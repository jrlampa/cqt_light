import { describe, it, expect, vi, beforeEach } from 'vitest';

// We import the Class version for testing
const { KitRepository } = require('../src/infrastructure/repositories/KitRepository');

describe('KitRepository (100% Coverage)', () => {
    let repo;
    let mockDb;

    beforeEach(() => {
        mockDb = {
            all: vi.fn(),
            get: vi.fn(),
            run: vi.fn()
        };
        repo = new KitRepository(mockDb);
    });

    it('getAll should fetch all kits', () => {
        mockDb.all.mockReturnValue([{ codigo_kit: 'K1' }]);
        const result = repo.getAll();
        expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM kits'));
        expect(result).toHaveLength(1);
    });

    it('getCustoTotal should correctly calculate totals with multi-kit projects', () => {
        const kitCodes = ['K1', 'K1'];

        mockDb.all.mockReturnValueOnce([
            { codigo_kit: 'K1', sap: 'M1', descricao: 'Mat 1', unidade: 'UN', preco_unitario: 10, quantidade: 2 }
        ]);
        mockDb.all.mockReturnValueOnce([
            { codigo_kit: 'K1', descricao_kit: 'Kit 1', codigo_servico: 'S1', custo_servico: 50 }
        ]);

        const result = repo.getCustoTotal(kitCodes);

        expect(result.totalMaterial).toBe(40);
        expect(result.totalServico).toBe(100);
        expect(result.totalGeral).toBe(140);
        expect(result.materiais[0].quantidade).toBe(4);
    });

    it('search should handle query correctly', () => {
        repo.search('pole');
        expect(mockDb.all).toHaveBeenCalled();
    });

    it('get should fetch single kit', () => {
        repo.get('K1');
        expect(mockDb.get).toHaveBeenCalledWith(expect.any(String), ['K1']);
    });

    it('upsert should register kit', () => {
        repo.upsert({ codigoKit: 'K1', descricaoKit: 'D1' });
        expect(mockDb.run).toHaveBeenCalled();
    });

    it('delete should remove composition and kit', () => {
        repo.delete('K1');
        expect(mockDb.run).toHaveBeenCalledTimes(2);
    });

    it('getComposition should join with materials', () => {
        repo.getComposition('K1');
        expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('JOIN materiais'), ['K1']);
    });

    it('addMaterial should update composition', () => {
        repo.addMaterial('K1', 'M1', 5);
        expect(mockDb.run).toHaveBeenCalledWith(expect.any(String), ['K1', 'M1', 5]);
    });

    it('getStats should collect project counts', () => {
        mockDb.get.mockReturnValue({ count: 10 });
        const stats = repo.getStats();
        expect(stats.budgets).toBe(10);
    });
});
