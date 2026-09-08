import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { App } from './App';

let dispose: () => void;
let user: ReturnType<typeof userEvent.setup>;
beforeEach(() => {
  user = userEvent.setup();
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  flushSync(() => root.render(<App />));
  dispose = () => {
    root.unmount();
    container.remove();
  };
});
afterEach(() => dispose());

test('adds, completes, filters, reopens, and deletes a task', async () => {
  fireEvent.change(screen.getByRole('textbox', { name: 'New task' }), {
    target: { value: '  Send the prototype  ' },
  });
  expect(screen.getByRole('textbox')).toHaveValue('  Send the prototype  ');
  expect(screen.getByRole('button', { name: 'Add task' })).not.toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Add task' }));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('3 tasks remaining'));
  await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(''));
  const task = () => screen.getByRole('checkbox', { name: 'Send the prototype' });
  await user.click(task());
  await user.click(screen.getByRole('button', { name: 'Open' }));
  await waitFor(() =>
    expect(screen.queryByRole('checkbox', { name: 'Send the prototype' })).not.toBeInTheDocument(),
  );
  await user.click(screen.getByRole('button', { name: 'Done' }));
  await waitFor(() => expect(task()).toBeChecked());
  await user.click(task());
  await waitFor(() =>
    expect(screen.queryByRole('checkbox', { name: 'Send the prototype' })).not.toBeInTheDocument(),
  );
  await user.click(screen.getByRole('button', { name: 'Open' }));
  await user.click(screen.getByRole('button', { name: 'Delete Send the prototype' }));
  await waitFor(() =>
    expect(screen.queryByRole('checkbox', { name: 'Send the prototype' })).not.toBeInTheDocument(),
  );
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('2 tasks remaining'));
});

test('rejects whitespace-only tasks and shows an empty filtered list', async () => {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Add task' })).toBeDisabled());
  await user.click(screen.getByRole('button', { name: 'Done' }));
  await user.click(screen.getByRole('button', { name: 'Delete Review the project brief' }));
  await waitFor(() => expect(screen.getByText('No done tasks. A clean slate.')).toBeVisible());
});
