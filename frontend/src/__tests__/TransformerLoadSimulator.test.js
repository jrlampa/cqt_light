/**
 * TransformerLoadSimulator — Unit tests for the calculation logic.
 * Imports pure functions from the shared utility module to avoid duplication.
 */
import { describe, it, expect } from 'vitest';
import {
    calcularDemandaTotal,
    sugerirTransformador,
    calcularCorrenteNominal,
    calcularQuedaTensao,
    nivelCarregamento,
    FP_DEFAULT,
} from '../utils/transformerCalculations';

describe('TransformerLoadSimulator — Cálculos de Engenharia', () => {
    describe('calcularDemandaTotal', () => {
        it('deve calcular demanda em kVA corretamente', () => {
            // 50 UCs × 3000 VA × 0.6 = 90000 VA = 90 kVA
            expect(calcularDemandaTotal(50, 3000, 0.6)).toBeCloseTo(90, 2);
        });

        it('deve retornar 0 com 0 UCs', () => {
            expect(calcularDemandaTotal(0, 3000, 0.6)).toBe(0);
        });

        it('deve retornar kVA (dividido por 1000)', () => {
            expect(calcularDemandaTotal(1, 1000, 1)).toBe(1);
        });
    });

    describe('sugerirTransformador', () => {
        it('deve sugerir transformador com 20% de margem mínima (NBR 14039)', () => {
            // Demanda 90 kVA → mínimo 108 kVA → próximo padrão = 112.5 kVA
            expect(sugerirTransformador(90)).toBe(112.5);
        });

        it('deve sugerir 15 kVA para demandas muito baixas', () => {
            expect(sugerirTransformador(1)).toBe(15);
        });

        it('deve sugerir potência máxima quando demanda excede catálogo', () => {
            expect(sugerirTransformador(2000)).toBe(1000);
        });

        it('deve sugerir 30 kVA para demanda de 24 kVA (30 >= 24×1.2=28.8)', () => {
            expect(sugerirTransformador(24)).toBe(30);
        });
    });

    describe('calcularCorrenteNominal', () => {
        it('deve calcular corrente trifásica no secundário (220V)', () => {
            // I = (75000) / (√3 × 220) ≈ 196.8 A
            expect(calcularCorrenteNominal(75, 220)).toBeCloseTo(196.83, 1);
        });

        it('deve calcular corrente primária de 13.8 kV', () => {
            // I = (75000) / (√3 × 13800) ≈ 3.14 A
            expect(calcularCorrenteNominal(75, 13800)).toBeCloseTo(3.14, 1);
        });
    });

    describe('calcularQuedaTensao', () => {
        it('deve retornar queda percentual positiva', () => {
            const queda = calcularQuedaTensao(100, 0.306, 0.087, 300, 220);
            expect(queda).toBeGreaterThan(0);
        });

        it('deve retornar queda menor com cabo de menor resistência', () => {
            const quedaCaboGrosso = calcularQuedaTensao(100, 0.1, 0.08, 300, 220);
            const quedaCaboFino = calcularQuedaTensao(100, 0.5, 0.08, 300, 220);
            expect(quedaCaboGrosso).toBeLessThan(quedaCaboFino);
        });

        it('deve escalar linearmente com o comprimento', () => {
            const queda100 = calcularQuedaTensao(100, 0.306, 0.087, 100, 220);
            const queda200 = calcularQuedaTensao(100, 0.306, 0.087, 200, 220);
            expect(queda200).toBeCloseTo(queda100 * 2, 5);
        });

        it('deve usar FP_DEFAULT como fator de potência base', () => {
            // FP_DEFAULT deve ser 0.92 (PRODIST Módulo 8)
            expect(FP_DEFAULT).toBe(0.92);
        });
    });

    describe('nivelCarregamento', () => {
        it('deve classificar como CRÍTICO acima de 90%', () => {
            const result = nivelCarregamento(95, 100);
            expect(result.status).toBe('CRÍTICO');
            expect(result.pct).toBeCloseTo(95, 1);
        });

        it('deve classificar como ALERTA entre 70% e 90%', () => {
            expect(nivelCarregamento(80, 100).status).toBe('ALERTA');
        });

        it('deve classificar como ADEQUADO entre 45% e 70%', () => {
            expect(nivelCarregamento(60, 100).status).toBe('ADEQUADO');
        });

        it('deve classificar como SUBDIMENSIONADO abaixo de 45%', () => {
            expect(nivelCarregamento(30, 100).status).toBe('SUBDIMENSIONADO');
        });

        it('deve calcular percentual corretamente', () => {
            expect(nivelCarregamento(75, 150).pct).toBeCloseTo(50, 1);
        });

        it('deve retornar cores CSS válidas para cada nível', () => {
            expect(nivelCarregamento(95, 100).color).toContain('red');
            expect(nivelCarregamento(80, 100).color).toContain('amber');
            expect(nivelCarregamento(60, 100).color).toContain('emerald');
            expect(nivelCarregamento(30, 100).color).toContain('blue');
        });
    });

    describe('Cenário de integração — Rede típica 50 UCs', () => {
        it('deve gerar resultado consistente para rede residencial típica', () => {
            const demanda = calcularDemandaTotal(50, 3000, 0.6);
            const sugerido = sugerirTransformador(demanda);
            const corrente = calcularCorrenteNominal(demanda, 220);
            const carregamento = nivelCarregamento(demanda, 75);
            const queda = calcularQuedaTensao(corrente, 0.306, 0.087, 300, 220);

            expect(demanda).toBeCloseTo(90, 1);
            expect(sugerido).toBe(112.5);
            expect(corrente).toBeGreaterThan(100);
            expect(carregamento.status).toBe('CRÍTICO'); // 90/75 = 120% → CRÍTICO
            expect(queda).toBeGreaterThan(0);
        });
    });
});
