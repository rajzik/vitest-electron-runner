# vitest-electron-runner

Run Vitest tests in real Electron main and renderer processes using a custom pool.

Targets **Vitest 5.0.0** and **Electron 44.x**, starting at 44.2.0. The Vitest peer is pinned because
its custom worker API is experimental. Requires Node 22.15+, 24+, or 26+ within
Vitest's supported release lines. Local integration verification uses Node 24
and Electron 44.2.0 on macOS.

## Install from this checkout

```sh
pnpm install
pnpm --filter vitest-electron-runner build
pnpm --filter vitest-electron-runner pack
```

Install the generated tarball in your application, alongside the peer dependencies:

```sh
pnpm add -D /path/to/vitest-electron-runner-0.1.0.tgz vitest@5.0.0 electron@44.2.0
```

Allow Electron's installation script in your package manager so its executable
is downloaded. This package exports an ESM entry point with TypeScript types.

## Main-process tests

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { electronPool } from 'vitest-electron-runner';

export default defineConfig({
  test: {
    pool: electronPool({ process: 'main' }),
    maxWorkers: 1,
    isolate: true,
  },
});
```

```ts
import { expect, test } from 'vitest';
import { app, BrowserWindow } from 'electron';

test('opens an application window', () => {
  expect(app.isReady()).toBe(true);
  const window = new BrowserWindow({ show: false });
  try {
    expect(window.isDestroyed()).toBe(false);
  } finally {
    window.destroy();
  }
});
```

The pool waits for `app.whenReady()` before running tests. Imports of `electron`
resolve to Electron's runtime API, including when Vite resolves the npm package
entry to an absolute path. `ELECTRON_RUN_AS_NODE` is removed from the launch
environment so an inherited setting cannot silently turn the app into Node.

## Renderer tests

```ts
pool: electronPool({ process: 'renderer' });
```

```ts
import { expect, test } from 'vitest';
import { ipcRenderer } from 'electron';

test('uses the page DOM and renderer APIs', () => {
  expect(process.type).toBe('renderer');
  expect(typeof ipcRenderer.send).toBe('function');
  expect(globalThis).toBe(window);

  const button = document.createElement('button');
  document.body.append(button);
  button.addEventListener('click', () => {
    button.textContent = 'Clicked';
  });
  button.click();
  expect(button.textContent).toBe('Clicked');
});
```

Renderer tests run in a hidden local page with `nodeIntegration: true`,
`contextIsolation: false`, and `sandbox: false`. The CommonJS preload initializes
Vitest after the DOM loads. Tests execute in the page's own JavaScript context.

Use this mode for trusted test code. It does not emulate a production sandbox
or an isolated preload bridge, and it does not load your application's entry
point automatically. Main and renderer tests run in separate applications;
they do not share a live IPC session.

## Run both modes

Use Vitest projects to select the pool for each group of files:

```ts
import { defineConfig } from 'vitest/config';
import { electronPool } from 'vitest-electron-runner';

export default defineConfig({
  test: {
    maxWorkers: 1,
    projects: [
      {
        test: {
          name: 'main',
          include: ['test/main/**/*.test.ts'],
          pool: electronPool({ process: 'main' }),
        },
      },
      {
        test: {
          name: 'renderer',
          include: ['test/renderer/**/*.test.ts'],
          pool: electronPool({ process: 'renderer' }),
        },
      },
    ],
  },
});
```

## Options and lifecycle

| Option           | Behavior                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `process`        | Required when passing options: `'main'` or `'renderer'`. Calling `electronPool()` selects main. |
| `executablePath` | Optional Electron executable override. Otherwise resolves the application's `electron` package. |

Each file gets a fresh Electron application and temporary user-data directory,
including on watch reruns. Workers are never reused, even with `isolate: false`.
The profile is removed after shutdown. Leave `environment` at Vitest's default
`node`; renderer mode supplies its own real DOM.

Vitest manages collection, assertions, reporting, mocks, snapshots, cancellation,
and worker timeouts. The pool connects its worker protocol through portable
structured-clone JSON, since Electron and the host can use different V8 versions.
Renderer messages pass through Electron's main process.

Shutdown terminates Electron and escalates to `SIGKILL` after one second if
needed. Startup errors, main-process exits, renderer crashes, and unexpected
renderer window closure fail the run. Vitest's ordinary cancellation semantics
apply. Abruptly killing the Vitest host can leave a temporary profile behind.

Node `execArgv` options are not forwarded to the Electron executable. Pre-ready
Electron configuration, production-style renderer contexts, coverage providers,
and Vitest's experimental native module runner are outside the verified support
scope. Electron requires a graphical session; Linux CI can use `xvfb-run -a pnpm test`.

## Development and verification

Run these commands from the repository root.

```sh
pnpm check
pnpm test
```

The Node test runner launches real Vitest/Electron runs. Tests cover both process
modes, runtime collection, assertion diagnostics, TypeScript transforms, hoisted `vi.mock`,
`vi.importActual`, inline snapshots, crashes, cancellation, filesystem-triggered
watch reruns, persistent-session isolation, and process/profile cleanup with an
open window and an ignored termination signal. They exercise the package's public
configuration and Vitest execution seams without mocking Electron.

See the repository’s [CONTEXT.md](../../CONTEXT.md) for the agreed TDD seams and implementation scope.
