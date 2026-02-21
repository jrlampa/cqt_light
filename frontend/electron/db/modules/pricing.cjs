'use strict';
/**
 * CQT Light — Módulo de Empresas e Gestão de Preços
 * Responsabilidade: CRUD de empresas, preços por empresa, histórico e reajustes.
 */

/**
 * @param {import('better-sqlite3').Database} db
 */
module.exports = function createPricingModule(db) {
  // ========== CONFIGURAÇÃO ==========

  function getConfig(chave) {
    const config = db.prepare('SELECT valor FROM configuracao WHERE chave = ?').get(chave);
    return config ? config.valor : null;
  }

  function setConfig(chave, valor) {
    db.prepare('INSERT OR REPLACE INTO configuracao (chave, valor) VALUES (?, ?)').run(chave, valor);
  }

  // ========== EMPRESAS ==========

  function getAllEmpresas() {
    return db.prepare('SELECT * FROM empresas WHERE ativa = 1 ORDER BY nome').all();
  }

  function getEmpresa(id) {
    return db.prepare('SELECT * FROM empresas WHERE id = ?').get(id);
  }

  function createEmpresa(nome, contrato, regional) {
    db.prepare('INSERT INTO empresas (nome, contrato, regional) VALUES (?, ?, ?)').run(nome, contrato, regional);
    return db.prepare('SELECT last_insert_rowid() as id').get().id;
  }

  function updateEmpresa(id, nome, contrato, regional) {
    db.prepare('UPDATE empresas SET nome = ?, contrato = ?, regional = ? WHERE id = ?').run(nome, contrato, regional, id);
  }

  function deleteEmpresa(id) {
    db.prepare('UPDATE empresas SET ativa = 0 WHERE id = ?').run(id);
  }

  function getEmpresaAtiva() {
    const empresaId = getConfig('empresa_ativa_id');
    if (!empresaId) return null;
    return getEmpresa(parseInt(empresaId));
  }

  function setEmpresaAtiva(empresaId) {
    setConfig('empresa_ativa_id', empresaId.toString());
  }

  // ========== PREÇOS POR EMPRESA ==========

  function getPrecoByEmpresa(empresaId, sap) {
    const preco = db.prepare(
      'SELECT preco_unitario FROM precos_empresa WHERE empresa_id = ? AND sap = ?'
    ).get(empresaId, sap);

    if (!preco) {
      const material = db.prepare('SELECT preco_unitario FROM materiais WHERE sap = ?').get(sap);
      return material ? material.preco_unitario : 0;
    }
    return preco.preco_unitario;
  }

  function getAllPrecosByEmpresa(empresaId) {
    return db.prepare(`
      SELECT pe.sap, m.descricao, m.unidade, pe.preco_unitario, pe.data_atualizacao, pe.origem
      FROM precos_empresa pe
      LEFT JOIN materiais m ON pe.sap = m.sap
      WHERE pe.empresa_id = ?
      ORDER BY m.descricao
    `).all(empresaId);
  }

  function setPrecoEmpresa(empresaId, sap, precoNovo, origem = 'manual') {
    const precoAnterior = getPrecoByEmpresa(empresaId, sap);

    db.prepare(`
      INSERT INTO precos_empresa (empresa_id, sap, preco_unitario, origem, data_atualizacao)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(empresa_id, sap) DO UPDATE SET
        preco_unitario = excluded.preco_unitario,
        origem = excluded.origem,
        data_atualizacao = CURRENT_TIMESTAMP
    `).run(empresaId, sap, precoNovo, origem);

    db.prepare(`
      INSERT INTO historico_precos (empresa_id, sap, preco_anterior, preco_novo, tipo_alteracao)
      VALUES (?, ?, ?, ?, ?)
    `).run(empresaId, sap, precoAnterior, precoNovo, origem);
  }

  function importPrecosFromArray(empresaId, precosArray, origem = 'importacao') {
    let contador = 0;
    precosArray.forEach(item => {
      if (item.sap && item.preco_unitario !== undefined) {
        setPrecoEmpresa(empresaId, item.sap, item.preco_unitario, origem);
        contador++;
      }
    });
    return contador;
  }

  function reajusteEmMassa(empresaId, percentual, filtroSaps = null) {
    let query = 'SELECT sap, preco_unitario FROM precos_empresa WHERE empresa_id = ?';
    let params = [empresaId];

    if (filtroSaps && filtroSaps.length > 0) {
      const placeholders = filtroSaps.map(() => '?').join(',');
      query += ` AND sap IN (${placeholders})`;
      params = params.concat(filtroSaps);
    }

    const precos = db.prepare(query).all(params);
    let contador = 0;

    precos.forEach(item => {
      const novoPreco = item.preco_unitario * (1 + percentual / 100);
      db.prepare(`
        UPDATE precos_empresa
        SET preco_unitario = ?, origem = 'reajuste', data_atualizacao = CURRENT_TIMESTAMP
        WHERE empresa_id = ? AND sap = ?
      `).run(novoPreco, empresaId, item.sap);

      db.prepare(`
        INSERT INTO historico_precos (empresa_id, sap, preco_anterior, preco_novo, tipo_alteracao, percentual)
        VALUES (?, ?, ?, ?, 'reajuste_percentual', ?)
      `).run(empresaId, item.sap, item.preco_unitario, novoPreco, percentual);

      contador++;
    });

    return contador;
  }

  function getHistoricoPrecos(empresaId, limit = 100) {
    return db.prepare(`
      SELECT h.*, m.descricao
      FROM historico_precos h
      LEFT JOIN materiais m ON h.sap = m.sap
      WHERE h.empresa_id = ?
      ORDER BY h.data_alteracao DESC
      LIMIT ?
    `).all(empresaId, limit);
  }

  return {
    getConfig,
    setConfig,
    getAllEmpresas,
    getEmpresa,
    createEmpresa,
    updateEmpresa,
    deleteEmpresa,
    getEmpresaAtiva,
    setEmpresaAtiva,
    getPrecoByEmpresa,
    getAllPrecosByEmpresa,
    setPrecoEmpresa,
    importPrecosFromArray,
    reajusteEmMassa,
    getHistoricoPrecos,
  };
};
