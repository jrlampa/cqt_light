import { describe, it, expect, vi } from 'vitest';
const BOMService = require('../services/BOMService');

describe('BOMService', () => {
    const mockMaterials = [
        { sap: 'S-POSTE', descricao: 'POSTE CONCRETO DT 11/300', quantidade: 1, preco_unitario: 1000 },
        { sap: 'S-CABO', descricao: 'CABO ALUMINIO 35MM', quantidade: 100, preco_unitario: 5 },
        { sap: 'S-PARAFUSO', descricao: 'PARAFUSO M16', quantidade: 10, preco_unitario: 2 },
        { sap: 'S-ISOLADOR', descricao: 'ISOLADOR POLIMERICO', quantidade: 3, preco_unitario: 50 },
        { sap: 'S-MO', descricao: 'MAO DE OBRA N1', quantidade: 1, preco_unitario: 500 }
    ];

    it('should categorize materials correctly', () => {
        const result = BOMService.rationalizeBOM(mockMaterials);
        expect(result.categories['POSTES']).toHaveLength(1);
        expect(result.categories['CABOS']).toHaveLength(1);
        expect(result.categories['ACESSÓRIOS']).toHaveLength(1);
        expect(result.categories['ISOLADORES']).toHaveLength(1);
        expect(result.categories['SERVIÇOS']).toHaveLength(1);
    });

    it('should apply smart rounding (technical slack)', () => {
        const result = BOMService.rationalizeBOM(mockMaterials);

        // Cabos: 100 * 1.03 = 103
        const cabo = result.categories['CABOS'][0];
        expect(cabo.quantidade_ajustada).toBe(103);

        // Acessórios: 10 * 1.05 = 10.5 -> Ceil -> 11
        const parafuso = result.categories['ACESSÓRIOS'][0];
        expect(parafuso.quantidade_ajustada).toBe(11);

        // Serviços: No slack. 1 * 1 = 1
        const servico = result.categories['SERVIÇOS'][0];
        expect(servico.quantidade_ajustada).toBe(1);
    });

    it('should calculate grand totals correctly (including logistics)', () => {
        const result = BOMService.rationalizeBOM(mockMaterials);
        // Subtotal: 2187
        // Weight: ~1048kg -> Freight: ~262
        // Total: 2187 + 262 = 2449
        expect(result.grandTotal).toBe(2449);
        expect(result.analytics.totalWeightKg).toBeDefined();
    });
});
