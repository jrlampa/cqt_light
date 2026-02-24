import { describe, it, expect } from 'vitest';
const ReportService = require('../services/ReportService');

describe('ReportService', () => {
    describe('generateTechnicalMemorial', () => {
        it('should generate a structured markdown report', () => {
            const projectData = {
                structures: [
                    { id: 1, descricao_kit: 'CE3T', quantidade: 2 }
                ],
                materials: [
                    { sap: '1001', descricao: 'Poste 300', quantidade: 1 }
                ],
                engineeringReport: {
                    status: 'SAFE',
                    totalLoadDaN: 150,
                    capacityDaN: 300,
                    utilizationPercent: 50,
                    recommendation: 'Projeto Seguro.'
                },
                sagReport: {
                    status: 'SAFE',
                    sagM: 1.2,
                    clearanceM: 6.5
                },
                costData: {
                    totalMaterial: 1000,
                    totalServico: 500,
                    totalGeral: 1500
                }
            };

            const report = ReportService.generateTechnicalMemorial(projectData);

            expect(report).toContain('# MEMORIAL DESCRITIVO TÉCNICO');
            expect(report).toContain('✅ APROVADO');
            expect(report).toContain('Ponto 1: CE3T (2 un)');
            expect(report).toContain('150 daN');
            expect(report).toContain('R$ 1.500');
        });

        it('should handle missing engineering report gracefully', () => {
            const projectData = {
                structures: [],
                materials: [],
                costData: { totalMaterial: 0, totalServico: 0, totalGeral: 0 }
            };
            const report = ReportService.generateTechnicalMemorial(projectData);
            expect(report).toContain('pendente');
        });
    });
});
