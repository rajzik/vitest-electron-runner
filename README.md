# vitest-electron-runner

A Vitest custom pool for tests in real Electron main and renderer processes, with
React, Solid, Effect, and split-process monorepo examples that use the core library.
All workspace packages are private.

The runner and examples target Vitest 5.0.0 and Electron 44.2.0. Vite Plus handles
builds, dev servers, formatting, and linting. Test commands invoke Vitest 5 directly
because Vite Plus bundles a different Vitest version.

## Setup

Use Node.js 24.20.0 from `.nvmrc` and pnpm 11.25.0 from `package.json`:

```sh
nvm use
pnpm install
pnpm build
pnpm test
```

Electron downloads its runtime as needed. No separate Playwright Chromium download
is required. Electron needs a graphical session; Linux CI can use `xvfb-run -a pnpm test`.

## Examples

| App                                               | Start from the repository root                                        |
| ------------------------------------------------- | --------------------------------------------------------------------- |
| [React task board](examples/react)                | `pnpm --filter @examples/react dev`                                   |
| [Solid expense tracker](examples/solid)           | `pnpm --filter @examples/solid dev`                                   |
| [Effect order quotes](examples/effect)            | `pnpm --filter @examples/effect dev`                                  |
| [Split-process Electron notes](examples/monorepo) | `ELECTRON_EXAMPLE_SHOW_WINDOW=1 pnpm --filter @examples/monorepo dev` |

See the [examples guide](examples/README.md) for test commands, package layout,
and coverage. Each example depends on the local `vitest-electron-runner` package
and configures `electronPool` in its `vitest.config.ts`.

## Commands

| Command           | Purpose                                                         |
| ----------------- | --------------------------------------------------------------- |
| `pnpm build`      | Build the runner and example apps                               |
| `pnpm dev`        | Watch the library and start example dev servers                 |
| `pnpm check`      | Check formatting, lint rules, and types                         |
| `pnpm fmt`        | Format the repository                                           |
| `pnpm test`       | Run the runner's integration suite, then all example pool tests |
| `pnpm test:watch` | Build the runner, then watch example tests                      |

To watch the runner's own integration suite, use
`pnpm --filter vitest-electron-runner test:watch`.
The root `vite.config.ts` owns formatting and linting; `vitest.config.ts` discovers
example projects. The runner has its own Node integration driver.

See the [runner documentation](packages/vitest-electron-runner/README.md) for
pool options, supported versions, and renderer limitations, and [CONTEXT.md](CONTEXT.md)
for the agreed test seams. Windows are hidden by default; use `showWindow: true`
to enable a visible pool renderer manually.
