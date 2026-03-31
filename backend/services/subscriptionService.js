const {
  Organization,
  PaymentTransaction,
  SubscriptionPackage,
} = require("../models");
const qpayService = require("./qpayService");

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_PACKAGE_CODE = "AI_CHATBOT";

async function ensureDefaultPackages() {
  await SubscriptionPackage.updateOne(
    { code: DEFAULT_PACKAGE_CODE },
    {
      $setOnInsert: {
        name: "AI Chatbot",
        code: DEFAULT_PACKAGE_CODE,
        description: "AI chatbot monthly subscription багц",
        price: 10,
        currency: "MNT",
        billingCycle: "monthly",
        durationDays: 30,
        features: [
          "1 chatbot subscription",
          "Knowledge base upload",
          "Dashboard management",
          "QPay monthly renewal",
        ],
        sortOrder: 1,
        isActive: true,
        entitlements: {
          chatbot: true,
        },
      },
    },
    { upsert: true },
  );
}

async function syncOrganizationSubscription(company) {
  if (!company?.subscriptionEndsAt) {
    return company;
  }

  const endsAt = new Date(company.subscriptionEndsAt);
  if (Number.isNaN(endsAt.getTime())) {
    return company;
  }

  if (
    company.subscriptionStatus === "active" &&
    endsAt.getTime() <= Date.now()
  ) {
    company.subscriptionStatus = "expired";

    if (typeof company.save === "function") {
      await company.save();
    }
  }

  return company;
}

function getSubscriptionAccessState(company) {
  if (!company) {
    return {
      isActive: false,
      status: "missing",
      code: "SUBSCRIPTION_REQUIRED",
      message: "Subscription мэдээлэл олдсонгүй",
    };
  }

  if (company.status !== "active") {
    return {
      isActive: false,
      status: "suspended",
      code: "COMPANY_SUSPENDED",
      message: "Таны company түр хаагдсан байна",
    };
  }

  const endsAt = company.subscriptionEndsAt
    ? new Date(company.subscriptionEndsAt)
    : null;
  if (
    endsAt &&
    !Number.isNaN(endsAt.getTime()) &&
    endsAt.getTime() <= Date.now()
  ) {
    return {
      isActive: false,
      status: "expired",
      code: "SUBSCRIPTION_EXPIRED",
      message: "Subscription хугацаа дууссан байна",
    };
  }

  if (
    company.subscriptionStatus === "active" &&
    endsAt &&
    endsAt.getTime() > Date.now()
  ) {
    return {
      isActive: true,
      status: "active",
      code: null,
      message: "",
    };
  }

  if (company.subscriptionStatus === "pending") {
    return {
      isActive: false,
      status: "pending",
      code: "SUBSCRIPTION_REQUIRED",
      message: "Subscription идэвхжээгүй байна",
    };
  }

  if (company.subscriptionStatus === "cancelled") {
    return {
      isActive: false,
      status: "cancelled",
      code: "SUBSCRIPTION_REQUIRED",
      message: "Subscription цуцлагдсан байна",
    };
  }

  return {
    isActive: false,
    status: company.subscriptionStatus || "inactive",
    code: "SUBSCRIPTION_REQUIRED",
    message: "Subscription шаардлагатай байна",
  };
}

function buildSubscriptionSummary(company) {
  const access = getSubscriptionAccessState(company);

  return {
    status: company?.subscriptionStatus || "pending",
    isActive: access.isActive,
    code: access.code,
    startsAt: company?.subscriptionStartsAt || null,
    endsAt: company?.subscriptionEndsAt || null,
    lastPaymentAt: company?.lastPaymentAt || null,
    currentPackage: company?.currentPackage
      ? {
          _id: company.currentPackage._id || company.currentPackage,
          id: company.currentPackage._id || company.currentPackage,
          name: company.currentPackage.name || "",
          code: company.currentPackage.code || company.plan || "",
          price: company.currentPackage.price ?? null,
          currency: company.currentPackage.currency || "MNT",
          durationDays: company.currentPackage.durationDays ?? null,
          billingCycle: company.currentPackage.billingCycle || "monthly",
        }
      : null,
  };
}

function computeSubscriptionWindow(company, packageDoc) {
  const now = new Date();
  const currentEnd = company?.subscriptionEndsAt
    ? new Date(company.subscriptionEndsAt)
    : null;
  const startsAt =
    currentEnd && currentEnd.getTime() > now.getTime() ? currentEnd : now;
  const endsAt = new Date(
    startsAt.getTime() + Number(packageDoc.durationDays || 30) * DAY_IN_MS,
  );

  return { startsAt, endsAt };
}

async function markTransactionPaid(transaction, paymentRow) {
  if (!transaction) {
    return null;
  }

  const [org, packageDoc] = await Promise.all([
    Organization.findById(transaction.org),
    SubscriptionPackage.findById(transaction.package),
  ]);

  if (!org || !packageDoc) {
    return transaction;
  }

  const { startsAt, endsAt } = computeSubscriptionWindow(org, packageDoc);

  org.currentPackage = packageDoc._id;
  org.plan = packageDoc.code;
  org.subscriptionStatus = "active";
  org.subscriptionStartsAt = startsAt;
  org.subscriptionEndsAt = endsAt;
  org.lastPaymentAt = paymentRow?.payment_date
    ? new Date(paymentRow.payment_date)
    : new Date();
  org.lastPaymentTransaction = transaction._id;
  await org.save();

  transaction.status = "paid";
  transaction.paymentId = String(
    paymentRow?.payment_id || transaction.paymentId || "",
  );
  transaction.qpayPaymentStatus = paymentRow?.payment_status || "PAID";
  transaction.paidAt = paymentRow?.payment_date
    ? new Date(paymentRow.payment_date)
    : new Date();
  transaction.activatedStartsAt = startsAt;
  transaction.activatedEndsAt = endsAt;
  transaction.errorMessage = "";
  await transaction.save();

  return transaction.populate("package");
}

async function reconcileTransaction(transaction) {
  if (!transaction?.invoiceId || transaction.status === "paid") {
    return transaction;
  }

  if (!qpayService.isConfigured()) {
    return transaction;
  }

  const paymentCheck = await qpayService.checkInvoicePayment(
    transaction.invoiceId,
  );
  transaction.lastCheckedAt = new Date();
  transaction.rawPaymentCheckResponse = paymentCheck;

  const paymentRow = (paymentCheck?.rows || []).find(
    (row) => row.payment_status === "PAID",
  );

  if (paymentRow) {
    return markTransactionPaid(transaction, paymentRow);
  }

  if (
    transaction.expiresAt &&
    new Date(transaction.expiresAt).getTime() <= Date.now() &&
    transaction.status === "pending"
  ) {
    transaction.status = "expired";
    await transaction.save();
  } else {
    await transaction.save();
  }

  return transaction;
}

module.exports = {
  buildSubscriptionSummary,
  computeSubscriptionWindow,
  ensureDefaultPackages,
  getSubscriptionAccessState,
  markTransactionPaid,
  reconcileTransaction,
  syncOrganizationSubscription,
};
