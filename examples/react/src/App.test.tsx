import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { App } from './App';

let dispose: () => void;
beforeEach(() => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  root.render(<App />);
  dispose = () => {
    root.unmount();
    container.remove();
  };
});
afterEach(() => dispose());

test('adds, completes, filters, reopens, and deletes a task', async () => {
  await page.getByRole('textbox', { name: 'New task' }).fill('  Send the prototype  ');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await expect.element(page.getByRole('status')).toHaveTextContent('3 tasks remaining');
  await expect.element(page.getByRole('textbox')).toHaveValue('');
  const task = page.getByRole('checkbox', { name: 'Send the prototype' });
  await task.click();
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await expect.element(task).not.toBeInTheDocument();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect.element(task).toBeChecked();
  await task.click();
  await expect.element(task).not.toBeInTheDocument();
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await page.getByRole('button', { name: 'Delete Send the prototype', exact: true }).click();
  await expect.element(task).not.toBeInTheDocument();
  await expect.element(page.getByRole('status')).toHaveTextContent('2 tasks remaining');
});

test('rejects whitespace-only tasks and shows an empty filtered list', async () => {
  await page.getByRole('textbox').fill('   ');
  await expect.element(page.getByRole('button', { name: 'Add task', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Delete Review the project brief' }).click();
  await expect.element(page.getByText('No done tasks. A clean slate.')).toBeVisible();
});
