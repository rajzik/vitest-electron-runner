import { afterEach, expect, test } from 'vitest';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import html from '../index.html?raw';
import { mountEditor } from '../src/editor';
import type { NotesApi } from '@split/contracts';

let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  document.body.replaceChildren();
});
async function mount(notes: NotesApi) {
  document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
  dispose = await mountEditor(document, notes);
  return userEvent.setup();
}

test('loads, edits, saves, and clears a note through the editor', async () => {
  let saved = 'Yesterday’s idea';
  const user = await mount({
    load: async () => saved,
    save: async (text) => {
      saved = text;
    },
  });
  const editor = screen.getByRole('textbox', { name: 'Your note' });
  expect(editor).toHaveValue('Yesterday’s idea');
  await user.clear(editor);
  await user.type(editor, 'Ship the next release');
  expect(screen.getByRole('status')).toHaveTextContent('Unsaved changes');
  await user.click(screen.getByRole('button', { name: 'Save note' }));
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('Saved on this computer'),
  );
  expect(saved).toBe('Ship the next release');
  await user.clear(editor);
  await user.click(screen.getByRole('button', { name: 'Save note' }));
  await waitFor(() => expect(saved).toBe(''));
});

test('keeps edits after a failed save and allows retrying', async () => {
  let fail = true;
  let saved = '';
  const user = await mount({
    load: async () => '',
    save: async (text) => {
      if (fail) throw new Error('Disk full');
      saved = text;
    },
  });
  await user.type(screen.getByRole('textbox'), 'Keep this thought');
  await user.click(screen.getByRole('button'));
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save your note'),
  );
  expect(screen.getByRole('textbox')).toHaveValue('Keep this thought');
  fail = false;
  await user.click(screen.getByRole('button'));
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('Saved on this computer'),
  );
  expect(saved).toBe('Keep this thought');
});
