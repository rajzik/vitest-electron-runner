import { app, BrowserWindow, ipcMain } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const hidden = process.env.ELECTRON_EXAMPLE_SHOW_WINDOW !== '1';
if (hidden && process.platform === 'darwin') app.setActivationPolicy('accessory');
let window: BrowserWindow | null = null;

function validateSender(event: IpcMainInvokeEvent) {
  if (!window || event.senderFrame !== window.webContents.mainFrame) {
    throw new Error('Notes are only available to the app window');
  }
}

async function createWindow() {
  window = new BrowserWindow({
    show: !hidden,
    focusable: !hidden,
    skipTaskbar: hidden,
    width: 900,
    height: 760,
    minWidth: 420,
    minHeight: 500,
    title: 'Desk notes',
    webPreferences: {
      backgroundThrottling: !hidden,
      preload: join(directory, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  window.on('closed', () => {
    window = null;
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl) {
    const url = new URL(devUrl);
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1') {
      throw new Error('The development renderer must use http://127.0.0.1');
    }
    await window.loadURL(url.href);
  } else {
    await window.loadFile(join(directory, '../../renderer/dist/index.html'));
  }
}

void app
  .whenReady()
  .then(async () => {
    const dataDirectory = process.env.ELECTRON_EXAMPLE_DATA_DIR || app.getPath('userData');
    await mkdir(dataDirectory, { recursive: true });
    const notePath = join(dataDirectory, 'desk-note.txt');

    ipcMain.handle('notes:load', async (event): Promise<string> => {
      validateSender(event);
      try {
        return await readFile(notePath, 'utf8');
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
          return '';
        throw error;
      }
    });

    ipcMain.handle('notes:save', async (event, text: unknown): Promise<void> => {
      validateSender(event);
      if (typeof text !== 'string' || text.length > 20000) {
        throw new Error('Notes must be text with at most 20,000 characters');
      }
      await writeFile(notePath, text, 'utf8');
    });

    await createWindow();
  })
  .catch((error: unknown) => {
    process.stderr.write(`Failed to start Desk notes: ${String(error)}\n`);
    app.exit(1);
  });
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) void createWindow();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
