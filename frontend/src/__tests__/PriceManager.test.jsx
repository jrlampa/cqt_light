/**
 * PriceManager.jsx — testes unitários
 * Gerenciador de preços (materiais sem preço cadastrado)
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PriceManager from '../components/PriceManager';
import { defaultApi } from './setup';

const MATERIAIS_SEM_PRECO = [
  { sap: 'MAT001', descricao: 'Condutor CAA 35mm²', preco_unitario: 0 },
  { sap: 'MAT002', descricao: 'Isolador pino 15kV', preco_unitario: 0 },
];

describe('PriceManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultApi.getZeroPriceMaterials.mockResolvedValue(MATERIAIS_SEM_PRECO);
    defaultApi.updateMaterialPrice.mockResolvedValue({ changes: 1 });
    defaultApi.updateAllKitsServiceCost.mockResolvedValue({ changes: 5 });
  });

  it('não carrega dados quando isOpen=false', () => {
    render(<PriceManager isOpen={false} onClose={vi.fn()} />);
    expect(defaultApi.getZeroPriceMaterials).not.toHaveBeenCalled();
  });

  it('carrega materiais sem preço quando isOpen=true', async () => {
    render(<PriceManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(defaultApi.getZeroPriceMaterials).toHaveBeenCalled());
  });

  it('exibe materiais sem preço', async () => {
    render(<PriceManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Condutor CAA 35mm²')).toBeTruthy());
    expect(screen.getByText('Isolador pino 15kV')).toBeTruthy();
  });

  it('exibe mensagem quando não há materiais sem preço', async () => {
    defaultApi.getZeroPriceMaterials.mockResolvedValue([]);
    render(<PriceManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/Nenhum item pendente encontrado/i)).toBeTruthy());
  });

  it('recarrega quando isOpen muda de false para true', async () => {
    const { rerender } = render(<PriceManager isOpen={false} onClose={vi.fn()} />);
    expect(defaultApi.getZeroPriceMaterials).not.toHaveBeenCalled();
    rerender(<PriceManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(defaultApi.getZeroPriceMaterials).toHaveBeenCalled());
  });

  it('não crasha quando window.api não está disponível (isOpen=true)', () => {
    const backup = window.api;
    window.api = undefined;
    expect(() => render(<PriceManager isOpen={true} onClose={vi.fn()} />)).not.toThrow();
    window.api = backup;
  });

  it('renderiza botão de fechar', async () => {
    render(<PriceManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(defaultApi.getZeroPriceMaterials).toHaveBeenCalled());
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('exibe SAP dos materiais', async () => {
    render(<PriceManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('MAT001')).toBeTruthy());
    expect(screen.getByText('MAT002')).toBeTruthy();
  });
});
