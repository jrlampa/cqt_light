const db = require('../../../db/database.cjs');

class ProjectRepository {
    // ========== ORÇAMENTOS (Budget History) ==========
    saveOrcamento(nome, total, dados) {
        return db.run(
            'INSERT INTO orcamentos (nome, data, total, dados_json) VALUES (?, CURRENT_TIMESTAMP, ?, ?)',
            [nome, total, JSON.stringify(dados)]
        );
    }

    getAllOrcamentos() {
        return db.all('SELECT id, nome, data, total FROM orcamentos ORDER BY data DESC');
    }

    getOrcamento(id) {
        return db.get('SELECT * FROM orcamentos WHERE id = ?', [id]);
    }

    deleteOrcamento(id) {
        return db.run('DELETE FROM orcamentos WHERE id = ?', [id]);
    }

    // ========== TEMPLATES (Project Templates) ==========
    saveTemplate(nome, descricao, dados) {
        return db.run(
            'INSERT INTO templates_projeto (nome, descricao, data_criacao, dados_json) VALUES (?, ?, CURRENT_TIMESTAMP, ?)',
            [nome, descricao, JSON.stringify(dados)]
        );
    }

    getAllTemplates() {
        return db.all('SELECT id, nome, descricao, data_criacao FROM templates_projeto ORDER BY nome');
    }

    getTemplate(id) {
        return db.get('SELECT * FROM templates_projeto WHERE id = ?', [id]);
    }

    deleteTemplate(id) {
        return db.run('DELETE FROM templates_projeto WHERE id = ?', [id]);
    }

    // ========== MANUAL TEMPLATES (Kit Templates) ==========
    saveTemplateManual(data) {
        return db.run(`
            INSERT INTO templates_kit_manual (nome_template, materiais_json, observacao)
            VALUES (?, ?, ?)
            ON CONFLICT(nome_template) DO UPDATE SET
                materiais_json = excluded.materiais_json,
                observacao = excluded.observacao
        `, [data.nome_template, JSON.stringify(data.materiais_json), data.observacao]);
    }

    getAllTemplatesManuais() {
        return db.all('SELECT * FROM templates_kit_manual ORDER BY nome_template');
    }

    getTemplateManual(nome) {
        return db.get('SELECT * FROM templates_kit_manual WHERE nome_template = ?', [nome]);
    }

    deleteTemplateManual(nome) {
        return db.run('DELETE FROM templates_kit_manual WHERE nome_template = ?', [nome]);
    }
}

module.exports = new ProjectRepository();
