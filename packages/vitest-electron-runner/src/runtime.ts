import { pathToFileURL } from 'node:url';
import { stringify, parse } from '@ungap/structured-clone/json';
import electron from 'electron';

export interface Transport {
  post: (message: string) => void;
  on: (callback: (message: unknown) => void) => void;
  off: (callback: (message: unknown) => void) => void;
}

export function initialize(worker: typeof import('vitest/worker'), transport: Transport): void {
  const { init, runBaseTests, setupEnvironment } = worker;
  const entry = process.env.VITEST_ELECTRON_ENTRY;
  if (!entry) throw new Error('Missing Electron module entry');
  const entryUrl = pathToFileURL(entry).href;

  init({
    post: (message: unknown) => transport.post(stringify(message)),
    on: transport.on,
    off: transport.off,
    deserialize: (message: unknown) => {
      if (typeof message !== 'string') throw new TypeError('Invalid Electron IPC payload');
      return parse(message);
    },
    runTests: (state, traces) => runBaseTests('run', state, traces),
    collectTests: (state, traces) => runBaseTests('collect', state, traces),
    setup: setupEnvironment,
    onModuleRunner(runner) {
      const original = runner.evaluator.runExternalModule.bind(runner.evaluator);
      runner.evaluator.runExternalModule = (id) => {
        if (id === 'electron' || id === entry || id === entryUrl) {
          return Promise.resolve({ ...electron, default: electron });
        }
        return original(id);
      };
    },
  });
}
