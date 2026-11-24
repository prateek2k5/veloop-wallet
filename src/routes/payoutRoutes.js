const express = require("express");
const { getMethods, getOptions } = require("../controllers/payoutController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect);
router.get("/methods", getMethods);
router.get("/options/:method", getOptions);

module.exports = router;
