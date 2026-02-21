'use strict';
/**
 * CQT Light — Módulo de Sufixos e Templates Manuais de Kit
 * Responsabilidade: resolução contextual de códigos parciais e templates manuais.
 */

/**
 * @param {import('better-sqlite3').Database} db
 */
module.exports = function createSufixosModule(db) {
  // ========== SUFIXOS CONTEXTUAIS ==========

  /**
   * Resolve um código parcial (ex: 'F-10/', 'M1/') para código completo com base no contexto.
   * @param {string} prefixo - Código parcial com '/' no final
   * @param {string} tipoContexto - 'poste' ou 'condutor'
   * @param {string} valorContexto - ex: '11600B' ou 'CAA 1/0'
   * @returns {string|null} Código completo ou null
   */
  function resolverSufixo(prefixo, tipoContexto, valorContexto) {
    const result = db.prepare(`
      SELECT codigo_completo, prefixo || sufixo as resolved
      FROM sufixos_contextuais
      WHERE prefixo = ? AND tipo_contexto = ? AND valor_contexto = ?
    `).get(prefixo, tipoContexto, valorContexto);

    return result ? (result.codigo_completo || result.resolved) : null;
  }

  function upsertSufixo(prefixo, tipoContexto, valorContexto, sufixo) {
    const codigoCompleto = prefixo + sufixo;
    db.prepare(`
      INSERT INTO sufixos_contextuais (prefixo, tipo_contexto, valor_contexto, sufixo, codigo_completo)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(prefixo, tipo_contexto, valor_contexto) DO UPDATE SET
        sufixo = excluded.sufixo,
        codigo_completo = excluded.codigo_completo
    `).run(prefixo, tipoContexto, valorContexto, sufixo, codigoCompleto);
  }

  function getSufixosByPrefixo(prefixo) {
    return db.prepare(
      'SELECT * FROM sufixos_contextuais WHERE prefixo = ? ORDER BY valor_contexto'
    ).all(prefixo);
  }

  function getSufixosByContexto(tipoContexto, valorContexto) {
    return db.prepare(`
      SELECT * FROM sufixos_contextuais
      WHERE tipo_contexto = ? AND valor_contexto = ?
    `).all(tipoContexto, valorContexto);
  }

  function getAllSufixos() {
    return db.prepare('SELECT * FROM sufixos_contextuais').all();
  }

  // ========== TEMPLATES KIT MANUAL ==========

  function saveTemplateManual(templateData) {
    const { nome_template, kit_base, materiais, observacao } = templateData;
    const p_nome = nome_template || null;
    const p_base = kit_base || null;
    const p_materiais = JSON.stringify(materiais || []);
    const p_obs = observacao || null;

    if (!p_nome) throw new Error('Nome do template é obrigatório');

    db.prepare(`
      INSERT INTO templates_kit_manual (nome_template, kit_base, materiais_json, observacao)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(nome_template) DO UPDATE SET
        kit_base = excluded.kit_base,
        materiais_json = excluded.materiais_json,
        observacao = excluded.observacao
    `).run(p_nome, p_base, p_materiais, p_obs);
    return { success: true };
  }

  function deleteTemplateManual(nome_template) {
    db.prepare('DELETE FROM templates_kit_manual WHERE nome_template = ?').run(nome_template);
    return { success: true };
  }

  function getTemplateManual(nomeTemplate) {
    const tpl = db.prepare(
      'SELECT * FROM templates_kit_manual WHERE nome_template = ?'
    ).get(nomeTemplate);
    if (tpl) {
      try { tpl.materiais = JSON.parse(tpl.materiais_json); }
      catch (e) { console.error('Erro parse template manual', e); tpl.materiais = []; }
    }
    return tpl;
  }

  function getAllTemplatesManuais() {
    const templates = db.prepare(
      'SELECT * FROM templates_kit_manual ORDER BY nome_template'
    ).all();
    return templates.map(t => {
      try {
        t.materiais = t.materiais_json ? JSON.parse(t.materiais_json) : [];
      } catch (e) {
        console.error(`Erro parse template ${t.nome_template}:`, e);
        t.materiais = [];
      }
      return t;
    });
  }

  return {
    resolverSufixo,
    upsertSufixo,
    getSufixosByPrefixo,
    getSufixosByContexto,
    getAllSufixos,
    saveTemplateManual,
    deleteTemplateManual,
    getTemplateManual,
    getAllTemplatesManuais,
  };
};
