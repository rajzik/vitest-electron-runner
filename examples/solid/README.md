# Solid example

A trip expense tracker built with Solid. Add categorized expenses, filter them,
and see totals update through signals and memos. Amounts are stored in cents.
State resets when the page reloads.

From the repository root, after [setup](../../README.md#setup):

```sh
pnpm --filter @examples/solid dev
pnpm --filter @examples/solid test
pnpm --filter @examples/solid build
pnpm --filter @examples/solid preview
```

Open the URL printed by the dev or preview server. Tests run in headless Chromium.
This app uses Vitest Browser Mode directly; it does not use the Electron custom pool.
See [the examples guide](../README.md) for architecture and test coverage.
