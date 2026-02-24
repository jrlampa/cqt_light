import { describe, it, expect, vi, beforeEach } from 'vitest';
const AnalyticsController = require('../src/interfaces/ipc/AnalyticsController');

describe('AnalyticsController (100% Coverage)', () => {
    let mockRepo;
    let mockLogger;

    beforeEach(() => {
        mockRepo = {
            getPrices: vi.fn().mockResolvedValue([
                { sap: 'M1', ciclo_manutencao_meses: 12, vida_util_anos: 20 }
            ])
        };
        mockLogger = {
            info: vi.fn(),
            error: vi.fn()
        };
        AnalyticsController.materialRepo = mockRepo;
        AnalyticsController.logger = mockLogger;
    });

    it('should calculate project analytics correctly', async () => {
        const projectData = {
            name: 'Test Project',
            poles: [{ sap: 'M1' }],
            metadata: { dxf_layers_count: 5 }
        };

        const result = await AnalyticsController.getProjectAnalytics(projectData);

        expect(result.summary.materialsCount).toBe(1);
        expect(result.bim.score).toBe(100);
        expect(result.dxf.score).toBe(50);
        expect(mockRepo.getPrices).toHaveBeenCalledWith(['M1']);
    });

    it('should handle missing metadata with defaults', async () => {
        mockRepo.getPrices.mockResolvedValue([]); // No metadata found
        const result = await AnalyticsController.getProjectAnalytics({ poles: [{ sap: 'UNKNOWN' }] });

        expect(result.bim.score).toBe(0);
        expect(result.summary.avgMaintenanceMonths).toBe(24);
    });

    it('should log and throw errors', async () => {
        mockRepo.getPrices.mockRejectedValue(new Error('DB Fail'));
        await expect(AnalyticsController.getProjectAnalytics({})).rejects.toThrow('DB Fail');
        expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should register its handler', () => {
        const handle = vi.fn();
        AnalyticsController.register(handle);
        expect(handle).toHaveBeenCalledWith('get-project-analytics', expect.any(Function));
    });
});
