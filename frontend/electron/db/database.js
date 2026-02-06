const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseService {
  constructor() {
    // Use a persistent DB file
    const dbPath = path.join(process.cwd(), 'cqt_light.db');
    this.db = new Database(dbPath, { verbose: console.log });
    this.init();
  }

  init() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    this.db.exec(schema);
    this.seedIfNeeded();
  }

  // --- Contratos ---
  getContracts() {
    return this.db.prepare('SELECT * FROM contratos').all();
  }

  createContract(contract) {
    const stmt = this.db.prepare('INSERT INTO contratos (nome_empresa, regional, numero_contrato) VALUES (@nome_empresa, @regional, @numero_contrato)');
    return stmt.run(contract);
  }

  // --- Custos Modulares ---
  getCostsByContract(contractId) {
    return this.db.prepare('SELECT * FROM custos_modulares WHERE contrato_id = ?').all(contractId);
  }

  updateServiceCost(id, newPrice) {
    return this.db.prepare('UPDATE custos_modulares SET preco_bruto = ? WHERE id = ?').run(newPrice, id);
  }

  // --- Kits & Materiais ---
  getKitComposition(kitCode) {
    // Busca os materiais de um kit específico
    return this.db.prepare(`
            SELECT k.id, k.codigo_kit, k.quantidade, m.codigo_sap, m.descricao, m.unidade
            FROM kits_composicao k
            LEFT JOIN materiais m ON k.codigo_sap_material = m.codigo_sap
            WHERE k.codigo_kit = ?
        `).all(kitCode);
  }

  updateKitItem(id, quantity) {
    return this.db.prepare('UPDATE kits_composicao SET quantidade = ? WHERE id = ?').run(quantity, id);
  }

  deleteKitItem(id) {
    return this.db.prepare('DELETE FROM kits_composicao WHERE id = ?').run(id);
  }

  addKitItem(kitCode, materialSAP, quantity) {
    return this.db.prepare('INSERT INTO kits_composicao (codigo_kit, codigo_sap_material, quantidade) VALUES (?, ?, ?)').run(kitCode, materialSAP, quantity);
  }

  // Método para buscar composição agregada (vários kits)
  // Retorna lista única de materiais somados
  getAggregatedComposition(kitCodes) {
    if (!kitCodes || kitCodes.length === 0) return [];

    const placeholders = kitCodes.map(() => '?').join(',');
    const query = `
            SELECT m.codigo_sap, m.descricao, m.unidade, SUM(k.quantidade) as total_quantidade
            FROM kits_composicao k
            LEFT JOIN materiais m ON k.codigo_sap_material = m.codigo_sap
            WHERE k.codigo_kit IN (${placeholders})
            GROUP BY m.codigo_sap
        `;

    return this.db.prepare(query).all(kitCodes);
  }

  // Helper to get all available kit codes (structure types)
  getAllKitCodes() {
    return this.db.prepare('SELECT DISTINCT codigo_kit FROM kits_composicao ORDER BY codigo_kit').all().map(r => r.codigo_kit);
  }

  // --- Seed Data (Mock) ---
  seedIfNeeded() {
    const check = this.db.prepare('SELECT count(*) as c FROM materiais').get();
    if (check.c > 0) return;

    console.log('Seeding Database with Mock Data...');

    // 1. Materiais
    const insertMat = this.db.prepare('INSERT OR IGNORE INTO materiais (codigo_sap, descricao, unidade) VALUES (@codigo, @desc, @uni)');
    const mats = [
      { codigo: '100010', desc: 'POSTE DT 11/400', uni: 'UN' },
      { codigo: '200050', desc: 'CRUZETA POLIMÉRICA 2400mm', uni: 'UN' },
      { codigo: '300100', desc: 'ISOLADOR PILAR 15KV', uni: 'UN' },
      { codigo: '400500', desc: 'PARAFUSO M16x200', uni: 'UN' },
      { codigo: '500100', desc: 'CABO COBRE NU 35MM', uni: 'M' }
    ];
    mats.forEach(m => insertMat.run(m));

    // 2. Composição de Kits
    const insertKit = this.db.prepare('INSERT INTO kits_composicao (codigo_kit, codigo_sap_material, quantidade) VALUES (?, ?, ?)');

    // Estrutura 13N1
    insertKit.run('13N1', '200050', 1); // 1 Cruzeta
    insertKit.run('13N1', '300100', 3); // 3 Isoladores
    insertKit.run('13N1', '400500', 2); // 2 Parafusos

    // Poste DT
    insertKit.run('P_DT_11_400', '100010', 1);

    // 3. Contratos
    const insertContrato = this.db.prepare('INSERT INTO contratos (nome_empresa, regional, numero_contrato) VALUES (?, ?, ?)');
    const info = insertContrato.run('Light Serviços', 'LESTE', 'CTR-2026/001');
    const contratoId = info.lastInsertRowid;

    // 4. Custos Modulares (Mock Service Costs)
    const insertCusto = this.db.prepare('INSERT INTO custos_modulares (contrato_id, codigo_servico, descricao_servico, unidade, preco_bruto) VALUES (?, ?, ?, ?, ?)');
    insertCusto.run(contratoId, 'SERV001', 'INSTALAÇÃO DE POSTE', 'UN', 450.00);
    insertCusto.run(contratoId, 'SERV002', 'LANÇAMENTO DE CABO', 'M', 12.50);
  }
}

module.exports = new DatabaseService();
