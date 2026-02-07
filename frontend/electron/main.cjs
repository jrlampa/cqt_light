const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const db = require('./db/database.cjs');

let mainWindow;

async function createWindow() {
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

  if (isDev) {
    mainWindow.loadURL('http://localhost:5174');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// ========== IPC HANDLERS ==========

// Fast cost calculation (single query)
ipcMain.handle('get-custo-total', (_, kitCodes) => db.getCustoTotal(kitCodes));

// Materials
ipcMain.handle('get-all-materials', () => db.getAllMaterials());
ipcMain.handle('search-materials', (_, query) => db.searchMaterials(query));
ipcMain.handle('upsert-material', (_, { sap, descricao, unidade, preco_unitario }) =>
  db.upsertMaterial(sap, descricao, unidade, preco_unitario));

// Kits
ipcMain.handle('get-all-kits', () => db.getAllKits());
ipcMain.handle('search-kits', (_, query) => db.searchKits(query));
ipcMain.handle('get-kit', (_, codigoKit) => db.getKit(codigoKit));
ipcMain.handle('upsert-kit', (_, { codigoKit, descricaoKit, codigoServico, custoServico }) =>
  db.upsertKit(codigoKit, descricaoKit, codigoServico, custoServico));
ipcMain.handle('create-kit', (_, { codigo_kit, descricao_kit }) =>
  db.createKit(codigo_kit, descricao_kit));
ipcMain.handle('update-kit-metadata', (_, { codigo_kit, descricao_kit }) =>
  db.updateKitMetadata(codigo_kit, descricao_kit));
ipcMain.handle('delete-kit', (_, codigo_kit) => db.deleteKit(codigo_kit));
ipcMain.handle('get-kit-composition', (_, codigoKit) => db.getKitComposition(codigoKit));

// Orçamentos
ipcMain.handle('save-orcamento', (_, { nome, total, dados }) =>
  db.saveOrcamento(nome, total, dados));
ipcMain.handle('get-orcamentos', () => db.getOrcamentos());
ipcMain.handle('get-orcamento', (_, id) => db.getOrcamento(id));
ipcMain.handle('delete-orcamento', (_, id) => db.deleteOrcamento(id));

// Templates
ipcMain.handle('save-template', (_, { nome, descricao, dados }) =>
  db.saveTemplate(nome, descricao, dados));
ipcMain.handle('get-templates', () => db.getTemplates());
ipcMain.handle('get-template', (_, id) => db.getTemplate(id));
ipcMain.handle('delete-template', (_, id) => db.deleteTemplate(id));

ipcMain.handle('delete-kit', (_, codigo_kit) =>
  db.deleteKit(codigo_kit));

// Kit Composition
ipcMain.handle('get-kit-composition', (_, codigoKit) => db.getKitComposition(codigoKit));
ipcMain.handle('add-material-to-kit', (_, { codigoKit, sap, quantidade }) =>
  db.addMaterialToKit(codigoKit, sap, quantidade));
ipcMain.handle('update-kit-material-qty', (_, { id, quantidade }) => db.updateKitMaterialQty(id, quantidade));
ipcMain.handle('remove-material-from-kit', (_, id) => db.removeMaterialFromKit(id));

// Servicos CM
ipcMain.handle('get-all-servicos', () => db.getAllServicos());
ipcMain.handle('search-servicos', (_, query) => db.searchServicos(query));
ipcMain.handle('upsert-servico', (_, { codigo, descricao, precoBruto }) =>
  db.upsertServico(codigo, descricao, precoBruto));

// Stats
ipcMain.handle('get-stats', () => db.getStats());
