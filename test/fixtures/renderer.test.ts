import { expect, test } from 'vitest'
import { ipcRenderer } from 'electron'

test('runs in the page context with renderer APIs and a real DOM', () => {
  expect(process.type).toBe('renderer')
  expect(typeof ipcRenderer.send).toBe('function')
  expect(globalThis).toBe(window)
  expect(document.querySelector('meta[charset]')).not.toBeNull()
  const button = document.createElement('button')
  document.body.append(button)
  button.addEventListener('click', () => { document.body.dataset.clicked = 'yes' })
  button.click()
  expect(document.body.dataset.clicked).toBe('yes')
  expect(button.getBoundingClientRect().width).toBeGreaterThan(0)
})
