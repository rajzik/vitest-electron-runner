import { render } from 'solid-js/web';
import { afterEach, beforeEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { App } from './App';

let dispose: () => void;
beforeEach(() => {
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
  await expect.element(page.getByRole('status')).toHaveTextContent('€66.50 · 2 expenses');
  await page.getByRole('textbox', { name: 'Description' }).fill('  Coffee by the canal  ');
  await page.getByRole('spinbutton', { name: 'Amount (EUR)' }).fill('4.25');
  await page.getByRole('button', { name: 'Add expense', exact: true }).click();
  await expect.element(page.getByRole('status')).toHaveTextContent('€70.75 · 3 expenses');
  await expect.element(page.getByRole('textbox')).toHaveValue('');
  await page.getByRole('button', { name: 'Food', exact: true }).click();
  await expect.element(page.getByRole('status')).toHaveTextContent('€22.75 · 2 expenses');
  await expect.element(page.getByText('Train to Copenhagen')).not.toBeInTheDocument();
  await page.getByRole('button', { name: 'Delete Coffee by the canal' }).click();
  await expect.element(page.getByRole('status')).toHaveTextContent('€18.50 · 1 expense');
  await page.getByRole('button', { name: 'Stay', exact: true }).click();
  await expect.element(page.getByText('No expenses in this category yet.')).toBeVisible();
});

test('validates amounts and assigns the selected category', async () => {
  const add = page.getByRole('button', { name: 'Add expense', exact: true });
  await page.getByRole('textbox').fill('Guesthouse');
  for (const invalid of ['0', '-1', '1.001', '100001']) {
    await page.getByRole('spinbutton').fill(invalid);
    await expect.element(add).toBeDisabled();
  }
  await page.getByRole('spinbutton').fill('95');
  await page.getByRole('combobox', { name: 'Category' }).selectOptions('Stay');
  await add.click();
  await page.getByRole('button', { name: 'Stay', exact: true }).click();
  await expect.element(page.getByText('Guesthouse', { exact: true })).toBeVisible();
  await expect.element(page.getByRole('status')).toHaveTextContent('€95.00 · 1 expense');
});
