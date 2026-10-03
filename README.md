# orderly — bug bench

A tiny, dependency-free order/refund service used as a fixture for evaluating
automated code review tools.

**This code contains intentional defects. Do not use it as a reference or copy it
into anything real.** The bugs are planted on purpose so a reviewer (human or
machine) can be scored on whether it finds them. Locations are deliberately not
documented here.

## Layout

| Path              | Purpose                                            |
| ----------------- | -------------------------------------------------- |
| `src/server.js`   | `node:http` entrypoint                             |
| `src/orders.js`   | Route handlers: list, read, pay, refund            |
| `src/auth.js`     | Bearer token session lookup + access rules         |
| `src/payments.js` | Charge-with-retry and refund logic                 |
| `src/gateway.js`  | Fake payment gateway, dedupes on idempotency key    |
| `src/store.js`    | In-memory users, sessions, orders                  |
| `test/repro.js`   | Four behavioral checks                             |

## Run

```sh
npm start        # serves on http://localhost:3000
npm run repro    # runs the behavioral checks
npm run --silent repro -- --json  # emits parseable JSON without npm's banner
npm test         # verifies repro output formats
```

The checks are expected to fail on this revision.

The JSON report contains a `results` array with each check's `name` and
`status` (`passed` or `failed`); failed checks also include an `error` message.
The `summary` object reports `total`, `passed`, and `failed` counts.
The `--silent` option suppresses npm's own lifecycle banner so standard output
contains only the JSON report.

### Sample requests

```sh
curl -H 'Authorization: Bearer tok-ada'   localhost:3000/orders
curl -H 'Authorization: Bearer tok-grace' localhost:3000/orders/o_100
curl -XPOST -H 'Authorization: Bearer tok-grace' localhost:3000/orders/o_200/pay
```

Seeded tokens: `tok-ada` (customer `u_1`), `tok-grace` (customer `u_2`),
`tok-admin` (admin `u_9`).
