const projectRepo = require('../../infrastructure/repositories/ProjectRepository');

/**
 * ProjectController
 * Handles IPC communication for Budgets (Orçamentos) and Project Templates.
 */
class ProjectController {
    static register(handle) {
        // Budgets
        handle('save-orcamento', (_, { nome, total, dados }) => projectRepo.saveOrcamento(nome, total, dados));
        handle('get-orcamentos', () => projectRepo.getAllOrcamentos());
        handle('get-orcamento', (_, id) => projectRepo.getOrcamento(id));
        handle('delete-orcamento', (_, id) => projectRepo.deleteOrcamento(id));

        // Project Templates
        handle('save-template', (_, { nome, descricao, dados }) => projectRepo.saveTemplate(nome, descricao, dados));
        handle('get-templates', () => projectRepo.getAllTemplates());
        handle('get-template', (_, id) => projectRepo.getTemplate(id));
        handle('delete-template', (_, id) => projectRepo.deleteTemplate(id));

        // Manual Kit Templates
        handle('save-template-manual', (_, data) => projectRepo.saveTemplateManual(data));
        handle('get-template-manual', (_, nome) => projectRepo.getTemplateManual(nome));
        handle('get-all-templates-manuais', () => projectRepo.getAllTemplatesManuais());
        handle('delete-template-manual', (_, nome) => projectRepo.deleteTemplateManual(nome));
    }
}

module.exports = ProjectController;
