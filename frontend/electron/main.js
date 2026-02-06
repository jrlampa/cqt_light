const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const db = require('./db/database'); // Import database service

// Seed DB for testing if empty
try {
  db.seed();
} catch (e) {
  console.error("Failed to seed database:", e);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#050a14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  const startUrl = isDev
    ? 'http://localhost:5174'
    : `file://${path.join(__dirname, '../../dist/index.html')}`;

  win.loadURL(startUrl);

  win.once('ready-to-show', () => {
    win.show();
  });

  // Open external links in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    // win.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(() => {
  // IPC Handlers
  ipcMain.handle('get-kits', (event, category) => {
    // Legacy or filtered logic
    return [];
  });

  ipcMain.handle('get-all-kit-codes', () => {
    return db.getAllKitCodes();
  });

  ipcMain.handle('get-kit-details', (event, code) => {
    return db.getKitComposition(code);
  });

  // --- Budgeting Handlers ---
  ipcMain.handle('get-contracts', () => {
    return db.getContracts();
  });

  ipcMain.handle('create-contract', (event, contract) => {
    return db.createContract(contract);
  });

  ipcMain.handle('get-costs-by-contract', (event, contractId) => {
    return db.getCostsByContract(contractId);
  });

  ipcMain.handle('update-service-cost', (event, { id, price }) => {
    return db.updateServiceCost(id, price);
  });

  ipcMain.handle('get-aggregated-composition', (event, kitCodes) => {
    return db.getAggregatedComposition(kitCodes);
  });

  ipcMain.handle('update-kit-item', (event, { id, quantity }) => {
    return db.updateKitItem(id, quantity);
  });

  ipcMain.handle('delete-kit-item', (event, id) => {
    return db.deleteKitItem(id);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
