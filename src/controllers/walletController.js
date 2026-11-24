const walletService = require("../services/walletService");
const AuditLog = require("../models/AuditLog");

exports.getWallet = async (req, res, next) => {
  try {
    const wallet = await walletService.getWallet(req.user._id);
    res.status(200).json({ success: true, wallet });
  } catch (error) { next(error); }
};

exports.getTransactions = async (req, res, next) => {
  try {
    const result = await walletService.getTransactions(req.user._id, req.query.page, req.query.limit);
    res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
};

exports.getSummary = async (req, res, next) => {
  try {
    const wallet = await walletService.getWallet(req.user._id);
    res.status(200).json({
      success: true,
      summary: { ves: wallet.ves, sves: wallet.sves, gems: wallet.gems, tokens: wallet.tokens, spins: wallet.spins },
    });
  } catch (error) { next(error); }
};

async function mutateWallet(req, res, next, operation) {
  try {
    const { currency, amount, source, description, referenceId } = req.body;
    const input = { userId: req.body.userId, currency, amount, source, description, referenceId };
    if (!input.userId) {
      const error = new Error("Target userId is required for internal wallet operations.");
      error.statusCode = 400;
      throw error;
    }
    const result = await operation(input);
    await AuditLog.create({
      actorId: req.user._id,
      targetUserId: input.userId,
      action: operation === walletService.creditWallet ? "WALLET_CREDIT" : "WALLET_DEBIT",
      targetType: "Wallet",
      referenceId: result.transaction.transactionId,
      metadata: { currency, amount, source, description },
      ipAddress: req.ip,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
}

exports.credit = (req, res, next) => mutateWallet(req, res, next, walletService.creditWallet);
exports.debit = (req, res, next) => mutateWallet(req, res, next, walletService.debitWallet);
