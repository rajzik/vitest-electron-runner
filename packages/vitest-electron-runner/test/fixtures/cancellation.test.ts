import { test } from 'vitest';
import { setTimeout } from 'node:timers/promises';

test('starts a test that can be cancelled', async () => {
  console.log('CANCEL_READY');
  await setTimeout(1500);
});

test('does not run after cancellation', () => {
  throw new Error('CANCELLATION_WAS_NOT_DELIVERED');
});
