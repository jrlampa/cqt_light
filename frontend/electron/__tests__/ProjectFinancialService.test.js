const { describe, it, expect } = require('vitest');
const ProjectFinancialService = require('../src/domain/services/ProjectFinancialService');

describe('ProjectFinancialService', () => {
    const mockMaterials = [
        { sap: 'PT-11-300', preco: 1000, quantidade: 1, descricao: 'POSTE' },
        { sap: 'TR-15', preco: 5000, quantidade: 1, descricao: 'TRANSFORMADOR' }
    ];

    const mockProjectData = {
        poles: [
            { sap: 'PT-11-300', trafo_kva: 15 }
        ]
    };

    it('should calculate correct executive summary totals', () => {
        const summary = ProjectFinancialService.calculateExecutiveSummary(mockMaterials, mockProjectData);

        // MAT: 1000 + 5000 = 6000
        // MO: 4.5*120 (Poste) + 12*120 (Trafo) = 540 + 1440 = 1980
        expect(summary.matTotal).toBe(6000);
        expect(summary.laborTotal).toBe(1980);
        expect(summary.totalCAPEX).toBe(7980);
    });

    it('should calculate correct cost per kVA', () => {
        const summary = ProjectFinancialService.calculateExecutiveSummary(mockMaterials, mockProjectData);
        // 7980 / 15 = 532
        expect(summary.costPerKVA).toBe(532);
        expect(summary.healthStatus).toBe('EXCELLENT');
    });

    it('should handle zero kVA gracefully', () => {
        const emptyProject = { poles: [] };
        const summary = ProjectFinancialService.calculateExecutiveSummary(mockMaterials, emptyProject);
        expect(summary.costPerKVA).toBe(0);
        expect(summary.healthStatus).toBe('NEUTRAL');
    });
});
