import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from 'vite-plus/test';
import { close, directory, launch } from '../../../testing/electron.js';

test('saves through preload IPC and restores the note after restarting Electron', async () => {
  const page = await launch();
  expect(await page.getByRole('textbox').inputValue()).toBe('');
  const note = 'Sketch the next release.\nKeep the main and renderer separate.';
  await page.getByRole('textbox').fill(note);
  await page.getByRole('button', { name: 'Save note' }).click();
  await page.getByRole('status').filter({ hasText: 'Saved on this computer' }).waitFor();
  expect(await readFile(join(directory, 'desk-note.txt'), 'utf8')).toBe(note);
  await close();
  const reopened = await launch();
  expect(await reopened.getByRole('textbox').inputValue()).toBe(note);
  await reopened.getByRole('textbox').fill('');
  await reopened.getByRole('button', { name: 'Save note' }).click();
  await reopened.getByRole('status').filter({ hasText: 'Saved on this computer' }).waitFor();
  expect(await readFile(join(directory, 'desk-note.txt'), 'utf8')).toBe('');
});
