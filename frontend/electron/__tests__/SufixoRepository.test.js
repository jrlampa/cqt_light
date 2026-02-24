import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const sufixoRepo = require('../src/infrastructure/repositories/SufixoRepository');
const db = require('../db/database.cjs');

describe('SufixoRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    it('should resolve specific sufixo', () => {
        vi.spyOn(db, 'get').mockReturnValue({ sufixo: 'SPEC' });
        const result = sufixoRepo.resolverSufixo('P', 'T', 'V');
        expect(result).toBe('SPEC');
    });

    it('should resolve default sufixo if specific not found', () => {
        vi.spyOn(db, 'get')
            .mockReturnValueOnce(null) // Specific not found
            .mockReturnValueOnce({ sufixo: 'DEF' }); // Default found

        const result = sufixoRepo.resolverSufixo('P', 'T', 'V');
        expect(result).toBe('DEF');
    });

    it('should return empty string if nothing found', () => {
        vi.spyOn(db, 'get').mockReturnValue(null);
        const result = sufixoRepo.resolverSufixo('P', 'T', 'V');
        expect(result).toBe('');
    });

    it('should upsert sufixo', () => {
        vi.spyOn(db, 'run').mockReturnValue({ changes: 1 });
        sufixoRepo.upsertSufixo('P', 'T', 'V', 'S');
        expect(db.run).toHaveBeenCalled();
    });

    it('should get by prefixo', () => {
        vi.spyOn(db, 'all').mockReturnValue([]);
        sufixoRepo.getByPrefixo('P');
        expect(db.all).toHaveBeenCalled();
    });

    it('should get all sufixos', () => {
        vi.spyOn(db, 'all').mockReturnValue([]);
        sufixoRepo.getAll();
        expect(db.all).toHaveBeenCalled();
    });

    it('should get by contexto', () => {
        vi.spyOn(db, 'all').mockReturnValue([]);
        sufixoRepo.getByContexto('T', 'V');
        expect(db.all).toHaveBeenCalled();
    });
});
