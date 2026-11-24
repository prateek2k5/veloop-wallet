const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    withdrawalId: { type: String, required: true, unique: true, index: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: ["upi", "paypal", "amazon", "google_play"],
      required: true,
    },
    optionId: { type: String, required: true, index: true },
    currency: { type: String, enum: ["VES"], default: "VES", required: true },
    currencyAmount: { type: Number, required: true, min: 1 },
    payoutAmount: { type: Number, required: true, min: 1 },
    payoutDetails: { type: mongoose.Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "APPROVED", "REJECTED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    rejectionReason: { type: String, default: null, maxlength: 500 },
    reviewNote: { type: String, default: null, maxlength: 1000 },
    transactionId: { type: String, default: null, index: true },
    idempotencyKey: { type: String, required: true },
    requestHash: { type: String, required: true },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

withdrawalSchema.index({ userId: 1, createdAt: -1 });
withdrawalSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
