import { describe, it, expect, vi, beforeEach } from 'vitest';
const { ProjectRepository } = require('../src/infrastructure/repositories/ProjectRepository');

describe('ProjectRepository (100% Coverage)', () => {
    let repo;
    let mockDb;

    beforeEach(() => {
        mockDb = {
            all: vi.fn(),
            get: vi.fn(),
            run: vi.fn()
        };
        repo = new ProjectRepository(mockDb);
    });

    it('should CRUD orcamentos', async () => {
        await repo.saveOrcamento('Test', 100, {});
        expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO orcamentos'), ['Test', 100, '{}']);

        mockDb.all.mockReturnValue([{ id: 1 }]);
        const all = await repo.getAllOrcamentos();
        expect(all).toHaveLength(1);

        await repo.getOrcamento(1);
        expect(mockDb.get).toHaveBeenCalledWith(expect.any(String), [1]);

        await repo.deleteOrcamento(1);
        expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('DELETE'), [1]);
    });

    it('should CRUD project templates', async () => {
        await repo.saveTemplate('T1', 'Desc', {});
        expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('templates_projeto'), ['T1', 'Desc', '{}']);

        await repo.getAllTemplates();
        expect(mockDb.all).toHaveBeenCalled();

        await repo.getTemplate(1);
        expect(mockDb.get).toHaveBeenCalled();

        await repo.deleteTemplate(1);
        expect(mockDb.run).toHaveBeenCalled();
    });

    it('should CRUD manual kit templates', async () => {
        await repo.saveTemplateManual({ nome_template: 'K1', materiais_json: [], observacao: '' });
        expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('templates_kit_manual'), ['K1', '[]', '']);

        await repo.getAllTemplatesManuais();
        expect(mockDb.all).toHaveBeenCalled();

        await repo.getTemplateManual('K1');
        expect(mockDb.get).toHaveBeenCalled();

        await repo.deleteTemplateManual('K1');
        expect(mockDb.run).toHaveBeenCalled();
    });
});
