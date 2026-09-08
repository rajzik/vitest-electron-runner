import { createVitest } from 'vitest/node';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const directory = dirname(process.argv[2]);
const source = join(directory, 'value.ts');
const fixture = join(directory, 'watch.test.ts');
await writeFile(source, 'export const value: number = 1\n');
await writeFile(
  fixture,
  `import { test, expect } from 'vitest'
import { value } from './value.js'
test('reloads changed source in a new Electron process', () => {
  console.log('WATCH_PID=' + process.pid)
  expect(value).toBe(2)
})`,
);
const states = [];
const pids = [];
let finishRerun;
const rerun = new Promise((resolve) => {
  finishRerun = resolve;
});
const ctx = await createVitest({
  config: process.argv[2],
  watch: true,
  include: [fixture],
  reporters: [
    {
      onUserConsoleLog(log) {
        const match = log.content.match(/WATCH_PID=(\d+)/);
        if (match) pids.push(Number(match[1]));
      },
      onTestRunEnd(_modules, _errors, reason) {
        states.push(reason);
        if (states.length === 2) finishRerun();
      },
    },
  ],
});
try {
  await ctx.start();
  await writeFile(source, 'export const value: number = 2\n');
  await rerun;
  console.log('WATCH_RESULT=' + JSON.stringify({ states, pids }));
} finally {
  await ctx.close();
}
