const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const db = require('./db/database.cjs');
const ControllerRegistry = require('./src/interfaces/ControllerRegistry');

let mainWindow;

async function createWindow() {
  await db.init();

  // Register all DDD Controllers (SotA Architecture)
  // This centralizes all IPC logic and ensures systematic sanitization.
  ControllerRegistry.registerAll();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#f0fdfa',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      spellcheck: false,
      enableRemoteModule: false,
    },
    show: false,
  });

  // Mitigation for chrome://terms and Autofill error popups
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('chrome://')) event.preventDefault();
  });

  // Strict CSP Implementation
  const { session } = require('electron');
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' http://localhost:* ws://localhost:*"
        ]
      }
    });
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5174');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Open external links in default browser
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
