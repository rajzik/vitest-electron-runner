import { expect, test } from 'vitest';
import { app, BrowserWindow } from 'electron';

test('runs in a ready Electron main process and manages a real window', () => {
  expect(process.type).toBe('browser');
  expect(app.isReady()).toBe(true);
  if (process.platform === 'darwin') expect(app.dock?.isVisible()).toBe(false);
  const window = new BrowserWindow({ show: false });
  expect(window.isDestroyed()).toBe(false);
  window.destroy();
  expect(window.isDestroyed()).toBe(true);
});
