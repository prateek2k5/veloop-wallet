const payoutService = require("../services/payoutService");

exports.getMethods = async (req, res, next) => {
  try {
    const methods = await payoutService.getPayoutMethods();
    res.status(200).json({ success: true, methods });
  } catch (error) {
    next(error);
  }
};

exports.getOptions = async (req, res, next) => {
  try {
    const options = await payoutService.getOptionsByMethod(req.params.method);
    res.status(200).json({ success: true, options });
  } catch (error) {
    next(error);
  }
};
