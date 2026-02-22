'use strict';
/**
 * CQT Light — Módulo de Materiais e Kits (banco SQLite)
 * Responsabilidade: CRUD de materiais, kits e composição de kits.
 */

/**
 * @param {import('better-sqlite3').Database} db
 */
module.exports = function createMaterialsKitsModule(db) {
  // ========== MATERIAIS ==========

  function getAllMaterials() {
    return db.prepare('SELECT * FROM materiais ORDER BY sap LIMIT 200').all();
  }

  function searchMaterials(query) {
    return db.prepare(`
      SELECT * FROM materiais
      WHERE sap LIKE ? OR descricao LIKE ?
      ORDER BY sap LIMIT 50
    `).all(`%${query}%`, `%${query}%`);
  }

  function getMaterialsPrices(codes) {
    if (!codes || codes.length === 0) return [];
    const placeholders = codes.map(() => '?').join(',');
    return db.prepare(`
      SELECT sap, descricao, unidade, preco_unitario
      FROM materiais WHERE sap IN (${placeholders})
    `).all(codes);
  }

  function upsertMaterial(sap, descricao, unidade, preco_unitario) {
    db.prepare(`
      INSERT INTO materiais (sap, descricao, unidade, preco_unitario)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(sap) DO UPDATE SET
        descricao = excluded.descricao,
        unidade = excluded.unidade,
        preco_unitario = excluded.preco_unitario
    `).run(sap, descricao, unidade || 'UN', preco_unitario || 0);
  }

  function getZeroPriceMaterials() {
    return db.prepare(
      'SELECT * FROM materiais WHERE preco_unitario = 0 OR preco_unitario IS NULL ORDER BY sap'
    ).all();
  }

  function updateMaterialPrice(sap, price) {
    return db.prepare('UPDATE materiais SET preco_unitario = ? WHERE sap = ?').run(price, sap);
  }

  // ========== KITS ==========

  function getAllKits() {
    return db.prepare('SELECT * FROM kits ORDER BY codigo_kit').all();
  }

  function searchKits(query) {
    return db.prepare(`
      SELECT codigo_kit, descricao_kit, custo_servico, 'padrao' as tipo, NULL as materiais_json
      FROM kits
      WHERE codigo_kit LIKE ? OR descricao_kit LIKE ?
      UNION ALL
      SELECT nome_template as codigo_kit, observacao as descricao_kit, 0 as custo_servico, 'manual' as tipo, materiais_json
      FROM templates_kit_manual
      WHERE nome_template LIKE ? OR observacao LIKE ?
      ORDER BY codigo_kit LIMIT 30
    `).all(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
  }

  function getKit(codigoKit) {
    return db.prepare('SELECT * FROM kits WHERE codigo_kit = ?').get(codigoKit);
  }

  function upsertKit(codigoKit, descricaoKit, codigoServico = null, custoServico = 0) {
    db.prepare(`
      INSERT INTO kits (codigo_kit, descricao_kit, codigo_servico, custo_servico)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(codigo_kit) DO UPDATE SET
        descricao_kit = excluded.descricao_kit,
        codigo_servico = excluded.codigo_servico,
        custo_servico = excluded.custo_servico
    `).run(codigoKit, descricaoKit, codigoServico, custoServico);
  }

  function createKit(codigoKit, descricaoKit) {
    db.prepare(`
      INSERT INTO kits (codigo_kit, descricao_kit, codigo_servico, custo_servico)
      VALUES (?, ?, NULL, 0)
    `).run(codigoKit, descricaoKit);
    return getKit(codigoKit);
  }

  function updateKitMetadata(codigoKit, descricaoKit) {
    return db.prepare('UPDATE kits SET descricao_kit = ? WHERE codigo_kit = ?').run(descricaoKit, codigoKit);
  }

  function deleteKit(codigoKit) {
    db.prepare('DELETE FROM kit_composicao WHERE codigo_kit = ?').run(codigoKit);
    return db.prepare('DELETE FROM kits WHERE codigo_kit = ?').run(codigoKit);
  }

  // ========== KIT COMPOSIÇÃO ==========

  function getKitComposition(codigoKit) {
    return db.prepare(`
      SELECT kc.*, m.descricao, m.unidade, m.preco_unitario,
             (kc.quantidade * m.preco_unitario) as subtotal
      FROM kit_composicao kc
      LEFT JOIN materiais m ON kc.sap = m.sap
      WHERE kc.codigo_kit = ?
      ORDER BY m.descricao
    `).all(codigoKit);
  }

  function addMaterialToKit(codigoKit, sap, quantidade) {
    db.prepare(`
      INSERT INTO kit_composicao (codigo_kit, sap, quantidade)
      VALUES (?, ?, ?)
      ON CONFLICT(codigo_kit, sap) DO UPDATE SET quantidade = excluded.quantidade
    `).run(codigoKit, sap, quantidade || 1);
  }

  function updateKitMaterialQty(id, quantidade) {
    return db.prepare('UPDATE kit_composicao SET quantidade = ? WHERE id = ?').run(quantidade, id);
  }

  function removeMaterialFromKit(id) {
    return db.prepare('DELETE FROM kit_composicao WHERE id = ?').run(id);
  }

  function updateServiceCostForAllKits(amount) {
    return db.prepare('UPDATE kits SET custo_servico = ?').run(amount);
  }

  return {
    getAllMaterials,
    searchMaterials,
    getMaterialsPrices,
    upsertMaterial,
    getZeroPriceMaterials,
    updateMaterialPrice,
    getAllKits,
    searchKits,
    getKit,
    upsertKit,
    createKit,
    updateKitMetadata,
    deleteKit,
    getKitComposition,
    addMaterialToKit,
    updateKitMaterialQty,
    removeMaterialFromKit,
    updateServiceCostForAllKits,
  };
};
