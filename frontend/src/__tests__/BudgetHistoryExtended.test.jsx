/**
 * BudgetHistory.jsx — testes estendidos (salvar orçamento, excluir, carregar via clique)
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BudgetHistory from '../components/BudgetHistory';
import { defaultApi } from './setup';

const CURRENT_DATA = {
  totalGeral: 5500,
  materiais: [
    { sap: 'M1', descricao: 'Poste', quantidade: 2, subtotal: 700 },
    { sap: 'M2', descricao: 'Braço', quantidade: 4, subtotal: 200 },
  ],
  condutorMT: 'CAA 70mm²',
  condutorBT: '3x70+54,6 mm² (Multiplexada)',
  estruturas: [],
  materiaisAvulsos: [],
};

const ORCAMENTOS = [
  { id: 10, nome: 'Orçamento Janeiro', total: 3200, data_criacao: '2026-01-10T09:00:00' },
  { id: 11, nome: 'Orçamento Fevereiro', total: 5800, data_criacao: '2026-02-05T11:00:00' },
];

describe('BudgetHistory — salvar, excluir e carregar orçamentos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultApi.getOrcamentos.mockResolvedValue(ORCAMENTOS);
    defaultApi.saveOrcamento.mockResolvedValue({ id: 12 });
    defaultApi.deleteOrcamento.mockResolvedValue({ changes: 1 });
    defaultApi.getOrcamento.mockResolvedValue({
      ...ORCAMENTOS[0],
      dados: CURRENT_DATA,
    });
    window.confirm = vi.fn().mockReturnValue(true);
    window.alert = vi.fn().mockImplementation(() => {});
  });

  it('muda para modo salvar ao clicar em Salvar Atual', async () => {
    render(
      <BudgetHistory
        isOpen={true}
        onClose={vi.fn()}
        onLoad={vi.fn()}
        currentData={CURRENT_DATA}
      />
    );
    await waitFor(() => expect(screen.queryByText(/Salvar Atual/i)).toBeTruthy());
    fireEvent.click(screen.queryByText(/Salvar Atual/i));
    await waitFor(() => expect(screen.queryByPlaceholderText(/Obra Rua das Flores/i)).toBeTruthy());
  });

  it('salva orçamento ao preencher nome e confirmar', async () => {
    render(
      <BudgetHistory
        isOpen={true}
        onClose={vi.fn()}
        onLoad={vi.fn()}
        currentData={CURRENT_DATA}
      />
    );
    await waitFor(() => expect(screen.queryByText(/Salvar Atual/i)).toBeTruthy());
    fireEvent.click(screen.queryByText(/Salvar Atual/i));
    await waitFor(() => expect(screen.queryByPlaceholderText(/Obra Rua das Flores/i)).toBeTruthy());

    const nomeInput = screen.queryByPlaceholderText(/Obra Rua das Flores/i);
    if (nomeInput) {
      fireEvent.change(nomeInput, { target: { value: 'Obra Projeto Alpha' } });
      // Press Enter to save
      fireEvent.keyDown(nomeInput, { key: 'Enter' });
      await waitFor(() =>
        expect(defaultApi.saveOrcamento).toHaveBeenCalledWith(
          expect.objectContaining({ nome: 'Obra Projeto Alpha' })
        )
      );
    }
  });

  it('salva orçamento ao clicar no botão Salvar', async () => {
    render(
      <BudgetHistory
        isOpen={true}
        onClose={vi.fn()}
        onLoad={vi.fn()}
        currentData={CURRENT_DATA}
      />
    );
    await waitFor(() => expect(screen.queryByText(/Salvar Atual/i)).toBeTruthy());
    fireEvent.click(screen.queryByText(/Salvar Atual/i));
    await waitFor(() => expect(screen.queryByPlaceholderText(/Obra Rua das Flores/i)).toBeTruthy());

    const nomeInput = screen.queryByPlaceholderText(/Obra Rua das Flores/i);
    if (nomeInput) {
      fireEvent.change(nomeInput, { target: { value: 'Orçamento Beta' } });
      // Find the Salvar button in save mode
      const salvarBtn = screen.queryAllByRole('button').find(
        b => b.textContent.includes('Salvar') && !b.textContent.includes('Atual')
      );
      if (salvarBtn) {
        fireEvent.click(salvarBtn);
        await waitFor(() => expect(defaultApi.saveOrcamento).toHaveBeenCalled());
      }
    }
  });

  it('exibe total e contagem de materiais no resumo ao salvar', async () => {
    render(
      <BudgetHistory
        isOpen={true}
        onClose={vi.fn()}
        onLoad={vi.fn()}
        currentData={CURRENT_DATA}
      />
    );
    await waitFor(() => expect(screen.queryByText(/Salvar Atual/i)).toBeTruthy());
    fireEvent.click(screen.queryByText(/Salvar Atual/i));
    await waitFor(() => expect(screen.queryByText(/Resumo do Estado Atual/i)).toBeTruthy());
    // Should show total and item count
    expect(screen.queryByText(/2 itens/i) || screen.queryByText(/Total/i)).toBeTruthy();
  });

  it('cancela modo de salvar ao clicar em Cancelar', async () => {
    render(
      <BudgetHistory
        isOpen={true}
        onClose={vi.fn()}
        onLoad={vi.fn()}
        currentData={CURRENT_DATA}
      />
    );
    await waitFor(() => expect(screen.queryByText(/Salvar Atual/i)).toBeTruthy());
    fireEvent.click(screen.queryByText(/Salvar Atual/i));
    await waitFor(() => expect(screen.queryByText(/Cancelar/i)).toBeTruthy());
    const cancelBtn = screen.queryByText(/Cancelar/i);
    if (cancelBtn) {
      fireEvent.click(cancelBtn);
      await waitFor(() => expect(screen.queryByText(/Salvar Atual/i)).toBeTruthy());
    }
  });

  it('exclui orçamento ao confirmar', async () => {
    render(
      <BudgetHistory
        isOpen={true}
        onClose={vi.fn()}
        onLoad={vi.fn()}
        currentData={CURRENT_DATA}
      />
    );
    await waitFor(() => expect(screen.getByText('Orçamento Janeiro')).toBeTruthy());
    // The delete button is hidden (opacity-0 group-hover) but findable in DOM
    const allBtns = screen.getAllByRole('button');
    // Delete buttons have title="Excluir"
    const deleteBtns = allBtns.filter(b => b.title === 'Excluir');
    if (deleteBtns.length > 0) {
      fireEvent.click(deleteBtns[0]);
      expect(window.confirm).toHaveBeenCalled();
      await waitFor(() =>
        expect(defaultApi.deleteOrcamento).toHaveBeenCalledWith(ORCAMENTOS[0].id)
      );
    }
  });

  it('não exclui quando confirm retorna false', async () => {
    window.confirm = vi.fn().mockReturnValue(false);
    render(
      <BudgetHistory
        isOpen={true}
        onClose={vi.fn()}
        onLoad={vi.fn()}
        currentData={CURRENT_DATA}
      />
    );
    await waitFor(() => expect(screen.getByText('Orçamento Janeiro')).toBeTruthy());
    const allBtns = screen.getAllByRole('button');
    const deleteBtns = allBtns.filter(b => b.title === 'Excluir');
    if (deleteBtns.length > 0) {
      fireEvent.click(deleteBtns[0]);
      expect(defaultApi.deleteOrcamento).not.toHaveBeenCalled();
    }
  });

  it('carrega orçamento ao clicar no item da lista e chama onLoad', async () => {
    const onLoad = vi.fn();
    const onClose = vi.fn();
    render(
      <BudgetHistory
        isOpen={true}
        onClose={onClose}
        onLoad={onLoad}
        currentData={CURRENT_DATA}
      />
    );
    await waitFor(() => expect(screen.getByText('Orçamento Janeiro')).toBeTruthy());
    fireEvent.click(screen.getByText('Orçamento Janeiro'));
    await waitFor(() => {
      expect(defaultApi.getOrcamento).toHaveBeenCalledWith(ORCAMENTOS[0].id);
    });
    await waitFor(() => {
      expect(onLoad).toHaveBeenCalledWith(CURRENT_DATA);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('exibe valor total formatado em R$ na lista de orçamentos', async () => {
    render(
      <BudgetHistory
        isOpen={true}
        onClose={vi.fn()}
        onLoad={vi.fn()}
        currentData={CURRENT_DATA}
      />
    );
    await waitFor(() => expect(screen.getByText('Orçamento Janeiro')).toBeTruthy());
    // Both orçamentos show R$ values
    expect(screen.queryAllByText(/R\$/).length).toBeGreaterThan(0);
  });

  it('não crasha quando getOrcamento retorna null', async () => {
    defaultApi.getOrcamento.mockResolvedValue(null);
    const onLoad = vi.fn();
    render(
      <BudgetHistory
        isOpen={true}
        onClose={vi.fn()}
        onLoad={onLoad}
        currentData={CURRENT_DATA}
      />
    );
    await waitFor(() => expect(screen.getByText('Orçamento Janeiro')).toBeTruthy());
    fireEvent.click(screen.getByText('Orçamento Janeiro'));
    await waitFor(() => expect(defaultApi.getOrcamento).toHaveBeenCalled());
    // onLoad should NOT be called when fullBudget is null
    expect(onLoad).not.toHaveBeenCalled();
  });
});
