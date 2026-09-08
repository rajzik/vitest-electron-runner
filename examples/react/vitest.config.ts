import { defineConfig } from 'vitest/config';
import { electronPool } from 'vitest-electron-runner';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  test: {
    name: 'react',
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    pool: electronPool({
      process: 'renderer',
      showWindow: process.env.ELECTRON_EXAMPLE_SHOW_WINDOW === '1',
    }),
    maxWorkers: 1,
  },
});
