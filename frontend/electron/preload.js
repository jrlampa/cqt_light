const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Basic Kits
  getKits: (category) => ipcRenderer.invoke('get-kits', category), // Legacy support if needed
  getAllKitCodes: () => ipcRenderer.invoke('get-all-kit-codes'),
  getKitDetails: (code) => ipcRenderer.invoke('get-kit-details', code),

  // Budgeting / Advanced
  getContracts: () => ipcRenderer.invoke('get-contracts'),
  createContract: (contract) => ipcRenderer.invoke('create-contract', contract),

  getCostsByContract: (contractId) => ipcRenderer.invoke('get-costs-by-contract', contractId),
  updateServiceCost: (id, price) => ipcRenderer.invoke('update-service-cost', { id, price }),

  // Aggregation Logic
  getAggregatedComposition: (kitCodes) => ipcRenderer.invoke('get-aggregated-composition', kitCodes),

  updateKitItem: (id, quantity) => ipcRenderer.invoke('update-kit-item', { id, quantity }),
  deleteKitItem: (id) => ipcRenderer.invoke('delete-kit-item', id),
});
