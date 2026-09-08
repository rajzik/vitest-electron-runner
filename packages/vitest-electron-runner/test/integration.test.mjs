import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

async function runFixture(file, options, testOptions = {}, driver = 'cli') {
  const directory = await mkdtemp(resolve('test/.run-'));
  const config = resolve(directory, 'vitest.config.mjs');
  await writeFile(
    config,
    `import { electronPool } from ${JSON.stringify(pathToFileURL(resolve('dist/index.mjs')).href)};
export default { test: { include: [${JSON.stringify(`test/fixtures/${file}.test.ts`)}], pool: electronPool(${JSON.stringify(options)}), maxWorkers: 1, isolate: true, ...${JSON.stringify(testOptions)} } }`,
  );
  try {
    return await new Promise((resolveResult, reject) => {
      const child = spawn(
        process.execPath,
        driver === 'cli'
          ? ['node_modules/vitest/vitest.mjs', 'run', '--config', config]
          : [`test/helpers/${driver}.mjs`, config],
        { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', NO_COLOR: '1' } },
      );
      let output = '';
      child.stdout.on('data', (data) => (output += data));
      child.stderr.on('data', (data) => (output += data));
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`Vitest did not exit:\n${output}`));
      }, 30000);
      child.on('error', reject);
      child.on('close', (code) => {
        clearTimeout(timer);
        resolveResult({ code, output });
      });
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

void test('main tests access Electron and destroy a real BrowserWindow', async () => {
  const result = await runFixture('main', { process: 'main' });
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /1 passed/);
});

void test('renderer tests use the page DOM and Electron renderer APIs', async () => {
  const result = await runFixture('renderer', { process: 'renderer' });
  assert.equal(result.code, 0, result.output);
  assert.doesNotMatch(result.output, /Electron renderer window closed/, result.output);
  assert.match(result.output, /1 passed/);
});

for (const mode of ['main', 'renderer']) {
  void test(`${mode} reports assertion details and exits with failure`, async () => {
    const result = await runFixture('failure', { process: mode });
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, /expected Electron result/);
    assert.match(result.output, /actual Electron result/);
    assert.match(result.output, /failure.test.ts:4/);
    assert.match(result.output, /1 failed/);
  });
}

for (const mode of ['main', 'renderer']) {
  void test(`${mode} supports TypeScript, hoisted mocks, importActual and snapshots`, async () => {
    const result = await runFixture('compatibility', { process: mode });
    assert.equal(result.code, 0, result.output);
    assert.match(result.output, /1 passed/);
  });
}

void test('a missing Electron executable fails promptly with its path', async () => {
  const executablePath = resolve('test/nonexistent-electron');
  const result = await runFixture('main', { process: 'main', executablePath });
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /nonexistent-electron/);
  assert.match(result.output, /ENOENT/);
});

void test('a renderer crash fails the run instead of leaving Vitest waiting', async () => {
  const result = await runFixture('crash', { process: 'renderer' });
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /Electron renderer exited/);
});

void test('a main-process crash fails the run promptly', async () => {
  const result = await runFixture('crash', { process: 'main' });
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /Worker exited unexpectedly.*SIGKILL/);
});

void test('isolated files do not share persistent Electron cookies', async () => {
  const result = await runFixture(
    'isolation-*',
    { process: 'main' },
    { env: { ISOLATION_COOKIE: `isolation-${Date.now()}` } },
  );
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /2 passed/);
});

for (const ignoreTermination of [false, true]) {
  void test(`shutdown removes processes and profiles with an open window (ignore SIGTERM: ${ignoreTermination})`, async () => {
    const result = await runFixture(
      'cleanup',
      { process: 'main' },
      {
        silent: false,
        reporters: ['verbose'],
        env: { IGNORE_TERMINATION: ignoreTermination ? '1' : '' },
      },
    );
    assert.equal(result.code, 0, result.output);
    const match = result.output.match(/ELECTRON_RESOURCES=(\{[^\n]+\})/);
    assert.ok(match, result.output);
    const { pids, profile } = JSON.parse(match[1]);
    assert.ok(pids.length >= 2, 'expected a real application and renderer');
    for (const pid of pids) {
      assert.throws(
        () => process.kill(pid, 0),
        { code: 'ESRCH' },
        `Electron process ${pid} leaked`,
      );
    }
    await assert.rejects(access(profile), { code: 'ENOENT' });
  });
}

for (const mode of ['main', 'renderer']) {
  void test(`${mode} delivers cancellation and skips remaining tests`, async () => {
    const result = await runFixture('cancellation', { process: mode }, {}, 'cancel');
    assert.equal(result.code, 1, result.output);
    const match = result.output.match(/CANCEL_RESULT=(\{[^\n]+\})/);
    assert.ok(match, result.output);
    const report = JSON.parse(match[1]);
    assert.equal(report.reason, 'interrupted', result.output);
    assert.deepEqual(
      report.results.map((test) => test.state),
      ['skipped', 'skipped'],
    );
  });
}

for (const mode of ['main', 'renderer']) {
  void test(`${mode} watch reruns load changed source in a fresh process`, async () => {
    const result = await runFixture('unused', { process: mode }, {}, 'watch');
    assert.equal(result.code, 1, result.output);
    const match = result.output.match(/WATCH_RESULT=(\{[^\n]+\})/);
    assert.ok(match, result.output);
    const { states, pids } = JSON.parse(match[1]);
    assert.deepEqual(states, ['failed', 'passed']);
    assert.equal(pids.length, 2);
    assert.notEqual(pids[0], pids[1]);
    for (const pid of pids) assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
  });
}

void test('closing the renderer window fails promptly with a clear diagnostic', async () => {
  const result = await runFixture('close-renderer', { process: 'renderer' });
  assert.equal(result.code, 1, result.output);
  assert.match(result.output, /Electron renderer window closed/);
});

for (const mode of ['main', 'renderer']) {
  void test(`${mode} collects tests without executing their bodies`, async () => {
    const result = await runFixture('collect', { process: mode }, {}, 'collect');
    assert.equal(result.code, 0, result.output);
    const match = result.output.match(/COLLECT_RESULT=(\{[^\n]+\})/);
    assert.ok(match, result.output);
    assert.deepEqual(JSON.parse(match[1]), {
      names: ['collects tests inside Electron without executing their bodies'],
      errors: [],
    });
  });
}
