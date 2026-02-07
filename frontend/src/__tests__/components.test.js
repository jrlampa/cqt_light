import { describe, it, expect } from 'vitest';

describe('State Management Tests', () => {
  it('should initialize state from localStorage', () => {
    const mockState = { condutorMT: null, estruturas: [] };
    const loadState = () => {
      try {
        const saved = localStorage.getItem('cqt_configurator_state');
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    };

    // Mock localStorage
    global.Storage.prototype.getItem = () => JSON.stringify(mockState);
    const state = loadState();
    expect(state).toEqual(mockState);
  });

  it('should save state to localStorage', () => {
    const state = { condutorMT: 'cab_21_caa', estruturas: [] };
    let savedValue = null;

    global.Storage.prototype.setItem = (key, value) => {
      savedValue = value;
    };

    const saveState = (st) => {
      try {
        localStorage.setItem('cqt_configurator_state', JSON.stringify(st));
      } catch { }
    };

    saveState(state);
    expect(savedValue).toBe(JSON.stringify(state));
  });
});

describe('Utility Function Tests', () => {
  it('should format currency correctly', () => {
    const formatCurrency = (value) =>
      `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    const formatted = formatCurrency(1000);
    expect(formatted).toContain('R$');
    expect(formatted).toContain('1');
  });

  it('should filter poste materials', () => {
    const materials = [
      { descricao: 'POSTE MADEIRA 10M' },
      { descricao: 'CINTA METAL' },
      { descricao: 'Poste Concreto' }
    ];

    const postes = materials.filter(m =>
      m.descricao?.toUpperCase().includes('POSTE')
    );

    expect(postes).toHaveLength(2);
  });

  it('should consolidate duplicate materials', () => {
    const kits = new Map();
    const addToMap = (key, item) => {
      if (kits.has(key)) {
        const existing = kits.get(key);
        existing.quantidade += item.quantidade;
        existing.subtotal += item.subtotal;
      } else {
        kits.set(key, { ...item });
      }
    };

    addToMap('13N1', { codigo_kit: '13N1', quantidade: 1, subtotal: 100 });
    addToMap('13N1', { codigo_kit: '13N1', quantidade: 2, subtotal: 200 });

    const result = kits.get('13N1');
    expect(result.quantidade).toBe(3);
    expect(result.subtotal).toBe(300);
  });
});

describe('Edge Case Tests', () => {
  it('should handle empty material list', () => {
    const materials = [];
    const total = materials.reduce((sum, m) => sum + (m.subtotal || 0), 0);
    expect(total).toBe(0);
  });

  it('should handle null prices gracefully', () => {
    const calculateSubtotal = (qty, price) => qty * (price || 0);
    expect(calculateSubtotal(2, null)).toBe(0);
    expect(calculateSubtotal(2, undefined)).toBe(0);
  });

  it('should handle empty search query', () => {
    const query = '';
    const shouldSearch = query.trim().length > 0;
    expect(shouldSearch).toBe(false);
  });
});

describe('Material Aggregation Logic Tests', () => {
  it('should aggregate kit materials and loose materials', () => {
    const kitMaterials = [
      { sap: '123', quantidade: 2, subtotal: 20 },
      { sap: '456', quantidade: 1, subtotal: 10 }
    ];

    const looseMaterials = [
      { sap: '123', quantidade: 1, subtotal: 10 }, // DUPLICATE SAP
      { sap: '789', quantidade: 3, subtotal: 30 }
    ];

    const consolidated = new Map();

    // Add kit materials
    kitMaterials.forEach(mat => {
      consolidated.set(mat.sap, { ...mat });
    });

    // Add loose materials and merge
    looseMaterials.forEach(mat => {
      if (consolidated.has(mat.sap)) {
        const existing = consolidated.get(mat.sap);
        existing.quantidade += mat.quantidade;
        existing.subtotal += mat.subtotal;
      } else {
        consolidated.set(mat.sap, { ...mat });
      }
    });

    // Check that SAP 123 was consolidated
    expect(consolidated.get('123').quantidade).toBe(3); // 2 + 1
    expect(consolidated.get('123').subtotal).toBe(30); // 20 + 10

    // Check other materials exist
    expect(consolidated.size).toBe(3); // 123, 456, 789
  });
});
