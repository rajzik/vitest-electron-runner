import { copyFile, readdir } from 'node:fs/promises'

const source = new URL('../src/', import.meta.url)
const destination = new URL('../dist/', import.meta.url)
for (const name of await readdir(source)) {
  if (name.endsWith('.cjs') || name.endsWith('.html')) {
    await copyFile(new URL(name, source), new URL(name, destination))
  }
}
