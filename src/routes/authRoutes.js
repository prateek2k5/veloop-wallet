const express = require("express");
const { signup, login } = require("../controllers/authController");
const { createRateLimiter } = require("../middleware/rateLimitMiddleware");

const router = express.Router();
const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });
router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);

module.exports = router;
