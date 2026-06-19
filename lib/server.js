/**
 * server.js — shared Express app factory, request logger, and 404 handler.
 *
 * Sets up CORS, JSON body parsing, a /healthz endpoint, a global request
 * logger (method, path, status, duration), and an error handler.
 *
 * Each stub calls `createApp()` then mounts its own routes. The 404
 * catch-all MUST be mounted AFTER all routes — see createNotFoundHandler().
 *
 * Usage:
 *   const { createApp, createNotFoundHandler } = require("@dev-stub/lib/server");
 *   const app = createApp({ name: "feee" });
 *   app.use("/open", auth, ...routes);
 *   app.use(createNotFoundHandler("feee"));   // ← after all routes
 *   app.listen();
 */

const express = require("express");
const cors = require("cors");
const path = require("path");

const pkg = require(path.resolve(__dirname, "..", "package.json"));

/**
 * Create a fresh Express app with shared middleware.
 *
 * Middleware order:
 *   1. cors
 *   2. express.json
 *   3. requestLogger (logs method, path, status, duration)
 *   4. /healthz
 *   5. (stub mounts its own routes here)
 *   6. (stub mounts createNotFoundHandler here)
 *   7. error handler
 */
function createApp({ name = "stub" } = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "256kb" }));

  // ── Request logger ────────────────────────────────────────────────
  // Logs every request: timestamp | method path | status | duration
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const ms = Date.now() - start;
      console.log(
        `${new Date().toISOString()} | ${req.method} ${req.originalUrl} | ${res.statusCode} | ${ms}ms`,
      );
    });
    next();
  });

  // ── Health endpoint ───────────────────────────────────────────────
  app.get("/healthz", (req, res) => {
    res.json({
      status: "ok",
      stub: name,
      version: pkg.version,
      time: new Date().toISOString(),
    });
  });

  // ── Global error handler (LAST) ──────────────────────────────────
  app.use((err, req, res, next) => {
    console.error(`[${name}] unhandled error:`, err);
    res.status(200).json({
      code: 50000,
      msg: `internal ${name} stub error: ` + (err && err.message ? err.message : String(err)),
      request_id: "req_" + Date.now(),
    });
  });

  return app;
}

/**
 * 404 catch-all middleware. Must be mounted AFTER all routes.
 *
 * Usage:
 *   app.use(createNotFoundHandler("feee"));
 */
function createNotFoundHandler(name) {
  return (req, res) => {
    res.status(404).json({
      code: 404,
      msg: `not found on ${name} stub`,
      request_id: "req_" + Date.now(),
    });
  };
}

module.exports = { createApp, createNotFoundHandler };
