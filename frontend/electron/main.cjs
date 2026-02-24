const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const db = require('./db/database.cjs');
const ControllerRegistry = require('./src/interfaces/ControllerRegistry');
const PythonBridge = require('./src/infrastructure/services/PythonBridge');
const DashboardService = require('./services/DashboardService');
const BimPredictorService = require('./services/BimPredictorService');
const MaintenanceService = require('./services/MaintenanceService');
const EngineeringService = require('./services/EngineeringService');
const OptimizationService = require('./services/OptimizationService');
const ReportService = require('./services/ReportService');
const BOMService = require('./services/BOMService');
const AssetService = require('./services/AssetService');

let mainWindow;

async function createWindow() {
  await db.init();

  // Register all DDD Controllers (New SotA Architecture)
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

  // Mitigation for chrome://terms and Autofill errors
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
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// ========== MISC HANDLERS (Pending Modularization) ==========

// AI & Intelligence
ipcMain.handle('suggest-labor-cost', (_, data) => PythonBridge.run('ai_labor_estimator', data));

// Engineering Intelligence
ipcMain.handle('calculate-stress', (e, data) => EngineeringService.calculateMechanicalStress(data.pole, data.structures, data.conductors));
ipcMain.handle('calculate-vdrop', (e, data) => EngineeringService.calculateVoltageDrop(data.conductor, data.distance, data.current));
ipcMain.handle('calculate-sag', (e, data) => EngineeringService.calculateConductorSag(data.span, data.conductor, data.temp));
ipcMain.handle('find-cost-savings', async (event, materials, zone) => {
  return await OptimizationService.findCostSavings(materials, zone);
});

ipcMain.handle('generate-technical-memorial', async (event, projectData) => {
  return ReportService.generateTechnicalMemorial(projectData);
});

ipcMain.handle('rationalize-bom', async (event, materials, structures) => {
  return BOMService.rationalizeBOM(materials, structures);
});

ipcMain.handle('validate-structures', (e, structures) => EngineeringService.validateStructureCompatibility(structures));

ipcMain.handle('calculate-asset-health', (e, asset) => AssetService.calculateAssetHealth(asset));
ipcMain.handle('assess-project-risk', (e, assets) => AssetService.assessProjectRisk(assets));
