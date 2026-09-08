import type { NotesApi } from '@split/contracts';
export async function mountEditor(container: ParentNode, notes: NotesApi) {
  const form = container.querySelector('form');
  const editor = container.querySelector('textarea');
  const save = container.querySelector('button');
  const status = container.querySelector('[role="status"]');
  const alert = container.querySelector('[role="alert"]');
  if (!form || !editor || !save || !status || !alert) throw new Error('Missing notebook elements');

  try {
    editor.value = await notes.load();
    editor.disabled = false;
    save.disabled = false;
    status.textContent = 'Ready';
  } catch {
    status.textContent = 'Note unavailable';
    alert.textContent = 'Could not load your note. Close and reopen the app to try again.';
  }

  const controller = new AbortController();
  editor.addEventListener(
    'input',
    () => {
      status.textContent = 'Unsaved changes';
    },
    { signal: controller.signal },
  );
  form.addEventListener(
    'submit',
    (event) => {
      event.preventDefault();
      if (save.disabled) return;
      editor.disabled = true;
      save.disabled = true;
      alert.textContent = '';
      status.textContent = 'Saving…';
      void notes
        .save(editor.value)
        .then(() => {
          status.textContent = 'Saved on this computer';
        })
        .catch(() => {
          status.textContent = 'Not saved';
          alert.textContent =
            'Could not save your note. Check that the app data folder is writable and try again.';
        })
        .finally(() => {
          editor.disabled = false;
          save.disabled = false;
        });
    },
    { signal: controller.signal },
  );
  return () => controller.abort();
}
