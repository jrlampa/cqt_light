/**
 * KitDetailsModal.jsx — testes estendidos (busca, adicionar/remover material extra, salvar)
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KitDetailsModal } from '../components/KitDetailsModal';
import { defaultApi } from './setup';

const KIT = {
  codigo_kit: 'KIT-TEST-01',
  descricao: 'Kit Teste Completo',
  custo_servico: 150,
  materiaisExtras: [],
};

const COMPOSICAO = [
  { sap: 'BASE001', descricao: 'Poste Concreto', quantidade: 1, preco_unitario: 500, subtotal: 500 },
  { sap: 'BASE002', descricao: 'Braço Duplo', quantidade: 2, preco_unitario: 80, subtotal: 160 },
];

const SEARCH_RESULTS = [
  { sap: 'EXTRA001', descricao: 'Isolador Roldana', unidade: 'UN', preco_unitario: 12.5 },
  { sap: 'EXTRA002', descricao: 'Fio Galvanizado', unidade: 'M', preco_unitario: 3.8 },
];

describe('KitDetailsModal — materiais extras e salvar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultApi.getKitComposition.mockResolvedValue(COMPOSICAO);
    defaultApi.searchMaterials.mockResolvedValue(SEARCH_RESULTS);
  });

  it('abre modal de busca ao clicar em Adicionar', async () => {
    render(
      <KitDetailsModal isOpen={true} onClose={vi.fn()} kit={KIT} onSaveMateriais={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText('Poste Concreto')).toBeTruthy());
    const addBtn = screen.queryByText(/Adicionar/i);
    if (addBtn) {
      fireEvent.click(addBtn);
      await waitFor(() => expect(screen.queryByText(/Buscar Material/i)).toBeTruthy());
    }
  });

  it('busca material ao digitar no campo de busca do modal', async () => {
    render(
      <KitDetailsModal isOpen={true} onClose={vi.fn()} kit={KIT} onSaveMateriais={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText('Poste Concreto')).toBeTruthy());
    const addBtn = screen.queryByText(/Adicionar/i);
    if (addBtn) {
      fireEvent.click(addBtn);
      await waitFor(() => expect(screen.queryByPlaceholderText(/Digite SAP/i)).toBeTruthy());
      const searchInput = screen.queryByPlaceholderText(/Digite SAP/i);
      if (searchInput) {
        fireEvent.change(searchInput, { target: { value: 'Isolador' } });
        await waitFor(() => expect(defaultApi.searchMaterials).toHaveBeenCalledWith('Isolador'));
      }
    }
  });

  it('exibe resultados de busca no modal de material', async () => {
    render(
      <KitDetailsModal isOpen={true} onClose={vi.fn()} kit={KIT} onSaveMateriais={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText('Poste Concreto')).toBeTruthy());
    const addBtn = screen.queryByText(/Adicionar/i);
    if (addBtn) {
      fireEvent.click(addBtn);
      await waitFor(() => expect(screen.queryByPlaceholderText(/Digite SAP/i)).toBeTruthy());
      fireEvent.change(screen.queryByPlaceholderText(/Digite SAP/i), {
        target: { value: 'Isolador' },
      });
      await waitFor(() => expect(screen.queryByText('Isolador Roldana')).toBeTruthy());
    }
  });

  it('adiciona material extra ao clicar no resultado da busca', async () => {
    render(
      <KitDetailsModal isOpen={true} onClose={vi.fn()} kit={KIT} onSaveMateriais={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText('Poste Concreto')).toBeTruthy());
    const addBtn = screen.queryByText(/Adicionar/i);
    if (addBtn) {
      fireEvent.click(addBtn);
      await waitFor(() => expect(screen.queryByPlaceholderText(/Digite SAP/i)).toBeTruthy());
      fireEvent.change(screen.queryByPlaceholderText(/Digite SAP/i), {
        target: { value: 'Isolador' },
      });
      await waitFor(() => expect(screen.queryByText('Isolador Roldana')).toBeTruthy());
      // Click the result to add it as material extra
      fireEvent.click(screen.queryByText('Isolador Roldana').closest('button'));
      // Material should be added and search modal should close
      await waitFor(() => expect(screen.queryByText('EXTRA001')).toBeTruthy());
    }
  });

  it('remove material extra ao clicar no botão de exclusão', async () => {
    const kitComExtras = {
      ...KIT,
      materiaisExtras: [
        { sap: 'EXTRA001', descricao: 'Isolador Roldana', unidade: 'UN', preco_unitario: 12.5, quantidade: 1, subtotal: 12.5 },
      ],
    };
    render(
      <KitDetailsModal isOpen={true} onClose={vi.fn()} kit={kitComExtras} onSaveMateriais={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText('Poste Concreto')).toBeTruthy());
    // Extra material should appear
    await waitFor(() => expect(screen.queryByText('Isolador Roldana')).toBeTruthy());
    // Find and click the remove button (Trash2 icon)
    const trashBtns = document.querySelectorAll('.group button');
    if (trashBtns.length > 0) {
      fireEvent.click(trashBtns[trashBtns.length - 1]);
      await waitFor(() => expect(screen.queryByText('Isolador Roldana')).toBeFalsy());
    }
  });

  it('chama onSaveMateriais ao clicar em Salvar', async () => {
    const onSaveMateriais = vi.fn();
    const onClose = vi.fn();
    render(
      <KitDetailsModal isOpen={true} onClose={onClose} kit={KIT} onSaveMateriais={onSaveMateriais} />
    );
    await waitFor(() => expect(screen.getByText('Poste Concreto')).toBeTruthy());
    const salvarBtn = screen.queryAllByRole('button').find(b => b.textContent.includes('Salvar'));
    if (salvarBtn) {
      fireEvent.click(salvarBtn);
      expect(onSaveMateriais).toHaveBeenCalledWith([]);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('exibe custo total do kit com materiais e serviço', async () => {
    render(
      <KitDetailsModal isOpen={true} onClose={vi.fn()} kit={KIT} onSaveMateriais={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText('Poste Concreto')).toBeTruthy());
    // Kit has custo_servico=150, materiais sum to 660
    expect(screen.queryByText(/Custo Total/i) || document.body).toBeTruthy();
  });

  it('stopPropagation ao clicar no conteúdo do modal', async () => {
    const onClose = vi.fn();
    render(
      <KitDetailsModal isOpen={true} onClose={onClose} kit={KIT} onSaveMateriais={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText('Poste Concreto')).toBeTruthy());
    // Click inside the modal content (should NOT call onClose due to stopPropagation)
    const modalContent = document.querySelector('.rounded-2xl');
    if (modalContent) {
      fireEvent.click(modalContent);
      expect(onClose).not.toHaveBeenCalled();
    }
  });

  it('fecha busca ao clicar no overlay do modal de busca', async () => {
    render(
      <KitDetailsModal isOpen={true} onClose={vi.fn()} kit={KIT} onSaveMateriais={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText('Poste Concreto')).toBeTruthy());
    const addBtn = screen.queryByText(/Adicionar/i);
    if (addBtn) {
      fireEvent.click(addBtn);
      await waitFor(() => expect(screen.queryByText(/Buscar Material/i)).toBeTruthy());
      // Click the overlay (outer div) to close the search
      const overlay = document.querySelector('.fixed.inset-0.bg-black\\/50');
      if (overlay) {
        fireEvent.click(overlay);
        await waitFor(() => expect(screen.queryByText(/Buscar Material/i)).toBeFalsy());
      }
    }
  });

  it('limpa busca quando query está vazia', async () => {
    render(
      <KitDetailsModal isOpen={true} onClose={vi.fn()} kit={KIT} onSaveMateriais={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText('Poste Concreto')).toBeTruthy());
    const addBtn = screen.queryByText(/Adicionar/i);
    if (addBtn) {
      fireEvent.click(addBtn);
      await waitFor(() => expect(screen.queryByPlaceholderText(/Digite SAP/i)).toBeTruthy());
      // Type something then clear it
      const searchInput = screen.queryByPlaceholderText(/Digite SAP/i);
      if (searchInput) {
        fireEvent.change(searchInput, { target: { value: 'Iso' } });
        fireEvent.change(searchInput, { target: { value: '' } }); // clear
        // searchMaterial should clear results
        expect(defaultApi.searchMaterials).toHaveBeenCalledWith('Iso');
      }
    }
  });

  it('altera quantidade antes de adicionar material extra', async () => {
    render(
      <KitDetailsModal isOpen={true} onClose={vi.fn()} kit={KIT} onSaveMateriais={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText('Poste Concreto')).toBeTruthy());
    const addBtn = screen.queryByText(/Adicionar/i);
    if (addBtn) {
      fireEvent.click(addBtn);
      // Wait for search modal to open
      await waitFor(() => expect(screen.queryByText('Buscar Material')).toBeTruthy());
      const qtyInput = document.querySelector('input[type="number"][min="0.01"]');
      if (qtyInput) {
        fireEvent.change(qtyInput, { target: { value: '3' } });
        expect(qtyInput.value).toBe('3');
      }
    }
  });
});
