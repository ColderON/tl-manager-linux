const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getInitialData: () => ipcRenderer.invoke('get-initial-data'),
  openJsonDialog: () => ipcRenderer.invoke('dialog:openJson'),
  saveCurrentFile: (args) => ipcRenderer.invoke('file:save', args),
  onNavigate: (callback) => ipcRenderer.on('navigate', (_event, path) => callback(path)),
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (config) => ipcRenderer.invoke('set-config', config),
  laufkarteSaveAndCheck: (args) => ipcRenderer.invoke('laufkarte:saveAndCheck', args),
}); 