import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: [
    {
      entry: ['src/index.ts'],
      format: ['esm'],
      platform: 'node',
      dts: true,
      sourcemap: true,
      clean: true,
    },
    {
      entry: ['src/bootstrap.ts', 'src/preload.ts'],
      format: ['cjs'],
      platform: 'node',
      dts: false,
      sourcemap: true,
      clean: true,
      copy: ['src/renderer.html'],
    },
  ],
});
