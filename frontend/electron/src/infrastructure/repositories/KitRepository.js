const defaultDb = require('../../../db/database.cjs');

class KitRepository {
  constructor(db = defaultDb) {
    this.db = db;
  }

  getAll() {
    return this.db.all('SELECT * FROM kits ORDER BY codigo_kit');
  }

  search(query) {
    return this.db.all(`
      SELECT codigo_kit, descricao_kit, custo_servico, 'padrao' as tipo, NULL as materiais_json
      FROM kits 
      WHERE codigo_kit LIKE ? OR descricao_kit LIKE ?
      UNION ALL
      SELECT nome_template as codigo_kit, observacao as descricao_kit, 0 as custo_servico, 'manual' as tipo, materiais_json
      FROM templates_kit_manual
      WHERE nome_template LIKE ? OR observacao LIKE ?
      ORDER BY codigo_kit LIMIT 30
    `, [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]);
  }

  get(codigoKit) {
    return this.db.get('SELECT * FROM kits WHERE codigo_kit = ?', [codigoKit]);
  }

  upsert(kit) {
    this.db.run(`
      INSERT INTO kits (codigo_kit, descricao_kit, codigo_servico, custo_servico)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(codigo_kit) DO UPDATE SET
        descricao_kit = excluded.descricao_kit,
        codigo_servico = excluded.codigo_servico,
        custo_servico = excluded.custo_servico
    `, [kit.codigoKit, kit.descricaoKit, kit.codigoServico || null, kit.custoServico || 0]);
  }

  delete(codigoKit) {
    this.db.run('DELETE FROM kit_composicao WHERE codigo_kit = ?', [codigoKit]);
    return this.db.run('DELETE FROM kits WHERE codigo_kit = ?', [codigoKit]);
  }

  getComposition(codigoKit) {
    return this.db.all(`
      SELECT kc.*, m.descricao, m.unidade, m.preco_unitario,
             (kc.quantidade * m.preco_unitario) as subtotal
      FROM kit_composicao kc
      LEFT JOIN materiais m ON kc.sap = m.sap
      WHERE kc.codigo_kit = ?
      ORDER BY m.descricao
    `, [codigoKit]);
  }

  addMaterial(codigoKit, sap, quantidade) {
    this.db.run(`
      INSERT INTO kit_composicao (codigo_kit, sap, quantidade)
      VALUES (?, ?, ?)
      ON CONFLICT(codigo_kit, sap) DO UPDATE SET quantidade = excluded.quantidade
    `, [codigoKit, sap, quantidade || 1]);
  }

  getCustoTotal(kitCodes) {
    if (!kitCodes || kitCodes.length === 0) {
      return { materiais: [], totalMaterial: 0, totalServico: 0, totalGeral: 0 };
    }

    const kitCounts = {};
    const uniqueCodes = [];
    kitCodes.forEach(code => {
      if (!kitCounts[code]) {
        kitCounts[code] = 0;
        uniqueCodes.push(code);
      }
      kitCounts[code]++;
    });

    const placeholders = uniqueCodes.map(() => '?').join(',');

    const components = this.db.all(`
      SELECT kc.codigo_kit, kc.sap, m.descricao, m.unidade, m.preco_unitario, kc.quantidade
      FROM kit_composicao kc
      JOIN materiais m ON kc.sap = m.sap
      WHERE kc.codigo_kit IN (${placeholders})
    `, uniqueCodes);

    const materialsMap = {};
    components.forEach(c => {
      const multiplier = kitCounts[c.codigo_kit] || 1;
      const totalQty = c.quantidade * multiplier;

      if (!materialsMap[c.sap]) {
        materialsMap[c.sap] = {
          sap: c.sap,
          descricao: c.descricao,
          unidade: c.unidade,
          preco_unitario: c.preco_unitario,
          quantidade: 0,
          subtotal: 0
        };
      }
      materialsMap[c.sap].quantidade += totalQty;
      materialsMap[c.sap].subtotal += totalQty * c.preco_unitario;
    });

    const materiais = Object.values(materialsMap).sort((a, b) => a.descricao.localeCompare(b.descricao));

    const servicosRaw = this.db.all(`
      SELECT codigo_kit, descricao_kit, codigo_servico, custo_servico
      FROM kits WHERE codigo_kit IN (${placeholders})
    `, uniqueCodes);

    const servicos = [];
    let totalServico = 0;

    servicosRaw.forEach(s => {
      const count = kitCounts[s.codigo_kit] || 1;
      totalServico += (s.custo_servico || 0) * count;
      servicos.push({ ...s, quantidade: count });
    });

    const totalMaterial = materiais.reduce((sum, m) => sum + (m.subtotal || 0), 0);

    return {
      materiais,
      servicos,
      totalMaterial,
      totalServico,
      totalGeral: totalMaterial + totalServico
    };
  }

  getStats() {
    const mats = this.db.get('SELECT COUNT(*) as count FROM materiais');
    const kits = this.db.get('SELECT COUNT(*) as count FROM kits');
    const budgets = this.db.get('SELECT COUNT(*) as count FROM orcamentos');
    return {
      materials: mats?.count || 0,
      kits: kits?.count || 0,
      budgets: budgets?.count || 0
    };
  }
}

module.exports = new KitRepository();
// Export the class for testing
module.exports.KitRepository = KitRepository;
