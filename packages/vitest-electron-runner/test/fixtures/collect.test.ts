import { expect, test } from 'vitest';

expect(process.versions.electron).toBeDefined();

test('collects tests inside Electron without executing their bodies', () => {
  throw new Error('COLLECTION_EXECUTED_A_TEST');
});
