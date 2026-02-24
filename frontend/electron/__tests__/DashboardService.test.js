import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const dashboardService = require('../services/DashboardService');
const db = require('../db/database.cjs');
const kitRepo = require('../src/infrastructure/repositories/KitRepository');

describe('DashboardService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('should return metrics with aggregated database data', async () => {
        // Mock KitRepository instead of direct DB methods
        vi.spyOn(kitRepo, 'getStats').mockResolvedValue({
            materials: 100,
            kits: 50,
            servicos: 10
        });

        vi.spyOn(db, 'all').mockImplementation((query) => {
            if (query.includes('materiais')) {
                return [{ name: 'Poste', value: 10 }];
            }
            if (query.includes('tarefas_operacao')) {
                return [{ name: 'IM3', hh: 100 }];
            }
            return [];
        });

        const metrics = await dashboardService.getMetrics();

        expect(metrics).not.toBeNull();
        expect(metrics.summary.totalMaterials).toBe(100);
        expect(metrics.materialsByType).toHaveLength(1);
    });

    it('should handle database errors gracefully', async () => {
        vi.spyOn(kitRepo, 'getStats').mockRejectedValue(new Error('DB ERROR'));

        const metrics = await dashboardService.getMetrics();
        expect(metrics).toBeNull();
    });
});
