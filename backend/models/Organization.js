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
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    brandColor: {
      type: String,
      default: "#2563eb",
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
