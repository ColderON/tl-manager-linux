const { contextBridge, ipcRenderer } = require('electron');

// Validate IPC handlers before exposing them
const validateHandler = (handler) => {
  return typeof handler === 'function' ? handler : () => Promise.reject(new Error('Handler not available'));
};

contextBridge.exposeInMainWorld('electronAPI', {
  getInitialData: () => ipcRenderer.invoke('get-initial-data').catch(err => {
    console.error('getInitialData error:', err);
    return null;
  }),
  openJsonDialog: () => ipcRenderer.invoke('dialog:openJson').catch(err => {
    console.error('openJsonDialog error:', err);
    return null;
  }),
  saveCurrentFile: (args) => ipcRenderer.invoke('file:save', args).catch(err => {
    console.error('saveCurrentFile error:', err);
    return { success: false, error: err.message };
  }),
  onNavigate: (callback) => {
    if (typeof callback === 'function') {
      ipcRenderer.on('navigate', (_event, path) => callback(path));
    }
  },
  getConfig: () => ipcRenderer.invoke('get-config').catch(err => {
    console.error('getConfig error:', err);
    return null;
  }),
  setConfig: (config) => ipcRenderer.invoke('set-config', config).catch(err => {
    console.error('setConfig error:', err);
    return { success: false, error: err.message };
  }),
  laufkarteSaveAndCheck: (args) => ipcRenderer.invoke('laufkarte:saveAndCheck', args).catch(err => {
    console.error('laufkarteSaveAndCheck error:', err);
    return { success: false, error: err.message };
  }),
  listLaufkarten: () => ipcRenderer.invoke('laufkarten:list').catch(err => {
    console.error('listLaufkarten error:', err);
    return { files: [] };
  }),
  readLaufkarte: ({ filename }) => ipcRenderer.invoke('laufkarte:read', { filename }).catch(err => {
    console.error('readLaufkarte error:', err);
    return null;
  }),
  saveLaufkartePDF: (args) => ipcRenderer.invoke('laufkarte:savePDF', args).catch(err => {
    console.error('saveLaufkartePDF error:', err);
    return { success: false, error: err.message };
  }),
  saveAndPrintLaufkartePDF: (args) => ipcRenderer.invoke('laufkarte:saveAndPrintPDF', args).catch(err => {
    console.error('saveAndPrintLaufkartePDF error:', err);
    return { success: false, error: err.message };
  }),
  getLaufkartePDFPath: (args) => ipcRenderer.invoke('laufkarte:getPDFPath', args).catch(err => {
    console.error('getLaufkartePDFPath error:', err);
    return { exists: false };
  }),
  listLaufkartenPDFs: () => ipcRenderer.invoke('laufkarten:listPDFs').catch(err => {
    console.error('listLaufkartenPDFs error:', err);
    return { files: [] };
  }),
  getLaufkartePDFPathByFile: (args) => ipcRenderer.invoke('laufkarte:getPDFPathByFile', args).catch(err => {
    console.error('getLaufkartePDFPathByFile error:', err);
    return { exists: false };
  }),
}); 