import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: {
    singleQuote: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  test: {
    projects: [
      'examples/*/vite.config.ts',
      '!examples/monorepo/vite.config.ts',
      'examples/monorepo/packages/*/vite.config.ts',
    ],
    globalSetup: ['./examples/monorepo/testing/build.ts'],
  },
});
