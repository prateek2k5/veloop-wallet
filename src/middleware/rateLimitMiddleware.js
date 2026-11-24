const buckets = new Map();

function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 10 } = {}) {
  return function rateLimit(req, res, next) {
    const key = req.user?._id?.toString() || req.ip || "unknown";
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    res.set("RateLimit-Limit", String(max));
    res.set("RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
    res.set("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > max) {
      return res.status(429).json({ success: false, message: "Too many requests. Please try again later." });
    }
    next();
  };
}

const withdrawalLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 5 });
module.exports = { createRateLimiter, withdrawalLimiter };
