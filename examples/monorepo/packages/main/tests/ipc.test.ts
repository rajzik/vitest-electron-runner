import { app, BrowserWindow } from 'electron';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, test } from 'vitest';
import { openNotebook } from '../src/notebook.js';

const directory = app.getPath('userData');
afterEach(() => {
  for (const window of BrowserWindow.getAllWindows()) window.destroy();
});

async function open() {
  const window = await openNotebook({
    dataDirectory: directory,
    preloadPath: fileURLToPath(new URL('../dist/preload.cjs', import.meta.url)),
    rendererPath: fileURLToPath(new URL('../../renderer/dist/index.html', import.meta.url)),
  });
  await expect
    .poll(() => window.webContents.executeJavaScript('document.querySelector("textarea").disabled'))
    .toBe(false);
  expect(window.isVisible()).toBe(false);
  return window;
}

test('saves through the production preload and restores the note in a new window', async () => {
  const window = await open();
  const note = 'Sketch the next release.\nKeep the main and renderer separate.';
  await window.webContents.executeJavaScript(`window.notes.save(${JSON.stringify(note)})`);
  expect(await readFile(join(directory, 'desk-note.txt'), 'utf8')).toBe(note);
  window.destroy();
  const reopened = await open();
  expect(
    await reopened.webContents.executeJavaScript('document.querySelector("textarea").value'),
  ).toBe(note);
  await reopened.webContents.executeJavaScript('window.notes.save("")');
  expect(await readFile(join(directory, 'desk-note.txt'), 'utf8')).toBe('');
});

test('isolates the production renderer from Node and validates IPC requests', async () => {
  const window = await open();
  expect(
    await window.webContents.executeJavaScript(
      '({ node: "process" in window || "require" in window, methods: Object.keys(window.notes).sort() })',
    ),
  ).toEqual({ node: false, methods: ['load', 'save'] });
  const failure: unknown = await window.webContents.executeJavaScript(
    'window.notes.save("x".repeat(20001)).then(() => null, error => error.message)',
  );
  expect(failure).toContain('at most 20,000');
  await window.webContents.executeJavaScript('window.notes.save("A valid note")');
  expect(await window.webContents.executeJavaScript('window.notes.load()')).toBe('A valid note');
  expect(await readFile(join(directory, 'desk-note.txt'), 'utf8')).toBe('A valid note');
});
