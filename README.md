# vitest-electron-runner

A pnpm monorepo with Vite Plus and one TypeScript package at
`packages/vitest-electron-runner`.

The package starts with an empty entry point. Electron runner functionality has
not been implemented, and both manifests are private to prevent accidental publishing.

## Setup

Use Node.js 24.20.0, pinned in `.nvmrc`, and pnpm 11.25.0, pinned in
`package.json`.

```sh
nvm use
pnpm install
```

Vite Plus is a local development dependency. The scripts below use its `vp`
binary, so a global Vite Plus installation is unnecessary.

## Commands

Run these from the repository root:

| Command           | Purpose                                                                              |
| ----------------- | ------------------------------------------------------------------------------------ |
| `pnpm build`      | Build workspace packages into their `dist/` directories with TypeScript declarations |
| `pnpm dev`        | Rebuild workspace packages when source files change                                  |
| `pnpm check`      | Check formatting, lint rules, and types                                              |
| `pnpm fmt`        | Format the repository                                                                |
| `pnpm test`       | Run tests once across workspace packages                                             |
| `pnpm test:watch` | Run tests in watch mode                                                              |

Add tests as `packages/vitest-electron-runner/src/**/*.test.ts` and import test
helpers from `vite-plus/test`. Test commands currently allow an empty test suite
because the package has no implementation yet. Remove `passWithNoTests` and
`--passWithNoTests` once tests exist.

To target the package directly:

```sh
pnpm --filter vitest-electron-runner build
```

Shared formatting, linting, and test discovery live in the root `vite.config.ts`.
The package's `vite.config.ts` configures its library build and Node test environment.
See the [Vite Plus monorepo guide](https://viteplus.dev/guide/monorepo) and
[library packaging guide](https://viteplus.dev/guide/pack).
