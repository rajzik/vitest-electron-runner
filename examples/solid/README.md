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

Open the URL printed by the dev or preview server. Tests build the local core
library and run in its hidden Electron renderer pool using Vitest 5. They use
DOM Testing Library rather than a Playwright browser provider.
See [the examples guide](../README.md) for configuration and coverage.
