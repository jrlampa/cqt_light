'use strict';
/**
 * CQT Light — DatabaseService (Orquestrador)
 * Responsabilidade: inicialização do banco e composição dos módulos de domínio.
 * Módulos: materialsKits, budget, pricing, sufixos
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const createMaterialsKitsModule = require('./modules/materialsKits.cjs');
const createBudgetModule        = require('./modules/budget.cjs');
const createPricingModule       = require('./modules/pricing.cjs');
const createSufixosModule       = require('./modules/sufixos.cjs');

class DatabaseService {
  constructor() {
    this.db = null;
    this.dbPath = path.join(process.cwd(), 'cqt_light.db');
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    try {
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');

      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      this.db.exec(schema);

      this._mountModules();
      this.initialized = true;
    } catch (err) {
      console.error('Database initialization error:', err);
      throw err;
    }
  }

  _mountModules() {
    const mk = createMaterialsKitsModule(this.db);
    const bgt = createBudgetModule(this.db);
    const prc = createPricingModule(this.db);
    const sfx = createSufixosModule(this.db);

    // Materials & Kits
    Object.assign(this, mk);
    // Budget & Templates
    Object.assign(this, bgt);
    // Pricing & Empresas
    Object.assign(this, prc);
    // Sufixos & Manual templates
    Object.assign(this, sfx);
  }

  // ========== BASE HELPERS (raw SQL access) ==========

  run(sql, params = []) {
    const info = this.db.prepare(sql).run(params);
    return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
  }

  get(sql, params = []) {
    return this.db.prepare(sql).get(params);
  }

  all(sql, params = []) {
    return this.db.prepare(sql).all(params);
  }

  // ========== CÁLCULO DE CUSTO (otimizado: < 100ms) ==========

  getCustoTotal(kitCodes) {
    if (!kitCodes || kitCodes.length === 0) {
      return { materiais: [], totalMaterial: 0, totalServico: 0, totalGeral: 0 };
    }
    const placeholders = kitCodes.map(() => '?').join(',');

    const materiais = this.all(`
      SELECT
        m.sap, m.descricao, m.unidade, m.preco_unitario,
        SUM(kc.quantidade) as quantidade,
        SUM(kc.quantidade * m.preco_unitario) as subtotal
      FROM kit_composicao kc
      JOIN materiais m ON kc.sap = m.sap
      WHERE kc.codigo_kit IN (${placeholders})
      GROUP BY m.sap, m.descricao, m.unidade, m.preco_unitario
      ORDER BY m.descricao
    `, kitCodes);

    const servicos = this.all(`
      SELECT codigo_kit, descricao_kit, codigo_servico, custo_servico
      FROM kits WHERE codigo_kit IN (${placeholders})
    `, kitCodes);

    const totalMaterial = materiais.reduce((sum, m) => sum + (m.subtotal || 0), 0);
    const totalServico  = servicos.reduce((sum, s) => sum + (s.custo_servico || 0), 0);

    return { materiais, servicos, totalMaterial, totalServico, totalGeral: totalMaterial + totalServico };
  }

  // ========== STATS ==========

  getStats() {
    const materials = this.get('SELECT COUNT(*) as count FROM materiais');
    const kits      = this.get('SELECT COUNT(*) as count FROM kits');
    const servicos  = this.get('SELECT COUNT(*) as count FROM servicos_cm');
    return {
      materials: materials?.count || 0,
      kits:      kits?.count      || 0,
      servicos:  servicos?.count  || 0,
    };
  }
}

module.exports = new DatabaseService();
