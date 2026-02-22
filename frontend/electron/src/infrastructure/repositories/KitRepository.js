const db = require('../../../db/database.cjs');

class KitRepository {
    getAll() {
        return db.all('SELECT * FROM kits ORDER BY codigo_kit');
    }

    search(query) {
        return db.all(`
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
        return db.get('SELECT * FROM kits WHERE codigo_kit = ?', [codigoKit]);
    }

    upsert(kit) {
        db.run(`
      INSERT INTO kits (codigo_kit, descricao_kit, codigo_servico, custo_servico)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(codigo_kit) DO UPDATE SET
        descricao_kit = excluded.descricao_kit,
        codigo_servico = excluded.codigo_servico,
        custo_servico = excluded.custo_servico
    `, [kit.codigoKit, kit.descricaoKit, kit.codigoServico || null, kit.custoServico || 0]);
    }

    delete(codigoKit) {
        db.run('DELETE FROM kit_composicao WHERE codigo_kit = ?', [codigoKit]);
        return db.run('DELETE FROM kits WHERE codigo_kit = ?', [codigoKit]);
    }

    getComposition(codigoKit) {
        return db.all(`
      SELECT kc.*, m.descricao, m.unidade, m.preco_unitario,
             (kc.quantidade * m.preco_unitario) as subtotal
      FROM kit_composicao kc
      LEFT JOIN materiais m ON kc.sap = m.sap
      WHERE kc.codigo_kit = ?
      ORDER BY m.descricao
    `, [codigoKit]);
    }

    addMaterial(codigoKit, sap, quantidade) {
        db.run(`
      INSERT INTO kit_composicao (codigo_kit, sap, quantidade)
      VALUES (?, ?, ?)
      ON CONFLICT(codigo_kit, sap) DO UPDATE SET quantidade = excluded.quantidade
    `, [codigoKit, sap, quantidade || 1]);
    }
}

module.exports = new KitRepository();
