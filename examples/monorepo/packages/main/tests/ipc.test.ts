import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from 'vite-plus/test';
import { directory, launch } from '../../../testing/electron.js';

test('keeps Node out of the renderer and rejects invalid IPC payloads', async () => {
  const page = await launch();
  expect(
    await page.evaluate(() => ({
      require: 'require' in window,
      process: 'process' in window,
      methods: Object.keys(window.notes).sort(),
    })),
  ).toEqual({ require: false, process: false, methods: ['load', 'save'] });
  await expect(page.evaluate(() => window.notes.save('x'.repeat(20001)))).rejects.toThrow(
    'at most 20,000',
  );
  await page.evaluate(() => window.notes.save('A valid note'));
  expect(await page.evaluate(() => window.notes.load())).toBe('A valid note');
  expect(await readFile(join(directory, 'desk-note.txt'), 'utf8')).toBe('A valid note');
});
