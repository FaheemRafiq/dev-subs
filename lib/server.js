/**
 * server.js — shared Express app factory.
 *
 * Sets up CORS, JSON body parsing, a /healthz endpoint, and a global
 * error handler that always returns Feee-shaped envelopes.
 *
 * Each stub calls `createApp()` then mounts its own routes under `/open`.
 *
 * Usage:
 *   const { createApp } = require("../../lib/server");
 *   const app = createApp({ name: "feee", port: 3080 });
 *   app.use("/open", auth, ...routes);
 *   app.listen();
 */

const express = require("express");
const cors = require("cors");
const path = require("path");

const pkg = require(path.resolve(__dirname, "..", "package.json"));

/**
 * @param {object} opts
 * @param {string} opts.name  - Stub name (shown in the startup banner)
 * @param {number} [opts.port] - Listen port (defaults to 3080)
 * @returns {import("express").Express}
 */
function createApp({ name = "stub", port } = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "256kb" }));

  // Health endpoint (unauthed, no prefix) — quick liveness check
  app.get("/healthz", (req, res) => {
    res.json({
      status: "ok",
      stub: name,
      version: pkg.version,
      time: new Date().toISOString(),
    });
  });

  // 404 for requests outside our known prefixes
  app.use((req, res) => {
    res.status(404).json({
      code: 404,
      msg: `not found on ${name} stub`,
      request_id: "req_" + Date.now(),
    });
  });

  // Global error handler — always return a JSON envelope
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

module.exports = { createApp };
