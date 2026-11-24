const mongoose = require("mongoose");

const payoutOptionSchema = new mongoose.Schema(
  {
    optionId: { type: String, required: true, unique: true, trim: true },
    method: {
      type: String,
      enum: ["upi", "paypal", "amazon", "google_play"],
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    currency: { type: String, enum: ["VES"], default: "VES", required: true },
    payoutAmount: { type: Number, required: true, min: 1 },
    requiredAmount: { type: Number, required: true, min: 1 },
    active: { type: Boolean, default: true, index: true },
    eligibility: {
      minAccountAgeDays: { type: Number, default: 0, min: 0 },
      allowedCountries: { type: [String], default: [] },
    },
    requiredDetails: {
      type: [String],
      default: [],
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

payoutOptionSchema.index({ method: 1, active: 1, requiredAmount: 1 });

module.exports = mongoose.model("PayoutOption", payoutOptionSchema);
