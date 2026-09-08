# vitest-electron-runner

A pnpm/Vite Plus monorepo containing a Vitest custom pool for real Electron main
and renderer tests. The package lives in `packages/vitest-electron-runner`.

Use Node.js 24.20.0 from `.nvmrc` and pnpm 11.25.0. Both manifests remain private;
this change does not publish the package.

```sh
pnpm install
pnpm build
pnpm check
pnpm test
```

`pnpm test` builds the package and runs integration tests through real Electron.
`pnpm dev` watches the library build, `pnpm test:watch` watches its integration
tests, and `pnpm fmt` formats the repository.

See the [package documentation](packages/vitest-electron-runner/README.md) for
configuration, supported versions, and renderer limitations. The runner targets
Vitest 5.0.0 with its matching Vite runtime, independently of Vite Plus's own
Vitest dependency. See [CONTEXT.md](CONTEXT.md) for the agreed TDD seams.
