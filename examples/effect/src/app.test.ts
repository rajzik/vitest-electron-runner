import { afterEach, beforeEach, expect, test } from 'vitest';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { mountApp } from './app';

let dispose: () => void;
let user: ReturnType<typeof userEvent.setup>;
beforeEach(() => {
  user = userEvent.setup();
  const container = document.createElement('div');
  document.body.append(container);
  const unmount = mountApp(container);
  dispose = () => {
    unmount();
    container.remove();
  };
});
afterEach(() => dispose());

test('quotes standard, free, and express delivery through the form', async () => {
  const submit = screen.getByRole('button', { name: 'Calculate quote' });
  await user.click(submit);
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('€16.00'));
  await user.clear(screen.getByRole('spinbutton', { name: 'Quantity' }));
  await user.type(screen.getByRole('spinbutton', { name: 'Quantity' }), '5');
  await user.click(submit);
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('€60.00'));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Delivery€0.00'));
  await user.selectOptions(screen.getByRole('combobox', { name: 'Delivery' }), 'express');
  await user.click(submit);
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('€69.00'));
});

test('clears an old quote on stock errors and recovers after correction', async () => {
  const submit = screen.getByRole('button', { name: 'Calculate quote' });
  await user.click(submit);
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('€16.00'));
  await user.clear(screen.getByRole('spinbutton'));
  await user.type(screen.getByRole('spinbutton'), '9');
  await user.click(submit);
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('Only 8 notebooks are available.'),
  );
  await waitFor(() => expect(screen.getByRole('status')).toBeEmptyDOMElement());
  await user.clear(screen.getByRole('spinbutton'));
  await user.type(screen.getByRole('spinbutton'), '2');
  await user.click(submit);
  await waitFor(() => expect(screen.getByRole('alert')).toBeEmptyDOMElement());
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('€28.00'));
});

test('displays schema validation errors for invalid quantities', async () => {
  for (const quantity of ['', '0', '-1', '1.5', '101']) {
    await user.clear(screen.getByRole('spinbutton'));
    if (quantity) await user.type(screen.getByRole('spinbutton'), quantity);
    await user.click(screen.getByRole('button', { name: 'Calculate quote' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Enter a whole quantity from 1 to 100'),
    );
    await waitFor(() => expect(screen.getByRole('status')).toBeEmptyDOMElement());
  }
});
