const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const isDev = process.env.NODE_ENV === 'development';
const os = require('os');
const fsSync = require('fs');

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
      label: 'Start',
      submenu: [
        {
          label: 'Hauptseite',
          click: () => mainWindow.webContents.send('navigate', '/'),
        },
        { type: 'separator' },
        {
          label: 'Preisliste',
          click: () => mainWindow.webContents.send('navigate', '/preisliste'),
        },
        {
          label: 'Laufkarte',
          click: () => mainWindow.webContents.send('navigate', '/laufkarte'),
        },
        {
          label: 'Beispiel',
          click: () => mainWindow.webContents.send('navigate', '/beispiel'),
        },
        { type: 'separator' },
        {
          label: 'Exit',
          click: () => { app.quit(); },
        },
      ],
    },
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

function getConfigPath() {
  const xdg = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  const configDir = path.join(xdg, 'TL-Manager');
  if (!fsSync.existsSync(configDir)) {
    fsSync.mkdirSync(configDir, { recursive: true });
  }
  return path.join(configDir, 'config.json');
}

function getDefaultPreislistePath() {
  const docs = path.join(os.homedir(), 'Documents', 'TL-Manager');
  if (!fsSync.existsSync(docs)) {
    fsSync.mkdirSync(docs, { recursive: true });
  }
  return path.join(docs, 'preisliste.json');
}

async function readConfig() {
  const configPath = getConfigPath();
  let justCreated = false;
  let config;
  if (fsSync.existsSync(configPath)) {
    try {
      const raw = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(raw);
    } catch (e) {
      config = { preislistePath: getDefaultPreislistePath() };
      justCreated = true;
    }
  } else {
    config = { preislistePath: getDefaultPreislistePath() };
    justCreated = true;
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  }
  // Если только что создали config, создаём preisliste.json если его нет
  if (justCreated && config.preislistePath) {
    if (!fsSync.existsSync(config.preislistePath)) {
      // 5 случайных объектов
      const categories = ['A', 'B', 'C', 'D', 'E'];
      const names = ['Item Alpha', 'Item Beta', 'Item Gamma', 'Item Delta', 'Item Epsilon'];
      const data = Array.from({ length: 5 }).map((_, i) => ({
        id: i + 1,
        name: names[i],
        category: categories[i],
        price: (Math.random() * 100 + 1).toFixed(2) * 1
      }));
      await fs.writeFile(config.preislistePath, JSON.stringify(data, null, 2));
    }
  }
  return config;
}

async function writeConfig(config) {
  const configPath = getConfigPath();
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

const laufkartenDir = path.join(os.homedir(), 'Documents', 'TL-Manager', 'Laufkarten');

ipcMain.handle('laufkarte:saveAndCheck', async (event, { filename, data }) => {
  try {
    if (!fsSync.existsSync(laufkartenDir)) {
      fsSync.mkdirSync(laufkartenDir, { recursive: true });
    }
    const filePath = path.join(laufkartenDir, filename);
    if (fsSync.existsSync(filePath)) {
      return { success: false, error: 'Eine Datei mit diesem Namen existiert bereits!' };
    }
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  ipcMain.handle('get-config', async () => {
    return await readConfig();
  });
  ipcMain.handle('set-config', async (_event, config) => {
    await writeConfig(config);
    return true;
  });
  ipcMain.handle('get-initial-data', async () => {
    const config = await readConfig();
    const filePath = config.preislistePath;
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