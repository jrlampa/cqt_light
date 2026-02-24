const db = require('../../../db/database.cjs');

class CompanyRepository {
    getAll() {
        return db.all('SELECT * FROM empresas ORDER BY nome');
    }

    getById(id) {
        return db.get('SELECT * FROM empresas WHERE id = ?', [id]);
    }

    create(nome, contrato, regional) {
        return db.run(
            'INSERT INTO empresas (nome, contrato, regional) VALUES (?, ?, ?)',
            [nome, contrato, regional]
        );
    }

    update(id, nome, contrato, regional) {
        return db.run(
            'UPDATE empresas SET nome = ?, contrato = ?, regional = ? WHERE id = ?',
            [nome, contrato, regional, id]
        );
    }

    delete(id) {
        return db.run('UPDATE empresas SET ativa = 0 WHERE id = ?', [id]);
    }

    getAtiva() {
        const configId = db.get('SELECT valor FROM configuracao WHERE chave = ?', ['empresa_ativa_id']);
        if (!configId) return null;
        return this.getById(parseInt(configId.valor));
    }

    setAtiva(id) {
        return db.run(
            'INSERT OR REPLACE INTO configuracao (chave, valor) VALUES (?, ?)',
            ['empresa_ativa_id', id.toString()]
        );
    }
}

module.exports = new CompanyRepository();
