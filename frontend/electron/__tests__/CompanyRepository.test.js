import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const companyRepo = require('../src/infrastructure/repositories/CompanyRepository');
const db = require('../db/database.cjs');

describe('CompanyRepository', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('should get all companies', () => {
        vi.spyOn(db, 'all').mockReturnValue([]);
        companyRepo.getAll();
        expect(db.all).toHaveBeenCalled();
    });

    it('should create company', () => {
        vi.spyOn(db, 'run').mockReturnValue({ lastInsertRowid: 1 });
        companyRepo.create('IM3', 'CONT-001', 'Regional Norte');
        expect(db.run).toHaveBeenCalled();
    });

    it('should set active company', () => {
        vi.spyOn(db, 'run').mockReturnValue({ changes: 1 });
        companyRepo.setAtiva(1);
        expect(db.run).toHaveBeenCalledTimes(1);
    });

    it('should get active company', () => {
        vi.spyOn(db, 'get').mockReturnValue({ id: 1, nome: 'IM3' });
        const company = companyRepo.getAtiva();
        expect(company.id).toBe(1);
    });
});
