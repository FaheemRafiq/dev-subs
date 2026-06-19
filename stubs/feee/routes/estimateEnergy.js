/**
 * GET /v2/order/estimate_energy
 *
 * Returns a canned energy estimate for a TRC-20 transfer.
 * The backend's `stageEstimateEnergy` uses this to calculate how much
 * energy to rent.
 */

const express = require("express");
const { success, error, CODE } = require("@dev-stub/lib/response");
const { isValidTronAddress, estimateFeeTrx } = require("@dev-stub/lib/validation");

function createEstimateEnergyRouter({ energyUsed = 48000 } = {}) {
  const router = express.Router();

  router.get("/v2/order/estimate_energy", (req, res) => {
    const { from_address, to_address, contract_address } = req.query;

    if (!from_address || !to_address) {
      return res.json(error(CODE.INVALID_PARAMS, "from_address and to_address are required"));
    }
    if (!isValidTronAddress(from_address) || !isValidTronAddress(to_address)) {
      return res.json(error(CODE.INVALID_PARAMS, "invalid TRON address"));
    }
    if (contract_address && !isValidTronAddress(contract_address)) {
      return res.json(error(CODE.INVALID_PARAMS, "invalid contract_address"));
    }

    res.json(
      success({
        energy_used: energyUsed,
        fee: estimateFeeTrx(energyUsed),
        bandwidth: 680,
      }),
    );
  });

  return router;
}

module.exports = { createEstimateEnergyRouter };
