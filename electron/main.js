const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const isDev = process.env.NODE_ENV === 'development';

if (app.isPackaged) {
  app.commandLine.appendSwitch('no-sandbox');
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(process.cwd(), 'public', 'icon.png')
  });

  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../out/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create a minimal menu
  const template = [
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  ipcMain.handle('get-initial-data', async () => {
    const isPackaged = app.isPackaged;
    const basePath = isPackaged ? process.resourcesPath : process.cwd();
    const filePath = path.join(basePath, 'items', 'preisliste.json');
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      return { filePath, data };
    } catch (err) {
      console.error('Failed to load initial data from main process:', err);
      return null;
    }
  });

  ipcMain.handle('dialog:openJson', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
    if (canceled || filePaths.length === 0) {
      return null;
    }
    try {
      const filePath = filePaths[0];
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      return { filePath, data };
    } catch (err) {
      console.error('Failed to read or parse file', err);
      return null;
    }
  });

  ipcMain.handle('file:save', async (event, { filePath, data }) => {
    try {
      let savePath = filePath;

      if (!savePath || savePath.startsWith('/api')) {
        const { canceled, filePath: newFilePath } = await dialog.showSaveDialog({
          filters: [{ name: 'JSON Files', extensions: ['json'] }]
        });
        if (canceled || !newFilePath) {
          return { success: false, canceled: true };
        }
        savePath = newFilePath;
      }
      
      await fs.writeFile(savePath, data);
      return { success: true, filePath: savePath };

    } catch (err) {
      console.error('Failed to save file', err);
      return { success: false, error: err.message };
    }
  });
  
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 