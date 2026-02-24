import { describe, it, expect, vi } from 'vitest';

const EngineeringService = require('../services/EngineeringService');

describe('EngineeringService', () => {
    it('delegate calls using injected mocks (Pareto 100%)', () => {
        // Direct injection for CJS interop reliability
        EngineeringService.MechanicalService = {
            calculateMechanicalStress: vi.fn(() => ({ stress_ratio: 0.8 }))
        };
        EngineeringService.ElectricalService = {
            calculateVoltageDrop: vi.fn(() => ({ drop_v: 2.5 }))
        };
        EngineeringService.SpatialService = {
            calculateSpatialDistance: vi.fn(() => 10.5),
            calculateConductorSag: vi.fn(() => ({ sag_m: 1.2 }))
        };
        EngineeringService.ComplianceService = {
            validateStructureCompatibility: vi.fn(() => ({ valid: true }))
        };

        const stress = EngineeringService.calculateMechanicalStress();
        expect(stress.stress_ratio).toBe(0.8);

        expect(EngineeringService.calculateVoltageDrop().drop_v).toBe(2.5);
    });
});
