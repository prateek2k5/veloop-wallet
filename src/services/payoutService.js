const PayoutOption = require("../models/PayoutOption");

const METHOD_NAMES = {
  upi: "UPI",
  paypal: "PayPal",
  amazon: "Amazon Gift Card",
  google_play: "Google Play Gift Card",
};

async function getPayoutMethods() {
  const options = await PayoutOption.find({ active: true }).sort({ method: 1, payoutAmount: 1 }).lean();
  const grouped = new Map();

  for (const option of options) {
    if (!grouped.has(option.method)) {
      grouped.set(option.method, {
        method: option.method,
        name: METHOD_NAMES[option.method] || option.method,
        options: [],
      });
    }
    grouped.get(option.method).options.push({
      optionId: option.optionId,
      name: option.name,
      payoutAmount: option.payoutAmount,
      currency: option.currency,
      requiredAmount: option.requiredAmount,
      requiredDetails: option.requiredDetails,
    });
  }

  return Array.from(grouped.values());
}

async function getOptionsByMethod(method) {
  const normalized = String(method || "").toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(METHOD_NAMES, normalized)) {
    const error = new Error("Unsupported payout method.");
    error.statusCode = 400;
    throw error;
  }
  return PayoutOption.find({ method: normalized, active: true })
    .sort({ payoutAmount: 1 })
    .select("optionId name method payoutAmount currency requiredAmount requiredDetails eligibility")
    .lean();
}

module.exports = { getPayoutMethods, getOptionsByMethod };
