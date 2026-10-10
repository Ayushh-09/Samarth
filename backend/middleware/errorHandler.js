/**
 * Centralized Error Handler Middleware
 *
 * - Catches all errors passed via next(err)
 * - Prevents stack traces leaking in production responses
 * - Sanitizes error messages for client consumption
 */

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Global error handler - must be registered LAST in Express middleware chain.
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function errorHandler(err, req, res, next) {
  // Log full error server-side (safe — not sent to client)
  console.error("[ERROR]", req.method, req.path, "-", err.message);
  if (isDev) {
    console.error(err.stack);
  }

  const status = err.status || err.statusCode || 500;

  // In production, never expose internal error details
  const message = isDev
    ? err.message || 'Internal Server Error'
    : status < 500
    ? err.message
    : 'An unexpected error occurred. Please try again.';

  res.status(status).json({ message });
}

module.exports = { errorHandler };

