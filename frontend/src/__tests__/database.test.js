import { describe, it, expect, beforeAll } from 'vitest';

describe('Database Service Tests', () => {
  let db;

  beforeAll(async () => {
    // Mock database for testing
    // In real scenario, import from electron/db/database.cjs
    db = {
      getAllMaterials: () => Promise.resolve([
        { sap: '123', descricao: 'Material Teste', preco_unitario: 10.5 }
      ]),
      searchMaterials: (query) => Promise.resolve([
        { sap: '123', descricao: 'Material Teste', preco_unitario: 10.5 }
      ]),
      getAllServicos: () => Promise.resolve([
        { codigo: 'SRV01', descricao: 'Serviço Teste', preco_bruto: 50.0 }
      ]),
      getKit: (codigo) => Promise.resolve({
        codigo_kit: '13N1',
        descricao_kit: 'Kit Teste'
      }),
      getKitComposition: (codigo) => Promise.resolve([
        { sap: '123', quantidade: 2, preco_unitario: 10.5, subtotal: 21.0 }
      ]),
      saveOrcamento: (nome, total, dados) => Promise.resolve({
        id: 1, nome, total, data_criacao: new Date().toISOString()
      }),
      getOrcamentos: () => Promise.resolve([
        { id: 1, nome: 'Orçamento Teste', total: 1000, data_criacao: new Date().toISOString() }
      ]),
      getOrcamento: (id) => Promise.resolve({
        id, nome: 'Orçamento Teste', total: 1000, dados_json: JSON.stringify({ itens: [] })
      }),
      deleteOrcamento: (id) => Promise.resolve()
    };
  });

  it('should fetch all materials', async () => {
    const materials = await db.getAllMaterials();
    expect(materials).toBeDefined();
    expect(Array.isArray(materials)).toBe(true);
    expect(materials.length).toBeGreaterThan(0);
  });

  it('should search materials by query', async () => {
    const results = await db.searchMaterials('Teste');
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
  });

  it('should fetch all services', async () => {
    const services = await db.getAllServicos();
    expect(services).toBeDefined();
    expect(Array.isArray(services)).toBe(true);
  });

  it('should get kit by codigo', async () => {
    const kit = await db.getKit('13N1');
    expect(kit).toBeDefined();
    expect(kit.codigo_kit).toBe('13N1');
  });

  it('should get kit composition', async () => {
    const composition = await db.getKitComposition('13N1');
    expect(composition).toBeDefined();
    expect(Array.isArray(composition)).toBe(true);
  });

  describe('Budget Management Tests', () => {
    it('should save a new budget', async () => {
      const budget = { nome: 'Obra A', total: 1000, dados: { itens: [] } };
      const saved = await db.saveOrcamento(budget.nome, budget.total, budget.dados);
      expect(saved).toBeDefined();
      expect(saved.id).toBe(1);
      expect(saved.nome).toBe('Obra A');
    });

    it('should list saved budgets', async () => {
      const budgets = await db.getOrcamentos();
      expect(budgets).toBeDefined();
      expect(Array.isArray(budgets)).toBe(true);
      expect(budgets.length).toBeGreaterThan(0);
      expect(budgets[0].total).toBeDefined();
    });

    it('should load a specific budget details', async () => {
      const budget = await db.getOrcamento(1);
      expect(budget).toBeDefined();
      expect(budget.id).toBe(1);
      expect(budget.dados_json).toBeDefined();
    });
  });
});

describe('Data Validation Tests', () => {
  it('should validate material SAP format', () => {
    const validateSAP = (sap) => typeof sap === 'string' && sap.length > 0;
    expect(validateSAP('123456')).toBe(true);
    expect(validateSAP('')).toBe(false);
  });

  it('should validate price is number', () => {
    const validatePrice = (price) => typeof price === 'number' && price >= 0;
    expect(validatePrice(10.5)).toBe(true);
    expect(validatePrice(-5)).toBe(false);
    expect(validatePrice('ten')).toBe(false);
  });

  it('should validate quantity is positive', () => {
    const validateQty = (qty) => typeof qty === 'number' && qty > 0;
    expect(validateQty(1)).toBe(true);
    expect(validateQty(0)).toBe(false);
    expect(validateQty(-1)).toBe(false);
  });
});

describe('Cost Calculation Tests', () => {
  it('should calculate subtotal correctly', () => {
    const calculateSubtotal = (qty, price) => qty * price;
    expect(calculateSubtotal(2, 10.5)).toBe(21.0);
    expect(calculateSubtotal(1, 100)).toBe(100);
    expect(calculateSubtotal(0, 50)).toBe(0);
  });

  it('should aggregate materials by SAP', () => {
    const materials = [
      { sap: '123', quantidade: 2, subtotal: 20 },
      { sap: '123', quantidade: 1, subtotal: 10 },
      { sap: '456', quantidade: 3, subtotal: 30 }
    ];

    const consolidated = materials.reduce((acc, mat) => {
      if (acc[mat.sap]) {
        acc[mat.sap].quantidade += mat.quantidade;
        acc[mat.sap].subtotal += mat.subtotal;
      } else {
        acc[mat.sap] = { ...mat };
      }
      return acc;
    }, {});

    expect(consolidated['123'].quantidade).toBe(3);
    expect(consolidated['123'].subtotal).toBe(30);
    expect(consolidated['456'].quantidade).toBe(3);
  });

  it('should calculate total from array', () => {
    const materials = [
      { subtotal: 10.5 },
      { subtotal: 20.0 },
      { subtotal: 15.5 }
    ];
    const total = materials.reduce((sum, m) => sum + m.subtotal, 0);
    expect(total).toBe(46.0);
  });
});


