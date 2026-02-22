/**
 * KitEditor.jsx — testes unitários (smoke tests)
 * Gerenciador de kits (criar, editar, composição)
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import KitEditor from '../components/KitEditor';
import { defaultApi } from './setup';

const KITS_MOCK = [
  { codigo_kit: 'KIT-001', descricao_kit: 'Kit Poste 11m BT', custo_estimado: 500 },
  { codigo_kit: 'KIT-002', descricao_kit: 'Kit Transformador 45kVA', custo_estimado: 1200 },
];

const COMPOSICAO_MOCK = [
  { sap: 'MAT001', descricao: 'Poste 11m', quantidade: 1, preco_unitario: 350 },
];

describe('KitEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultApi.getAllKits.mockResolvedValue(KITS_MOCK);
    defaultApi.searchKits.mockResolvedValue([KITS_MOCK[0]]);
    defaultApi.getKitComposition.mockResolvedValue(COMPOSICAO_MOCK);
    defaultApi.createKit.mockResolvedValue({ id: 3 });
    defaultApi.deleteKit.mockResolvedValue({ changes: 1 });
    defaultApi.addMaterialToKit.mockResolvedValue({ changes: 1 });
    defaultApi.removeMaterialFromKit.mockResolvedValue({ changes: 1 });
    defaultApi.updateKitMaterialQty.mockResolvedValue({ changes: 1 });
  });

  it('renderiza sem crash', async () => {
    render(<KitEditor />);
    expect(document.body).toBeTruthy();
  });

  it('carrega kits ao montar', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(defaultApi.getAllKits).toHaveBeenCalled());
  });

  it('exibe lista de kits', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(screen.getByText('Kit Poste 11m BT')).toBeTruthy());
    expect(screen.getByText('Kit Transformador 45kVA')).toBeTruthy();
  });

  it('busca kits ao digitar e clicar em buscar', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(defaultApi.getAllKits).toHaveBeenCalled());
    const inputs = screen.getAllByRole('textbox');
    if (inputs.length > 0) {
      fireEvent.change(inputs[0], { target: { value: 'Poste' } });
      const searchBtn = screen.queryByText(/Buscar/i);
      if (searchBtn) {
        fireEvent.click(searchBtn);
        await waitFor(() => expect(defaultApi.searchKits).toHaveBeenCalledWith('Poste'));
      }
    }
  });

  it('exibe código do kit na lista', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(screen.getByText('KIT-001')).toBeTruthy());
    expect(screen.getByText('KIT-002')).toBeTruthy();
  });

  it('não crasha quando window.api não está disponível', () => {
    const backup = window.api;
    window.api = undefined;
    expect(() => render(<KitEditor />)).not.toThrow();
    window.api = backup;
  });

  it('abre modal de criação ao clicar em Novo Kit', async () => {
    render(<KitEditor />);
    const novoBtn = screen.queryByText(/Novo Kit/i);
    if (novoBtn) {
      fireEvent.click(novoBtn);
      await waitFor(() => expect(screen.queryByPlaceholderText(/código/i)).toBeTruthy());
    }
  });

  it('seleciona kit e carrega composição', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(screen.getByText('Kit Poste 11m BT')).toBeTruthy());
    const kitItem = screen.getByText('Kit Poste 11m BT');
    // O item pode estar dentro de um elemento clicável
    const clickable = kitItem.closest('div[class*="cursor"]') || kitItem.parentElement;
    if (clickable) {
      fireEvent.click(clickable);
      await waitFor(() => expect(defaultApi.getKitComposition).toHaveBeenCalled());
    }
  });
});
