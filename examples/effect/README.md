# Effect example

A notebook order-quote app built with Effect and vanilla TypeScript. Schema
validation parses form input, an inventory layer supplies stock and prices, and
typed failures become visible form errors. No order is placed.

From the repository root, after [setup](../../README.md#setup):

```sh
pnpm --filter @examples/effect dev
pnpm --filter @examples/effect test
pnpm --filter @examples/effect build
pnpm --filter @examples/effect preview
```

Open the URL printed by the dev or preview server. Tests run in headless Chromium.
This app uses Vitest Browser Mode directly; it does not use the Electron custom pool.
See [the examples guide](../README.md) for architecture and test coverage.
