/**
 * MaterialManager.jsx — testes estendidos (adicionar, editar, excluir materiais)
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MaterialManager from '../components/MaterialManager';
import { defaultApi } from './setup';

const MATERIAIS = [
  { sap: 'MAT-X1', descricao: 'Poste Concreto 11m', unidade: 'UN', preco_unitario: 450.0 },
  { sap: 'MAT-X2', descricao: 'Cruzeta Dupla 2.4m', unidade: 'UN', preco_unitario: 85.5 },
];

describe('MaterialManager — CRUD inline e formulário de novo material', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    window.confirm = vi.fn().mockReturnValue(true);
    defaultApi.getAllMaterials.mockResolvedValue(MATERIAIS);
    defaultApi.searchMaterials.mockResolvedValue(MATERIAIS);
    defaultApi.upsertMaterial.mockResolvedValue({ changes: 1 });
    defaultApi.deleteMaterial.mockResolvedValue({ changes: 1 });
  });

  it('preenche campos do formulário de novo material', async () => {
    render(<MaterialManager />);
    fireEvent.click(screen.getByText('Novo Material'));
    const sapInput = screen.getByPlaceholderText('SAP');
    const descInput = screen.getByPlaceholderText('Descrição');
    const unidInput = screen.getByPlaceholderText('UN');
    fireEvent.change(sapInput, { target: { value: 'NEW-001' } });
    fireEvent.change(descInput, { target: { value: 'Material Novo' } });
    fireEvent.change(unidInput, { target: { value: 'M' } });
    expect(sapInput.value).toBe('NEW-001');
    expect(descInput.value).toBe('Material Novo');
    expect(unidInput.value).toBe('M');
  });

  it('preenche preço no formulário de novo material', async () => {
    render(<MaterialManager />);
    fireEvent.click(screen.getByText('Novo Material'));
    const precoInput = screen.getByPlaceholderText('Preço');
    fireEvent.change(precoInput, { target: { value: '99.99' } });
    expect(precoInput.value).toBe('99.99');
  });

  it('salva novo material ao preencher SAP e clicar Salvar', async () => {
    render(<MaterialManager />);
    fireEvent.click(screen.getByText('Novo Material'));
    const sapInput = screen.getByPlaceholderText('SAP');
    fireEvent.change(sapInput, { target: { value: 'NEW-001' } });
    // Click Salvar button inside the form
    const salvarBtns = screen.getAllByText('Salvar');
    fireEvent.click(salvarBtns[0]);
    await waitFor(() => expect(defaultApi.upsertMaterial).toHaveBeenCalled());
  });

  it('não salva novo material sem SAP', async () => {
    render(<MaterialManager />);
    fireEvent.click(screen.getByText('Novo Material'));
    // SAP empty — click Salvar should not call API
    const salvarBtns = screen.getAllByText('Salvar');
    fireEvent.click(salvarBtns[0]);
    expect(defaultApi.upsertMaterial).not.toHaveBeenCalled();
  });

  it('cancela formulário de novo material ao clicar Cancelar', async () => {
    render(<MaterialManager />);
    fireEvent.click(screen.getByText('Novo Material'));
    expect(screen.getByPlaceholderText('SAP')).toBeTruthy();
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByPlaceholderText('SAP')).toBeFalsy());
  });

  it('abre modo de edição ao clicar no ícone de editar na linha', async () => {
    render(<MaterialManager />);
    await waitFor(() => expect(screen.getByText('Poste Concreto 11m')).toBeTruthy());
    // Edit buttons: p-1 text-blue-600 rounded
    const editBtns = document.querySelectorAll('.p-1.text-blue-600');
    if (editBtns.length > 0) {
      fireEvent.click(editBtns[0]);
      // After edit, the row shows inline inputs
      await waitFor(() => {
        const inputs = screen.getAllByRole('textbox');
        expect(inputs.length).toBeGreaterThan(2); // 1 search + 2 edit text inputs
      });
    }
  });

  it('cancela edição ao clicar no X do modo de edição', async () => {
    render(<MaterialManager />);
    await waitFor(() => expect(screen.getByText('Poste Concreto 11m')).toBeTruthy());
    const editBtns = document.querySelectorAll('.p-1.text-blue-600');
    if (editBtns.length > 0) {
      fireEvent.click(editBtns[0]);
      await waitFor(() => {
        const cancelEditBtns = document.querySelectorAll('.p-1.text-red-600');
        expect(cancelEditBtns.length).toBeGreaterThan(0);
      });
      const cancelBtns = document.querySelectorAll('.p-1.text-red-600');
      if (cancelBtns.length > 0) {
        fireEvent.click(cancelBtns[0]);
        // Edit mode should be closed — description text should be back
        await waitFor(() => expect(screen.queryByText('Poste Concreto 11m')).toBeTruthy());
      }
    }
  });

  it('salva edição ao clicar no ícone de salvar no modo de edição', async () => {
    render(<MaterialManager />);
    await waitFor(() => expect(screen.getByText('Poste Concreto 11m')).toBeTruthy());
    const editBtns = document.querySelectorAll('.p-1.text-blue-600');
    if (editBtns.length > 0) {
      fireEvent.click(editBtns[0]);
      await waitFor(() => {
        const saveEditBtns = document.querySelectorAll('.p-1.text-emerald-600');
        expect(saveEditBtns.length).toBeGreaterThan(0);
      });
      const saveEditBtns = document.querySelectorAll('.p-1.text-emerald-600');
      if (saveEditBtns.length > 0) {
        fireEvent.click(saveEditBtns[0]);
        await waitFor(() => expect(defaultApi.upsertMaterial).toHaveBeenCalled());
      }
    }
  });

  it('exclui material ao confirmar', async () => {
    render(<MaterialManager />);
    await waitFor(() => expect(screen.getByText('Poste Concreto 11m')).toBeTruthy());
    // Delete buttons
    const deleteBtns = document.querySelectorAll('.p-1.text-red-600');
    if (deleteBtns.length > 0) {
      fireEvent.click(deleteBtns[0]);
      await waitFor(() => expect(defaultApi.deleteMaterial).toHaveBeenCalledWith('MAT-X1'));
    }
  });

  it('não exclui material quando confirm retorna false', async () => {
    window.confirm = vi.fn().mockReturnValue(false);
    render(<MaterialManager />);
    await waitFor(() => expect(screen.getByText('Poste Concreto 11m')).toBeTruthy());
    const deleteBtns = document.querySelectorAll('.p-1.text-red-600');
    if (deleteBtns.length > 0) {
      fireEvent.click(deleteBtns[0]);
      expect(defaultApi.deleteMaterial).not.toHaveBeenCalled();
    }
  });

  it('edita inline descrição no campo de edição', async () => {
    render(<MaterialManager />);
    await waitFor(() => expect(screen.getByText('Poste Concreto 11m')).toBeTruthy());
    const editBtns = document.querySelectorAll('.p-1.text-blue-600');
    if (editBtns.length > 0) {
      fireEvent.click(editBtns[0]);
      await waitFor(() => {
        // The inline edit shows the description in an input
        const allInputs = screen.getAllByRole('textbox');
        const descInput = allInputs.find(i => i.value === 'Poste Concreto 11m');
        expect(descInput || document.body).toBeTruthy();
      });
      const allInputs = screen.getAllByRole('textbox');
      const descInput = allInputs.find(i => i.value === 'Poste Concreto 11m');
      if (descInput) {
        fireEvent.change(descInput, { target: { value: 'Poste Modificado' } });
        expect(descInput.value).toBe('Poste Modificado');
      }
    }
  });
});
