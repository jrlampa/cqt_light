const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Fast cost calculation
  getCustoTotal: (kitCodes) => ipcRenderer.invoke('get-custo-total', kitCodes),

  // Materials
  getAllMaterials: () => ipcRenderer.invoke('get-all-materials'),
  searchMaterials: (query) => ipcRenderer.invoke('search-materials', query),
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
  saveTemplateManual: (nome, kitBase, materiais, observacao) =>
    ipcRenderer.invoke('save-template-manual', { nome, kitBase, materiais, observacao }),
  getTemplateManual: (nome) =>
    ipcRenderer.invoke('get-template-manual', nome),
  getAllTemplatesManuais: () =>
    ipcRenderer.invoke('get-all-templates-manuais'),
});
