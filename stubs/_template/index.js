/**
 * _template — scaffolding for a new stub.
 *
 * Copy this directory to stubs/<your-stub-name>/ and rename things.
 * Then add a script to package.json:
 *   "my-stub": "node stubs/my-stub/index.js"
 */

require("module-alias/register");
require("@dev-stub/env");

const { createApp } = require("@dev-stub/lib/server");
const { createAuth } = require("@dev-stub/lib/auth");

const PORT = Number(process.env.MY_STUB_PORT || 3090);
const API_KEY = process.env.MY_STUB_API_KEY || "test-key-123";

const app = createApp({ name: "my-stub", port: PORT });
const auth = createAuth({ apiKey: API_KEY });

// Mount your routes under a versioned base path (mirrors the real API)
// const myRouter = require("./routes/myRoute");
// app.use("/v1", auth, myRouter);

app.listen(PORT, () => {
  console.log(`  [my-stub] listening on http://localhost:${PORT}`);
});
