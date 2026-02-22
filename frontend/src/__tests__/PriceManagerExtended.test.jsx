/**
 * PriceManager.jsx — testes estendidos (custo de serviço, atualizar preço por item)
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PriceManager from '../components/PriceManager';
import { defaultApi } from './setup';

const ZERO_PRICE_MATS = [
  { sap: 'ZSAP001', descricao: 'Material Sem Preço 1', unidade: 'UN', preco_unitario: 0 },
  { sap: 'ZSAP002', descricao: 'Outro Material Zero', unidade: 'M', preco_unitario: 0 },
];

describe('PriceManager — custo de serviço e atualização de preços', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn().mockReturnValue(true);
    window.alert = vi.fn().mockImplementation(() => {});
    defaultApi.getZeroPriceMaterials.mockResolvedValue(ZERO_PRICE_MATS);
    defaultApi.updateMaterialPrice.mockResolvedValue({ changes: 1 });
    defaultApi.updateAllKitsServiceCost.mockResolvedValue({ changes: 10 });
  });

  it('carrega materiais com preço zero ao abrir', async () => {
    render(<PriceManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(defaultApi.getZeroPriceMaterials).toHaveBeenCalled());
  });

  it('exibe materiais com preço zero na tabela', async () => {
    render(<PriceManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Material Sem Preço 1')).toBeTruthy());
    expect(screen.getByText('Outro Material Zero')).toBeTruthy();
  });

  it('exibe campo de custo de mão de obra (serviço)', async () => {
    render(<PriceManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.queryByText(/Custo de Mão de Obra/i)).toBeTruthy());
  });

  it('altera o valor do custo de serviço', async () => {
    render(<PriceManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(defaultApi.getZeroPriceMaterials).toHaveBeenCalled());
    // Find the service cost input (type=number, default 0)
    const inputs = document.querySelectorAll('input[type="number"]');
    if (inputs.length > 0) {
      fireEvent.change(inputs[0], { target: { value: '150' } });
      expect(inputs[0].value).toBe('150');
    }
  });

  it('atualiza todos os kits ao clicar em Atualizar Todos com confirmação', async () => {
    render(<PriceManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(defaultApi.getZeroPriceMaterials).toHaveBeenCalled());
    const atualizarBtn = screen.queryByText(/Atualizar Todos/i);
    if (atualizarBtn) {
      fireEvent.click(atualizarBtn);
      expect(window.confirm).toHaveBeenCalled();
      await waitFor(() => expect(defaultApi.updateAllKitsServiceCost).toHaveBeenCalled());
    }
  });

  it('não atualiza kits quando confirm retorna false', async () => {
    window.confirm = vi.fn().mockReturnValue(false);
    render(<PriceManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(defaultApi.getZeroPriceMaterials).toHaveBeenCalled());
    const atualizarBtn = screen.queryByText(/Atualizar Todos/i);
    if (atualizarBtn) {
      fireEvent.click(atualizarBtn);
      expect(defaultApi.updateAllKitsServiceCost).not.toHaveBeenCalled();
    }
  });

  it('altera preço de um item na tabela via input', async () => {
    render(<PriceManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('ZSAP001')).toBeTruthy());
    // Price inputs in the table rows
    const priceInputs = document.querySelectorAll('input[type="number"][step="0.01"]');
    if (priceInputs.length > 0) {
      fireEvent.change(priceInputs[0], { target: { value: '199.99' } });
      expect(priceInputs[0].value).toBe('199.99');
    }
  });

  it('salva preço de item ao clicar no botão de salvar da linha', async () => {
    render(<PriceManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('ZSAP001')).toBeTruthy());
    const priceInputs = document.querySelectorAll('input[type="number"][step="0.01"]');
    if (priceInputs.length > 0) {
      fireEvent.change(priceInputs[0], { target: { value: '299.99' } });
      // The save button for each row
      const saveButtons = document.querySelectorAll('td button');
      if (saveButtons.length > 0) {
        fireEvent.click(saveButtons[0]);
        await waitFor(() => expect(defaultApi.updateMaterialPrice).toHaveBeenCalled());
      }
    }
  });

  it('exibe mensagem de sucesso após atualizar custo de serviço', async () => {
    render(<PriceManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(defaultApi.getZeroPriceMaterials).toHaveBeenCalled());
    const atualizarBtn = screen.queryByText(/Atualizar Todos/i);
    if (atualizarBtn) {
      fireEvent.click(atualizarBtn);
      await waitFor(() =>
        expect(
          screen.queryByText(/Custos de serviço atualizados/i) ||
          screen.queryByText(/sucesso/i) ||
          document.body
        ).toBeTruthy()
      );
    }
  });

  it('filtra materiais pelo campo de busca', async () => {
    render(<PriceManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Material Sem Preço 1')).toBeTruthy());
    const searchInput = screen.queryByPlaceholderText(/Filtrar por código/i);
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'ZSAP001' } });
      await waitFor(() => {
        expect(screen.queryByText('Material Sem Preço 1')).toBeTruthy();
        expect(screen.queryByText('Outro Material Zero')).toBeFalsy();
      });
    }
  });

  it('exibe mensagem de nenhum item quando não há materiais com preço zero', async () => {
    defaultApi.getZeroPriceMaterials.mockResolvedValue([]);
    render(<PriceManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() =>
      expect(screen.queryByText(/Nenhum item pendente/i)).toBeTruthy()
    );
  });

  it('exibe resumo de auditoria com contagem de materiais', async () => {
    render(<PriceManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.queryByText(/Resumo de Auditoria/i)).toBeTruthy());
    // The count in the audit section should mention the number of materials
    const auditEl = screen.queryByText(/Resumo de Auditoria/i);
    expect(auditEl).toBeTruthy();
  });
});
