/**
 * Vitest global setup — mocks Electron IPC (window.api) for all component tests.
 */
import { vi } from 'vitest';

// Default empty successful responses for all API methods
const defaultApi = {
  // Materials
  getAllMaterials: vi.fn().mockResolvedValue([]),
  searchMaterials: vi.fn().mockResolvedValue([]),
  upsertMaterial: vi.fn().mockResolvedValue({ changes: 1 }),
  deleteMaterial: vi.fn().mockResolvedValue({ changes: 1 }),
  getMaterialsPrices: vi.fn().mockResolvedValue([]),
  getZeroPriceMaterials: vi.fn().mockResolvedValue([]),
  updateMaterialPrice: vi.fn().mockResolvedValue({ changes: 1 }),
  importPrecosFromArray: vi.fn().mockResolvedValue({ atualizados: 0, novos: 0 }),
  reajusteEmMassa: vi.fn().mockResolvedValue({ changes: 0 }),

  // Kits
  getAllKits: vi.fn().mockResolvedValue([]),
  getKit: vi.fn().mockResolvedValue(null),
  searchKits: vi.fn().mockResolvedValue([]),
  createKit: vi.fn().mockResolvedValue({ id: 1 }),
  updateKitMetadata: vi.fn().mockResolvedValue({ changes: 1 }),
  deleteKit: vi.fn().mockResolvedValue({ changes: 1 }),
  getKitComposition: vi.fn().mockResolvedValue([]),
  addMaterialToKit: vi.fn().mockResolvedValue({ changes: 1 }),
  removeMaterialFromKit: vi.fn().mockResolvedValue({ changes: 1 }),
  updateKitMaterialQty: vi.fn().mockResolvedValue({ changes: 1 }),
  getCustoTotal: vi.fn().mockResolvedValue({ materiais: [], totalMaterial: 0, totalServico: 0 }),

  // Services
  getAllServicos: vi.fn().mockResolvedValue([]),
  searchServicos: vi.fn().mockResolvedValue([]),
  upsertServico: vi.fn().mockResolvedValue({ changes: 1 }),
  updateAllKitsServiceCost: vi.fn().mockResolvedValue({ changes: 0 }),

  // Budget
  getOrcamentos: vi.fn().mockResolvedValue([]),
  getOrcamento: vi.fn().mockResolvedValue(null),
  saveOrcamento: vi.fn().mockResolvedValue({ id: 1 }),
  deleteOrcamento: vi.fn().mockResolvedValue({ changes: 1 }),

  // Templates
  getTemplates: vi.fn().mockResolvedValue([]),
  getTemplate: vi.fn().mockResolvedValue(null),
  saveTemplate: vi.fn().mockResolvedValue({ id: 1 }),
  deleteTemplate: vi.fn().mockResolvedValue({ changes: 1 }),
  getAllTemplatesManuais: vi.fn().mockResolvedValue([]),
  saveTemplateManual: vi.fn().mockResolvedValue({ id: 1 }),
  deleteTemplateManual: vi.fn().mockResolvedValue({ changes: 1 }),

  // Sufixos
  getAllSufixos: vi.fn().mockResolvedValue([]),

  // Empresas / Preços
  getAllEmpresas: vi.fn().mockResolvedValue([]),
  getEmpresaAtiva: vi.fn().mockResolvedValue(null),
  setEmpresaAtiva: vi.fn().mockResolvedValue({ changes: 1 }),
  getHistoricoPrecos: vi.fn().mockResolvedValue([]),
};

// Add window.api without overwriting the whole window object (preserves addEventListener etc.)
if (typeof window !== 'undefined') {
  window.api = defaultApi;
} else {
  global.window = { api: defaultApi };
}

// Re-export so individual tests can access/override
export { defaultApi };
