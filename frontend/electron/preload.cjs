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
});
