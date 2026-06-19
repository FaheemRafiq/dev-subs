/**
 * smoke.test.js — black-box smoke test for the feee stub.
 *
 * Expects the server at http://localhost:3080 (start with `pnpm run feee`).
 * Tests: health, auth, all 5 endpoints, order lifecycle progression.
 *
 * Usage:
 *   pnpm run test:feee
 */

const BASE = "http://localhost:3080/open";
const HEALTH = "http://localhost:3080/healthz";
const KEY = process.env.FEEE_API_KEY || "test-key-123";

let pass = 0;
let fail = 0;

function assert(cond, label) {
  if (cond) { pass++; console.log(`  \u2713 ${label}`); }
  else { fail++; console.log(`  \u2717 ${label}`); }
}

async function get(path, { key = KEY } = {}) {
  const res = await fetch(BASE + path, {
    method: "GET",
    headers: key ? { key } : {},
  });
  return { status: res.status, body: await res.json() };
}

async function post(path, payload, { key = KEY } = {}) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", key },
    body: JSON.stringify(payload || {}),
  });
  return { status: res.status, body: await res.json() };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VALID_ADDR = "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8";
const VALID_CONTRACT = "TDPgDew2tC6BwqY3psfWPtVCJNr91emZP6";

(async () => {
  console.log(`\n[test:feee] target = ${BASE}\n`);

  // --- health ---
  console.log("[1] Health check");
  const healthRes = await fetch(HEALTH);
  const health = await healthRes.json();
  assert(health.status === "ok", "GET /healthz returns ok");

  // --- auth ---
  console.log("\n[2] Auth");
  const noKey = await get("/v2/api/query", { key: null });
  assert(noKey.body.code === 10001, "missing key → code 10001");
  const badKey = await get("/v2/api/query", { key: "wrong" });
  assert(badKey.body.code === 10001, "wrong key → code 10001");

  // --- api query ---
  console.log("\n[3] /v2/api/query");
  const api = await get("/v2/api/query");
  assert(api.body.code === 0, "code === 0");
  assert(typeof api.body.data.trx_money === "number", "trx_money is a number");

  // --- estimate ---
  console.log("\n[4] /v2/order/estimate_energy");
  const estBad = await get(
    "/v2/order/estimate_energy?from_address=NOT_VALID&to_address=" + VALID_ADDR,
  );
  assert(estBad.body.code !== 0, "invalid from_address → non-zero code");
  const est = await get(
    `/v2/order/estimate_energy?from_address=${VALID_ADDR}&to_address=${VALID_ADDR}&contract_address=${VALID_CONTRACT}`,
  );
  assert(est.body.code === 0, "valid params → code 0");
  assert(est.body.data.energy_used > 0, "energy_used positive");

  // --- submit (bad address) ---
  console.log("\n[5] /v2/order/submit (bad address)");
  const subBad = await post("/v2/order/submit", { receive_address: "not-valid", resource_value: 1000 });
  assert(subBad.body.code !== 0, "bad receive_address → non-zero code");

  // --- submit + query progression ---
  console.log("\n[6] /v2/order/submit → /v2/order/query (progression)");
  const sub = await post("/v2/order/submit", {
    receive_address: VALID_ADDR,
    resource_value: 55200,
    rent_duration: 1,
    rent_time_unit: "h",
    rent_time_second: 3600,
  });
  assert(sub.body.code === 0, "submit → code 0");
  assert(typeof sub.body.data.order_no === "string", "order_no returned");
  const orderNo = sub.body.data.order_no;

  const q1 = await get("/v2/order/query?order_no=" + orderNo);
  assert(q1.body.code === 0, "query (immediate) → code 0");
  assert(q1.body.data.status === 1, "query (immediate) → status 1 (pending)");

  console.log("  ...waiting for delegation delay...");
  await sleep(3500);

  const q2 = await get("/v2/order/query?order_no=" + orderNo);
  assert(q2.body.data.status === 6, "query (after delay) → status 6 (delegated)");
  assert(q2.body.data.frozen_resource_value === 55200, "frozen_resource_value matches");
  assert(typeof q2.body.data.frozen_tx_id === "string", "frozen_tx_id present");

  // --- query missing ---
  console.log("\n[7] /v2/order/query (missing order)");
  const qMiss = await get("/v2/order/query?order_no=does-not-exist");
  assert(qMiss.body.code === 20004, "missing order → code 20004");

  // --- cancel ---
  console.log("\n[8] /v2/order/cancel");
  const sub2 = await post("/v2/order/submit", { receive_address: VALID_ADDR, resource_value: 1000 });
  assert(sub2.body.code === 0, "second submit → code 0");
  const cancel = await post("/v2/order/cancel", { order_no: sub2.body.data.order_no });
  assert(cancel.body.code === 0, "cancel → code 0");
  assert(cancel.body.data.status === 10, "cancelled status === 10");

  console.log(`\n[test:feee] ${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
