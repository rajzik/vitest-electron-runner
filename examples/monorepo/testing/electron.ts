import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import electronPath from 'electron';
import { _electron } from 'playwright';
import type { ElectronApplication } from 'playwright';
import { afterEach, beforeEach, expect } from 'vite-plus/test';

export let directory: string;
let application: ElectronApplication | undefined;

export async function launch() {
  if (typeof electronPath !== 'string') throw new Error('Expected the Electron executable path');
  const electronEnv: Record<string, string> = {
    ELECTRON_EXAMPLE_DATA_DIR: directory,
    ELECTRON_RENDERER_URL: '',
  };
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && key !== 'ELECTRON_RUN_AS_NODE' && !(key in electronEnv))
      electronEnv[key] = value;
  }
  application = await _electron.launch({
    executablePath: electronPath,
    timeout: 10000,
    args: [fileURLToPath(new URL('../packages/main', import.meta.url))],
    env: electronEnv,
  });
  const page = await application.firstWindow();
  await page.getByRole('textbox', { name: 'Your note' }).waitFor();
  await page.waitForFunction(() => !document.querySelector('textarea')?.disabled);
  if (electronEnv.ELECTRON_EXAMPLE_SHOW_WINDOW !== '1') {
    const visibility = await application.evaluate(({ app, BrowserWindow }) => ({
      windows: BrowserWindow.getAllWindows().map((window) => ({
        visible: window.isVisible(),
        focused: window.isFocused(),
      })),
      dockVisible: process.platform === 'darwin' ? app.dock?.isVisible() : false,
    }));
    expect(visibility).toEqual({
      windows: [{ visible: false, focused: false }],
      dockVisible: false,
    });
  }
  return page;
}

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'split-electron-'));
});
afterEach(async () => {
  try {
    await close();
  } finally {
    application = undefined;
    await rm(directory, { recursive: true, force: true });
  }
});

export async function close() {
  await application?.close();
  application = undefined;
}
