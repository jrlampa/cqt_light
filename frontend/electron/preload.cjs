const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // === Materials ===
  getAllMaterials: () => ipcRenderer.invoke('get-all-materials'),
  getMaterial: (sap) => ipcRenderer.invoke('get-material', sap),
  upsertMaterial: (data) => ipcRenderer.invoke('upsert-material', data),
  deleteMaterial: (sap) => ipcRenderer.invoke('delete-material', sap),
  searchMaterials: (query) => ipcRenderer.invoke('search-materials', query),

  // === Kits ===
  getAllKits: () => ipcRenderer.invoke('get-all-kits'),
  getKit: (codigoKit) => ipcRenderer.invoke('get-kit', codigoKit),
  createKit: (data) => ipcRenderer.invoke('create-kit', data),
  deleteKit: (codigoKit) => ipcRenderer.invoke('delete-kit', codigoKit),
  searchKits: (query) => ipcRenderer.invoke('search-kits', query),

  // === Kit Composition ===
  getKitComposition: (codigoKit) => ipcRenderer.invoke('get-kit-composition', codigoKit),
  addMaterialToKit: (data) => ipcRenderer.invoke('add-material-to-kit', data),
  updateKitMaterialQty: (data) => ipcRenderer.invoke('update-kit-material-qty', data),
  removeMaterialFromKit: (id) => ipcRenderer.invoke('remove-material-from-kit', id),

  // === Aggregated Materials ===
  getAggregatedMaterials: (kitCodes) => ipcRenderer.invoke('get-aggregated-materials', kitCodes),

  // === Labor ===
  getAllLabor: () => ipcRenderer.invoke('get-all-labor'),
  getLabor: (codigoMo) => ipcRenderer.invoke('get-labor', codigoMo),
  upsertLabor: (data) => ipcRenderer.invoke('upsert-labor', data),
  deleteLabor: (codigoMo) => ipcRenderer.invoke('delete-labor', codigoMo),

  // === Kit Services ===
  getKitServices: (codigoKit) => ipcRenderer.invoke('get-kit-services', codigoKit),
  addServiceToKit: (data) => ipcRenderer.invoke('add-service-to-kit', data),
  removeServiceFromKit: (id) => ipcRenderer.invoke('remove-service-from-kit', id),

  // === Aggregated Services ===
  getAggregatedServices: (kitCodes) => ipcRenderer.invoke('get-aggregated-services', kitCodes),

  // === Stats ===
  getStats: () => ipcRenderer.invoke('get-stats'),
});
