# Example apps

These apps provide small, complete workflows for testing React rendering, Solid
reactivity, and Effect programs. The three browser apps run in Chromium through
[Vite Plus](https://viteplus.dev/guide/test) and
[Vitest Browser Mode](https://vitest.dev/guide/browser/).
These examples do not import the Electron custom pool; they use Browser Mode or
Playwright directly.

The [monorepo example](monorepo) runs a desktop scratchpad in Electron with
separate main, renderer, and shared-contract packages. Start it with
`ELECTRON_EXAMPLE_SHOW_WINDOW=1 pnpm --filter @examples/monorepo dev`. Its tests launch real Electron through
Playwright and check note persistence across process restarts.

## Run an app

After the [root setup](../README.md#setup), run one of:

```sh
pnpm --filter @examples/react dev
pnpm --filter @examples/solid dev
pnpm --filter @examples/effect dev
```

Each browser app also supports `build`, `preview`, `test`, and `test:watch`. For example:

```sh
pnpm --filter @examples/react build
pnpm --filter @examples/react preview
pnpm --filter @examples/react test
pnpm --filter @examples/react test:watch --browser.headless=false
```

Run `pnpm test` at the root for all examples. Tests mount fresh app instances and
use browser locators to fill forms, click controls, and assert visible results.
They run without a separate dev server, DOM emulation, or external services.
The monorepo tests build their main and renderer first and run Electron with hidden
windows, so the app does not interrupt your work.

## What's covered

| Example          | Application                                                                   | Tests                                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [React](react)   | A studio task board using component state                                     | Add and trim tasks, complete and reopen, filter, delete, reject blank input, show empty state                                 |
| [Solid](solid)   | Trip expenses using signals and memoized totals, with amounts stored in cents | Add and delete expenses, select and filter categories, recalculate totals, reject invalid amounts                             |
| [Effect](effect) | A notebook order form backed by an Effect program and demo inventory layer    | Quote delivery costs, handle validation and stock errors, clear stale results, recover after correction, substitute inventory |

The Effect example uses vanilla DOM rendering because Effect is a TypeScript
library rather than a UI framework. `src/quote.ts` owns the program and its
requirements. `src/app.ts` supplies the inventory layer and handles the result.
The domain tests use a separate inventory layer to verify that pricing and stock
come from the provided service.

`shared/style.css` is the only shared visual asset. The monorepo additionally
shares an IPC interface through its contracts package. Each example has its own manifest,
HTML entry, TypeScript configuration, and Vite configuration. Keep the `shared`
directory when copying an example, or copy the stylesheet and update its import.

React and Solid data resets on refresh. Quotes use eight demo notebooks at €12
each. Standard delivery costs €4 and is free at a subtotal of €50 or more; express
delivery always costs €9. No checkout or network request occurs.
