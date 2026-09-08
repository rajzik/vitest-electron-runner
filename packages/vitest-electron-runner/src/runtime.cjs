const { stringify, parse } = require('@ungap/structured-clone/json');
const electron = require('electron');
const { pathToFileURL } = require('node:url');

exports.initialize = (worker, transport) => {
  const { init, runBaseTests, setupEnvironment } = worker;
  init({
    post: (message) => transport.post(stringify(message)),
    on: transport.on,
    off: transport.off,
    deserialize: parse,
    runTests: (state, traces) => runBaseTests('run', state, traces),
    collectTests: (state, traces) => runBaseTests('collect', state, traces),
    setup: setupEnvironment,
    onModuleRunner(runner) {
      const original = runner.evaluator.runExternalModule.bind(runner.evaluator);
      const entry = process.env.VITEST_ELECTRON_ENTRY;
      runner.evaluator.runExternalModule = (id) => {
        if (id === 'electron' || id === entry || id === pathToFileURL(entry).href) {
          return Promise.resolve({ ...electron, default: electron });
        }
        return original(id);
      };
    },
  });
};
