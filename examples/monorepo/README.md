# Split-process Electron monorepo

A desktop scratchpad with separate main and renderer packages. Notes are saved to
`desk-note.txt` in Electron's user-data directory and restored when the app opens.

```text
monorepo/
  packages/
    main/          Electron lifecycle, file storage, IPC handlers, preload
      tests/       File persistence, IPC validation, renderer isolation
    renderer/      Vite app, editor, browser-only TypeScript
      tests/       Editor save, clear, and error recovery
    contracts/     NotesApi type shared by preload and renderer
  scripts/         Build and launch both processes
  testing/         Production-asset build setup for tests
```

These packages belong to the repository's existing pnpm workspace. The root
`pnpm-workspace.yaml` includes `examples/monorepo/packages/*`; there is one shared
lockfile, not a nested pnpm installation.

## Run

After the [root setup](../../README.md#setup), run from the repository root:

```sh
ELECTRON_EXAMPLE_SHOW_WINDOW=1 pnpm --filter @examples/monorepo dev
```

The main process defaults to hidden, non-focusable windows. Set
`ELECTRON_EXAMPLE_SHOW_WINDOW=1` to show the app manually, as above. Without that
variable, `dev`, `start`, and tests all run hidden.

This builds main and preload, starts Vite on `http://127.0.0.1:5176`, and opens
Electron. Renderer edits use Vite HMR. Restart the command after changing main,
preload, or their shared types. Quit Electron or press Ctrl+C to stop the dev server.

To build and open the app without a dev server:

```sh
ELECTRON_EXAMPLE_SHOW_WINDOW=1 pnpm --filter @examples/monorepo start
```

The launcher rebuilds both packages before starting Electron. To build without
opening a window, use `pnpm build` at the repository root or target the two packages:

```sh
pnpm --filter @split/main build
pnpm --filter @split/renderer build
```

The main package emits ESM `dist/main.js` and CommonJS `dist/preload.cjs` using
TypeScript. Vite emits the renderer into its own `dist/`. Relative asset URLs let
Electron load the built HTML through `file://`. Keep the sibling package layout
when running these outputs. This example does not create an installable app bundle.

## Process boundary

The renderer calls `window.notes.load()` and `window.notes.save(text)`. It imports
only the `NotesApi` type from `@split/contracts`, so there is no Node or Electron
runtime import in its bundle.

The sandboxed preload exposes those two methods through `contextBridge`. Main
checks the sending frame and validates note text before writing. The renderer has
context isolation enabled and Node integration disabled. It cannot choose file
paths or send arbitrary IPC channels. See Electron's
[context isolation guide](https://www.electronjs.org/docs/latest/tutorial/context-isolation).

Notes have a 20,000-character limit. Save is explicit; closing with unsaved edits
loses those edits. This is a single-window demo with plain-text local storage.

## Tests

```sh
pnpm --filter @examples/monorepo test
pnpm --filter @split/main test
pnpm --filter @split/renderer test
```

Each test command builds the workspace runner. The test setup builds main/preload
and renderer assets, then Vitest 5 starts the selected core-library pools:

- `packages/main/tests` uses `electronPool({ process: 'main' })`. It calls the same
  `openNotebook` function as the app, opens the production sandboxed renderer,
  exercises the actual preload and IPC handlers, checks disk contents, and verifies
  restoration after closing and reopening the window.
- `packages/renderer/tests` uses `electronPool({ process: 'renderer' })`. It mounts
  the production editor with an in-memory `NotesApi` to test save, clear, failure,
  and retry behavior. It does not load the production preload into the pool page.

The core library owns Electron startup, hidden windows, test transport, and process
cleanup. The main tests store notes under the pool's temporary user-data directory,
which the runner removes after the file finishes. The old Playwright launcher and
process-restart test are removed; persistence is verified by opening a fresh
production window against the same file in the main pool.

The app and pool windows are hidden by default. To show a renderer test window:

```sh
ELECTRON_EXAMPLE_SHOW_WINDOW=1 pnpm --filter @split/renderer test
```

The configs translate this to the core library's `showWindow` option. Main tests
keep their own production windows hidden. Linux CI needs Electron's system libraries
and a graphical session, for example `xvfb-run -a pnpm test`. There is no Playwright
or separate Chromium installation.
