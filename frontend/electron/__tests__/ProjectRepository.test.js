import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const projectRepo = require('../src/infrastructure/repositories/ProjectRepository');
const db = require('../db/database.cjs');

describe('ProjectRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should save budget', () => {
        vi.spyOn(db, 'run').mockReturnValue({ changes: 1 });
        projectRepo.saveOrcamento('Proj', 100, { items: [] });
        expect(db.run).toHaveBeenCalled();
    });

    it('should save template', () => {
        vi.spyOn(db, 'run').mockReturnValue({ changes: 1 });
        projectRepo.saveTemplate('T1', 'Desc', {});
        expect(db.run).toHaveBeenCalled();
    });

    it('should delete manual template', () => {
        vi.spyOn(db, 'run').mockReturnValue({ changes: 1 });
        projectRepo.deleteTemplateManual('Nome');
        expect(db.run).toHaveBeenCalled();
    });

    it('should get orcamento', () => {
        vi.spyOn(db, 'get').mockReturnValue({ id: 1 });
        projectRepo.getOrcamento(1);
        expect(db.get).toHaveBeenCalled();
    });

    it('should get all orcamentos', () => {
        vi.spyOn(db, 'all').mockReturnValue([]);
        projectRepo.getAllOrcamentos();
        expect(db.all).toHaveBeenCalled();
    });

    it('should delete orcamento', () => {
        vi.spyOn(db, 'run').mockReturnValue({ changes: 1 });
        projectRepo.deleteOrcamento(1);
        expect(db.run).toHaveBeenCalled();
    });

    it('should get all templates manuais', () => {
        vi.spyOn(db, 'all').mockReturnValue([]);
        projectRepo.getAllTemplatesManuais();
        expect(db.all).toHaveBeenCalled();
    });

    it('should save manual template', () => {
        vi.spyOn(db, 'run').mockReturnValue({ changes: 1 });
        projectRepo.saveTemplateManual({ nome: 'N', desc: 'D', items: [] });
        expect(db.run).toHaveBeenCalled();
    });

    it('should get all templates', () => {
        vi.spyOn(db, 'all').mockReturnValue([]);
        projectRepo.getAllTemplates();
        expect(db.all).toHaveBeenCalled();
    });

    it('should delete template', () => {
        vi.spyOn(db, 'run').mockReturnValue({ changes: 1 });
        projectRepo.deleteTemplate(1);
        expect(db.run).toHaveBeenCalled();
    });

    it('should get template by ID', () => {
        vi.spyOn(db, 'get').mockReturnValue({ id: 1 });
        projectRepo.getTemplate(1);
        expect(db.get).toHaveBeenCalled();
    });

    it('should get template manual by name', () => {
        vi.spyOn(db, 'get').mockReturnValue({ nome: 'N' });
        projectRepo.getTemplateManual('N');
        expect(db.get).toHaveBeenCalled();
    });
});
