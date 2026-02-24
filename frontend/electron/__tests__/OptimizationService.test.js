import { vi, describe, it, expect, beforeEach } from 'vitest';

// Require the real singleton
const db = require('../db/database.cjs');
const OptimizationService = require('../services/OptimizationService');

describe('OptimizationService', () => {
    beforeEach(() => {
        // Manually patch methods on the singleton
        db.getMaterialAlternatives = vi.fn();
        db.getRegionalPrice = vi.fn();
        vi.clearAllMocks();
    });

    describe('findCostSavings', () => {
        it('should return suggestions when cheaper alternatives exist', async () => {
            const materials = [{ sap: 'SAP-1', descricao: 'PORCELANA', quantidade: 1 }];

            // Setup mock responses on the patched methods
            db.getMaterialAlternatives.mockReturnValue([
                { alternative_sap: 'SAP-ALT', alternative_desc: 'POLIMERICO', notes: 'Better' }
            ]);
            db.getRegionalPrice.mockImplementation((sap, zone) => {
                if (zone === 'Rural') return sap === 'SAP-1' ? 120 : 90;
                return sap === 'SAP-1' ? 100 : 80;
            });

            const suggestions = await OptimizationService.findCostSavings(materials, 'Rural');

            expect(suggestions.length).toBe(1);
            expect(suggestions[0].suggested_sap).toBe('SAP-ALT');
            expect(suggestions[0].savings_percent).toBe(25.0); // (1 - 90/120) * 100
        });

        it('should trigger volume discount heuristic', async () => {
            const materials = [{ sap: 'SAP-2', descricao: 'ISOLADOR', quantidade: 15 }];
            db.getMaterialAlternatives.mockReturnValue([]);

            const suggestions = await OptimizationService.findCostSavings(materials, 'Urbano');
            expect(suggestions.some(s => s.reason.includes('volume'))).toBe(true);
        });
    });

    describe('suggestEngineeringFix', () => {
        it('should suggest a stronger pole if overloaded', () => {
            const violation = { status: 'CRITICAL', totalLoadDaN: 550, capacityDaN: 300 };
            const fix = OptimizationService.suggestEngineeringFix(violation);
            expect(fix.action).toBe('SWAP_POLE');
            expect(fix.target_strength).toBe(900);
        });
    });
});
