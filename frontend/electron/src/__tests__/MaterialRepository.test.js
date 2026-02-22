import { describe, it, expect, vi, beforeEach } from 'vitest';
import MaterialRepository from '../infrastructure/repositories/MaterialRepository';

// Mock the database service
vi.mock('../../../db/database.cjs', () => ({
    all: vi.fn(),
    get: vi.fn(),
    run: vi.fn(),
}));

import db from '../../../db/database.cjs';

describe('MaterialRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getAll calls database correctly', () => {
        db.all.mockReturnValue([{ sap: '123', descricao: 'Test' }]);
        const result = MaterialRepository.getAll();
        expect(db.all).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM materiais'));
        expect(result).toHaveLength(1);
    });

    it('upsert calls run with correct parameters', () => {
        const material = { sap: 'SAP01', descricao: 'Desc', unidade: 'UN', preco_unitario: 10 };
        MaterialRepository.upsert(material);
        expect(db.run).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO materiais'),
            ['SAP01', 'Desc', 'UN', 10]
        );
    });

    it('getPrecoByEmpresa returns material price if empresa price missing', () => {
        db.get.mockReturnValueOnce(null) // empresa price missing
            .mockReturnValueOnce({ preco_unitario: 50 }); // base material price

        const price = MaterialRepository.getPrecoByEmpresa(1, 'SAP01');
        expect(price).toBe(50);
        expect(db.get).toHaveBeenCalledTimes(2);
    });
});
