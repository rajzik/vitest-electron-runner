import { ipcRenderer, type IpcRendererEvent } from 'electron';
import { initialize, type Transport } from './runtime.js';

type MessageListener = Parameters<Transport['on']>[0];
const listeners = new Map<MessageListener, (event: IpcRendererEvent, message: unknown) => void>();

window.addEventListener('DOMContentLoaded', () => {
  try {
    const worker: typeof import('vitest/worker') = require('vitest/worker');
    initialize(worker, {
      post: (message) => ipcRenderer.send('vitest:message', message),
      on: (callback) => {
        const listener = (_event: IpcRendererEvent, message: unknown) => callback(message);
        listeners.set(callback, listener);
        ipcRenderer.on('vitest:message', listener);
      },
      off: (callback) => {
        const listener = listeners.get(callback);
        if (listener) ipcRenderer.off('vitest:message', listener);
        listeners.delete(callback);
      },
    });
    ipcRenderer.send('vitest:ready');
  } catch (error) {
    console.error(error);
    ipcRenderer.send(
      'vitest:bootstrap-error',
      error instanceof Error ? error.stack : String(error),
    );
  }
});
