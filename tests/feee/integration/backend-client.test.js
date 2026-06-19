/**
 * backend-client.test.js — integration test that verifies the real
 * backend's feeeClient can talk to the dev-stub feee mock.
 *
 * Run from A-Bot-backend/ root:
 *   cd A-Bot-backend && node ../dev-stub/tests/feee/integration/backend-client.test.js
 *
 * Expected env: dev-stub's feee server running at localhost:3080
 */

const path = require("path");
const DEV_STUB_ROOT = path.resolve(__dirname, "..", "..", "..");
const BACKEND_ROOT = path.resolve(DEV_STUB_ROOT, "..", "A-Bot-backend");

// Initialize module-alias the way the backend expects
const moduleAlias = require(path.join(BACKEND_ROOT, "node_modules", "module-alias"));
moduleAlias.addAliases({
  "@utils": path.join(BACKEND_ROOT, "utils"),
  "@modules": path.join(BACKEND_ROOT, "modules"),
  "@models": path.join(BACKEND_ROOT, "models"),
  "@config": path.join(BACKEND_ROOT, "config"),
  "@services": path.join(BACKEND_ROOT, "services"),
  "@bullmq": path.join(BACKEND_ROOT, "bullmq"),
  "@db_services": path.join(BACKEND_ROOT, "db_services"),
});

// Inject FEEE env vars into SecureEnv BEFORE requiring feeeClient
const SecureEnv = require(path.join(BACKEND_ROOT, "modules/keys/storage.js"));
SecureEnv.FEEE_BASE_URL = "http://localhost:3080/open";
SecureEnv.FEEE_API_KEY = "test-key-123";

const feeeClient = require(path.join(BACKEND_ROOT, "utils/common/feeeClient.js"));

(async () => {
  console.log("\n[integration:test:feee] feeeClient against dev-stub mock\n");
  let pass = 0, fail = 0;
  const ok = (label, cond) => {
    if (cond) { pass++; console.log(`  \u2713 ${label}`); }
    else { fail++; console.log(`  \u2717 ${label}`); }
  };

  try {
    // 1. GET /v2/api/query
    const api = await feeeClient.getApiQuery();
    ok("getApiQuery returns code 0", api.code === 0);
    ok("getApiQuery returns trx_money", typeof api.data.trx_money === "number");

    // 2. GET /v2/order/estimate_energy
    const est = await feeeClient.estimateEnergy({
      from_address: "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8",
      to_address: "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8",
      contract_address: "TDPgDew2tC6BwqY3psfWPtVCJNr91emZP6",
    });
    ok("estimateEnergy returns code 0", est.code === 0);
    ok("estimateEnergy returns energy_used", est.data.energy_used > 0);

    // 3. POST /v2/order/submit
    const sub = await feeeClient.createOrder({
      receive_address: "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8",
      resource_value: 55200,
      rent_duration: 1,
      rent_time_unit: "h",
      rent_time_second: 3600,
    });
    ok("createOrder returns code 0", sub.code === 0);
    ok("createOrder returns order_no", typeof sub.data.order_no === "string");
    const orderNo = sub.data.order_no;

    // 4. GET /v2/order/query (immediate = pending)
    const q1 = await feeeClient.queryOrder(orderNo);
    ok("queryOrder (immediate) returns code 0", q1.code === 0);
    ok("queryOrder (immediate) status === 1", q1.data.status === 1);

    // 5. wait + query (delegated)
    await new Promise((r) => setTimeout(r, 3500));
    const q2 = await feeeClient.queryOrder(orderNo);
    ok("queryOrder (after delay) status === 6", q2.data.status === 6);
    ok("queryOrder (after delay) frozen_resource_value > 0", q2.data.frozen_resource_value > 0);

    // 6. POST /v2/order/cancel
    const cancel = await feeeClient.cancelOrder(orderNo);
    ok("cancelOrder returns code 0", cancel.code === 0);
  } catch (err) {
    fail++;
    console.log(`  \u2717 threw: ${err.message}`);
  }

  console.log(`\n[integration:test:feee] ${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
