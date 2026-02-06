const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

class DatabaseService {
  constructor() {
    this.db = null;
    this.dbPath = path.join(process.cwd(), 'cqt_light.db');
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    const SQL = await initSqlJs();

    // Load existing DB or create new
    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }

    // Run schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    this.db.run(schema);

    this.initialized = true;
    this.save();
  }

  save() {
    if (!this.db) return;
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
  }

  // Helper to run queries
  run(sql, params = []) {
    this.db.run(sql, params);
    this.save();
    return { changes: this.db.getRowsModified() };
  }

  get(sql, params = []) {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const result = stmt.getAsObject();
      stmt.free();
      return result;
    }
    stmt.free();
    return null;
  }

  all(sql, params = []) {
    const results = [];
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  // ========== MATERIAIS ==========
  getAllMaterials() {
    return this.all('SELECT * FROM materiais ORDER BY sap');
  }

  getMaterial(sap) {
    return this.get('SELECT * FROM materiais WHERE sap = ?', [sap]);
  }

  upsertMaterial(sap, descricao, unidade, preco_unitario) {
    this.run(`
      INSERT INTO materiais (sap, descricao, unidade, preco_unitario)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(sap) DO UPDATE SET
        descricao = excluded.descricao,
        unidade = excluded.unidade,
        preco_unitario = excluded.preco_unitario
    `, [sap, descricao, unidade || 'UN', preco_unitario || 0]);
  }

  deleteMaterial(sap) {
    return this.run('DELETE FROM materiais WHERE sap = ?', [sap]);
  }

  searchMaterials(query) {
    return this.all(`
      SELECT * FROM materiais 
      WHERE sap LIKE ? OR descricao LIKE ?
      ORDER BY sap LIMIT 50
    `, [`%${query}%`, `%${query}%`]);
  }

  // ========== KITS ==========
  getAllKits() {
    return this.all('SELECT * FROM kits ORDER BY codigo_kit');
  }

  getKit(codigoKit) {
    return this.get('SELECT * FROM kits WHERE codigo_kit = ?', [codigoKit]);
  }

  createKit(codigoKit, descricaoKit) {
    this.run(`
      INSERT INTO kits (codigo_kit, descricao_kit)
      VALUES (?, ?)
      ON CONFLICT(codigo_kit) DO UPDATE SET descricao_kit = excluded.descricao_kit
    `, [codigoKit, descricaoKit]);
  }

  deleteKit(codigoKit) {
    return this.run('DELETE FROM kits WHERE codigo_kit = ?', [codigoKit]);
  }

  searchKits(query) {
    return this.all(`
      SELECT * FROM kits 
      WHERE codigo_kit LIKE ? OR descricao_kit LIKE ?
      ORDER BY codigo_kit LIMIT 50
    `, [`%${query}%`, `%${query}%`]);
  }

  // ========== KIT COMPOSITION ==========
  getKitComposition(codigoKit) {
    return this.all(`
      SELECT kc.id, kc.codigo_kit, kc.sap, kc.quantidade,
             m.descricao, m.unidade, m.preco_unitario,
             (kc.quantidade * m.preco_unitario) as subtotal
      FROM kit_composicao kc
      LEFT JOIN materiais m ON kc.sap = m.sap
      WHERE kc.codigo_kit = ?
      ORDER BY m.descricao
    `, [codigoKit]);
  }

  addMaterialToKit(codigoKit, sap, quantidade) {
    this.run(`
      INSERT INTO kit_composicao (codigo_kit, sap, quantidade)
      VALUES (?, ?, ?)
      ON CONFLICT(codigo_kit, sap) DO UPDATE SET quantidade = excluded.quantidade
    `, [codigoKit, sap, quantidade || 1]);
  }

  updateKitMaterialQty(id, quantidade) {
    return this.run('UPDATE kit_composicao SET quantidade = ? WHERE id = ?', [quantidade, id]);
  }

  removeMaterialFromKit(id) {
    return this.run('DELETE FROM kit_composicao WHERE id = ?', [id]);
  }

  // ========== AGGREGATED MATERIALS (Key Feature) ==========
  getAggregatedMaterials(kitCodes) {
    if (!kitCodes || kitCodes.length === 0) return [];

    const placeholders = kitCodes.map(() => '?').join(',');
    return this.all(`
      SELECT 
        m.sap,
        m.descricao,
        m.unidade,
        m.preco_unitario,
        SUM(kc.quantidade) as total_quantidade,
        (SUM(kc.quantidade) * m.preco_unitario) as subtotal
      FROM kit_composicao kc
      LEFT JOIN materiais m ON kc.sap = m.sap
      WHERE kc.codigo_kit IN (${placeholders})
      GROUP BY m.sap, m.descricao, m.unidade, m.preco_unitario
      ORDER BY m.descricao
    `, kitCodes);
  }

  // ========== MAO DE OBRA ==========
  getAllLabor() {
    return this.all('SELECT * FROM mao_de_obra ORDER BY codigo_mo');
  }

  getLabor(codigoMo) {
    return this.get('SELECT * FROM mao_de_obra WHERE codigo_mo = ?', [codigoMo]);
  }

  upsertLabor(codigoMo, descricao, unidade, precoBruto) {
    this.run(`
      INSERT INTO mao_de_obra (codigo_mo, descricao, unidade, preco_bruto)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(codigo_mo) DO UPDATE SET
        descricao = excluded.descricao,
        unidade = excluded.unidade,
        preco_bruto = excluded.preco_bruto
    `, [codigoMo, descricao, unidade || 'UN', precoBruto || 0]);
  }

  deleteLabor(codigoMo) {
    return this.run('DELETE FROM mao_de_obra WHERE codigo_mo = ?', [codigoMo]);
  }

  // ========== KIT SERVICES ==========
  getKitServices(codigoKit) {
    return this.all(`
      SELECT ks.id, ks.codigo_kit, ks.codigo_mo,
             mo.descricao, mo.unidade, mo.preco_bruto
      FROM kit_servicos ks
      LEFT JOIN mao_de_obra mo ON ks.codigo_mo = mo.codigo_mo
      WHERE ks.codigo_kit = ?
      ORDER BY mo.descricao
    `, [codigoKit]);
  }

  addServiceToKit(codigoKit, codigoMo) {
    this.run('INSERT OR IGNORE INTO kit_servicos (codigo_kit, codigo_mo) VALUES (?, ?)', [codigoKit, codigoMo]);
  }

  removeServiceFromKit(id) {
    return this.run('DELETE FROM kit_servicos WHERE id = ?', [id]);
  }

  // ========== AGGREGATED SERVICES ==========
  getAggregatedServices(kitCodes) {
    if (!kitCodes || kitCodes.length === 0) return [];

    const placeholders = kitCodes.map(() => '?').join(',');
    return this.all(`
      SELECT 
        mo.codigo_mo,
        mo.descricao,
        mo.unidade,
        mo.preco_bruto,
        COUNT(*) as quantidade
      FROM kit_servicos ks
      LEFT JOIN mao_de_obra mo ON ks.codigo_mo = mo.codigo_mo
      WHERE ks.codigo_kit IN (${placeholders})
      GROUP BY mo.codigo_mo, mo.descricao, mo.unidade, mo.preco_bruto
      ORDER BY mo.descricao
    `, kitCodes);
  }

  // ========== STATS ==========
  getStats() {
    const materials = this.get('SELECT COUNT(*) as count FROM materiais');
    const kits = this.get('SELECT COUNT(*) as count FROM kits');
    const labor = this.get('SELECT COUNT(*) as count FROM mao_de_obra');
    return {
      materials: materials?.count || 0,
      kits: kits?.count || 0,
      labor: labor?.count || 0
    };
  }
}

module.exports = new DatabaseService();
