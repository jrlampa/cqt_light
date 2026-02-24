import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBudgetCalculator } from '../hooks/useBudgetCalculator';

// Mock window.api
const mockApi = {
  getCustoTotal: vi.fn(),
  getMaterialsPrices: vi.fn()
};
global.window = { api: mockApi, performance: { now: () => Date.now() } };

describe('useBudgetCalculator (100% Coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate budget with kits and materials', async () => {
    mockApi.getCustoTotal.mockResolvedValue({
      materiais: [{ sap: 'M1', quantidade: 1, preco_unitario: 10, descricao: 'Mat 1' }],
      servicos: [{ codigo_kit: 'K1', custo_servico: 50 }],
      totalMaterial: 10,
      totalServico: 50
    });

    const { result } = renderHook(() => useBudgetCalculator());

    await act(async () => {
      await result.current.calculateTotal({
        estruturas: [{ codigo_kit: 'K1', quantidade: 1 }],
        templates: []
      });
    });

    expect(result.current.custoData.totalGeral).toBe(60);
  });

  it('should handle manual templates (extras)', async () => {
    mockApi.getCustoTotal.mockResolvedValue({ materiais: [], servicos: [], totalMaterial: 0, totalServico: 0 });
    mockApi.getMaterialsPrices.mockResolvedValue([
      { sap: 'EXT1', preco_unitario: 100, descricao: 'Extra 1', unidade: 'UN' }
    ]);

    const { result } = renderHook(() => useBudgetCalculator());

    await act(async () => {
      await result.current.calculateTotal({
        estruturas: [{ codigo_kit: 'TPL1', quantidade: 1 }],
        templates: [{
          nome_template: 'TPL1',
          materiais_json: [{ codigo: 'EXT1', quantidade: 2 }]
        }]
      });
    });

    expect(result.current.custoData.totalMaterial).toBe(200);
  });

  it('should handle material suffixes', async () => {
    mockApi.getCustoTotal.mockResolvedValue({ materiais: [], servicos: [], totalMaterial: 0, totalServico: 0 });
    const { result } = renderHook(() => useBudgetCalculator());

    await act(async () => {
      await result.current.calculateTotal({
        sufixos: [{ prefixo: 'M1/', tipo_contexto: 'condutor', valor_contexto: 'AL4', codigo_completo: 'M1/AL4' }],
        condutorMT: { codigo: 'AL4' },
        materiaisAvulsos: [{ sap: 'M1/', quantidade: 1, preco_unitario: 5 }]
      });
    });

    // The sap should be resolved to M1/AL4
    const materials = result.current.custoData.materiais;
    expect(materials.find(m => m.sap === 'M1/AL4')).toBeDefined();
  });
});
