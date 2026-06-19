/**
 * env.js — loads dotenv from the project root.
 *
 * Usage in any entry file:
 *   require("@dev-stub/env");
 *
 * This must be called BEFORE any module that reads process.env values.
 */

const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
