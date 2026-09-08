import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import electron from 'electron';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const development = process.argv.includes('--dev');

async function build(name) {
  const child = spawn('pnpm', ['--filter', name, 'build'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${name} build failed`)),
    );
  });
}

await build('@split/main');
let server;
if (development) {
  server = await createServer({
    root: fileURLToPath(new URL('../packages/renderer', import.meta.url)),
    server: { host: '127.0.0.1', port: 5176, strictPort: true },
  });
  await server.listen();
} else {
  await build('@split/renderer');
}

const electronEnv = {
  ...process.env,
  ELECTRON_RENDERER_URL: development ? 'http://127.0.0.1:5176' : '',
};
delete electronEnv.ELECTRON_RUN_AS_NODE;
const child = spawn(electron, [fileURLToPath(new URL('../packages/main', import.meta.url))], {
  stdio: 'inherit',
  env: electronEnv,
});
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => child.kill(signal));
try {
  process.exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => resolve(code ?? 0));
  });
} finally {
  await server?.close();
}
