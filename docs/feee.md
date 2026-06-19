# feee — Feee.io mock stub

A drop-in mock for the [Feee.io](https://feee.io) Energy/Bandwidth
rental API. Use it when developing/testing the A-Bot TRON fungible
energy-refill job against Shasta testnet (Feee.io is mainnet-only).

## Why this exists

The energy-refill job (`init-tron-fungible-energy-refill` in
`A-Bot-backend`) calls Feee.io for three operations:
1. Estimate energy required for a TRC-20 transfer.
2. Place a rental order on the marketplace.
3. Poll the order until energy is delegated.

Feee.io only works on mainnet. To test the full 5-stage job on Shasta,
we point the backend at this stub instead.

## Endpoints

All endpoints live under `/open` (mirrors `https://feee.io/open`).

| Method | Path | Description |
|---|---|---|
| `GET`  | `/open/v2/api/query` | Platform balance + valid durations |
| `GET`  | `/open/v2/order/estimate_energy` | Canned energy estimate |
| `POST` | `/open/v2/order/submit` | Place rental order |
| `GET`  | `/open/v2/order/query` | Poll order status |
| `POST` | `/open/v2/order/cancel` | Cancel order |

Auth: `key` header matching `FEEE_API_KEY`.

## Config

All via `.env` (see `.env.example`):

| Variable | Default | Purpose |
|---|---|---|
| `FEEE_PORT` | `3080` | Listen port |
| `FEEE_API_KEY` | `test-key-123` | Required `key` header |
| `FEEE_PLATFORM_BALANCE` | `100` | Canned `trx_money` for `/api/query` |
| `FEEE_ENERGY_USED` | `48000` | Canned `energy_used` |
| `FEEE_DELEGATION_DELAY_MS` | `3000` | Time before order reads `status: 6` |
| `FEEE_ORDER_PREFIX` | `mock-` | Generated order_no prefix |

## Order lifecycle

```
submit    → status: 1 (pending),  frozen_resource_value: 0
[≥delay]
poll      → status: 6 (delegated), frozen_resource_value: resource_value
                                     frozen_tx_id: "mock-tx-<order_no>"
cancel    → status: 10 (cancelled)
```

## Wiring the backend

In `A-Bot-backend/.env`:

```env
FEEE_BASE_URL=http://localhost:3080/open
FEEE_API_KEY=test-key-123
TRON_FUNGIBLE_ENERGY_REFILL_ENABLED=true
```

## Testing

```bash
# Terminal 1
pnpm run feee

# Terminal 2
pnpm run test:feee              # black-box smoke test
pnpm run test:feee:integration  # real feeeClient → mock (run from A-Bot-backend/)
```
