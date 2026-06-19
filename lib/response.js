/**
 * response.js — builder helpers for Feee.io-compatible JSON envelopes.
 *
 * Every stub should use these so all mocks share a consistent response
 * format and error vocabulary.
 *
 * Usage:
 *   const { success, error, CODE } = require("../../lib/response");
 *   res.json(success({ key: "val" }));
 *   res.json(error(CODE.INVALID_PARAMS, "what went wrong"));
 */

const { v4: uuidv4 } = require("uuid");

const CODE = Object.freeze({
  SUCCESS: 0,
  INVALID_API_KEY: 10001,
  INVALID_PARAMS: 10003,
  RATE_LIMIT: 11001,
  INSUFFICIENT_BALANCE: 20002,
  ORDER_NOT_FOUND: 20004,
  TOO_MANY_CONCURRENT: 20014,
});

function genRequestId() {
  return "req_" + uuidv4().replace(/-/g, "").slice(0, 16);
}

/**
 * Build a success response.
 * @param {object} data - Payload body
 * @param {string} [reqId] - Optional request id (auto-generated if omitted)
 * @returns {{ code:0, msg:"success", request_id:string, data:object }}
 */
function success(data = {}, reqId) {
  return {
    code: CODE.SUCCESS,
    msg: "success",
    request_id: reqId || genRequestId(),
    data,
  };
}

/**
 * Build an error response.
 * @param {number} code - Error code from the CODE map
 * @param {string} msg - Human-readable message
 * @param {string} [reqId] - Optional request id
 * @returns {{ code:number, msg:string, request_id:string }}
 */
function error(code, msg, reqId) {
  return {
    code,
    msg: msg || "error",
    request_id: reqId || genRequestId(),
  };
}

module.exports = { CODE, success, error, genRequestId };
