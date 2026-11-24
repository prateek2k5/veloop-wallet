const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    currency: {
      type: String,
      enum: ["VES", "SVES", "GEMS", "TOKENS", "SPINS"],
      required: true,
    },
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },
    amount: { type: Number, required: true, min: 1 },
    balanceBefore: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
    source: {
      type: String,
      enum: [
        "REWARD",
        "BONUS",
        "REFERRAL",
        "DAILY_REWARD",
        "AD_REWARD",
        "GAME_REWARD",
        "ADMIN_CREDIT",
        "EXCHANGE_CREDIT",
        "WITHDRAWAL",
        "EXCHANGE_DEBIT",
        "ADMIN_DEBIT",
        "CORRECTION",
      ],
      required: true,
    },
    referenceId: { type: String, default: null, index: true },
    status: {
      type: String,
      enum: ["SUCCESS", "PENDING", "FAILED", "REVERSED"],
      default: "SUCCESS",
    },
    description: { type: String, trim: true, maxlength: 250, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ userId: 1, currency: 1, createdAt: -1 });

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
