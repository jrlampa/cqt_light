import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dashboardService = require('../services/DashboardService');
const db = require('../db/database.cjs');

describe('DashboardService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('should return metrics with aggregated database data', async () => {
        // Spy on the CJS instance methods
        vi.spyOn(db, 'getStats').mockResolvedValue({
            materials: 100,
            kits: 50,
            servicos: 10,
            total_value: 500000
        });

        vi.spyOn(db, 'rawQuery').mockImplementation((query) => {
            if (query.includes('materiais')) {
                return Promise.resolve([{ name: 'Poste', value: 10 }]);
            }
            if (query.includes('tarefas_operacao')) {
                return Promise.resolve([{ name: 'IM3', hh: 100 }]);
            }
            return Promise.resolve([]);
        });

        vi.spyOn(db, 'getAllGisAssets').mockReturnValue([]);

        const metrics = await dashboardService.getMetrics();

        expect(metrics).not.toBeNull();
        expect(metrics.summary.totalMaterials).toBe(100);
        expect(metrics.materialsByType).toHaveLength(1);
    });

    it('should return default/fallback data if queries return empty', async () => {
        vi.spyOn(db, 'getStats').mockResolvedValue({ materials: 100, kits: 50, servicos: 10, total_value: 500000 });
        vi.spyOn(db, 'rawQuery').mockResolvedValue([]);
        vi.spyOn(db, 'getAllGisAssets').mockReturnValue([]);

        const metrics = await dashboardService.getMetrics();
        expect(metrics.materialsByType).toHaveLength(4);
        expect(metrics.contractorPerformance).toHaveLength(4);
    });

    it('should handle database errors gracefully', async () => {
        vi.spyOn(db, 'getStats').mockRejectedValue(new Error('DB ERROR'));

        const metrics = await dashboardService.getMetrics();
        expect(metrics).toBeNull();
    });
});
