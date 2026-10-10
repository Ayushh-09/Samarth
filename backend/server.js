/**
 * Samarth — Server Entry Point
 *
 * Express server that:
 * 1. Serves the frontend static files
 * 2. Exposes REST API endpoints for users, requests, progress, ratings, dashboard
 * 3. Uses in-memory data store (no database required)
 *
 * Security features:
 * - Environment-aware CORS (wildcard in dev, restricted in prod)
 * - 10 KB request body size limit
 * - Centralized error handler (no stack traces in production)
 * - Graceful shutdown on SIGTERM / SIGINT
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import route modules
const userRoutes = require('./routes/users');
const requestRoutes = require('./routes/requests');
const progressRoutes = require('./routes/progress');
const ratingRoutes = require('./routes/ratings');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;

// ─── CORS Configuration ───────────────────────────────
// In production, restrict to the configured origin.
// In development, allow all origins for convenience.
const corsOptions = {
  origin: NODE_ENV === 'production' && ALLOWED_ORIGIN
    ? ALLOWED_ORIGIN
    : true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// ─── Core Middleware ──────────────────────────────────
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));   // Prevent large payload attacks
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ─── Apply general API rate limiter ──────────────────
app.use('/api', apiLimiter);

// ─── Serve Frontend Static Files ──────────────────────
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ─── API Routes ───────────────────────────────────────
app.use('/api', userRoutes);       // /api/login, /api/signup, /api/users
app.use('/api', requestRoutes);    // /api/request, /api/requests, /api/assign
app.use('/api', progressRoutes);   // /api/update-status, /api/reject-task
app.use('/api', ratingRoutes);     // /api/rate-volunteer
app.use('/api', dashboardRoutes);  // /api/dashboard

// ─── Catch-all: Serve index.html for any unmatched route ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ─── Centralized Error Handler (must be last) ─────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Samarth — Smart Resource Allocation`);
  console.log(`   Environment: ${NODE_ENV}`);
  console.log(`   Server running at: http://localhost:${PORT}`);
  console.log(`   API available at:  http://localhost:${PORT}/api`);
  console.log(`   📦 Using in-memory data store (no database required)\n`);
});

// ─── Graceful Shutdown ────────────────────────────────
function shutdown(signal) {
  console.log(`\n[server] Received ${signal}. Closing HTTP server...`);
  server.close(() => {
    console.log('[server] HTTP server closed. Exiting.\n');
    process.exit(0);
  });
  // Force-exit if connections don't drain within 10 seconds
  setTimeout(() => {
    console.error('[server] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
