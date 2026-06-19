/**
 * validation.js — reusable input validators for TRON-related stubs.
 *
 * Provides TRON base58 address validation with checksum verification,
 * matching what the real Feee.io API would do.
 */

const crypto = require("crypto");

/**
 * Validate a TRON base58Check-encoded address.
 *
 * Format: 34 chars starting with 'T', base58 encoded, last 4 bytes are
 * the double-SHA256 checksum of [0x41 + 20-byte key hash].
 *
 * @param {string} addr
 * @returns {boolean}
 */
function isValidTronAddress(addr) {
  if (typeof addr !== "string") return false;
  if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(addr)) return false;

  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const decoded = [];
  for (const ch of addr) {
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) return false;
    let carry = idx;
    for (let i = 0; i < decoded.length; i++) {
      carry += decoded[i] * 58;
      decoded[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      decoded.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const ch of addr) {
    if (ch === "1") decoded.push(0);
    else break;
  }
  decoded.reverse();
  if (decoded.length !== 25) return false;

  const payload = decoded.slice(0, 21);
  const checksum = decoded.slice(21);
  const hash1 = crypto.createHash("sha256").update(Buffer.from(payload)).digest();
  const hash2 = crypto.createHash("sha256").update(hash1).digest();
  for (let i = 0; i < 4; i++) {
    if (hash2[i] !== checksum[i]) return false;
  }
  return payload[0] === 0x41;
}

/**
 * Estimate the TRX fee for a given resource value.
 * Rough rule: energy_price * resource_value.
 */
function estimateFeeTrx(resourceValue) {
  const v = Number(resourceValue) || 0;
  return +(v * 0.00042).toFixed(6);
}

module.exports = { isValidTronAddress, estimateFeeTrx };
