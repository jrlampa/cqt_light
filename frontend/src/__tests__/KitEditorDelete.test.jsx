/**
 * KitEditor.jsx — testes de cancelar exclusão e operações em composição
 * Cobre: linha 251 (cancelar delete modal), linhas 389-398 (qty change e remove material)
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import KitEditor from '../components/KitEditor';
import { defaultApi } from './setup';

const KITS = [
  { codigo_kit: 'KIT-A', descricao_kit: 'Kit A Descrição', custo_estimado: 800 },
];

const COMP = [
  { id: 10, sap: 'SAP001', descricao: 'Material A', quantidade: 2, preco_unitario: 100, unidade: 'UN', subtotal: 200 },
  { id: 11, sap: 'SAP002', descricao: 'Material B', quantidade: 1, preco_unitario: 50, unidade: 'UN', subtotal: 50 },
];

describe('KitEditor — delete cancel e operações de composição', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    defaultApi.getAllKits.mockResolvedValue(KITS);
    defaultApi.getKitComposition.mockResolvedValue(COMP);
    defaultApi.getKit.mockResolvedValue(KITS[0]);
    defaultApi.createKit.mockResolvedValue({ id: 99 });
    defaultApi.updateKitMetadata.mockResolvedValue({ changes: 1 });
    defaultApi.deleteKit.mockResolvedValue({ changes: 1 });
    defaultApi.addMaterialToKit.mockResolvedValue({ changes: 1 });
    defaultApi.removeMaterialFromKit.mockResolvedValue({ changes: 1 });
    defaultApi.updateKitMaterialQty.mockResolvedValue({ changes: 1 });
    defaultApi.searchMaterials.mockResolvedValue([]);
    window.alert = vi.fn().mockImplementation(() => {});
  });

  /**
   * Cobre linha 251: botão "Cancelar" no modal de exclusão chama setShowDeleteModal(false).
   * Fluxo: selecionar kit → abrir modal exclusão → clicar Cancelar → modal fecha.
   */
  it('fecha modal de exclusão ao clicar em Cancelar (linha 251)', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(screen.getByText('KIT-A')).toBeTruthy());

    // Seleciona o kit para ativar o painel de detalhe
    fireEvent.click(screen.getByText('KIT-A'));
    await waitFor(() => expect(document.querySelector('[title="Excluir kit"]')).toBeTruthy());

    // Abre modal de exclusão
    const delBtn = document.querySelector('[title="Excluir kit"]');
    fireEvent.click(delBtn);
    await waitFor(() => expect(screen.queryByText(/Excluir Kit/i)).toBeTruthy());

    // Clica em "Cancelar" — cobre linha 251
    const cancelBtn = screen.getAllByRole('button').find(
      (b) => b.textContent.trim() === 'Cancelar'
    );
    expect(cancelBtn).toBeTruthy();
    fireEvent.click(cancelBtn);

    // Modal deve fechar
    await waitFor(() => expect(screen.queryByText(/Excluir Kit/i)).toBeFalsy());
  });

  /**
   * Cobre linhas 389-392: onChange do input de quantidade chama handleUpdateQty.
   * Requer: kit selecionado + composição com items renderizados na tabela.
   */
  it('atualiza quantidade ao modificar input de qty na composição (linhas 389-392)', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(screen.getByText('KIT-A')).toBeTruthy());
    fireEvent.click(screen.getByText('KIT-A'));

    // Aguarda composição carregar
    await waitFor(() => expect(screen.queryByText('Material A')).toBeTruthy());

    // Os inputs de quantidade são do tipo "number" na tabela de composição
    const qtyInputs = document.querySelectorAll('input[type="number"][step="0.01"]');
    expect(qtyInputs.length).toBeGreaterThan(0);

    // Dispara onChange no primeiro input de qty (item.id=10) — cobre linha 389
    fireEvent.change(qtyInputs[0], { target: { value: '5' } });

    await waitFor(() =>
      expect(defaultApi.updateKitMaterialQty).toHaveBeenCalledWith({ id: 10, quantidade: 5 })
    );
  });

  /**
   * Cobre linhas 397-398: onClick do botão Trash2 chama handleRemoveMaterial.
   * Requer: kit selecionado + composição com items renderizados.
   */
  it('remove material ao clicar no botão Trash2 na composição (linhas 397-398)', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(screen.getByText('KIT-A')).toBeTruthy());
    fireEvent.click(screen.getByText('KIT-A'));

    // Aguarda composição carregar
    await waitFor(() => expect(screen.queryByText('Material A')).toBeTruthy());

    // Botões de remoção são os de p-1 text-red-500 na tabela
    const removeButtons = document.querySelectorAll('button.p-1.text-red-500');
    expect(removeButtons.length).toBeGreaterThan(0);

    // Clica no primeiro botão de remover (item.id=10) — cobre linha 398
    fireEvent.click(removeButtons[0]);

    await waitFor(() =>
      expect(defaultApi.removeMaterialFromKit).toHaveBeenCalledWith(10)
    );
  });

  /**
   * Cobre linha 251 via overlay click: clicar no fundo do delete modal também fecha.
   */
  it('fecha modal de exclusão ao clicar no fundo (overlay)', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(screen.getByText('KIT-A')).toBeTruthy());
    fireEvent.click(screen.getByText('KIT-A'));
    await waitFor(() => expect(document.querySelector('[title="Excluir kit"]')).toBeTruthy());

    fireEvent.click(document.querySelector('[title="Excluir kit"]'));
    await waitFor(() => expect(screen.queryByText(/Excluir Kit/i)).toBeTruthy());

    // Clicar no overlay (o div pai do modal) fecha
    const overlay = document.querySelector('.fixed.inset-0.bg-black\\/50');
    if (overlay) {
      fireEvent.click(overlay);
      await waitFor(() => expect(screen.queryByText(/Excluir Kit/i)).toBeFalsy());
    }
  });
});
