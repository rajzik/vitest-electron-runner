import { test } from 'node:test'
import assert from 'node:assert/strict'
import { electronPool } from 'vitest-electron-runner'

test('rejects unsupported process modes before launching Electron', () => {
  assert.throws(() => electronPool({ process: 'preload' }), /process must be "main" or "renderer"/)
})
