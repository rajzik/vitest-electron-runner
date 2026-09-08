import { test } from 'vitest';

test('an Electron runtime can crash during a test', async () => {
  process.kill(process.pid, 'SIGKILL');
  await new Promise(() => {});
});
