'use strict';
/**
 * CQT Light — Módulo de Serviços, Orçamentos e Templates
 * Responsabilidade: CRUD de serviços CM, orçamentos históricos e templates de projeto.
 */

/**
 * @param {import('better-sqlite3').Database} db
 */
module.exports = function createBudgetModule(db) {
  // ========== SERVIÇOS CM ==========

  function getAllServicos() {
    return db.prepare('SELECT * FROM servicos_cm ORDER BY codigo').all();
  }

  function searchServicos(query) {
    return db.prepare(`
      SELECT * FROM servicos_cm
      WHERE codigo LIKE ? OR descricao LIKE ?
      ORDER BY codigo LIMIT 30
    `).all(`%${query}%`, `%${query}%`);
  }

  function upsertServico(codigo, descricao, precoBruto) {
    db.prepare(`
      INSERT INTO servicos_cm (codigo, descricao, preco_bruto)
      VALUES (?, ?, ?)
      ON CONFLICT(codigo) DO UPDATE SET
        descricao = excluded.descricao,
        preco_bruto = excluded.preco_bruto
    `).run(codigo, descricao, precoBruto || 0);
  }

  // ========== ORÇAMENTOS (Budget History) ==========

  function saveOrcamento(nome, total, dados) {
    const info = db.prepare(`
      INSERT INTO orcamentos (nome, total, dados_json) VALUES (?, ?, ?)
    `).run(nome, total, JSON.stringify(dados));
    return { id: info.lastInsertRowid, nome, total, data_criacao: new Date().toISOString() };
  }

  function getOrcamentos() {
    return db.prepare(
      'SELECT id, nome, total, data_criacao FROM orcamentos ORDER BY data_criacao DESC'
    ).all();
  }

  function getOrcamento(id) {
    const orcamento = db.prepare('SELECT * FROM orcamentos WHERE id = ?').get(id);
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

  function deleteOrcamento(id) {
    db.prepare('DELETE FROM orcamentos WHERE id = ?').run(id);
  }

  // ========== TEMPLATES (Project Templates) ==========

  function saveTemplate(nome, descricao, dados) {
    try {
      db.prepare(`
        INSERT INTO templates (nome, descricao, dados_json) VALUES (?, ?, ?)
      `).run(nome, descricao, JSON.stringify(dados));
      return { success: true };
    } catch (e) {
      if (e.message.includes('UNIQUE constraint failed')) {
        throw new Error('Já existe um template com este nome.');
      }
      throw e;
    }
  }

  function getTemplates() {
    return db.prepare(
      'SELECT id, nome, descricao, is_default FROM templates ORDER BY nome'
    ).all();
  }

  function getTemplate(id) {
    const tpl = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
    if (tpl) {
      try { tpl.dados = JSON.parse(tpl.dados_json); }
      catch (e) { console.error('Erro ao fazer parse do JSON do template:', e); tpl.dados = null; }
    }
    return tpl;
  }

  function deleteTemplate(id) {
    db.prepare('DELETE FROM templates WHERE id = ?').run(id);
  }

  return {
    getAllServicos,
    searchServicos,
    upsertServico,
    saveOrcamento,
    getOrcamentos,
    getOrcamento,
    deleteOrcamento,
    saveTemplate,
    getTemplates,
    getTemplate,
    deleteTemplate,
  };
};
