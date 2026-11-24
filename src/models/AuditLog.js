const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        "WITHDRAWAL_CREATED",
        "WITHDRAWAL_APPROVED",
        "WITHDRAWAL_REJECTED",
        "WALLET_CREDIT",
        "WALLET_DEBIT",
        "BALANCE_CORRECTION",
        "PAYOUT_CONFIGURATION_CHANGED",
      ],
      required: true,
      index: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    targetType: { type: String, required: true },
    referenceId: { type: String, default: null, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: null },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
