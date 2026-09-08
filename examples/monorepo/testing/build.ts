import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export default async function setup() {
  for (const name of ['@split/main', '@split/renderer']) {
    const child = spawn('pnpm', ['--filter', name, 'build'], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    await new Promise<void>((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', (code) =>
        code === 0 ? resolve() : reject(new Error(`${name} build failed`)),
      );
    });
  }
}
