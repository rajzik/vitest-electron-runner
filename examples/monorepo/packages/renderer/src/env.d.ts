import type { NotesApi } from '@split/contracts';

declare global {
  interface Window {
    notes: NotesApi;
  }
}
