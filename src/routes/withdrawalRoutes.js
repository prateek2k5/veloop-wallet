const express = require("express");
const { create, listMine, getMine, adminList, adminReview } = require("../controllers/withdrawalController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { withdrawalLimiter } = require("../middleware/rateLimitMiddleware");

const router = express.Router();
router.use(protect);
router.post("/", withdrawalLimiter, create);
router.get("/", listMine);
router.get("/:withdrawalId", getMine);
router.get("/admin/pending", adminOnly, adminList);
router.patch("/admin/:withdrawalId/review", adminOnly, adminReview);

module.exports = router;
