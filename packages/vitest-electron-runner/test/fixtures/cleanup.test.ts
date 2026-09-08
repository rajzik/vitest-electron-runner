import { test } from 'vitest';
import { app, BrowserWindow } from 'electron';

test('leaves an open window and timer for pool shutdown to clean up', async () => {
  const window = new BrowserWindow({ show: false });
  await window.loadURL('about:blank');
  if (process.env.IGNORE_TERMINATION) process.on('SIGTERM', () => {});
  setInterval(() => {}, 1000);
  console.log(
    'ELECTRON_RESOURCES=' +
      JSON.stringify({
        pids: app.getAppMetrics().map((metric) => metric.pid),
        profile: app.getPath('userData'),
      }),
  );
});
