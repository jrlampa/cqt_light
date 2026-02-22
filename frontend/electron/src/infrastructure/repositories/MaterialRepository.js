const db = require('../../../db/database.cjs');

class MaterialRepository {
  getAll() {
    return db.all('SELECT *, ciclo_manutencao_meses, vida_util_anos FROM materiais ORDER BY sap LIMIT 200');
  }

  search(query) {
    return db.all(`
      SELECT *, ciclo_manutencao_meses, vida_util_anos FROM materiais 
      WHERE sap LIKE ? OR descricao LIKE ?
      ORDER BY sap LIMIT 50
    `, [`%${query}%`, `%${query}%`]);
  }

  getPrices(codes) {
    if (!codes || codes.length === 0) return [];
    const placeholders = codes.map(() => '?').join(',');
    return db.all(`
      SELECT sap, descricao, unidade, preco_unitario, ciclo_manutencao_meses, vida_util_anos
      FROM materiais WHERE sap IN (${placeholders})
    `, codes);
  }

  upsert(m) {
    db.run(`
      INSERT INTO materiais (sap, descricao, unidade, preco_unitario, ciclo_manutencao_meses, vida_util_anos)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(sap) DO UPDATE SET
        descricao = excluded.descricao,
        unidade = excluded.unidade,
        preco_unitario = excluded.preco_unitario,
        ciclo_manutencao_meses = excluded.ciclo_manutencao_meses,
        vida_util_anos = excluded.vida_util_anos
    `, [m.sap, m.descricao, m.unidade || 'UN', m.preco_unitario || 0, m.ciclo_manutencao || 24, m.vida_util || 30]);
  }

  updatePrice(sap, price) {
    return db.run("UPDATE materiais SET preco_unitario = ? WHERE sap = ?", [price, sap]);
  }

  getZeroPrice() {
    return db.all("SELECT * FROM materiais WHERE preco_unitario = 0 OR preco_unitario IS NULL ORDER BY sap");
  }

  // Preços por Empresa
  getPrecoByEmpresa(empresaId, sap) {
    const preco = db.get(
      'SELECT preco_unitario FROM precos_empresa WHERE empresa_id = ? AND sap = ?',
      [empresaId, sap]
    );
    if (!preco) {
      const material = db.get('SELECT preco_unitario FROM materiais WHERE sap = ?', [sap]);
      return material ? material.preco_unitario : 0;
    }
    return preco.preco_unitario;
  }

  getAllPrecosByEmpresa(empresaId) {
    return db.all(`
      SELECT pe.sap, m.descricao, m.unidade, pe.preco_unitario, pe.data_atualizacao, pe.origem
      FROM precos_empresa pe
      LEFT JOIN materiais m ON pe.sap = m.sap
      WHERE pe.empresa_id = ?
      ORDER BY m.descricao
    `, [empresaId]);
  }

  setPrecoEmpresa(empresaId, sap, precoNovo, origem = 'manual') {
    const precoAnterior = this.getPrecoByEmpresa(empresaId, sap);
    db.run(`
      INSERT INTO precos_empresa (empresa_id, sap, preco_unitario, origem, data_atualizacao)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(empresa_id, sap) DO UPDATE SET
        preco_unitario = excluded.preco_unitario,
        origem = excluded.origem,
        data_atualizacao = CURRENT_TIMESTAMP
    `, [empresaId, sap, precoNovo, origem]);

    db.run(`
      INSERT INTO historico_precos (empresa_id, sap, preco_anterior, preco_novo, tipo_alteracao)
      VALUES (?, ?, ?, ?, ?)
    `, [empresaId, sap, precoAnterior, precoNovo, origem]);
  }
}

module.exports = new MaterialRepository();
