import { afterEach, beforeEach, expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { mountApp } from './app';

let dispose: () => void;
beforeEach(() => {
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
  const submit = page.getByRole('button', { name: 'Calculate quote' });
  await submit.click();
  await expect.element(page.getByRole('status')).toHaveTextContent('€16.00');
  await page.getByRole('spinbutton', { name: 'Quantity' }).fill('5');
  await submit.click();
  await expect.element(page.getByRole('status')).toHaveTextContent('€60.00');
  await expect.element(page.getByRole('status')).toHaveTextContent('Delivery€0.00');
  await page.getByRole('combobox', { name: 'Delivery' }).selectOptions('express');
  await submit.click();
  await expect.element(page.getByRole('status')).toHaveTextContent('€69.00');
});

test('clears an old quote on stock errors and recovers after correction', async () => {
  const submit = page.getByRole('button', { name: 'Calculate quote' });
  await submit.click();
  await expect.element(page.getByRole('status')).toHaveTextContent('€16.00');
  await page.getByRole('spinbutton').fill('9');
  await submit.click();
  await expect
    .element(page.getByRole('alert'))
    .toHaveTextContent('Only 8 notebooks are available.');
  await expect.element(page.getByRole('status')).toBeEmptyDOMElement();
  await page.getByRole('spinbutton').fill('2');
  await submit.click();
  await expect.element(page.getByRole('alert')).toBeEmptyDOMElement();
  await expect.element(page.getByRole('status')).toHaveTextContent('€28.00');
});

test('displays schema validation errors for invalid quantities', async () => {
  for (const quantity of ['', '0', '-1', '1.5', '101']) {
    await page.getByRole('spinbutton').fill(quantity);
    await page.getByRole('button', { name: 'Calculate quote' }).click();
    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('Enter a whole quantity from 1 to 100');
    await expect.element(page.getByRole('status')).toBeEmptyDOMElement();
  }
});
