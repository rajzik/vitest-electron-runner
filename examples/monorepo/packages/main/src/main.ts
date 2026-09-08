import { app, BrowserWindow } from 'electron';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openNotebook } from './notebook.js';

const directory = dirname(fileURLToPath(import.meta.url));
const showWindow = process.env.ELECTRON_EXAMPLE_SHOW_WINDOW === '1';
if (!showWindow && process.platform === 'darwin') app.setActivationPolicy('accessory');

async function createWindow() {
  await openNotebook({
    dataDirectory: process.env.ELECTRON_EXAMPLE_DATA_DIR || app.getPath('userData'),
    preloadPath: join(directory, 'preload.cjs'),
    rendererPath: join(directory, '../../renderer/dist/index.html'),
    ...(process.env.ELECTRON_RENDERER_URL
      ? { rendererUrl: process.env.ELECTRON_RENDERER_URL }
      : {}),
    showWindow,
  });
}
function fail(error: unknown) {
  process.stderr.write(`Failed to start Desk notes: ${String(error)}\n`);
  app.exit(1);
}
void app.whenReady().then(createWindow).catch(fail);
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) void createWindow().catch(fail);
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
