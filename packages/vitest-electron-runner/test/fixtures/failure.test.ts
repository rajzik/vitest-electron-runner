import { expect, test } from 'vitest';

test('reports an actionable assertion failure', () => {
  expect('actual Electron result').toBe('expected Electron result');
});
