import electron = require('electron');
import type { NotesApi } from '@split/contracts';

const notes: NotesApi = {
  async load() {
    const text: unknown = await electron.ipcRenderer.invoke('notes:load');
    if (typeof text !== 'string') throw new Error('Invalid note response');
    return text;
  },
  async save(text) {
    await electron.ipcRenderer.invoke('notes:save', text);
  },
};

electron.contextBridge.exposeInMainWorld('notes', notes);
