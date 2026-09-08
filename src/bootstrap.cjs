const { app, BrowserWindow, ipcMain } = require('electron')
const { parse } = require('@ungap/structured-clone/json')
const path = require('node:path')
app.setPath('userData', process.env.VITEST_ELECTRON_USER_DATA)
const pending = []
const enqueue = message => pending.push(message)
let stopping = false
process.on('message', enqueue)
app.on('window-all-closed', () => {})
process.on('disconnect', () => {
  stopping = true
  app.exit()
})
app.whenReady().then(async () => {
  if (process.env.VITEST_ELECTRON_PROCESS === 'renderer') {
    const window = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        sandbox: false,
        preload: path.join(__dirname, 'preload.cjs'),
      },
    })
    window.once('closed', () => {
      if (stopping) return
      console.error('Electron renderer window closed during test execution')
      app.exit(1)
    })
    window.webContents.on('render-process-gone', (_event, details) => {
      console.error(`Electron renderer exited: ${details.reason} (code ${details.exitCode})`)
      app.exit(1)
    })
    ipcMain.on('vitest:message', (event, message) => {
      if (event.sender === window.webContents) process.send(message)
    })
    ipcMain.on('vitest:bootstrap-error', (_event, error) => { console.error(error); app.exit(1) })
    ipcMain.once('vitest:ready', () => {
      process.off('message', enqueue)
      const send = message => {
        const request = parse(message)
        if (request?.__vitest_worker_request__ === true && request.type === 'stop') stopping = true
        window.webContents.send('vitest:message', message)
      }
      process.on('message', send)
      for (const message of pending.splice(0)) send(message)
    })
    window.webContents.on('preload-error', (_event, _path, error) => { console.error(error); app.exit(1) })
    await window.loadFile(path.join(__dirname, 'renderer.html'))
  } else {
    require('./runtime.cjs').initialize(await import('vitest/worker'), {
      post: message => process.send(message),
      on: callback => {
        process.off('message', enqueue)
        process.on('message', callback)
        for (const message of pending.splice(0)) callback(message)
      },
      off: callback => process.off('message', callback),
    })
  }
}).catch(error => { console.error(error); app.exit(1) })
