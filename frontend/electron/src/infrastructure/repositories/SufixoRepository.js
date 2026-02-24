const db = require('../../../db/database.cjs');

class SufixoRepository {
    resolverSufixo(prefixo, tipoContexto, valorContexto) {
        // First, check for specific context override
        const specific = db.get(`
            SELECT sufixo FROM sufixos_materiais 
            WHERE prefixo_material = ? AND tipo_contexto = ? AND valor_contexto = ?
        `, [prefixo, tipoContexto, valorContexto]);

        if (specific) return specific.sufixo;

        // Fallback to default for this prefix
        const def = db.get(`
            SELECT sufixo FROM sufixos_materiais 
            WHERE prefixo_material = ? AND tipo_contexto = 'DEFAULT'
        `, [prefixo]);

        return def ? def.sufixo : '';
    }

    upsertSufixo(prefixo, tipoContexto, valorContexto, sufixo) {
        return db.run(`
            INSERT INTO sufixos_materiais (prefixo_material, tipo_contexto, valor_contexto, sufixo)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(prefixo_material, tipo_contexto, valor_contexto) DO UPDATE SET sufixo = excluded.sufixo
        `, [prefixo, tipoContexto, valorContexto, sufixo]);
    }

    getByPrefixo(prefixo) {
        return db.all('SELECT * FROM sufixos_materiais WHERE prefixo_material = ?', [prefixo]);
    }

    getByContexto(tipoContexto, valorContexto) {
        return db.all('SELECT * FROM sufixos_materiais WHERE tipo_contexto = ? AND valor_contexto = ?', [tipoContexto, valorContexto]);
    }

    getAll() {
        return db.all('SELECT * FROM sufixos_materiais ORDER BY prefixo_material');
    }
}

module.exports = new SufixoRepository();
