import { describe, it, expect } from 'vitest';
const EngineeringService = require('../services/EngineeringService');

describe('EngineeringService - Cycle 28', () => {
    it('should identify MT/BT coexistence alert', () => {
        const structures = [{ codigo_kit: 'N1' }, { codigo_kit: 'B1' }];
        const result = EngineeringService.validateStructureCompatibility(structures);
        expect(result.status).toBe('SAFE');
        expect(result.alerts).toContainEqual(expect.objectContaining({ message: expect.stringContaining('separação mínima') }));
    });

    it('should flag Transformer without protection as CRITICAL', () => {
        const structures = [{ codigo_kit: 'TR-1' }];
        const result = EngineeringService.validateStructureCompatibility(structures);
        expect(result.status).toBe('CRITICAL');
        expect(result.alerts).toContainEqual(expect.objectContaining({ type: 'CRITICAL' }));
    });

    it('should calculate MH based on structures in BOMService', () => {
        const BOMService = require('../services/BOMService');
        const structures = [{ codigo_kit: 'TR-1' }, { codigo_kit: 'N1' }]; // 12 + 4 = 16 HH
        const hh = BOMService.estimateLaborHours(structures);
        expect(hh).toBe(16);
    });
});
