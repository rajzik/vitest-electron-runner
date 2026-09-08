import { fork, type ChildProcess } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { mkdtemp, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stringify, parse } from '@ungap/structured-clone/json'
import type { PoolOptions, PoolRunnerInitializer, PoolWorker, WorkerRequest } from 'vitest/node'

export interface ElectronPoolOptions {
  process: 'main' | 'renderer'
  executablePath?: string
}

export function electronPool(options: ElectronPoolOptions = { process: 'main' }): PoolRunnerInitializer {
  if (options?.process !== 'main' && options?.process !== 'renderer') {
    throw new TypeError('electronPool process must be "main" or "renderer"')
  }
  const configuration = { ...options }
  return {
    name: 'electron',
    createPoolWorker: poolOptions => new ElectronWorker(poolOptions, configuration),
  }
}

class ElectronWorker extends EventEmitter implements PoolWorker {
  readonly name = 'electron'
  private child?: ChildProcess
  private userData?: string

  constructor(
    private readonly poolOptions: PoolOptions,
    private readonly options: ElectronPoolOptions,
  ) {
    super()
  }

  async start(): Promise<void> {
    const require = createRequire(this.poolOptions.project.config.root + '/package.json')
    const executable: unknown = this.options.executablePath ?? require('electron')
    if (typeof executable !== 'string') throw new Error('Cannot resolve the Electron executable')
    const electronEntry = require.resolve('electron')
    const env = { ...process.env, ...this.poolOptions.env }
    delete env.ELECTRON_RUN_AS_NODE
    this.userData = await mkdtemp(join(tmpdir(), 'vitest-electron-'))
    const child = this.child = fork(fileURLToPath(new URL('./bootstrap.cjs', import.meta.url)), [], {
      execPath: executable,
      execArgv: [],
      env: {
        ...env,
        VITEST_ELECTRON_ENTRY: electronEntry,
        VITEST_ELECTRON_PROCESS: this.options.process,
        VITEST_ELECTRON_USER_DATA: this.userData,
      },
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      serialization: 'json',
    })
    await new Promise<void>((resolve, reject) => {
      child.once('spawn', resolve)
      child.once('error', reject)
    })
    child.on('message', message => this.emit('message', message))
    child.on('error', error => this.emit('error', error))
    child.on('exit', (code, signal) => this.emit('exit', code, signal))
    child.stdout?.pipe(this.poolOptions.project.vitest.logger.outputStream, { end: false })
    child.stderr?.pipe(this.poolOptions.project.vitest.logger.errorStream, { end: false })
  }

  send(message: WorkerRequest): void {
    if (!this.child) throw new Error('Electron worker has not started')
    this.child.send(stringify(message))
  }

  deserialize(data: unknown): unknown {
    if (typeof data !== 'string') throw new TypeError('Invalid Electron IPC payload')
    return parse(data)
  }

  canReuse(): boolean { return false }

  async stop(): Promise<void> {
    const child = this.child
    if (child && child.exitCode === null && child.signalCode === null) {
      const exited = new Promise<void>(resolve => child.once('exit', () => resolve()))
      const timer = setTimeout(() => child.kill('SIGKILL'), 1000)
      child.kill('SIGTERM')
      await exited
      clearTimeout(timer)
    }
    if (this.userData) await rm(this.userData, { recursive: true, force: true, maxRetries: 5 })
  }
}
