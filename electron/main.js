const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = !app.isPackaged;
//const isDev = false;
const os = require('os');
const fsSync = require('fs');
const { spawn } = require('child_process');
const waitOn = require('wait-on');
const http = require('http');
let serverProcess;
let mainWindow = null;
let isCreatingWindow = false;
let loadAttempts = 0;
const MAX_ATTEMPTS = 3;

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-setuid-sandbox');

async function waitForServer(url, timeout = 20000, interval = 300) {
  const start = Date.now();
  const { hostname, port } = new URL(url);

  return new Promise((resolve, reject) => {
    function check() {
      const req = http.request(
        { hostname, port, method: 'HEAD', timeout: 2000 },
        (res) => {
          if (res.statusCode >= 200 && res.statusCode < 500) {
            resolve();
          } else {
            retry();
          }
        }
      );
      req.on('error', retry);
      req.on('timeout', retry);
      req.end();
    }

    function retry() {
      if (Date.now() - start > timeout) {
        reject(new Error('Server did not start in time'));
      } else {
        setTimeout(check, interval);
      }
    }

    check();
  });
}

function createWindow() {
  // Prevent multiple windows from being created
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    return;
  }
  
  if (isCreatingWindow) {
    console.log('Window creation already in progress');
    return;
  }
  
  isCreatingWindow = true;
  
  try {
    const iconPath = path.join(__dirname, 'icons', 'icon.png');
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
      icon: iconPath,
      show: false // Don't show until ready
    });

    const startUrl = isDev 
      ? 'http://localhost:3000' 
      : 'http://localhost:3000';

    // Handle window ready
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      isCreatingWindow = false;
    });

    // Handle window errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Window failed to load:', errorCode, errorDescription);
      isCreatingWindow = false;
    });

    // Load URL with proper error handling
    const loadApp = async () => {
      try {
        if (isDev) {
          const waitOn = require('wait-on');
          await new Promise((resolve, reject) => {
            waitOn({ resources: [startUrl], timeout: 20000 }, (err) => {
              if (err) {
                console.error('Next.js server did not start in time:', err);
                reject(err);
              } else {
                resolve();
              }
            });
          });
        } else {
          const waitOn = require('wait-on');
          await new Promise((resolve, reject) => {
            waitOn({ resources: [startUrl], timeout: 20000 }, (err) => {
              if (err) {
                console.error('Next.js server did not start in time (production):', err);
                reject(err);
              } else {
                resolve();
              }
            });
          });
        }
        await mainWindow.loadURL(startUrl);
        loadAttempts = 0; // сброс при успехе
      } catch (error) {
        loadAttempts++;
        console.error('Failed to load app (attempt ' + loadAttempts + '):', error);
        if (loadAttempts < MAX_ATTEMPTS) {
          setTimeout(loadApp, 3000);
        } else {
          console.error('Не удалось загрузить приложение после нескольких попыток. Завершаю работу.');
          app.quit();
        }
      }
    };

    loadApp();

    if (isDev) {
      mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
      mainWindow = null;
      isCreatingWindow = false;
    });

    mainWindow.on('close', () => {
      mainWindow = null;
      isCreatingWindow = false;
    });

    // Create a minimal menu
    const template = [
      {
        label: 'Start',
        submenu: [
          {
            label: 'Hauptseite',
            click: () => {
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('navigate', '/');
              }
            },
          },
          { type: 'separator' },
          {
            label: 'Preisliste',
            click: () => {
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('navigate', '/preisliste');
              }
            },
          },
          {
            label: 'Laufkarte',
            click: () => {
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('navigate', '/laufkarte');
              }
            },
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
    
  } catch (error) {
    console.error('Error creating window:', error);
    isCreatingWindow = false;
  }
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
      const data = await fs.promises.readFile(configPath, 'utf-8');
      config = JSON.parse(data);
    } catch (e) {
      config = { preislistePath: getDefaultPreislistePath() };
      justCreated = true;
    }
  } else {
    config = { preislistePath: getDefaultPreislistePath() };
    justCreated = true;
    await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
  }
  // Если только что создали конфиг — создаём и preisliste.json
  if (justCreated && config.preislistePath) {
    if (!fsSync.existsSync(config.preislistePath)) {
      const data = [
        { id: 1, name: "Item Alpha", category: "A", price: 10 },
        { id: 2, name: "Item Beta", category: "B", price: 20 }
      ];
      await fs.promises.writeFile(config.preislistePath, JSON.stringify(data, null, 2));
    }
  }
  return config;
}

async function writeConfig(config) {
  const configPath = getConfigPath();
  await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
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
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('laufkarte:savePDF', async (event, { laufkarteNumber }) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Als PDF speichern',
      defaultPath: `laufkarte-${laufkarteNumber}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (canceled || !filePath) return { success: false, error: 'Abgebrochen' };
    const pdfData = await mainWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
    });
    await fs.promises.writeFile(filePath, pdfData);
    return { success: true, filePath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('laufkarte:saveAndPrintPDF', async (event, { laufkarteNumber }) => {
  try {
    if (!fsSync.existsSync(laufkartenDir)) {
      fsSync.mkdirSync(laufkartenDir, { recursive: true });
    }
    const pdfPath = path.join(laufkartenDir, `laufkarte-${laufkarteNumber}.pdf`);
    const pdfData = await mainWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
    });
    await fs.promises.writeFile(pdfPath, pdfData);
    // Öffne das Systemdruckfenster für diese PDF
    const { shell } = require('electron');
    await shell.openPath(pdfPath); // Öffnet die PDF in der Standardanwendung zum Drucken
    return { success: true, filePath: pdfPath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('laufkarte:getPDFPath', async (_event, { laufkarteNumber }) => {
  try {
    const pdfPath = path.join(laufkartenDir, `laufkarte-${laufkarteNumber}.pdf`);
    if (fsSync.existsSync(pdfPath)) {
      return { exists: true, path: 'file://' + pdfPath };
    } else {
      return { exists: false };
    }
  } catch (e) {
    return { exists: false };
    }
  });

ipcMain.handle('laufkarten:listPDFs', async () => {
  const laufkartenDir = path.join(
    os.homedir(),
    'Documents',
    'TL-Manager',
    'Laufkarten'
  );
  //console.log('Laufkarten dir:', laufkartenDir);
  try {
    const files = await fs.promises.readdir(laufkartenDir);
    //console.log('All files:', files);
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
    //console.log('PDF files:', pdfFiles);
    const filesWithDates = await Promise.all(
      pdfFiles.map(async (file) => {
        const stat = await fs.promises.stat(path.join(laufkartenDir, file));
        return { name: file, ctime: stat.ctimeMs };
      })
    );
    //console.log('Files with dates:', filesWithDates);
    return { files: filesWithDates };
  } catch (e) {
    console.error('Fehler beim Lesen des Laufkarten-Ordners:', e);
    return { files: [] };
    }
  });

ipcMain.handle('laufkarte:getPDFPathByFile', async (_event, { pdfFileName }) => {
    try {
    const pdfPath = path.join(laufkartenDir, pdfFileName);
    if (fsSync.existsSync(pdfPath)) {
      return { exists: true, path: 'file://' + pdfPath };
    } else {
      return { exists: false };
    }
  } catch (e) {
    return { exists: false };
  }
});

function startNextServer() {
  if (serverProcess) {
    console.log('Server already running');
    return;
  }
  try {
    let serverPath;
    if (isDev) {
      serverPath = path.join(__dirname, '..', '.next', 'standalone', 'server.js');
    } else {
      serverPath = path.join(process.resourcesPath, '.next', 'standalone', 'server.js');
    }
    if (!fsSync.existsSync(serverPath)) {
      console.error('Server file not found:', serverPath);
      return;
    }
    // Устанавливаем рабочую директорию в папку с server.js
    process.chdir(path.dirname(serverPath));
    const nodeBinary = process.env.NODE_BINARY || 'node';
    serverProcess = spawn(nodeBinary, [serverPath], {
      env: { ...process.env, PORT: 3000, NODE_ENV: 'production' },
      stdio: 'inherit'
    });
    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
    });
    serverProcess.on('exit', (code, signal) => {
      console.error(`Server process exited with code ${code} and signal ${signal}`);
      serverProcess = null;
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
}

app.on('ready', () => {
  if (!isDev) {
    startNextServer();
  }
  createWindow();
});

app.on('will-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // Only create a new window if there are no windows and we're on macOS
  if (BrowserWindow.getAllWindows().length === 0 && process.platform === 'darwin') {
    createWindow();
  }
});

// Prevent multiple instances
// Prevent multiple instances of the app
// const gotTheLock = app.requestSingleInstanceLock();

// if (!gotTheLock) {
//   app.quit();
// } else {
//   app.on('second-instance', (event, commandLine, workingDirectory) => {
//     // Someone tried to run a second instance, we should focus our window instead.
//     if (mainWindow) {
//       if (mainWindow.isMinimized()) mainWindow.restore();
//       mainWindow.focus();
//     }
//   });
// }

ipcMain.handle('get-config', async () => {
  try {
    return await readConfig();
  } catch (e) {
    return { preislistePath: getDefaultPreislistePath() };
  }
});

ipcMain.handle('set-config', async (_event, config) => {
  try {
    await writeConfig(config);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-initial-data', async () => {
  try {
    const config = await readConfig();
    const filePath = config.preislistePath;
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8');
      const json = JSON.parse(data);
      return { filePath, data };
    } catch (err) {
      console.error('Fehler beim Laden der Initialdaten aus dem Hauptprozess:', err);
      return null;
    }
  } catch (e) {
    return null;
  }
});

// Add missing IPC handlers
ipcMain.handle('dialog:openJson', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'JSON Datei öffnen',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    });
    
    if (canceled || filePaths.length === 0) {
      return { success: false, error: 'Abgebrochen' };
    }
    
    const filePath = filePaths[0];
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return { success: true, filePath, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:save', async (event, { filePath, data }) => {
  try {
    let toWrite = data;
    if (typeof data !== 'string') {
      toWrite = JSON.stringify(data, null, 2);
    }
    await fs.promises.writeFile(filePath, toWrite, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('laufkarten:list', async () => {
  try {
    if (!fsSync.existsSync(laufkartenDir)) {
      return { files: [] };
    }
    
    const files = await fs.promises.readdir(laufkartenDir);
    const jsonFiles = files.filter(f => f.toLowerCase().endsWith('.json'));
    
    const filesWithDates = await Promise.all(
      jsonFiles.map(async (file) => {
        const stat = await fs.promises.stat(path.join(laufkartenDir, file));
        return { name: file, ctime: stat.ctimeMs };
      })
    );
    
    return { files: filesWithDates };
  } catch (error) {
    console.error('Error listing laufkarten:', error);
    return { files: [] };
  }
});

ipcMain.handle('laufkarte:read', async (event, { filename }) => {
  try {
    const filePath = path.join(laufkartenDir, filename);
    if (!fsSync.existsSync(filePath)) {
      return { success: false, error: 'Datei nicht gefunden' };
    }
    
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}); 