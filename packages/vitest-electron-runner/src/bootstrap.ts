import path from 'node:path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { parse } from '@ungap/structured-clone/json';
import { initialize } from './runtime.js';

const userData = process.env.VITEST_ELECTRON_USER_DATA;
if (!userData) throw new Error('Missing Electron user-data directory');
const sendToHost = process.send?.bind(process);
if (!sendToHost) throw new Error('Electron bootstrap requires a parent IPC channel');

app.setPath('userData', userData);
const showWindow = process.env.VITEST_ELECTRON_SHOW_WINDOW === '1';
if (!showWindow && process.platform === 'darwin') app.setActivationPolicy('accessory');
const pending: unknown[] = [];
const enqueue = (message: unknown) => pending.push(message);
let stopping = false;
process.on('message', enqueue);
app.on('window-all-closed', () => {});
process.on('disconnect', () => {
  stopping = true;
  app.exit();
});

void app
  .whenReady()
  .then(async () => {
    if (process.env.VITEST_ELECTRON_PROCESS === 'renderer') {
      const window = new BrowserWindow({
        show: showWindow,
        focusable: showWindow,
        skipTaskbar: !showWindow,
        webPreferences: {
          backgroundThrottling: showWindow,
          nodeIntegration: true,
          contextIsolation: false,
          sandbox: false,
          preload: path.join(__dirname, 'preload.cjs'),
        },
      });
      window.once('closed', () => {
        if (stopping) return;
        console.error('Electron renderer window closed during test execution');
        app.exit(1);
      });
      window.webContents.on('render-process-gone', (_event, details) => {
        console.error(`Electron renderer exited: ${details.reason} (code ${details.exitCode})`);
        app.exit(1);
      });
      ipcMain.on('vitest:message', (event, message: unknown) => {
        if (event.sender !== window.webContents) return;
        if (typeof message !== 'string') throw new TypeError('Invalid Electron IPC payload');
        sendToHost(message);
      });
      ipcMain.on('vitest:bootstrap-error', (_event, error: unknown) => {
        console.error(error);
        app.exit(1);
      });
      ipcMain.once('vitest:ready', () => {
        process.off('message', enqueue);
        const send = (message: unknown) => {
          if (typeof message !== 'string') throw new TypeError('Invalid Electron IPC payload');
          const request = parse(message);
          if (
            typeof request === 'object' &&
            request !== null &&
            '__vitest_worker_request__' in request &&
            request.__vitest_worker_request__ === true &&
            'type' in request &&
            request.type === 'stop'
          )
            stopping = true;
          window.webContents.send('vitest:message', message);
        };
        process.on('message', send);
        for (const message of pending.splice(0)) send(message);
      });
      window.webContents.on('preload-error', (_event, _path, error) => {
        console.error(error);
        app.exit(1);
      });
      await window.loadFile(path.join(__dirname, 'renderer.html'));
    } else {
      initialize(await import('vitest/worker'), {
        post: (message) => {
          sendToHost(message);
        },
        on: (callback) => {
          process.off('message', enqueue);
          process.on('message', callback);
          for (const message of pending.splice(0)) callback(message);
        },
        off: (callback) => {
          process.off('message', callback);
        },
      });
    }
  })
  .catch((error: unknown) => {
    console.error(error);
    app.exit(1);
  });
