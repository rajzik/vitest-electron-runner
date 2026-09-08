# Split-process Electron monorepo

A desktop scratchpad with separate main and renderer packages. Notes are saved to
`desk-note.txt` in Electron's user-data directory and restored when the app opens.

```text
monorepo/
  packages/
    main/          Electron lifecycle, file storage, IPC handlers, preload
      tests/       IPC validation and renderer isolation
    renderer/      Vite app, editor, browser-only TypeScript
      tests/       Editor save, clear, and reopen workflow
    contracts/     NotesApi type shared by preload and renderer
  scripts/         Build and launch both processes
  testing/         Shared Electron fixture and build setup
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

The tests build both packages automatically and launch real Electron with
Playwright from two Node Vitest projects. Test files live in each package's
`tests/` directory. The example-level config runs both projects; package test
commands select only their own project. Shared setup builds the app once before
the selected projects run. They verify a renderer-to-preload-to-main
save, the actual file contents, restoration after restarting Electron, clearing a
note, isolation from Node, and rejection of oversized IPC requests.

Each test gets a temporary data directory, removed after Electron exits. The
`ELECTRON_EXAMPLE_DATA_DIR` environment variable selects this directory; normal
launches use Electron's user-data directory. Launchers remove an inherited
`ELECTRON_RUN_AS_NODE` flag so Electron opens as a desktop app.

Root `pnpm test` includes these tests. Test windows are hidden and cannot take
focus; the app also stays out of the macOS Dock and the Windows taskbar. Visibility is controlled by the main process itself, including for `dev` and
`start`. To watch a test for debugging:

```sh
ELECTRON_EXAMPLE_SHOW_WINDOW=1 pnpm --filter @examples/monorepo test
```

These are real Electron processes with hidden windows, not headless Chromium. On Linux CI run
under a virtual display such as `xvfb-run -a pnpm test` and install Electron's system
libraries. No separately installed Chromium is needed for this example, though the
other examples still require Playwright Chromium.

The repository's `vitest-electron-runner` package tests code in its own Electron
processes. This example instead tests its application and production preload
bridge end to end. These tests use [Playwright's Electron support](https://playwright.dev/docs/api/class-electron)
directly and do not import that runner.
