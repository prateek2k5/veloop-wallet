const mongoose = require("mongoose");
const PayoutOption = require("../models/PayoutOption");

const payoutOptions = [
  { optionId: "upi_10", method: "upi", name: "₹10 UPI", payoutAmount: 10, requiredAmount: 2400, requiredDetails: ["upiId"] },
  { optionId: "upi_25", method: "upi", name: "₹25 UPI", payoutAmount: 25, requiredAmount: 5800, requiredDetails: ["upiId"] },
  { optionId: "upi_50", method: "upi", name: "₹50 UPI", payoutAmount: 50, requiredAmount: 10000, requiredDetails: ["upiId"] },
  { optionId: "upi_100", method: "upi", name: "₹100 UPI", payoutAmount: 100, requiredAmount: 19500, requiredDetails: ["upiId"] },
  { optionId: "upi_150", method: "upi", name: "₹150 UPI", payoutAmount: 150, requiredAmount: 28500, requiredDetails: ["upiId"] },
  { optionId: "upi_300", method: "upi", name: "₹300 UPI", payoutAmount: 300, requiredAmount: 52500, requiredDetails: ["upiId"] },
  { optionId: "upi_500", method: "upi", name: "₹500 UPI", payoutAmount: 500, requiredAmount: 80500, requiredDetails: ["upiId"] },
  { optionId: "upi_1000", method: "upi", name: "₹1,000 UPI", payoutAmount: 1000, requiredAmount: 150000, requiredDetails: ["upiId"] },
];

async function seedPayoutOptions() {
  for (const option of payoutOptions) {
    await PayoutOption.updateOne(
      { optionId: option.optionId },
      { $set: { ...option, currency: "VES", active: true, eligibility: { minAccountAgeDays: 0, allowedCountries: ["IN"] } } },
      { upsert: true }
    );
  }
}

if (require.main === module) {
  require("dotenv").config();
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required.");
  mongoose.connect(process.env.MONGO_URI)
    .then(seedPayoutOptions)
    .then(() => { console.log("Payout options seeded."); return mongoose.disconnect(); })
    .catch(async (error) => { console.error(error.message); await mongoose.disconnect(); process.exit(1); });
}

module.exports = { seedPayoutOptions };
