/**
 * auth.js — reusable API-key authentication middleware.
 *
 * Validates the key header sent by the backend client. If missing or
 * wrong, returns `{ code: 10001, msg: "Invalid API Key", ... }`.
 *
 * Usage:
 *   const { createAuth } = require("../../lib/auth");
 *   app.use("/open", createAuth({ apiKey: "test-key-123" }), ...);
 */

const { CODE, error, genRequestId } = require("./response");

function createAuth({ apiKey }) {
  if (!apiKey) {
    throw new Error("createAuth requires an apiKey");
  }
  return function authMiddleware(req, res, next) {
    const provided = req.get("key") || req.get("Key") || req.get("KEY");
    if (!provided || provided !== apiKey) {
      const reqId = genRequestId();
      return res.status(200).json(error(CODE.INVALID_API_KEY, "Invalid API Key", reqId));
    }
    next();
  };
}

module.exports = { createAuth };
