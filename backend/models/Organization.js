const mongoose = require("mongoose");

const OrganizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company нэр шаардлагатай"],
      trim: true,
      maxlength: [120, "Company нэр хэт урт байна"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: String,
      default: "trial",
    },
    currentPackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPackage",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    subscriptionStatus: {
      type: String,
      enum: ["pending", "active", "expired", "cancelled"],
      default: "pending",
    },
    subscriptionStartsAt: {
      type: Date,
      default: null,
    },
    subscriptionEndsAt: {
      type: Date,
      default: null,
    },
    lastPaymentAt: {
      type: Date,
      default: null,
    },
    lastPaymentTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentTransaction",
      default: null,
    },
    brandColor: {
      type: String,
      default: "#2563eb",
    },
    chatBg: {
      type: String,
      default: "#ffffff",
    },
    titleColor: {
      type: String,
      default: "#ffffff",
    },
    textColor: {
      type: String,
      default: "#1e293b",
    },
    greeting: {
      type: String,
      default: "",
      maxlength: [2000, "Мэндчилгээ хэт урт байна"],
    },
    subtitle: {
      type: String,
      default: "",
      maxlength: [200, "Subtitle хэт урт байна"],
    },
    logoUrl: {
      type: String,
      default: "",
    },
    systemPrompt: {
      type: String,
      default:
        "Та бол компанийн албан ёсны AI туслах. Мэдээлэлгүй үед ажилтантай холбогдохыг санал болго.",
    },
    pineconeNamespace: {
      type: String,
      required: true,
      unique: true,
    },
    verifyToken: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Organization", OrganizationSchema);
