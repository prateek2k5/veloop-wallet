require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const { seedPayoutOptions } = require("./payoutOptions");

async function seedDemoData() {
  const password = process.env.DEMO_USER_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error("Set DEMO_USER_PASSWORD (at least 8 characters) before seeding.");
  }

  let user = await User.findOne({ email: "demo@veloop.test" });
  if (!user) {
    user = await User.create({
      name: "VELOop Demo User",
      email: "demo@veloop.test",
      password,
      role: "user",
      accountStatus: "active",
    });
  }

  const wallet = await Wallet.findOneAndUpdate(
    { userId: user._id },
    { $setOnInsert: { userId: user._id, ves: 25000, sves: 5000, gems: 100, tokens: 500, spins: 3 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (await WalletTransaction.countDocuments({ userId: user._id }) === 0) {
    const rows = [
      ["DEMO-AD-001", "VES", "CREDIT", 500, 24500, 25000, "AD_REWARD", "Watch Ad Reward"],
      ["DEMO-DAILY-001", "VES", "CREDIT", 100, 24400, 24500, "DAILY_REWARD", "Daily Reward"],
      ["DEMO-REF-001", "GEMS", "CREDIT", 20, 80, 100, "REFERRAL", "Referral Reward"],
    ];
    await WalletTransaction.insertMany(rows.map(([transactionId,currency,type,amount,balanceBefore,balanceAfter,source,description]) => ({
      transactionId, userId: user._id, currency, type, amount, balanceBefore, balanceAfter, source, description,
      status: "SUCCESS", metadata: { demo: true },
    })));
  }

  await seedPayoutOptions();
  console.log("Demo data ready:", user.email, wallet._id.toString());
}

if (require.main === module) {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required.");
  mongoose.connect(process.env.MONGO_URI)
    .then(seedDemoData)
    .then(() => mongoose.disconnect())
    .catch(async (error) => { console.error(error.message); await mongoose.disconnect(); process.exit(1); });
}

module.exports = { seedDemoData };
