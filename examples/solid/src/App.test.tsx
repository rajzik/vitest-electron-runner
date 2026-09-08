import { render } from 'solid-js/web';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { App } from './App';

let dispose: () => void;
let user: ReturnType<typeof userEvent.setup>;
beforeEach(() => {
  user = userEvent.setup();
  const container = document.createElement('div');
  document.body.append(container);
  const unmount = render(() => <App />, container);
  dispose = () => {
    unmount();
    container.remove();
  };
});
afterEach(() => dispose());

test('adds an expense, derives category totals, and removes it', async () => {
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('€66.50 · 2 expenses'));
  await user.clear(screen.getByRole('textbox', { name: 'Description' }));
  await user.type(screen.getByRole('textbox', { name: 'Description' }), '  Coffee by the canal  ');
  await user.clear(screen.getByRole('spinbutton', { name: 'Amount (EUR)' }));
  await user.type(screen.getByRole('spinbutton', { name: 'Amount (EUR)' }), '4.25');
  await user.click(screen.getByRole('button', { name: 'Add expense' }));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('€70.75 · 3 expenses'));
  await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(''));
  await user.click(screen.getByRole('button', { name: 'Food' }));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('€22.75 · 2 expenses'));
  await waitFor(() => expect(screen.queryByText('Train to Copenhagen')).not.toBeInTheDocument());
  await user.click(screen.getByRole('button', { name: 'Delete Coffee by the canal' }));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('€18.50 · 1 expense'));
  await user.click(screen.getByRole('button', { name: 'Stay' }));
  await waitFor(() => expect(screen.getByText('No expenses in this category yet.')).toBeVisible());
});

test('validates amounts and assigns the selected category', async () => {
  const add = screen.getByRole('button', { name: 'Add expense' });
  await user.clear(screen.getByRole('textbox'));
  await user.type(screen.getByRole('textbox'), 'Guesthouse');
  for (const invalid of ['0', '-1', '1.001', '100001']) {
    await user.clear(screen.getByRole('spinbutton'));
    await user.type(screen.getByRole('spinbutton'), invalid);
    await waitFor(() => expect(add).toBeDisabled());
  }
  await user.clear(screen.getByRole('spinbutton'));
  await user.type(screen.getByRole('spinbutton'), '95');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'Stay');
  await user.click(add);
  await user.click(screen.getByRole('button', { name: 'Stay' }));
  await waitFor(() => expect(screen.getByText('Guesthouse')).toBeVisible());
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('€95.00 · 1 expense'));
});
