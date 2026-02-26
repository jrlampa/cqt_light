/**
 * CQT LIGHT - Preload Script
 * SEGUIR ESTRITAMENTE: Minimal API Exposure Pattern.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Fast cost calculation
  getCustoTotal: (kitCodes) => ipcRenderer.invoke('get-custo-total', kitCodes),

  // Materials
  getAllMaterials: () => ipcRenderer.invoke('get-all-materials'),
  searchMaterials: (query) => ipcRenderer.invoke('search-materials', query),
  getMaterialsPrices: (codes) => ipcRenderer.invoke('get-materials-prices', codes),
  upsertMaterial: (data) => ipcRenderer.invoke('upsert-material', data),

  // Kits
  getAllKits: () => ipcRenderer.invoke('get-all-kits'),
  searchKits: (query) => ipcRenderer.invoke('search-kits', query),
  getKit: (codigoKit) => ipcRenderer.invoke('get-kit', codigoKit),
  upsertKit: (data) => ipcRenderer.invoke('upsert-kit', data),
  createKit: (data) => ipcRenderer.invoke('create-kit', data),
  updateKitMetadata: (data) => ipcRenderer.invoke('update-kit-metadata', data),
  deleteKit: (codigo_kit) => ipcRenderer.invoke('delete-kit', codigo_kit),

  // Orçamentos
  saveOrcamento: (data) => ipcRenderer.invoke('save-orcamento', data),
  getOrcamentos: () => ipcRenderer.invoke('get-orcamentos'),
  getOrcamento: (id) => ipcRenderer.invoke('get-orcamento', id),
  deleteOrcamento: (id) => ipcRenderer.invoke('delete-orcamento', id),

  // Templates
  saveTemplate: (data) => ipcRenderer.invoke('save-template', data),
  getTemplates: () => ipcRenderer.invoke('get-templates'),
  getTemplate: (id) => ipcRenderer.invoke('get-template', id),
  deleteTemplate: (id) => ipcRenderer.invoke('delete-template', id),

  // Kit Composition
  getKitComposition: (codigoKit) => ipcRenderer.invoke('get-kit-composition', codigoKit),
  addMaterialToKit: (data) => ipcRenderer.invoke('add-material-to-kit', data),
  updateKitMaterialQty: (data) => ipcRenderer.invoke('update-kit-material-qty', data),
  removeMaterialFromKit: (id) => ipcRenderer.invoke('remove-material-from-kit', id),

  // Servicos CM
  getAllServicos: () => ipcRenderer.invoke('get-all-servicos'),
  searchServicos: (query) => ipcRenderer.invoke('search-servicos', query),
  upsertServico: (data) => ipcRenderer.invoke('upsert-servico', data),

  // Stats
  getStats: () => ipcRenderer.invoke('get-stats'),

  // Empresas & Preços (Multi-Company)
  getAllEmpresas: () => ipcRenderer.invoke('get-all-empresas'),
  getEmpresa: (id) => ipcRenderer.invoke('get-empresa', id),
  createEmpresa: (data) => ipcRenderer.invoke('create-empresa', data),
  updateEmpresa: (data) => ipcRenderer.invoke('update-empresa', data),
  deleteEmpresa: (id) => ipcRenderer.invoke('delete-empresa', id),

  getEmpresaAtiva: () => ipcRenderer.invoke('get-empresa-ativa'),
  setEmpresaAtiva: (empresaId) => ipcRenderer.invoke('set-empresa-ativa', empresaId),

  getPrecoByEmpresa: (empresaId, sap) => ipcRenderer.invoke('get-preco-by-empresa', { empresaId, sap }),
  getAllPrecosByEmpresa: (empresaId) => ipcRenderer.invoke('get-all-precos-by-empresa', empresaId),
  setPrecoEmpresa: (empresaId, sap, precoNovo, origem) =>
    ipcRenderer.invoke('set-preco-empresa', { empresaId, sap, precoNovo, origem }),
  importPrecosFromArray: (empresaId, precosArray, origem) =>
    ipcRenderer.invoke('import-precos-from-array', { empresaId, precosArray, origem }),
  reajusteEmMassa: (empresaId, percentual, filtroSaps) =>
    ipcRenderer.invoke('reajuste-em-massa', { empresaId, percentual, filtroSaps }),
  getHistoricoPrecos: (empresaId, limit) =>
    ipcRenderer.invoke('get-historico-precos', { empresaId, limit }),

  // Sufixos Contextuais (Dynamic Kit Material Resolution)
  resolverSufixo: (prefixo, tipoContexto, valorContexto) =>
    ipcRenderer.invoke('resolver-sufixo', { prefixo, tipoContexto, valorContexto }),
  upsertSufixo: (prefixo, tipoContexto, valorContexto, sufixo) =>
    ipcRenderer.invoke('upsert-sufixo', { prefixo, tipoContexto, valorContexto, sufixo }),
  getSufixosByPrefixo: (prefixo) =>
    ipcRenderer.invoke('get-sufixos-by-prefixo', prefixo),
  getSufixosByContexto: (tipoContexto, valorContexto) =>
    ipcRenderer.invoke('get-sufixos-by-contexto', { tipoContexto, valorContexto }),

  // Templates Kit Manual (PADRÕES from Excel)
  saveTemplateManual: (nome_template, kit_base, materiais, observacao) =>
    ipcRenderer.invoke('save-template-manual', { nome_template, kit_base, materiais, observacao }),
  getTemplateManual: (nome) =>
    ipcRenderer.invoke('get-template-manual', nome),
  getAllTemplatesManuais: () =>
    ipcRenderer.invoke('get-all-templates-manuais'),
  deleteTemplateManual: (nome) => ipcRenderer.invoke('delete-template-manual', nome),
  getAllSufixos: () =>
    ipcRenderer.invoke('get-all-sufixos'),

  // Price Management
  getZeroPriceMaterials: () => ipcRenderer.invoke('get-zero-price-materials'),
  updateMaterialPrice: (sap, price) => ipcRenderer.invoke('update-material-price', { sap, price }),
  updateAllKitsServiceCost: (amount) => ipcRenderer.invoke('update-all-kits-service-cost', amount),

  // Intelligence & Norms
  getNormsBySap: (sap) => ipcRenderer.invoke('get-norms-by-sap', sap),
  calculateStructureHealth: (poleData) => ipcRenderer.invoke('calculate-structure-health', poleData),
  searchNorms: (query) => ipcRenderer.invoke('search-norms', query),

  // Reporting
  savePdfReport: (data) => ipcRenderer.invoke('save-pdf-report', data),

  // Operation & GIS
  scheduleMaintenance: (jobData) => ipcRenderer.invoke('schedule-maintenance', jobData),
  getMaintenanceJobs: () => ipcRenderer.invoke('get-maintenance-jobs'),
  exportGeoJson: (projectData) => ipcRenderer.invoke('export-geojson', projectData),

  // GIS Assets (BIM Twin)
  getAllGisAssets: () => ipcRenderer.invoke('get-all-gis-assets'),
  upsertGisAsset: (data) => ipcRenderer.invoke('upsert-gis-asset', data),
  deleteGisAsset: (poleId) => ipcRenderer.invoke('delete-gis-asset', poleId),

  // Field Intelligence & Governance (Cycle 21)
  addVistoria: (data) => ipcRenderer.invoke('add-vistoria', data),
  getVistorias: (poleId) => ipcRenderer.invoke('get-vistorias', poleId),
  getMaintenanceBacklog: () => ipcRenderer.invoke('get-maintenance-backlog'),
  updateMaintenanceStatus: (id, status) => ipcRenderer.invoke('update-maintenance-status', { id, status }),
  getSuggestedBacklog: () => ipcRenderer.invoke('get-suggested-backlog'),

  // Engineering Intelligence (Cycle 22)
  calculateStress: (data) => ipcRenderer.invoke('calculate-stress', data),
  calculateVoltageDrop: (conductor, current, distance) => ipcRenderer.invoke('calculate-voltage-drop', conductor, current, distance),
  calculateSag: (data) => ipcRenderer.invoke('calculate-sag', data),
  validateStructures: (structures) => ipcRenderer.invoke('validate-structures', structures),
  findCostSavings: (materials, zone) => ipcRenderer.invoke('find-cost-savings', materials, zone),
  generateTechnicalMemorial: (projectData) => ipcRenderer.invoke('generate-technical-memorial', projectData),
  rationalizeBOM: (materials, structures) => ipcRenderer.invoke('rationalize-bom', materials, structures),
  calculateAssetHealth: (asset) => ipcRenderer.invoke('calculate-asset-health', asset),
  assessProjectRisk: (assets) => ipcRenderer.invoke('assess-project-risk', assets),

  // DXF Generation & Audit (Phase 3: DXF-IQ)
  generateDXF: (projectData) => ipcRenderer.invoke('generate-dxf', projectData),
  auditDXF: (dxfPath) => ipcRenderer.invoke('audit-dxf', { dxfPath }),

  // Engine Bridge (Hardened)
  auditProject: (projectData) => ipcRenderer.invoke('audit-project', projectData),
  generateBOM: (projectData) => ipcRenderer.invoke('generate-bom', projectData),
  getProjectAnalytics: (projectData) => ipcRenderer.invoke('get-project-analytics', projectData),
  suggestLaborCost: (data) => ipcRenderer.invoke('suggest-labor-cost', data),
  getDashboardMetrics: () => ipcRenderer.invoke('get-dashboard-metrics'),
  predictBimCategory: (description) => ipcRenderer.invoke('predict-bim-category', description),

  // TODO: Implement a unified "projectAction" gateway for better audit logging

  // Governance & Collaboration
  getAuditFlags: (poleId) => ipcRenderer.invoke('get-audit-flags', poleId),
  addAuditFlag: (data) => ipcRenderer.invoke('add-audit-flag', data),
  updateAuditFlagStatus: (id, status) => ipcRenderer.invoke('update-audit-flag-status', { id, status }),
  getGovernanceStats: () => ipcRenderer.invoke('get-governance-stats'),
});
