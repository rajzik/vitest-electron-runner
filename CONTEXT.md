# Vitest Electron runner

A Vitest custom pool runs tests inside a real Electron application. The public
entry point is `electronPool({ process: 'main' | 'renderer' })`.

## Agreed test seams

The user confirmed these seams before implementation:

- Package configuration: importing the package, choosing the process, validating options.
- Real Vitest execution: Electron APIs, renderer page DOM, reporting, TypeScript,
  mocks, snapshots, file isolation, watch reruns, failures, cancellation and cleanup.

Tests exercise package exports and real Vitest runs. Work proceeds one failing
behavior test followed by its implementation, not a batch of speculative tests.

## Initial support

Pin Vitest 5.0.0 because the worker integration API is experimental. Verify with
Electron 44.2.0. Main tests start after `app.whenReady()`. Renderer tests target a
local hidden page with Node integration, without context isolation or sandboxing.
This is a test environment for trusted code, not a production preload bridge.
Fresh Electron applications provide file isolation.

The implementation is in `packages/vitest-electron-runner`. Vite Plus builds the
library; real runtime integration tests explicitly use Vitest 5.0.0.
