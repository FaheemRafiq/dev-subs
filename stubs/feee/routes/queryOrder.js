/**
 * GET /v2/order/query
 *
 * Poll an order's status. Simulates marketplace progression:
 *   - Immediately after submit  → status 1 (pending)
 *   - After DELEGATION_DELAY_MS → status 6 (delegated) with frozen_resource_value
 */

const express = require("express");
const { success, error, CODE } = require("@dev-stub/lib/response");

function createQueryOrderRouter({ store }) {
  const router = express.Router();

  router.get("/v2/order/query", (req, res) => {
    const order_no = req.query.order_no;
    if (!order_no) {
      return res.json(error(CODE.INVALID_PARAMS, "order_no is required"));
    }

    const order = store.getOrder(order_no);
    if (!order) {
      return res.json(error(CODE.ORDER_NOT_FOUND, "Order does not exist"));
    }

    store.tickOrder(order);

    res.json(
      success({
        order_no: order.order_no,
        status: order.status,
        receive_address: order.receive_address,
        resource_value: order.resource_value,
        frozen_resource_value: order.frozen_resource_value,
        frozen_tx_id: order.frozen_tx_id,
        pay_amount: order.pay_amount,
        rent_time_second: order.rent_time_second,
      }),
    );
  });

  return router;
}

module.exports = { createQueryOrderRouter };
