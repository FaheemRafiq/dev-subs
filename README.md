# dev-stub

Modular stub/mock server for A-Bot development and testing.

Each stub lives under `stubs/<name>/` and is independently startable
via a `pnpm run <name>` script. Shared utilities live in `lib/` and
are imported via `@dev-stub/lib/...` aliases (powered by `module-alias`,
same pattern as `A-Bot-backend`).

## Structure

```
dev-stub/
├── package.json              # Scripts + _moduleAliases config
├── .env.example              # All env vars (copy to .env)
├── .gitignore
├── README.md
├── lib/                      # Shared utilities for all stubs (import via @dev-stub/lib/...)
│   ├── env.js                # Loads dotenv from root .env
│   ├── response.js           # success(), error(), CODE constants
│   ├── auth.js               # createAuth({ apiKey }) middleware
│   ├── validation.js         # Input validators (isValidTronAddress, ...)
│   └── server.js             # createApp({ name, port }) Express factory
├── stubs/                    # Each stub is a self-contained directory
│   ├── _template/            # Copy this to start a new stub
│   │   └── index.js
│   └── feee/                 # Feee.io mock (docs/docs/feee.md)
│       ├── index.js          # Entry point
│       ├── store.js          # In-memory order store
│       └── routes/           # Express route handlers
│           ├── apiQuery.js
│           ├── estimateEnergy.js
│           ├── submitOrder.js
│           ├── queryOrder.js
│           └── cancelOrder.js
├── tests/                    # Per-stub tests
│   ├── feee/
│   │   ├── smoke.test.js
│   │   └── integration/
│   │       └── backend-client.test.js
│   └── ...
└── docs/                     # Per-stub documentation
    ├── feee.md
    └── ...
```

## Module aliases

All modules inside `dev-stub` use `@dev-stub/...` aliases instead of
brittle relative paths:

| Alias | Resolves to | Example |
|---|---|---|
| `@dev-stub/lib/response` | `lib/response.js` | `const { success } = require("@dev-stub/lib/response")` |
| `@dev-stub/lib/auth` | `lib/auth.js` | `const { createAuth } = require("@dev-stub/lib/auth")` |
| `@dev-stub/lib/server` | `lib/server.js` | `const { createApp } = require("@dev-stub/lib/server")` |
| `@dev-stub/lib/validation` | `lib/validation.js` | `const { isValidTronAddress } = require("@dev-stub/lib/validation")` |
| `@dev-stub/env` | `lib/env.js` | `require("@dev-stub/env")` — loads `.env` from root |

The first line of every entry file must be:
```js
require("module-alias/register");
```

This reads the `_moduleAliases` map from the nearest `package.json`
and registers the path aliases.

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm run feee
```

## Adding a new stub

1. **Copy the template**
   ```bash
   cp -r stubs/_template stubs/my-stub
   ```

2. **Write your routes** in `stubs/my-stub/routes/`. Import shared
   utilities via `@dev-stub/lib/...`.

3. **Add a script** in `package.json`:
   ```json
   "my-stub": "node stubs/my-stub/index.js"
   ```

4. **Add env vars** to `.env.example` with the `MY_STUB_` prefix.

5. **Add docs** at `docs/my-stub.md`.

## Shared lib utilities

| Module | Exports | Purpose |
|---|---|---|
| `lib/env.js` | — (side-effect) | Loads dotenv from root `.env` |
| `lib/response.js` | `success(data)`, `error(code, msg)`, `CODE` | Build JSON envelopes matching `{ code, msg, request_id, data }` |
| `lib/auth.js` | `createAuth({ apiKey })` | Express middleware that validates the `key` header |
| `lib/validation.js` | `isValidTronAddress(addr)`, `estimateFeeTrx(val)` | TRON address validation with base58Check |
| `lib/server.js` | `createApp({ name, port })` | Sets up CORS, JSON parsing, `/healthz`, error handler |

## Current stubs

| Stub | Script | Port | Description |
|---|---|---|---|
| feee | `pnpm run feee` | 3080 | Feee.io Energy rental API mock |
| — | `pnpm run feee:dev` | 3080 | Same with `node --watch` for hot-reload |
