import { defineConfig } from 'vitest/config';
import { electronPool } from 'vitest-electron-runner';

export default defineConfig({
  plugins: [],
  test: {
    name: 'effect',
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    pool: electronPool({
      process: 'renderer',
      showWindow: process.env.ELECTRON_EXAMPLE_SHOW_WINDOW === '1',
    }),
    maxWorkers: 1,
  },
});
