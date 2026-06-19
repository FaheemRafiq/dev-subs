/**
 * POST /v2/order/submit
 *
 * Place a rental order. Returns an `order_no` that the backend can poll
 * via GET /v2/order/query.
 */

const express = require("express");
const { success, error, CODE } = require("@dev-stub/lib/response");
const { isValidTronAddress, estimateFeeTrx } = require("@dev-stub/lib/validation");

function createSubmitOrderRouter({ store }) {
  const router = express.Router();

  router.post("/v2/order/submit", (req, res) => {
    const body = req.body || {};
    const receive_address = body.receive_address;
    const resource_value = Number(body.resource_value);
    const rent_time_second = Number(body.rent_time_second) || 3600;

    if (!receive_address || !resource_value) {
      return res.json(error(CODE.INVALID_PARAMS, "receive_address and resource_value are required"));
    }
    if (!isValidTronAddress(receive_address)) {
      return res.json(error(CODE.INVALID_PARAMS, "invalid receive_address"));
    }
    if (resource_value <= 0) {
      return res.json(error(CODE.INVALID_PARAMS, "resource_value must be positive"));
    }

    const order = store.placeOrder({ receive_address, resource_value, rent_time_second });
    order.pay_amount = estimateFeeTrx(resource_value);

    res.json(
      success({
        order_no: order.order_no,
        pay_amount: order.pay_amount,
        rent_time_second: order.rent_time_second,
        status: order.status,
        receive_address: order.receive_address,
        resource_value: order.resource_value,
      }),
    );
  });

  return router;
}

module.exports = { createSubmitOrderRouter };
