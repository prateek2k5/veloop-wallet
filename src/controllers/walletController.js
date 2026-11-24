const walletService = require("../services/walletService");

exports.getWallet = async (req, res, next) => {
  try {
    const wallet = await walletService.getWallet(req.user._id);
    res.status(200).json({ success: true, wallet });
  } catch (error) {
    next(error);
  }
};

exports.getTransactions = async (req, res, next) => {
  try {
    const result = await walletService.getTransactions(
      req.user._id,
      req.query.page,
      req.query.limit
    );
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

exports.getSummary = async (req, res, next) => {
  try {
    const wallet = await walletService.getWallet(req.user._id);
    res.status(200).json({
      success: true,
      summary: {
        ves: wallet.ves,
        sves: wallet.sves,
        gems: wallet.gems,
        tokens: wallet.tokens,
        spins: wallet.spins,
      },
    });
  } catch (error) {
    next(error);
  }
};
