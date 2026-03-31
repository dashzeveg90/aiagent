const mongoose = require("mongoose");

const PaymentTransactionSchema = new mongoose.Schema(
  {
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPackage",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    provider: {
      type: String,
      enum: ["qpay"],
      default: "qpay",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "expired", "cancelled", "failed"],
      default: "pending",
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Дүн буруу байна"],
    },
    currency: {
      type: String,
      default: "MNT",
      trim: true,
      uppercase: true,
    },
    senderInvoiceNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    invoiceCode: {
      type: String,
      required: true,
      trim: true,
    },
    invoiceId: {
      type: String,
      default: null,
      index: true,
    },
    invoiceDescription: {
      type: String,
      required: true,
      trim: true,
    },
    callbackUrl: {
      type: String,
      default: "",
      trim: true,
    },
    paymentId: {
      type: String,
      default: null,
      index: true,
    },
    qpayPaymentStatus: {
      type: String,
      default: null,
      trim: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    activatedStartsAt: {
      type: Date,
      default: null,
    },
    activatedEndsAt: {
      type: Date,
      default: null,
    },
    lastCheckedAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
      default: "",
    },
    qrText: {
      type: String,
      default: "",
    },
    qrImage: {
      type: String,
      default: "",
    },
    bankUrls: {
      type: [
        {
          name: String,
          description: String,
          link: String,
        },
      ],
      default: [],
    },
    rawInvoiceResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    rawPaymentCheckResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    rawCallbackPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("PaymentTransaction", PaymentTransactionSchema);
