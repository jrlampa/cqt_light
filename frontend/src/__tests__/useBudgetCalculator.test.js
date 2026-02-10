import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBudgetCalculator } from '../hooks/useBudgetCalculator';

// Mock window.api
global.window = {
  api: {
    getCustoTotal: vi.fn(),
    getMaterialsPrices: vi.fn(),
  },
  performance: {
    now: vi.fn(() => 0),
  }
};

describe('useBudgetCalculator', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useBudgetCalculator());
    expect(result.current.custoData.totalGeral).toBe(0);
    expect(result.current.isCalculating).toBe(false);
  });

  it('should calculate total for standard kits and loose materials', async () => {
    const { result } = renderHook(() => useBudgetCalculator());

    const estruturas = [
      { codigo_kit: 'KIT1', quantidade: 2 }
    ];
    const materiaisAvulsos = [
      { sap: 'MAT1', preco_unitario: 10, quantidade: 3, descricao: 'Item' }
    ];

    window.api.getCustoTotal.mockResolvedValue({
      materiais: [
        { sap: 'M1', quantidade: 2, preco_unitario: 5, descricao: 'Mat1' }
      ],
      totalMaterial: 10,
      totalServico: 50
    });

    await act(async () => {
      await result.current.calculateTotal({ estruturas, materiaisAvulsos });
    });

    // Total Material: (2 kits * 5 price/kit_mat = 10) + (3 mats * 10 price = 30) = 40
    // Total Service: 50
    // Total Geral: 90
    expect(result.current.custoData.totalMaterial).toBe(40);
    expect(result.current.custoData.totalServico).toBe(50);
    expect(result.current.custoData.totalGeral).toBe(90);
    expect(result.current.custoData.materiais).toHaveLength(2);
  });

  it('should handle template extras correctly', async () => {
    const { result } = renderHook(() => useBudgetCalculator());

    const estruturas = [
      { codigo_kit: 'TPL1', quantidade: 1 }
    ];
    const templates = [
      {
        nome_template: 'TPL1',
        kit_base: null,
        materiais_json: JSON.stringify([{ codigo: 'EXTRA1', quantidade: 5 }])
      }
    ];

    window.api.getMaterialsPrices.mockResolvedValue([
      { sap: 'EXTRA1', preco_unitario: 2, descricao: 'Extra Material' }
    ]);

    await act(async () => {
      await result.current.calculateTotal({ estruturas, templates });
    });

    expect(result.current.custoData.totalMaterial).toBe(10); // 5 * 2
    expect(result.current.custoData.materiais[0].sap).toBe('EXTRA1');
  });
});
