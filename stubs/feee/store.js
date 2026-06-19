/**
 * store.js — in-memory order store for the Feee.io mock.
 *
 * Each order transitions:
 *   submitted → status: 1 (pending),   frozen_resource_value: 0
 *   after Δt  → status: 6 (delegated), frozen_resource_value: resource_value
 *   cancelled → status: 10 (cancelled)
 *
 * Orders are lost on server restart (intentional — keeps the mock
 * stateless for reproducible tests).
 */

const crypto = require("crypto");

function createStore({ orderPrefix = "mock-", delegationDelayMs = 3000 } = {}) {
  const orders = new Map();

  function nextOrderNo() {
    const ts = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand = crypto.randomBytes(4).toString("hex");
    return `${orderPrefix}${ts}-${rand}`;
  }

  function placeOrder({ receive_address, resource_value, rent_time_second = 3600 }) {
    const order_no = nextOrderNo();
    const order = {
      order_no,
      status: 1,
      receive_address,
      resource_value,
      createdAt: Date.now(),
      frozen_resource_value: 0,
      frozen_tx_id: null,
      pay_amount: 0,
      rent_time_second,
    };
    orders.set(order_no, order);
    return order;
  }

  function getOrder(order_no) {
    return orders.get(order_no) || null;
  }

  /**
   * Advance the order's state based on elapsed time.
   * Returns the (possibly mutated) order.
   */
  function tickOrder(order) {
    if (!order) return null;
    if (order.status === 1 && Date.now() - order.createdAt >= delegationDelayMs) {
      order.status = 6;
      order.frozen_resource_value = order.resource_value;
      order.frozen_tx_id = `mock-tx-${order.order_no}`;
    }
    return order;
  }

  function cancelOrder(order_no) {
    const o = orders.get(order_no);
    if (!o) return null;
    o.status = 10;
    return o;
  }

  function size() {
    return orders.size;
  }

  return { placeOrder, getOrder, tickOrder, cancelOrder, size };
}

module.exports = { createStore };
