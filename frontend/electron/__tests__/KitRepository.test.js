import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const kitRepo = require('../src/infrastructure/repositories/KitRepository');
const db = require('../db/database.cjs');

describe('KitRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    it('should get all kits', () => {
        vi.spyOn(db, 'all').mockReturnValue([]);
        kitRepo.getAll();
        expect(db.all).toHaveBeenCalled();
    });

    it('should search kits', () => {
        vi.spyOn(db, 'all').mockReturnValue([]);
        kitRepo.search('test');
        expect(db.all).toHaveBeenCalled();
    });

    it('should get kit by code', () => {
        vi.spyOn(db, 'get').mockReturnValue({ codigo_kit: 'K1' });
        kitRepo.get('K1');
        expect(db.get).toHaveBeenCalledWith(expect.any(String), ['K1']);
    });

    it('should upsert kit', () => {
        vi.spyOn(db, 'run').mockReturnValue({ changes: 1 });
        kitRepo.upsert({ codigoKit: 'K1', descricaoKit: 'D1' });
        expect(db.run).toHaveBeenCalled();
    });

    it('should delete kit', () => {
        vi.spyOn(db, 'run').mockReturnValue({ changes: 1 });
        kitRepo.delete('K1');
        expect(db.run).toHaveBeenCalledTimes(2);
    });

    it('should get kit composition', () => {
        vi.spyOn(db, 'all').mockReturnValue([]);
        kitRepo.getComposition('KIT01');
        expect(db.all).toHaveBeenCalledWith(expect.stringContaining('FROM kit_composicao'), ['KIT01']);
    });

    it('should add material to kit', () => {
        vi.spyOn(db, 'run').mockReturnValue({ changes: 1 });
        kitRepo.addMaterial('K1', 'S1', 10);
        expect(db.run).toHaveBeenCalled();
    });

    it('should calculate total cost', () => {
        vi.spyOn(db, 'all').mockImplementation((query) => {
            if (query.includes('materiais')) {
                return [{
                    codigo_kit: 'KIT01',
                    sap: 'S1',
                    descricao: 'M1',
                    unidade: 'UN',
                    preco_unitario: 10,
                    quantidade: 10
                }];
            }
            if (query.includes('kits')) {
                return [{
                    codigo_kit: 'KIT01',
                    descricao_kit: 'D1',
                    codigo_servico: 'S1',
                    custo_servico: 50
                }];
            }
            return [];
        });

        const result = kitRepo.getCustoTotal(['KIT01']);
        expect(result.totalGeral).toBe(150);
        expect(result.totalMaterial).toBe(100);
        expect(result.totalServico).toBe(50);
    });

    it('should return default cost for empty input', () => {
        const result = kitRepo.getCustoTotal([]);
        expect(result.totalGeral).toBe(0);
        expect(result.materiais).toEqual([]);
    });

    it('should return stats', () => {
        vi.spyOn(db, 'get').mockReturnValue({ count: 10 });
        const stats = kitRepo.getStats();
        expect(stats.materials).toBe(10);
        expect(stats.kits).toBe(10);
        expect(stats.budgets).toBe(10);
    });
});
