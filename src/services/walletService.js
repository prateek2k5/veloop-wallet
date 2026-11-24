const mongoose = require("mongoose");
const { randomUUID } = require("crypto");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");

const CURRENCY_FIELDS = {
  VES: "ves",
  SVES: "sves",
  GEMS: "gems",
  TOKENS: "tokens",
  SPINS: "spins",
};

const CREDIT_SOURCES = [
  "REWARD", "BONUS", "REFERRAL", "DAILY_REWARD", "AD_REWARD",
  "GAME_REWARD", "ADMIN_CREDIT", "EXCHANGE_CREDIT",
];
const DEBIT_SOURCES = [
  "WITHDRAWAL", "EXCHANGE_DEBIT", "ADMIN_DEBIT", "CORRECTION",
];

function validateAmount(amount) {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error("Amount must be a positive whole number.");
  }
}

function getCurrencyField(currency) {
  const field = CURRENCY_FIELDS[String(currency || "").toUpperCase()];
  if (!field) throw new Error("Unsupported wallet currency.");
  return field;
}

async function ensureWallet(userId) {
  return Wallet.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function getWallet(userId) {
  return ensureWallet(userId);
}

async function changeBalance({ userId, currency, amount, type, source, description = "", referenceId = null, metadata = {} }) {
  validateAmount(amount);
  const field = getCurrencyField(currency);
  const normalizedType = String(type || "").toUpperCase();
  const allowedSources = normalizedType === "CREDIT" ? CREDIT_SOURCES : DEBIT_SOURCES;

  if (!["CREDIT", "DEBIT"].includes(normalizedType)) {
    throw new Error("Invalid transaction type.");
  }
  if (!allowedSources.includes(source)) {
    throw new Error("Invalid transaction source for this operation.");
  }

  await ensureWallet(userId);
  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const wallet = await Wallet.findOne({ userId }).session(session);
      if (!wallet) throw new Error("Wallet could not be found.");

      const balanceBefore = wallet[field];
      if (normalizedType === "DEBIT" && balanceBefore < amount) {
        throw new Error(`Insufficient ${currency} balance.`);
      }

      const balanceAfter = normalizedType === "CREDIT"
        ? balanceBefore + amount
        : balanceBefore - amount;

      const update = await Wallet.updateOne(
        normalizedType === "CREDIT"
          ? { userId, [field]: balanceBefore }
          : { userId, [field]: { $gte: amount, $eq: balanceBefore } },
        { $inc: { [field]: normalizedType === "CREDIT" ? amount : -amount } },
        { session }
      );

      if (update.modifiedCount !== 1) {
        throw new Error("Wallet balance changed. Please retry the operation.");
      }

      const [transaction] = await WalletTransaction.create([{
        transactionId: randomUUID(),
        userId,
        currency: String(currency).toUpperCase(),
        type: normalizedType,
        amount,
        balanceBefore,
        balanceAfter,
        source,
        referenceId,
        status: "SUCCESS",
        description,
        metadata,
      }], { session });

      result = { wallet: { ...wallet.toObject(), [field]: balanceAfter }, transaction };
    });
    return result;
  } finally {
    await session.endSession();
  }
}

async function creditWallet(input) {
  return changeBalance({ ...input, type: "CREDIT" });
}

async function debitWallet(input) {
  return changeBalance({ ...input, type: "DEBIT" });
}

async function getTransactions(userId, page = 1, limit = 20) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
  const filter = { userId };
  const [transactions, total] = await Promise.all([
    WalletTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    WalletTransaction.countDocuments(filter),
  ]);

  return {
    transactions,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit),
    },
  };
}

module.exports = {
  CURRENCY_FIELDS,
  getWallet,
  getTransactions,
  creditWallet,
  debitWallet,
};
