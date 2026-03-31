const {
  Organization,
  PaymentTransaction,
  SubscriptionPackage,
} = require("../models");
const qpayService = require("../services/qpayService");
const {
  buildSubscriptionSummary,
  ensureDefaultPackages,
  reconcileTransaction,
  syncOrganizationSubscription,
} = require("../services/subscriptionService");

function normalizeFeatures(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function serializePackage(packageDoc) {
  if (!packageDoc) {
    return null;
  }

  return {
    _id: packageDoc._id,
    id: packageDoc._id,
    name: packageDoc.name,
    code: packageDoc.code,
    description: packageDoc.description,
    price: packageDoc.price,
    currency: packageDoc.currency,
    billingCycle: packageDoc.billingCycle,
    durationDays: packageDoc.durationDays,
    features: packageDoc.features || [],
    entitlements: packageDoc.entitlements || {},
    sortOrder: packageDoc.sortOrder || 0,
    isActive: packageDoc.isActive,
    createdAt: packageDoc.createdAt,
    updatedAt: packageDoc.updatedAt,
  };
}

function serializeTransaction(transaction) {
  if (!transaction) {
    return null;
  }

  return {
    _id: transaction._id,
    id: transaction._id,
    status: transaction.status,
    provider: transaction.provider,
    amount: transaction.amount,
    currency: transaction.currency,
    senderInvoiceNo: transaction.senderInvoiceNo,
    invoiceCode: transaction.invoiceCode,
    invoiceId: transaction.invoiceId,
    invoiceDescription: transaction.invoiceDescription,
    callbackUrl: transaction.callbackUrl,
    paymentId: transaction.paymentId,
    qpayPaymentStatus: transaction.qpayPaymentStatus,
    paidAt: transaction.paidAt,
    expiresAt: transaction.expiresAt,
    activatedStartsAt: transaction.activatedStartsAt,
    activatedEndsAt: transaction.activatedEndsAt,
    lastCheckedAt: transaction.lastCheckedAt,
    errorMessage: transaction.errorMessage,
    qrText: transaction.qrText,
    qrImage: transaction.qrImage,
    bankUrls: transaction.bankUrls || [],
    package: serializePackage(transaction.package),
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
}

function buildQPayConfigPayload() {
  const configStatus = qpayService.getConfigStatus();

  return {
    configured: configStatus.configured,
    missing: configStatus.missing,
    baseUrl: configStatus.baseUrl,
    backendPublicUrl: configStatus.backendPublicUrl,
  };
}

async function getCompanyWithSubscription(orgId) {
  const company = await Organization.findById(orgId).populate("currentPackage");
  if (!company) {
    return null;
  }

  await syncOrganizationSubscription(company);
  return company.populate("currentPackage");
}

exports.getPackages = async (req, res) => {
  try {
    await ensureDefaultPackages();

    const query = req.user?.role === "superadmin" ? {} : { isActive: true };
    const packages = await SubscriptionPackage.find(query)
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    res.status(200).json({
      status: "success",
      data: packages.map(serializePackage),
    });
  } catch (error) {
    console.error("Get packages error:", error);
    res.status(500).json({
      status: "error",
      message: "Багцын мэдээлэл авахад алдаа гарлаа",
      code: "PACKAGE_FETCH_FAILED",
    });
  }
};

exports.createPackage = async (req, res) => {
  try {
    const packageDoc = await SubscriptionPackage.create({
      name: req.body.name,
      code: String(req.body.code || "").trim().toUpperCase(),
      description: req.body.description || "",
      price: Number(req.body.price),
      currency: String(req.body.currency || "MNT").trim().toUpperCase(),
      billingCycle: "monthly",
      durationDays: Number(req.body.durationDays || 30),
      features: normalizeFeatures(req.body.features),
      sortOrder: Number(req.body.sortOrder || 0),
      isActive: req.body.isActive !== false,
      entitlements: {
        chatbot: req.body.entitlements?.chatbot !== false,
      },
    });

    res.status(201).json({
      status: "success",
      message: "Багц амжилттай үүслээ",
      data: serializePackage(packageDoc),
    });
  } catch (error) {
    console.error("Create package error:", error);
    res.status(500).json({
      status: "error",
      message: "Багц үүсгэхэд алдаа гарлаа",
      code: "PACKAGE_CREATE_FAILED",
      error: error.message,
    });
  }
};

exports.updatePackage = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      description: req.body.description,
      price:
        req.body.price === undefined ? undefined : Number(req.body.price),
      currency:
        req.body.currency === undefined
          ? undefined
          : String(req.body.currency).trim().toUpperCase(),
      durationDays:
        req.body.durationDays === undefined
          ? undefined
          : Number(req.body.durationDays),
      features:
        req.body.features === undefined
          ? undefined
          : normalizeFeatures(req.body.features),
      sortOrder:
        req.body.sortOrder === undefined
          ? undefined
          : Number(req.body.sortOrder),
      isActive: req.body.isActive,
    };

    Object.keys(fieldsToUpdate).forEach((key) => {
      if (fieldsToUpdate[key] === undefined) {
        delete fieldsToUpdate[key];
      }
    });

    const packageDoc = await SubscriptionPackage.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true },
    );

    if (!packageDoc) {
      return res.status(404).json({
        status: "error",
        message: "Багц олдсонгүй",
        code: "PACKAGE_NOT_FOUND",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Багц шинэчлэгдлээ",
      data: serializePackage(packageDoc),
    });
  } catch (error) {
    console.error("Update package error:", error);
    res.status(500).json({
      status: "error",
      message: "Багц шинэчлэхэд алдаа гарлаа",
      code: "PACKAGE_UPDATE_FAILED",
      error: error.message,
    });
  }
};

exports.getBillingOverview = async (req, res) => {
  try {
    await ensureDefaultPackages();

    const [company, packages] = await Promise.all([
      getCompanyWithSubscription(req.company._id),
      SubscriptionPackage.find({ isActive: true })
        .sort({ sortOrder: 1, createdAt: 1 })
        .lean(),
    ]);

    const pendingTransaction = await PaymentTransaction.findOne({
      org: req.company._id,
      status: "pending",
    })
      .sort({ createdAt: -1 })
      .populate("package");

    const latestTransaction = pendingTransaction
      ? await reconcileTransaction(pendingTransaction)
      : null;

    const recentTransactions = await PaymentTransaction.find({
      org: req.company._id,
      status: "paid",
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("package");

    res.status(200).json({
      status: "success",
      data: {
        company: {
          _id: company._id,
          id: company._id,
          name: company.name,
          slug: company.slug,
          status: company.status,
          subscription: buildSubscriptionSummary(company),
        },
        packages: packages.map(serializePackage),
        activeTransaction: serializeTransaction(latestTransaction),
        recentTransactions: recentTransactions.map(serializeTransaction),
        qpayConfigured: qpayService.isConfigured(),
        qpayConfig: buildQPayConfigPayload(),
      },
    });
  } catch (error) {
    console.error("Get billing overview error:", error);
    res.status(500).json({
      status: "error",
      message: "Billing мэдээлэл авахад алдаа гарлаа",
      code: "BILLING_OVERVIEW_FAILED",
      error: error.message,
    });
  }
};

exports.createInvoice = async (req, res) => {
  try {
    await ensureDefaultPackages();

    if (!qpayService.isConfigured()) {
      return res.status(503).json({
        status: "error",
        message: "QPay тохиргоо дутуу байна",
        code: "PAYMENT_PROVIDER_NOT_CONFIGURED",
        data: {
          qpayConfig: buildQPayConfigPayload(),
        },
      });
    }

    const packageDoc = await SubscriptionPackage.findOne({
      _id: req.body.packageId,
      isActive: true,
    });

    if (!packageDoc) {
      return res.status(404).json({
        status: "error",
        message: "Идэвхтэй багц олдсонгүй",
        code: "PACKAGE_NOT_FOUND",
      });
    }

    const existingPending = await PaymentTransaction.find({
      org: req.company._id,
      status: "pending",
    })
      .sort({ createdAt: -1 });

    for (const transaction of existingPending) {
      const refreshed = await reconcileTransaction(transaction);
      if (refreshed.status === "pending") {
        refreshed.status = "cancelled";
        refreshed.errorMessage =
          "Шинэ invoice үүсгэх үед өмнөх pending invoice цуцлагдсан";
        await refreshed.save();
      }
    }

    const senderInvoiceNo = `SUB-${Date.now()}-${String(req.company._id).slice(-6)}`;
    const invoiceDescription = `${packageDoc.name} - ${req.company.name}`;
    const callbackToken = qpayService.getCallbackToken();

    const transaction = await PaymentTransaction.create({
      org: req.company._id,
      package: packageDoc._id,
      createdBy: req.user._id,
      amount: packageDoc.price,
      currency: packageDoc.currency,
      senderInvoiceNo,
      invoiceCode: qpayService.getInvoiceCode(),
      invoiceDescription,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const callbackUrl = new URL(
      "/api/payments/qpay/callback",
      qpayService.getBackendPublicUrl(),
    );
    callbackUrl.searchParams.set("transactionId", String(transaction._id));
    if (callbackToken) {
      callbackUrl.searchParams.set("token", callbackToken);
    }

    transaction.callbackUrl = callbackUrl.toString();

    try {
      const invoiceResponse = await qpayService.createInvoice({
        invoice_code: qpayService.getInvoiceCode(),
        sender_invoice_no: senderInvoiceNo,
        invoice_receiver_code: String(req.company._id),
        invoice_receiver_data: {
          name: req.company.name,
          email: req.user.email,
        },
        invoice_description: invoiceDescription,
        amount: packageDoc.price,
        callback_url: transaction.callbackUrl,
        allow_partial: false,
        allow_exceed: false,
        lines: [
          {
            line_description: packageDoc.name,
            line_quantity: 1,
            line_unit_price: packageDoc.price,
          },
        ],
      });

      transaction.invoiceId = invoiceResponse.invoice_id || null;
      transaction.qrText = invoiceResponse.qr_text || "";
      transaction.qrImage = invoiceResponse.qr_image || "";
      transaction.bankUrls = Array.isArray(invoiceResponse.urls)
        ? invoiceResponse.urls
        : [];
      transaction.rawInvoiceResponse = invoiceResponse;
      await transaction.save();
    } catch (invoiceError) {
      transaction.status = "failed";
      transaction.errorMessage = invoiceError.message;
      await transaction.save();
      throw invoiceError;
    }

    const populatedTransaction = await PaymentTransaction.findById(transaction._id).populate(
      "package",
    );

    res.status(201).json({
      status: "success",
      message: "QPay нэхэмжлэл амжилттай үүслээ",
      data: serializeTransaction(populatedTransaction),
    });
  } catch (error) {
    console.error("Create invoice error:", error);
    res.status(500).json({
      status: "error",
      message: "QPay нэхэмжлэл үүсгэхэд алдаа гарлаа",
      code: "INVOICE_CREATE_FAILED",
      error: error.message,
    });
  }
};

exports.getTransactionStatus = async (req, res) => {
  try {
    const transaction = await PaymentTransaction.findOne({
      _id: req.params.id,
      org: req.company._id,
    }).populate("package");

    if (!transaction) {
      return res.status(404).json({
        status: "error",
        message: "Төлбөрийн мэдээлэл олдсонгүй",
        code: "TRANSACTION_NOT_FOUND",
      });
    }

    const refreshedTransaction = await reconcileTransaction(transaction);

    res.status(200).json({
      status: "success",
      data: serializeTransaction(refreshedTransaction),
    });
  } catch (error) {
    console.error("Get transaction status error:", error);
    res.status(500).json({
      status: "error",
      message: "Төлбөрийн төлөв шалгахад алдаа гарлаа",
      code: "TRANSACTION_STATUS_FAILED",
      error: error.message,
    });
  }
};

exports.handleQPayCallback = async (req, res) => {
  try {
    const callbackToken = qpayService.getCallbackToken();
    const providedToken =
      req.query.token || req.headers["x-qpay-callback-token"] || "";

    if (callbackToken && providedToken !== callbackToken) {
      return res.status(401).json({
        status: "error",
        message: "Callback token буруу байна",
        code: "INVALID_CALLBACK_TOKEN",
      });
    }

    const transactionId =
      req.query.transactionId || req.body.transactionId || req.body.payment_id || "";

    if (!transactionId) {
      return res.status(400).json({
        status: "error",
        message: "transactionId шаардлагатай",
        code: "CALLBACK_TRANSACTION_ID_REQUIRED",
      });
    }

    const transaction = await PaymentTransaction.findById(transactionId).populate("package");
    if (!transaction) {
      return res.status(404).json({
        status: "error",
        message: "Transaction олдсонгүй",
        code: "TRANSACTION_NOT_FOUND",
      });
    }

    transaction.rawCallbackPayload = req.body;
    if (req.body.payment_id) {
      transaction.paymentId = String(req.body.payment_id);
    }
    await transaction.save();

    const refreshedTransaction = await reconcileTransaction(transaction);

    res.status(200).json({
      status: "success",
      data: {
        transaction: serializeTransaction(refreshedTransaction),
      },
    });
  } catch (error) {
    console.error("QPay callback error:", error);
    res.status(500).json({
      status: "error",
      message: "QPay callback боловсруулахад алдаа гарлаа",
      code: "QPAY_CALLBACK_FAILED",
      error: error.message,
    });
  }
};
