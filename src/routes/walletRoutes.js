const express = require("express");
const { getWallet, getTransactions, getSummary } = require("../controllers/walletController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/", getWallet);
router.get("/summary", getSummary);
router.get("/transactions", getTransactions);

module.exports = router;
