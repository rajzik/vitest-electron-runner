# Example apps

Every example uses the workspace `vitest-electron-runner` package with Vitest 5.
Vite Plus still builds and serves the apps. Test configurations live in
`vitest.config.ts`; build configurations live in `vite.config.ts`.

## Run

After `pnpm install` at the repository root:

```sh
pnpm --filter @examples/react dev
pnpm --filter @examples/solid dev
pnpm --filter @examples/effect dev
ELECTRON_EXAMPLE_SHOW_WINDOW=1 pnpm --filter @examples/monorepo dev
```

The first three apps open in your browser at the URL printed by Vite. The monorepo
starts its main and renderer packages together in Electron. No API keys or backend
services are needed.

## Test

```sh
pnpm --filter @examples/react test
pnpm --filter @examples/solid test
pnpm --filter @examples/effect test
pnpm --filter @examples/monorepo test
pnpm --filter @split/main test
pnpm --filter @split/renderer test
```

Each command builds the local runner before starting Vitest. `pnpm test` at the
repository root runs the runner's own integration tests followed by every example.
The monorepo's test setup also builds its production preload and renderer assets.
No Playwright launcher, browser provider, or separately downloaded Chromium is used.

Tests use Electron's real DOM. DOM Testing Library queries accessible labels and
roles; user-event drives interactions, with `fireEvent.change` for React's controlled
text input. Test windows are hidden by default. To show a renderer pool window:

```sh
ELECTRON_EXAMPLE_SHOW_WINDOW=1 pnpm --filter @examples/react test
```

The configs pass this opt-in to `electronPool({ process: 'renderer', showWindow: true })`.
Electron still needs a graphical session; Linux CI can use `xvfb-run -a pnpm test`.

## Coverage

| Example                                         | Pool     | Behavior                                                                                                                    |
| ----------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| [React](react)                                  | Renderer | Add, complete, reopen, filter, and delete tasks; reject blank input                                                         |
| [Solid](solid)                                  | Renderer | Categorize expenses, update totals, filter and delete, reject invalid amounts                                               |
| [Effect](effect)                                | Renderer | Quote delivery, validate input, handle stock errors, recover after correction, inject inventory                             |
| [Monorepo main](monorepo/packages/main)         | Main     | Open a sandboxed production window, call preload IPC, save a real file, restore it in a new window, reject invalid requests |
| [Monorepo renderer](monorepo/packages/renderer) | Renderer | Load, edit, save, and clear notes; retain edits after save errors and retry                                                 |

The pool's renderer environment is for trusted test code, with Node integration.
The monorepo main tests separately create the production sandboxed window to verify
its actual isolated preload bridge. The renderer tests supply an in-memory
`NotesApi` implementation to exercise editor behavior independently of storage.

`shared/style.css` is shared by the apps. Keep that directory when copying an
example, or copy the stylesheet and update its import. Replace the runner's
`workspace:*` dependency with an installed release or local tarball outside this repo.
React and Solid state resets on refresh. Effect uses fixed demo inventory and never
places an order; the monorepo app saves notes on disk.
