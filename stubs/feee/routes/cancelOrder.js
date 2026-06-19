/**
 * POST /v2/order/cancel
 *
 * Cancel a previously-placed order. Used by the backend's retry path
 * to clean up stale orders before placing new ones.
 */

const express = require("express");
const { success, error, CODE } = require("@dev-stub/lib/response");

function createCancelOrderRouter({ store }) {
  const router = express.Router();

  router.post("/v2/order/cancel", (req, res) => {
    const order_no = (req.body || {}).order_no;
    if (!order_no) {
      return res.json(error(CODE.INVALID_PARAMS, "order_no is required"));
    }

    const order = store.cancelOrder(order_no);
    if (!order) {
      return res.json(error(CODE.ORDER_NOT_FOUND, "Order does not exist"));
    }

    res.json(success({ order_no: order.order_no, status: order.status }));
  });

  return router;
}

module.exports = { createCancelOrderRouter };
