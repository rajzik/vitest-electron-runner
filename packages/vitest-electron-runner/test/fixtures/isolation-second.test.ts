import { expect, test } from 'vitest';
import { session } from 'electron';

test('starts with an empty persistent browser session', async () => {
  const name = process.env.ISOLATION_COOKIE!;
  expect(await session.defaultSession.cookies.get({ name })).toEqual([]);
  await session.defaultSession.cookies.set({
    url: 'https://vitest-electron.example',
    name,
    value: 'from-another-file',
    expirationDate: Date.now() / 1000 + 3600,
  });
  await session.defaultSession.cookies.flushStore();
});
