const withdrawalService = require("../services/withdrawalService");

exports.create = async (req, res, next) => {
  try {
    const result = await withdrawalService.createWithdrawal({
      user: req.user,
      optionId: req.body.optionId,
      payoutDetails: req.body.payoutDetails,
      idempotencyKey: req.get("Idempotency-Key"),
    });
    res.status(result.duplicate ? 200 : 201).json({
      success: true,
      message: result.duplicate ? "This withdrawal request was already submitted." : "Withdrawal submitted successfully.",
      duplicate: result.duplicate,
      withdrawal: result.withdrawal,
    });
  } catch (error) {
    next(error);
  }
};

exports.listMine = async (req, res, next) => {
  try {
    const result = await withdrawalService.getUserWithdrawals(req.user._id, req.query.page, req.query.limit);
    res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
};

exports.getMine = async (req, res, next) => {
  try {
    const withdrawal = await withdrawalService.getUserWithdrawal(req.user._id, req.params.withdrawalId);
    res.status(200).json({ success: true, withdrawal });
  } catch (error) { next(error); }
};

exports.adminList = async (req, res, next) => {
  try {
    const result = await withdrawalService.listPendingWithdrawals(req.query.page, req.query.limit);
    res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
};

exports.adminReview = async (req, res, next) => {
  try {
    const withdrawal = await withdrawalService.reviewWithdrawal({
      admin: req.user,
      withdrawalId: req.params.withdrawalId,
      decision: req.body.decision,
      reason: req.body.reason,
      reviewNote: req.body.reviewNote,
    });
    res.status(200).json({ success: true, withdrawal });
  } catch (error) { next(error); }
};
