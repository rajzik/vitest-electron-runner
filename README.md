# vitest-electron-runner

A pnpm monorepo with a Vitest custom pool for real Electron main and renderer tests, with runnable React, Solid, and
Effect TypeScript example apps, plus a split-process Electron monorepo.

The runner targets Vitest 5.0.0 with its matching Vite runtime, independently of
Vite Plus's bundled Vitest 4. The React, Solid, and Effect examples use Vite Plus
Browser Mode with Playwright Chromium. The split-process monorepo tests its own
Electron app through Playwright directly. The examples do not use the custom pool.
See the [runner documentation](packages/vitest-electron-runner/README.md) for its
configuration and [CONTEXT.md](CONTEXT.md) for the agreed test seams.
All workspace packages are private.

## Setup

Use Node.js 24.20.0, pinned in `.nvmrc`, and pnpm 11.25.0, pinned in
`package.json`.

```sh
nvm use
pnpm install
pnpm --filter @examples/react exec playwright install chromium
```

The Chromium download is shared by all three examples. On Linux CI, use
`playwright install --with-deps chromium` to install browser system libraries too.
Vite Plus is a local development dependency; no global installation is needed.

## Examples

| App                       | What it does                                                               | Start from the repository root       |
| ------------------------- | -------------------------------------------------------------------------- | ------------------------------------ |
| [React](examples/react)   | Task board with completion, filters, and deletion                          | `pnpm --filter @examples/react dev`  |
| [Solid](examples/solid)   | Expense tracker with categories and derived totals                         | `pnpm --filter @examples/solid dev`  |
| [Effect](examples/effect) | Order quotes with schema validation, inventory injection, and typed errors | `pnpm --filter @examples/effect dev` |

The [split-process monorepo](examples/monorepo) adds a persistent Electron scratchpad.
Run `ELECTRON_EXAMPLE_SHOW_WINDOW=1 pnpm --filter @examples/monorepo dev` to start its main and renderer together.

For the browser apps, open the local URL printed by the dev server. Each app runs without API keys,
accounts, or a backend. React and Solid keep changes in memory and reset on reload.
Effect uses a fixed demo inventory and never places an order.

See [the examples guide](examples/README.md) for test commands and implementation notes.

## Commands

Run these from the repository root:

| Command           | Purpose                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `pnpm build`      | Build the runner library and all example apps into their `dist/` directories             |
| `pnpm dev`        | Start the example dev servers and watch the runner library                               |
| `pnpm check`      | Check formatting, lint rules, and types                                                  |
| `pnpm fmt`        | Format the repository                                                                    |
| `pnpm test`       | Run all workspace tests, including Chromium browser tests and Electron integration tests |
| `pnpm test:watch` | Run workspace tests in watch mode                                                        |

To target one workspace package:

```sh
pnpm --filter @examples/react test
pnpm --filter @examples/solid build
pnpm --filter vitest-electron-runner build
```

Shared formatting, linting, and test discovery live in the root `vite.config.ts`.
Each browser example owns its framework plugin and browser test configuration.
The monorepo example runs its Electron integration tests in separate main and
renderer Node test projects. Root `pnpm test` runs the runner's Node integration driver first, then the example
Vitest projects. This keeps Vitest 5 pool tests separate from Vite Plus tests.
