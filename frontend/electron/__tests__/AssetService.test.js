import { describe, it, expect } from 'vitest';
const AssetService = require('../services/AssetService');

describe('AssetService', () => {
    it('should calculate health for a new asset correctly', () => {
        const result = AssetService.calculateAssetHealth({ installDate: new Date() });
        expect(result.healthScore).toBe(100);
        expect(result.status).toBe('GOOD');
    });

    it('should decay health based on age', () => {
        // Mocking an asset that is 12.5 years old (50% of 25 year lifecycle)
        const date = new Date();
        date.setFullYear(date.getFullYear() - 12);
        date.setMonth(date.getMonth() - 6);

        const result = AssetService.calculateAssetHealth({ installDate: date.toISOString(), type: 'Pole' });
        expect(result.healthScore).toBeCloseTo(50, 0);
        expect(result.risk).toBe('MEDIUM');
    });

    it('should apply condition penalty correctly', () => {
        const result = AssetService.calculateAssetHealth({
            installDate: new Date().toISOString(),
            conditionRatio: 0.5
        });
        expect(result.healthScore).toBe(50);
        expect(result.status).toBe('WARNING');
    });

    it('should assess project-wide risk', () => {
        const assets = [
            { installDate: new Date().toISOString() }, // Good
            { installDate: '2000-01-01', type: 'Pole' } // Critical (26 years old)
        ];
        const result = AssetService.assessProjectRisk(assets);
        expect(result.criticalCount).toBe(1);
        expect(result.overallRisk).toBe('MEDIUM'); // (100 + 0) / 2 = 50
    });
});
