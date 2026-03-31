const mongoose = require("mongoose");

const SubscriptionPackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Package нэр шаардлагатай"],
      trim: true,
      maxlength: [120, "Package нэр хэт урт байна"],
    },
    code: {
      type: String,
      required: [true, "Package код шаардлагатай"],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [64, "Package код хэт урт байна"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [500, "Тайлбар хэт урт байна"],
    },
    price: {
      type: Number,
      required: [true, "Үнэ шаардлагатай"],
      min: [0, "Үнэ 0-ээс багагүй байна"],
    },
    currency: {
      type: String,
      default: "MNT",
      trim: true,
      uppercase: true,
      maxlength: [10, "Валют буруу байна"],
    },
    billingCycle: {
      type: String,
      enum: ["monthly"],
      default: "monthly",
    },
    durationDays: {
      type: Number,
      default: 30,
      min: [1, "Хугацаа 1-ээс багагүй байна"],
    },
    features: {
      type: [String],
      default: [],
    },
    entitlements: {
      chatbot: {
        type: Boolean,
        default: true,
      },
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("SubscriptionPackage", SubscriptionPackageSchema);
