import { defineConfig } from 'vitest/config';
import { electronPool } from 'vitest-electron-runner';
import solid from 'vite-plugin-solid';
export default defineConfig({
  plugins: [solid({ ssr: false })],
  resolve: { conditions: ['browser'] },
  test: {
    name: 'solid',
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    pool: electronPool({
      process: 'renderer',
      showWindow: process.env.ELECTRON_EXAMPLE_SHOW_WINDOW === '1',
    }),
    server: { deps: { inline: ['solid-js'] } },
    maxWorkers: 1,
  },
});
