/**
 * Simple In-Process Rate Limiter
 *
 * No external dependencies — uses a plain Map for the sliding window.
 * Good enough for a single-instance Node.js server.
 * For multi-instance deployments, replace with redis-backed express-rate-limit.
 *
 * Usage:
 *   const { authLimiter } = require('./middleware/rateLimiter');
 *   router.post('/login', authLimiter, handler);
 */

const requestCounts = new Map(); // ip -> { count, windowStart }

/**
 * Factory that returns an Express middleware enforcing a rate limit.
 * @param {object} opts
 * @param {number} opts.windowMs   - Time window in ms (default 15 min)
 * @param {number} opts.max        - Max requests per window per IP (default 20)
 * @param {string} opts.message    - Error message when limit exceeded
 */
function createLimiter({ windowMs = 15 * 60 * 1000, max = 20, message = 'Too many requests. Please try again later.' } = {}) {
  // Periodic cleanup to prevent unbounded memory growth
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requestCounts.entries()) {
      if (now - data.windowStart > windowMs) {
        requestCounts.delete(ip);
      }
    }
  }, windowMs);

  return function rateLimiter(req, res, next) {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = requestCounts.get(ip);

    if (!entry || now - entry.windowStart > windowMs) {
      // New window
      requestCounts.set(ip, { count: 1, windowStart: now });
      return next();
    }

    entry.count++;
    if (entry.count > max) {
      return res.status(429).json({ message });
    }
    next();
  };
}

// Pre-configured limiters
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,                   // 30 login/signup attempts per 15 min per IP
  message: 'Too many login attempts from this IP. Please wait 15 minutes before trying again.'
});

const apiLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 120,            // 120 general API requests per minute per IP
  message: 'Too many requests from this IP. Please slow down.'
});

module.exports = { createLimiter, authLimiter, apiLimiter };
