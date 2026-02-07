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

    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    this.db.run(schema);

    this.initialized = true;
    this.save();
  }

  save() {
    if (!this.db) return;
    const data = this.db.export();
    fs.writeFileSync(this.dbPath, Buffer.from(data));
  }

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

  // ========== FAST COST CALCULATION (< 100ms) ==========

  /**
   * Get total cost for multiple kits in ONE query
   * Returns: { materiais: [], totalMaterial, totalServico, totalGeral }
   */
  getCustoTotal(kitCodes) {
    if (!kitCodes || kitCodes.length === 0) {
      return { materiais: [], totalMaterial: 0, totalServico: 0, totalGeral: 0 };
    }

    const placeholders = kitCodes.map(() => '?').join(',');

    // Aggregated materials
    const materiais = this.all(`
      SELECT 
        m.sap,
        m.descricao,
        m.unidade,
        m.preco_unitario,
        SUM(kc.quantidade) as quantidade,
        SUM(kc.quantidade * m.preco_unitario) as subtotal
      FROM kit_composicao kc
      JOIN materiais m ON kc.sap = m.sap
      WHERE kc.codigo_kit IN (${placeholders})
      GROUP BY m.sap, m.descricao, m.unidade, m.preco_unitario
      ORDER BY m.descricao
    `, kitCodes);

    // Service costs from kits
    const servicos = this.all(`
      SELECT codigo_kit, descricao_kit, codigo_servico, custo_servico
      FROM kits WHERE codigo_kit IN (${placeholders})
    `, kitCodes);

    const totalMaterial = materiais.reduce((sum, m) => sum + (m.subtotal || 0), 0);
    const totalServico = servicos.reduce((sum, s) => sum + (s.custo_servico || 0), 0);

    return {
      materiais,
      servicos,
      totalMaterial,
      totalServico,
      totalGeral: totalMaterial + totalServico
    };
  }

  // ========== MATERIAIS ==========
  getAllMaterials() {
    return this.all('SELECT * FROM materiais ORDER BY sap LIMIT 200');
  }

  searchMaterials(query) {
    return this.all(`
      SELECT * FROM materiais 
      WHERE sap LIKE ? OR descricao LIKE ?
      ORDER BY sap LIMIT 50
    `, [`%${query}%`, `%${query}%`]);
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

  // ========== KITS ==========
  getAllKits() {
    return this.all('SELECT * FROM kits ORDER BY codigo_kit');
  }

  searchKits(query) {
    return this.all(`
      SELECT * FROM kits 
      WHERE codigo_kit LIKE ? OR descricao_kit LIKE ?
      ORDER BY codigo_kit LIMIT 30
    `, [`%${query}%`, `%${query}%`]);
  }

  getKit(codigoKit) {
    return this.get('SELECT * FROM kits WHERE codigo_kit = ?', [codigoKit]);
  }

  upsertKit(codigoKit, descricaoKit, codigoServico = null, custoServico = 0) {
    this.run(`
      INSERT INTO kits (codigo_kit, descricao_kit, codigo_servico, custo_servico)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(codigo_kit) DO UPDATE SET
        descricao_kit = excluded.descricao_kit,
        codigo_servico = excluded.codigo_servico,
        custo_servico = excluded.custo_servico
    `, [codigoKit, descricaoKit, codigoServico, custoServico]);
  }

  // Create a new kit (explicit insert)
  createKit(codigoKit, descricaoKit) {
    this.run(`
      INSERT INTO kits (codigo_kit, descricao_kit, codigo_servico, custo_servico)
      VALUES (?, ?, NULL, 0)
    `, [codigoKit, descricaoKit]);
    return this.getKit(codigoKit);
  }

  // Update kit metadata (description only, don't touch composition)
  updateKitMetadata(codigoKit, descricaoKit) {
    return this.run(`
      UPDATE kits SET descricao_kit = ? WHERE codigo_kit = ?
    `, [descricaoKit, codigoKit]);
  }

  // Delete kit and its composition (cascade)
  deleteKit(codigoKit) {
    // Delete composition first
    this.run('DELETE FROM kit_composicao WHERE codigo_kit = ?', [codigoKit]);
    // Then delete kit
    return this.run('DELETE FROM kits WHERE codigo_kit = ?', [codigoKit]);
  }

  // ========== KIT COMPOSITION ==========
  getKitComposition(codigoKit) {
    return this.all(`
      SELECT kc.*, m.descricao, m.unidade, m.preco_unitario,
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

  // ========== SERVICOS CM ==========
  getAllServicos() {
    return this.all('SELECT * FROM servicos_cm ORDER BY codigo');
  }

  searchServicos(query) {
    return this.all(`
      SELECT * FROM servicos_cm 
      WHERE codigo LIKE ? OR descricao LIKE ?
      ORDER BY codigo LIMIT 30
    `, [`%${query}%`, `%${query}%`]);
  }

  upsertServico(codigo, descricao, precoBruto) {
    this.run(`
      INSERT INTO servicos_cm (codigo, descricao, preco_bruto)
      VALUES (?, ?, ?)
      ON CONFLICT(codigo) DO UPDATE SET
        descricao = excluded.descricao,
        preco_bruto = excluded.preco_bruto
    `, [codigo, descricao, precoBruto || 0]);
  }

  // ========== STATS ==========
  getStats() {
    const materials = this.get('SELECT COUNT(*) as count FROM materiais');
    const kits = this.get('SELECT COUNT(*) as count FROM kits');
    const servicos = this.get('SELECT COUNT(*) as count FROM servicos_cm');
    return {
      materials: materials?.count || 0,
      kits: kits?.count || 0,
      servicos: servicos?.count || 0
    };
  }

  // ========== ORÇAMENTOS (Budget History) ==========
  saveOrcamento(nome, total, dados) {
    const info = this.run(`
      INSERT INTO orcamentos (nome, total, dados_json)
      VALUES (?, ?, ?)
    `, [nome, total, JSON.stringify(dados)]);
    return { id: info.lastInsertRowid, nome, total, data_criacao: new Date().toISOString() };
  }

  getOrcamentos() {
    return this.all('SELECT id, nome, total, data_criacao FROM orcamentos ORDER BY data_criacao DESC');
  }

  getOrcamento(id) {
    const orcamento = this.get('SELECT * FROM orcamentos WHERE id = ?', [id]);
    if (orcamento) {
      try {
        orcamento.dados = JSON.parse(orcamento.dados_json);
      } catch (e) {
        console.error('Erro ao fazer parse do JSON do orçamento:', e);
        orcamento.dados = null;
      }
    }
    return orcamento;
  }

  deleteOrcamento(id) {
    this.run('DELETE FROM orcamentos WHERE id = ?', [id]);
  }

  // ========== TEMPLATES (Project Templates) ==========
  saveTemplate(nome, descricao, dados) {
    try {
      this.run(`
        INSERT INTO templates (nome, descricao, dados_json)
        VALUES (?, ?, ?)
      `, [nome, descricao, JSON.stringify(dados)]);
      return { success: true };
    } catch (e) {
      if (e.message.includes('UNIQUE constraint failed')) {
        throw new Error('Já existe um template com este nome.');
      }
      throw e;
    }
  }

  getTemplates() {
    return this.all('SELECT id, nome, descricao, is_default FROM templates ORDER BY nome');
  }

  getTemplate(id) {
    const tpl = this.get('SELECT * FROM templates WHERE id = ?', [id]);
    if (tpl) {
      try {
        tpl.dados = JSON.parse(tpl.dados_json);
      } catch (e) {
        tpl.dados = null;
      }
    }
    return tpl;
  }

  deleteTemplate(id) {
    this.run('DELETE FROM templates WHERE id = ?', [id]);
  }
}

module.exports = new DatabaseService();
