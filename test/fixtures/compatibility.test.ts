import { expect, test, vi } from 'vitest'
import { greeting } from './value.js'

vi.mock('./value.js', () => ({ greeting: (name: string) => `Mocked, ${name}` }))

test('transforms TypeScript and applies hoisted module mocks', async () => {
  const name: string = 'Electron'
  expect(greeting(name)).toBe('Mocked, Electron')
  const original = await vi.importActual<typeof import('./value.js')>('./value.js')
  expect(original.greeting(name)).toBe('Hello, Electron')
  expect({ message: greeting(name) }).toMatchInlineSnapshot(`
    {
      "message": "Mocked, Electron",
    }
  `)
})
