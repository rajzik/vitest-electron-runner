import { BrowserWindow, ipcMain } from 'electron';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function openNotebook({
  dataDirectory,
  preloadPath,
  rendererPath,
  rendererUrl,
  showWindow = false,
}: {
  dataDirectory: string;
  preloadPath: string;
  rendererPath: string;
  rendererUrl?: string;
  showWindow?: boolean;
}) {
  await mkdir(dataDirectory, { recursive: true });
  const notePath = join(dataDirectory, 'desk-note.txt');
  const window = new BrowserWindow({
    show: showWindow,
    focusable: showWindow,
    skipTaskbar: !showWindow,
    width: 900,
    height: 760,
    minWidth: 420,
    minHeight: 500,
    title: 'Desk notes',
    webPreferences: {
      backgroundThrottling: showWindow,
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  ipcMain.handle('notes:load', async (event): Promise<string> => {
    if (event.senderFrame !== window.webContents.mainFrame)
      throw new Error('Notes are only available to the app window');
    try {
      return await readFile(notePath, 'utf8');
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
        return '';
      throw error;
    }
  });

  ipcMain.handle('notes:save', async (event, text: unknown): Promise<void> => {
    if (event.senderFrame !== window.webContents.mainFrame)
      throw new Error('Notes are only available to the app window');
    if (typeof text !== 'string' || text.length > 20000) {
      throw new Error('Notes must be text with at most 20,000 characters');
    }
    await writeFile(notePath, text, 'utf8');
  });

  window.once('closed', () => {
    ipcMain.removeHandler('notes:load');
    ipcMain.removeHandler('notes:save');
  });
  try {
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', (event) => event.preventDefault());
    const devUrl = rendererUrl;
    if (devUrl) {
      const url = new URL(devUrl);
      if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1') {
        throw new Error('The development renderer must use http://127.0.0.1');
      }
      await window.loadURL(url.href);
    } else {
      await window.loadFile(rendererPath);
    }
    return window;
  } catch (error) {
    window.destroy();
    throw error;
  }
}
