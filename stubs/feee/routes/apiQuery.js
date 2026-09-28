/**
 * GET /v2/api/query
 *
 * Pre-flight endpoint — returns platform TRX balance + pricing info.
 * Used by `stagePlaceOrder` in the backend's tronFungibleEnergyRefillHandler.
 */

const express = require("express");
const { success } = require("@dev-stub/lib/response");

function createApiQueryRouter({ platformBalance = 100 } = {}) {
  const router = express.Router();

  router.get("/v2/api/query", (req, res) => {
    res.json(
      success({
        trx_money: platformBalance,
        energy_price: 0.00042,
        bandwidth_price: 0.001,
        min_rent_duration: 1,
        max_rent_duration: 30,
        resource_prices: {
          energy: 0.00042,
          bandwidth: 0.001,
        },
      }),
    );
  });

  return router;
}

module.exports = { createApiQueryRouter };
