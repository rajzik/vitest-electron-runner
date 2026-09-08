import './style.css';

const form = document.querySelector('form');
const editor = document.querySelector('textarea');
const save = document.querySelector('button');
const status = document.querySelector('[role="status"]');
const alert = document.querySelector('[role="alert"]');
if (!form || !editor || !save || !status || !alert) throw new Error('Missing notebook elements');

try {
  editor.value = await window.notes.load();
  editor.disabled = false;
  save.disabled = false;
  status.textContent = 'Ready';
} catch {
  status.textContent = 'Note unavailable';
  alert.textContent = 'Could not load your note. Close and reopen the app to try again.';
}

editor.addEventListener('input', () => {
  status.textContent = 'Unsaved changes';
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (save.disabled) return;
  editor.disabled = true;
  save.disabled = true;
  alert.textContent = '';
  status.textContent = 'Saving…';
  void window.notes
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
});
