const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getInitialData: () => ipcRenderer.invoke('get-initial-data'),
  openJsonDialog: () => ipcRenderer.invoke('dialog:openJson'),
  saveCurrentFile: (args) => ipcRenderer.invoke('file:save', args),
}); 