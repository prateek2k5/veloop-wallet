const mongoose = require("mongoose");
const { randomUUID, createHash } = require("crypto");
const Withdrawal = require("../models/Withdrawal");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const PayoutOption = require("../models/PayoutOption");
const AuditLog = require("../models/AuditLog");

function httpError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

function stablePayloadHash(optionId, details) {
  const canonicalDetails = Object.fromEntries(Object.entries(details || {}).sort(([a], [b]) => a.localeCompare(b)));
  return createHash("sha256").update(JSON.stringify({ optionId, payoutDetails: canonicalDetails })).digest("hex");
}

function validatePayoutDetails(method, details, requiredDetails) {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    throw httpError("Valid payout details are required.");
  }

  const clean = {};
  for (const field of requiredDetails) {
    const value = typeof details[field] === "string" ? details[field].trim() : "";
    if (!value || value.length > 160) {
      throw httpError(`Valid ${field} is required.`);
    }
    clean[field] = value;
  }

  if (method === "upi" && !/^[\w.-]{2,256}@[\w.-]{2,64}$/.test(clean.upiId || "")) {
    throw httpError("Please enter a valid UPI ID.");
  }
  if ((method === "paypal" || method === "amazon" || method === "google_play") &&
      clean.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) {
    throw httpError("Please enter a valid email address.");
  }
  return clean;
}

async function createWithdrawal({ user, optionId, payoutDetails, idempotencyKey }) {
  if (!idempotencyKey || typeof idempotencyKey !== "string" || idempotencyKey.length > 120) {
    throw httpError("A valid Idempotency-Key header is required.");
  }
  if (user.accountStatus && user.accountStatus !== "active") {
    throw httpError("Your account is not eligible to request a withdrawal.", 403);
  }

  const requestHash = stablePayloadHash(optionId, payoutDetails);
  const existing = await Withdrawal.findOne({ userId: user._id, idempotencyKey });
  if (existing) {
    if (existing.requestHash !== requestHash) throw httpError("Idempotency key was already used with a different request.", 409);
    return { withdrawal: existing, duplicate: true };
  }

  const option = await PayoutOption.findOne({ optionId, active: true });
  if (!option) throw httpError("Selected payout option is unavailable.");
  const accountAgeDays = Math.floor((Date.now() - user.createdAt.getTime()) / 86400000);
  if (accountAgeDays < (option.eligibility?.minAccountAgeDays || 0)) {
    throw httpError("Your account does not meet the eligibility requirements.", 403);
  }
  if (option.eligibility?.allowedCountries?.length &&
      !option.eligibility.allowedCountries.includes("IN")) {
    throw httpError("This payout option is not available for your region.", 403);
  }

  const safeDetails = validatePayoutDetails(option.method, payoutDetails, option.requiredDetails || []);
  const session = await mongoose.startSession();
  let withdrawal;

  try {
    await session.withTransaction(async () => {
      const wallet = await Wallet.findOne({ userId: user._id }).session(session);
      if (!wallet) throw httpError("Wallet not found.", 404);
      const before = wallet.ves;
      if (before < option.requiredAmount) throw httpError("Insufficient VEs balance.");

      const after = before - option.requiredAmount;
      const update = await Wallet.updateOne(
        { _id: wallet._id, ves: { $gte: option.requiredAmount, $eq: before } },
        { $inc: { ves: -option.requiredAmount } },
        { session }
      );
      if (update.modifiedCount !== 1) throw httpError("Wallet balance changed. Please retry.");

      const transactionId = randomUUID();
      const withdrawalId = randomUUID();
      const [transaction] = await WalletTransaction.create([{
        transactionId,
        userId: user._id,
        currency: "VES",
        type: "DEBIT",
        amount: option.requiredAmount,
        balanceBefore: before,
        balanceAfter: after,
        source: "WITHDRAWAL",
        referenceId: withdrawalId,
        status: "SUCCESS",
        description: `${option.name} withdrawal request`,
        metadata: { method: option.method, optionId: option.optionId },
      }], { session });

      [withdrawal] = await Withdrawal.create([{
        withdrawalId,
        userId: user._id,
        method: option.method,
        optionId: option.optionId,
        currency: "VES",
        currencyAmount: option.requiredAmount,
        payoutAmount: option.payoutAmount,
        payoutDetails: safeDetails,
        status: "PENDING",
        transactionId: transaction.transactionId,
        idempotencyKey,
        requestHash,
      }], { session });

      await AuditLog.create([{
        actorId: user._id,
        targetUserId: user._id,
        action: "WITHDRAWAL_CREATED",
        targetType: "Withdrawal",
        referenceId: withdrawalId,
        metadata: { method: option.method, optionId: option.optionId, currencyAmount: option.requiredAmount, payoutAmount: option.payoutAmount },
      }], { session });
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicate = await Withdrawal.findOne({ userId: user._id, idempotencyKey });
      if (duplicate) {
        if (duplicate.requestHash !== requestHash) {
          throw httpError("Idempotency key was already used with a different request.", 409);
        }
        return { withdrawal: duplicate, duplicate: true };
      }
      throw httpError("This withdrawal request has already been submitted.", 409);
    }
    throw error;
  } finally {
    await session.endSession();
  }

  return { withdrawal, duplicate: false };
}

async function getUserWithdrawals(userId, page = 1, limit = 20) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
  const filter = { userId };
  const [withdrawals, total] = await Promise.all([
    Withdrawal.find(filter).sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    Withdrawal.countDocuments(filter),
  ]);
  return { withdrawals, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } };
}

async function getUserWithdrawal(userId, withdrawalId) {
  const withdrawal = await Withdrawal.findOne({ userId, withdrawalId }).lean();
  if (!withdrawal) throw httpError("Withdrawal not found.", 404);
  return withdrawal;
}

async function reviewWithdrawal({ admin, withdrawalId, decision, reason = "", reviewNote = "" }) {
  if (!["APPROVED", "REJECTED"].includes(decision)) throw httpError("Invalid withdrawal decision.");
  const session = await mongoose.startSession();
  let updated;

  try {
    await session.withTransaction(async () => {
      const item = await Withdrawal.findOne({ withdrawalId }).session(session);
      if (!item) throw httpError("Withdrawal not found.", 404);
      if (item.status !== "PENDING" && item.status !== "PROCESSING") {
        throw httpError("Only pending or processing withdrawals can be reviewed.", 409);
      }

      if (decision === "REJECTED") {
        const wallet = await Wallet.findOne({ userId: item.userId }).session(session);
        if (!wallet) throw httpError("Wallet not found.", 404);
        const before = wallet.ves;
        const after = before + item.currencyAmount;
        await Wallet.updateOne({ _id: wallet._id }, { $inc: { ves: item.currencyAmount } }, { session });
        const [refund] = await WalletTransaction.create([{
          transactionId: randomUUID(),
          userId: item.userId,
          currency: "VES",
          type: "CREDIT",
          amount: item.currencyAmount,
          balanceBefore: before,
          balanceAfter: after,
          source: "CORRECTION",
          referenceId: item.withdrawalId,
          status: "SUCCESS",
          description: "Refund for rejected withdrawal",
          metadata: { reason: reason || "Withdrawal rejected" },
        }], { session });
        item.transactionId = refund.transactionId;
        item.rejectionReason = reason || "Withdrawal rejected";
      }

      item.status = decision;
      item.reviewNote = reviewNote || null;
      item.processedAt = new Date();
      await item.save({ session });

      await AuditLog.create([{
        actorId: admin._id,
        targetUserId: item.userId,
        action: decision === "APPROVED" ? "WITHDRAWAL_APPROVED" : "WITHDRAWAL_REJECTED",
        targetType: "Withdrawal",
        referenceId: item.withdrawalId,
        metadata: { reviewNote, reason: decision === "REJECTED" ? item.rejectionReason : undefined },
      }], { session });
      updated = item;
    });
  } finally {
    await session.endSession();
  }
  return updated;
}

async function listPendingWithdrawals(page = 1, limit = 50) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 50));
  const filter = { status: { $in: ["PENDING", "PROCESSING"] } };
  const [withdrawals, total] = await Promise.all([
    Withdrawal.find(filter).sort({ createdAt: 1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    Withdrawal.countDocuments(filter),
  ]);
  return { withdrawals, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } };
}

module.exports = { createWithdrawal, getUserWithdrawals, getUserWithdrawal, reviewWithdrawal, listPendingWithdrawals };
