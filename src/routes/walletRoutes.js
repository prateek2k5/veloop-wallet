const express = require("express");
const { getWallet, getTransactions, getSummary, credit, debit } = require("../controllers/walletController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { withdrawalLimiter } = require("../middleware/rateLimitMiddleware");

const router = express.Router();
router.use(protect);
router.get("/", getWallet);
router.get("/summary", getSummary);
router.get("/transactions", getTransactions);
router.post("/credit", adminOnly, withdrawalLimiter, credit);
router.post("/debit", adminOnly, withdrawalLimiter, debit);
module.exports = router;
