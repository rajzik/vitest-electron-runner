import { test } from 'vitest';

test('closes its renderer window during execution', async () => {
  window.close();
  await new Promise(() => {});
});
