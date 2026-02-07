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

  // ============================================
  // EMPRESAS (Multi-Company Management)
  // ============================= ==============

  getAllEmpresas() {
    return this.all('SELECT * FROM empresas WHERE ativa = 1 ORDER BY nome');
  }

  getEmpresa(id) {
    return this.get('SELECT * FROM empresas WHERE id = ?', [id]);
  }

  createEmpresa(nome, contrato, regional) {
    this.run(
      'INSERT INTO empresas (nome, contrato, regional) VALUES (?, ?, ?)',
      [nome, contrato, regional]
    );
    return this.get('SELECT last_insert_rowid() as id').id;
  }

  updateEmpresa(id, nome, contrato, regional) {
    this.run(
      'UPDATE empresas SET nome = ?, contrato = ?, regional = ? WHERE id = ?',
      [nome, contrato, regional, id]
    );
  }

  deleteEmpresa(id) {
    this.run('UPDATE empresas SET ativa = 0 WHERE id = ?', [id]);
  }

  // CONFIGURAÇÃO (App Settings)

  getConfig(chave) {
    const config = this.get('SELECT valor FROM configuracao WHERE chave = ?', [chave]);
    return config ? config.valor : null;
  }

  setConfig(chave, valor) {
    this.run(
      'INSERT OR REPLACE INTO configuracao (chave, valor) VALUES (?, ?)',
      [chave, valor]
    );
  }

  getEmpresaAtiva() {
    const empresaId = this.getConfig('empresa_ativa_id');
    if (!empresaId) return null;
    return this.getEmpresa(parseInt(empresaId));
  }

  setEmpresaAtiva(empresaId) {
    this.setConfig('empresa_ativa_id', empresaId.toString());
  }

  // PREÇOS POR EMPRESA

  getPrecoByEmpresa(empresaId, sap) {
    const preco = this.get(
      'SELECT preco_unitario FROM precos_empresa WHERE empresa_id = ? AND sap = ?',
      [empresaId, sap]
    );

    // Fallback para tabela materiais se não encontrar preço específico
    if (!preco) {
      const material = this.get('SELECT preco_unitario FROM materiais WHERE sap = ?', [sap]);
      return material ? material.preco_unitario : 0;
    }

    return preco.preco_unitario;
  }

  getAllPrecosByEmpresa(empresaId) {
    return this.all(`
      SELECT pe.sap, m.descricao, m.unidade, pe.preco_unitario, pe.data_atualizacao, pe.origem
      FROM precos_empresa pe
      LEFT JOIN materiais m ON pe.sap = m.sap
      WHERE pe.empresa_id = ?
      ORDER BY m.descricao
    `, [empresaId]);
  }

  setPrecoEmpresa(empresaId, sap, precoNovo, origem = 'manual') {
    // Buscar preço anterior para histórico
    const precoAnterior = this.getPrecoByEmpresa(empresaId, sap);

    // Inserir ou atualizar preço
    this.run(`
      INSERT INTO precos_empresa (empresa_id, sap, preco_unitario, origem, data_atualizacao)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(empresa_id, sap) DO UPDATE SET
        preco_unitario = excluded.preco_unitario,
        origem = excluded.origem,
        data_atualizacao = CURRENT_TIMESTAMP
    `, [empresaId, sap, precoNovo, origem]);

    // Registrar no histórico
    this.run(`
      INSERT INTO historico_precos (empresa_id, sap, preco_anterior, preco_novo, tipo_alteracao)
      VALUES (?, ?, ?, ?, ?)
    `, [empresaId, sap, precoAnterior, precoNovo, origem]);
  }

  importPrecosFromArray(empresaId, precosArray, origem = 'importacao') {
    let contador = 0;

    precosArray.forEach(item => {
      if (item.sap && item.preco_unitario !== undefined) {
        this.setPrecoEmpresa(empresaId, item.sap, item.preco_unitario, origem);
        contador++;
      }
    });

    return contador;
  }

  reajusteEmMassa(empresaId, percentual, filtroSaps = null) {
    let query = `SELECT sap, preco_unitario FROM precos_empresa WHERE empresa_id = ?`;
    let params = [empresaId];

    if (filtroSaps && filtroSaps.length > 0) {
      const placeholders = filtroSaps.map(() => '?').join(',');
      query += ` AND sap IN (${placeholders})`;
      params = params.concat(filtroSaps);
    }

    const precos = this.all(query, params);
    let contador = 0;

    precos.forEach(item => {
      const novoPreco = item.preco_unitario * (1 + percentual / 100);
      this.run(`
        UPDATE precos_empresa 
        SET preco_unitario = ?, origem = 'reajuste', data_atualizacao = CURRENT_TIMESTAMP
        WHERE empresa_id = ? AND sap = ?
      `, [novoPreco, empresaId, item.sap]);

      // Histórico
      this.run(`
        INSERT INTO historico_precos (empresa_id, sap, preco_anterior, preco_novo, tipo_alteracao, percentual)
        VALUES (?, ?, ?, ?, 'reajuste_percentual', ?)
      `, [empresaId, item.sap, item.preco_unitario, novoPreco, percentual]);

      contador++;
    });

    return contador;
  }

  getHistoricoPrecos(empresaId, limit = 100) {
    return this.all(`
      SELECT h.*, m.descricao
      FROM historico_precos h
      LEFT JOIN materiais m ON h.sap = m.sap
      WHERE h.empresa_id = ?
      ORDER BY h.data_alteracao DESC
      LIMIT ?
    `, [empresaId, limit]);
  }

  // ========== SUFIXOS CONTEXTUAIS (Dynamic Material Resolution) ==========

  /**
   * Resolve a partial code (F-10/, M1/) to complete code based on context
   * @param {string} prefixo - Partial code like 'F-10/' or 'M1/'
   * @param {string} tipoContexto - 'poste' or 'condutor'
   * @param {string} valorContexto - e.g., '11600B' or 'CAA 1/0'
   * @returns {string|null} - Complete code or null if not found
   */
  resolverSufixo(prefixo, tipoContexto, valorContexto) {
    const result = this.get(`
      SELECT codigo_completo, prefixo || sufixo as resolved
      FROM sufixos_contextuais
      WHERE prefixo = ? AND tipo_contexto = ? AND valor_contexto = ?
    `, [prefixo, tipoContexto, valorContexto]);

    return result ? (result.codigo_completo || result.resolved) : null;
  }

  /**
   * Add or update a suffix mapping
   */
  upsertSufixo(prefixo, tipoContexto, valorContexto, sufixo) {
    const codigoCompleto = prefixo + sufixo;
    this.run(`
      INSERT INTO sufixos_contextuais (prefixo, tipo_contexto, valor_contexto, sufixo, codigo_completo)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(prefixo, tipo_contexto, valor_contexto) DO UPDATE SET
        sufixo = excluded.sufixo,
        codigo_completo = excluded.codigo_completo
    `, [prefixo, tipoContexto, valorContexto, sufixo, codigoCompleto]);
  }

  /**
   * Get all suffix mappings for a given prefix
   */
  getSufixosByPrefixo(prefixo) {
    return this.all(`
      SELECT * FROM sufixos_contextuais WHERE prefixo = ? ORDER BY valor_contexto
    `, [prefixo]);
  }

  /**
   * Get all suffix mappings for a context value (e.g., all for '11600B' pole)
   */
  getSufixosByContexto(tipoContexto, valorContexto) {
    return this.all(`
      SELECT * FROM sufixos_contextuais 
      WHERE tipo_contexto = ? AND valor_contexto = ?
    `, [tipoContexto, valorContexto]);
  }

  // ========== TEMPLATES KIT MANUAL ==========

  saveTemplateManual(nomeTemplate, kitBase, materiaisArray, observacao = null) {
    this.run(`
      INSERT INTO templates_kit_manual (nome_template, kit_base, materiais_json, observacao)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(nome_template) DO UPDATE SET
        kit_base = excluded.kit_base,
        materiais_json = excluded.materiais_json,
        observacao = excluded.observacao
    `, [nomeTemplate, kitBase, JSON.stringify(materiaisArray), observacao]);
  }

  getTemplateManual(nomeTemplate) {
    const tpl = this.get('SELECT * FROM templates_kit_manual WHERE nome_template = ?', [nomeTemplate]);
    if (tpl) {
      try { tpl.materiais = JSON.parse(tpl.materiais_json); }
      catch { tpl.materiais = []; }
    }
    return tpl;
  }

  getAllTemplatesManuais() {
    return this.all('SELECT nome_template, kit_base, observacao FROM templates_kit_manual ORDER BY nome_template');
  }
  getAllSufixos() {
    return this.all('SELECT * FROM sufixos_contextuais');
  }
}

module.exports = new DatabaseService();

