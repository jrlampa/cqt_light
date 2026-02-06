const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const db = require('./db/database.cjs');

let mainWindow;

async function createWindow() {
  // Initialize database before creating window
  await db.init();

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
    },
    show: false,
  });

  // Load app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5174');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
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

// ========== IPC HANDLERS ==========

// --- Materials ---
ipcMain.handle('get-all-materials', () => db.getAllMaterials());
ipcMain.handle('get-material', (_, sap) => db.getMaterial(sap));
ipcMain.handle('upsert-material', (_, { sap, descricao, unidade, preco_unitario }) =>
  db.upsertMaterial(sap, descricao, unidade, preco_unitario));
ipcMain.handle('delete-material', (_, sap) => db.deleteMaterial(sap));
ipcMain.handle('search-materials', (_, query) => db.searchMaterials(query));

// --- Kits ---
ipcMain.handle('get-all-kits', () => db.getAllKits());
ipcMain.handle('get-kit', (_, codigoKit) => db.getKit(codigoKit));
ipcMain.handle('create-kit', (_, { codigoKit, descricaoKit }) =>
  db.createKit(codigoKit, descricaoKit));
ipcMain.handle('delete-kit', (_, codigoKit) => db.deleteKit(codigoKit));
ipcMain.handle('search-kits', (_, query) => db.searchKits(query));

// --- Kit Composition ---
ipcMain.handle('get-kit-composition', (_, codigoKit) => db.getKitComposition(codigoKit));
ipcMain.handle('add-material-to-kit', (_, { codigoKit, sap, quantidade }) =>
  db.addMaterialToKit(codigoKit, sap, quantidade));
ipcMain.handle('update-kit-material-qty', (_, { id, quantidade }) =>
  db.updateKitMaterialQty(id, quantidade));
ipcMain.handle('remove-material-from-kit', (_, id) => db.removeMaterialFromKit(id));

// --- Aggregated Materials (Key Feature) ---
ipcMain.handle('get-aggregated-materials', (_, kitCodes) => db.getAggregatedMaterials(kitCodes));

// --- Labor ---
ipcMain.handle('get-all-labor', () => db.getAllLabor());
ipcMain.handle('get-labor', (_, codigoMo) => db.getLabor(codigoMo));
ipcMain.handle('upsert-labor', (_, { codigoMo, descricao, unidade, precoBruto }) =>
  db.upsertLabor(codigoMo, descricao, unidade, precoBruto));
ipcMain.handle('delete-labor', (_, codigoMo) => db.deleteLabor(codigoMo));

// --- Kit Services ---
ipcMain.handle('get-kit-services', (_, codigoKit) => db.getKitServices(codigoKit));
ipcMain.handle('add-service-to-kit', (_, { codigoKit, codigoMo }) =>
  db.addServiceToKit(codigoKit, codigoMo));
ipcMain.handle('remove-service-from-kit', (_, id) => db.removeServiceFromKit(id));

// --- Aggregated Services ---
ipcMain.handle('get-aggregated-services', (_, kitCodes) => db.getAggregatedServices(kitCodes));

// --- Stats ---
ipcMain.handle('get-stats', () => db.getStats());
