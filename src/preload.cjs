const { ipcRenderer } = require('electron')
const listeners = new Map()
window.addEventListener('DOMContentLoaded', () => {
  try {
    require('./runtime.cjs').initialize(require('vitest/worker'), {
      post: message => ipcRenderer.send('vitest:message', message),
      on: callback => {
        const listener = (_event, message) => callback(message)
        listeners.set(callback, listener)
        ipcRenderer.on('vitest:message', listener)
      },
      off: callback => {
        const listener = listeners.get(callback)
        if (listener) ipcRenderer.off('vitest:message', listener)
        listeners.delete(callback)
      },
    })
    ipcRenderer.send('vitest:ready')
  } catch (error) {
    console.error(error)
    ipcRenderer.send('vitest:bootstrap-error', String(error.stack || error))
  }
})
