/**
 * feee — Feee.io mock stub.
 *
 * Drop-in replacement for https://feee.io/open.
 *
 * Endpoints:
 *   GET  /open/v2/api/query
 *   GET  /open/v2/order/estimate_energy
 *   POST /open/v2/order/submit
 *   GET  /open/v2/order/query
 *   POST /open/v2/order/cancel
 *
 * Config (env):
 *   FEEE_PORT, FEEE_API_KEY, FEEE_PLATFORM_BALANCE, FEEE_ENERGY_USED,
 *   FEEE_DELEGATION_DELAY_MS, FEEE_ORDER_PREFIX
 *
 * Usage:
 *   cd dev-stubs
 *   pnpm run feee
 */

require("module-alias/register");
require("@dev-stub/env");

const { createApp, createNotFoundHandler } = require("@dev-stub/lib/server");
const { createAuth } = require("@dev-stub/lib/auth");
const { createStore } = require("./store");
const { createApiQueryRouter } = require("./routes/apiQuery");
const { createEstimateEnergyRouter } = require("./routes/estimateEnergy");
const { createSubmitOrderRouter } = require("./routes/submitOrder");
const { createQueryOrderRouter } = require("./routes/queryOrder");
const { createCancelOrderRouter } = require("./routes/cancelOrder");

const PORT = Number(process.env.FEEE_PORT || 3080);
const API_KEY = process.env.FEEE_API_KEY || "test-key-123";
const PLATFORM_BALANCE = Number(process.env.FEEE_PLATFORM_BALANCE || 100);
const ENERGY_USED = Number(process.env.FEEE_ENERGY_USED || 48000);
const DELEGATION_DELAY_MS = Number(process.env.FEEE_DELEGATION_DELAY_MS || 3000);
const ORDER_PREFIX = process.env.FEEE_ORDER_PREFIX || "mock-";

const app = createApp({ name: "feee" });
const store = createStore({ orderPrefix: ORDER_PREFIX, delegationDelayMs: DELEGATION_DELAY_MS });
const auth = createAuth({ apiKey: API_KEY });

// ── Routes (mounted BEFORE the 404 handler) ────────────────────────────
app.use(
  "/open",
  auth,
  createApiQueryRouter({ platformBalance: PLATFORM_BALANCE }),
  createEstimateEnergyRouter({ energyUsed: ENERGY_USED }),
  createSubmitOrderRouter({ store }),
  createQueryOrderRouter({ store }),
  createCancelOrderRouter({ store }),
);

// ── 404 catch-all (MUST be AFTER all routes) ──────────────────────────
app.use(createNotFoundHandler("feee"));

app.listen(PORT, () => {
  console.log("================================================");
  console.log("  dev-stub :: feee (Feee.io mock)");
  console.log("================================================");
  console.log(`  Listening       : http://localhost:${PORT}`);
  console.log(`  Health          : http://localhost:${PORT}/healthz`);
  console.log(`  Base URL        : http://localhost:${PORT}/open`);
  console.log(`  API key         : ${API_KEY}`);
  console.log(`  Energy used     : ${ENERGY_USED}`);
  console.log(`  Delegation delay: ${DELEGATION_DELAY_MS}ms`);
  console.log(`  Order prefix    : ${ORDER_PREFIX}`);
  console.log(`  Platform balance: ${PLATFORM_BALANCE} TRX`);
  console.log("================================================");
});
