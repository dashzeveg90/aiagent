const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
  {
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Document", DocumentSchema);
