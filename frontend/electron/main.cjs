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
const db = require('./db/database.cjs');

let mainWindow;

async function createWindow() {
  await db.init();

  // Register all DDD Controllers
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
      spellcheck: false, // Disable spellcheck to reduce internal requests
      enableRemoteModule: false,
    },
    show: false,
  });

  // Mitigation for chrome://terms and Autofill errors
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('chrome://')) event.preventDefault();
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

// ========== IPC HANDLERS (LEGACY - MIGRATION IN PROGRESS) ==========

// Fast cost calculation (single query)
ipcMain.handle('get-custo-total', (_, kitCodes) => db.getCustoTotal(kitCodes));

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



// Kit Composition

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

// EMPRESAS & PREÇOS (Multi-Company)
ipcMain.handle('get-all-empresas', () => db.getAllEmpresas());
ipcMain.handle('get-empresa', (_, id) => db.getEmpresa(id));
ipcMain.handle('create-empresa', (_, { nome, contrato, regional }) =>
  db.createEmpresa(nome, contrato, regional));
ipcMain.handle('update-empresa', (_, { id, nome, contrato, regional }) =>
  db.updateEmpresa(id, nome, contrato, regional));
ipcMain.handle('delete-empresa', (_, id) => db.deleteEmpresa(id));

ipcMain.handle('get-empresa-ativa', () => db.getEmpresaAtiva());
ipcMain.handle('set-empresa-ativa', (_, empresaId) => db.setEmpresaAtiva(empresaId));

ipcMain.handle('get-preco-by-empresa', (_, { empresaId, sap }) =>
  db.getPrecoByEmpresa(empresaId, sap));
ipcMain.handle('get-all-precos-by-empresa', (_, empresaId) =>
  db.getAllPrecosByEmpresa(empresaId));
ipcMain.handle('set-preco-empresa', (_, { empresaId, sap, precoNovo, origem }) =>
  db.setPrecoEmpresa(empresaId, sap, precoNovo, origem));
ipcMain.handle('import-precos-from-array', (_, { empresaId, precosArray, origem }) =>
  db.importPrecosFromArray(empresaId, precosArray, origem));
ipcMain.handle('reajuste-em-massa', (_, { empresaId, percentual, filtroSaps }) =>
  db.reajusteEmMassa(empresaId, percentual, filtroSaps));
ipcMain.handle('get-historico-precos', (_, { empresaId, limit }) =>
  db.getHistoricoPrecos(empresaId, limit));

// SUFIXOS CONTEXTUAIS (Dynamic Kit Material Resolution)
ipcMain.handle('resolver-sufixo', (_, { prefixo, tipoContexto, valorContexto }) =>
  db.resolverSufixo(prefixo, tipoContexto, valorContexto));
ipcMain.handle('upsert-sufixo', (_, { prefixo, tipoContexto, valorContexto, sufixo }) =>
  db.upsertSufixo(prefixo, tipoContexto, valorContexto, sufixo));
ipcMain.handle('get-sufixos-by-prefixo', (_, prefixo) =>
  db.getSufixosByPrefixo(prefixo));
ipcMain.handle('get-sufixos-by-contexto', (_, { tipoContexto, valorContexto }) =>
  db.getSufixosByContexto(tipoContexto, valorContexto));

// TEMPLATES KIT MANUAL
ipcMain.handle('save-template-manual', (_, templateData) =>
  db.saveTemplateManual(templateData));
ipcMain.handle('get-template-manual', (_, nome) =>
  db.getTemplateManual(nome));
ipcMain.handle('get-all-templates-manuais', () =>
  db.getAllTemplatesManuais());
ipcMain.handle('delete-template-manual', async (_, nome_template) => {
  return db.deleteTemplateManual(nome_template);
});
ipcMain.handle('get-all-sufixos', () =>
  db.getAllSufixos());

// Price Management
ipcMain.handle('get-zero-price-materials', () => db.getZeroPriceMaterials());
ipcMain.handle('update-material-price', (_, { sap, price }) => db.updateMaterialPrice(sap, price));
ipcMain.handle('update-all-kits-service-cost', (_, amount) => db.updateServiceCostForAllKits(amount));

// AI & Intelligence
ipcMain.handle('suggest-labor-cost', (_, data) => PythonBridge.run('ai_labor_estimator', data));

// Zenith Analytics & BI
ipcMain.handle('get-dashboard-metrics', () => DashboardService.getMetrics());
ipcMain.handle('predict-bim-category', (_, description) => BimPredictorService.predict(description));

// GIS Assets with BIM Intelligence
ipcMain.handle('get-all-gis-assets', async () => {
  const assets = db.getAllGisAssets();
  // Enrich with inferred BIM lifecycle data
  return assets.map(asset => {
    const material = { descricao: asset.material_desc, vida_util_anos: asset.material_vida_util };
    return {
      ...asset,
      bim_lifecycle: BimPredictorService.estimateLifecycle(asset, material)
    };
  });
});

ipcMain.handle('upsert-gis-asset', (e, data) => db.upsertGisAsset(data));
ipcMain.handle('delete-gis-asset', (e, id) => db.deleteGisAsset(id));

// Field Intelligence & Governance (Cycle 21)
ipcMain.handle('add-vistoria', (e, data) => db.addVistoria(data));
ipcMain.handle('get-vistorias', (e, id) => db.getVistoriasByPole(id));
ipcMain.handle('get-maintenance-backlog', () => db.getMaintenanceBacklog());
ipcMain.handle('update-maintenance-status', (e, { id, status }) => db.updateMaintenanceStatus(id, status));
ipcMain.handle('get-suggested-backlog', () => MaintenanceService.generateSuggestedBacklog());
ipcMain.handle('schedule-batch-maintenance', (e, suggestions) => MaintenanceService.scheduleBatch(suggestions));

// Engineering Intelligence (Cycle 22/23)
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
