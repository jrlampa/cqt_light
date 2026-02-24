import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const materialRepo = require('../src/infrastructure/repositories/MaterialRepository');
const db = require('../db/database.cjs');

describe('MaterialRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    it('should get all materials', () => {
        const mockData = [{ sap: '123', descricao: 'Material 1' }];
        vi.spyOn(db, 'all').mockReturnValue(mockData);
        const result = materialRepo.getAll();
        expect(result).toEqual(mockData);
    });

    it('should get prices for multiple codes', () => {
        vi.spyOn(db, 'all').mockReturnValue([]);
        materialRepo.getPrices(['123', '456']);
        expect(db.all).toHaveBeenCalled();
    });

    it('should update price', () => {
        vi.spyOn(db, 'run').mockReturnValue({ changes: 1 });
        materialRepo.updatePrice('123', 50);
        expect(db.run).toHaveBeenCalled();
    });

    it('should get zero price materials', () => {
        vi.spyOn(db, 'all').mockReturnValue([]);
        materialRepo.getZeroPrice();
        expect(db.all).toHaveBeenCalled();
    });

    it('should get price history', () => {
        vi.spyOn(db, 'all').mockReturnValue([]);
        materialRepo.getHistoricoPrecos(1);
        expect(db.all).toHaveBeenCalled();
    });

    it('should search materials', () => {
        const spy = vi.spyOn(db, 'all').mockReturnValue([]);
        materialRepo.search('query');
        expect(spy).toHaveBeenCalled();
    });

    it('should upsert material', () => {
        const spy = vi.spyOn(db, 'run').mockReturnValue({ changes: 1 });
        materialRepo.upsert({ sap: '123', descricao: 'Desc', unidade: 'UN', preco_unitario: 10 });
        expect(spy).toHaveBeenCalled();
    });

    it('should set company price', () => {
        vi.spyOn(db, 'get').mockReturnValue({ preco_unitario: 5 });
        const spyRun = vi.spyOn(db, 'run').mockReturnValue({ changes: 1 });

        materialRepo.setPrecoEmpresa(1, '123', 15, 'manual');

        expect(spyRun).toHaveBeenCalled();
    });

    it('should perform bulk adjustment', () => {
        vi.spyOn(db, 'all').mockReturnValue([{ sap: '123', preco_unitario: 100 }]);
        const spyRun = vi.spyOn(db, 'run').mockReturnValue({ changes: 1 });

        const count = materialRepo.reajusteEmMassa(1, 10);

        expect(count).toBe(1);
        expect(spyRun).toHaveBeenCalled();
    });
});
