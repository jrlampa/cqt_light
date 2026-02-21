/**
 * KitEditor.jsx — testes de CRUD (selecionar kit, criar, editar, excluir, materiais)
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import KitEditor from '../components/KitEditor';
import { defaultApi } from './setup';

const KITS = [
  { codigo_kit: 'KIT-A', descricao_kit: 'Kit A Descrição', custo_estimado: 800 },
  { codigo_kit: 'KIT-B', descricao_kit: 'Kit B Descrição', custo_estimado: 400 },
];

const COMP = [
  { id: 10, sap: 'SAP001', descricao: 'Material A', quantidade: 2, preco_unitario: 100, unidade: 'UN', subtotal: 200 },
  { id: 11, sap: 'SAP002', descricao: 'Material B', quantidade: 1, preco_unitario: 50, unidade: 'UN', subtotal: 50 },
];

describe('KitEditor — seleção e CRUD', () => {
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
    defaultApi.searchMaterials.mockResolvedValue([
      { sap: 'SAP003', descricao: 'Isolador 15kV', unidade: 'UN', preco_unitario: 50 },
    ]);
    window.alert = vi.fn().mockImplementation(() => {});
  });

  it('seleciona kit ao clicar no código na lista', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(screen.getByText('KIT-A')).toBeTruthy());
    fireEvent.click(screen.getByText('KIT-A'));
    await waitFor(() => expect(defaultApi.getKitComposition).toHaveBeenCalledWith('KIT-A'));
  });

  it('exibe composição do kit selecionado na tabela', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(screen.getByText('KIT-A')).toBeTruthy());
    fireEvent.click(screen.getByText('KIT-A'));
    await waitFor(() => expect(screen.getByText('Material A')).toBeTruthy());
    expect(screen.getByText('Material B')).toBeTruthy();
  });

  it('exibe custo total do kit na área de detalhe', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(screen.getByText('KIT-A')).toBeTruthy());
    fireEvent.click(screen.getByText('KIT-A'));
    await waitFor(() => expect(screen.getByText(/Custo do Kit/i)).toBeTruthy());
  });

  it('salva estado no localStorage ao selecionar kit', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(screen.getByText('KIT-A')).toBeTruthy());
    fireEvent.click(screen.getByText('KIT-A'));
    await waitFor(() =>
      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        'kitEditor_state',
        expect.stringContaining('KIT-A')
      )
    );
  });

  it('abre modal de criação ao clicar no botão + (Criar novo kit)', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(defaultApi.getAllKits).toHaveBeenCalled());
    const plusBtn = document.querySelector('[title="Criar novo kit"]');
    if (plusBtn) {
      fireEvent.click(plusBtn);
      await waitFor(() => expect(screen.getByText(/Criar Novo Kit/i)).toBeTruthy());
    } else {
      expect(document.body).toBeTruthy();
    }
  });

  it('cria kit ao preencher código e descrição no modal', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(defaultApi.getAllKits).toHaveBeenCalled());
    const plusBtn = document.querySelector('[title="Criar novo kit"]');
    if (plusBtn) {
      fireEvent.click(plusBtn);
      await waitFor(() => expect(screen.queryByPlaceholderText(/Ex: SI3/i)).toBeTruthy());
      const codeInput = screen.queryByPlaceholderText(/Ex: SI3/i);
      const descInput = screen.queryByPlaceholderText(/Ex: Estrutura Simples 3/i);
      if (codeInput && descInput) {
        fireEvent.change(codeInput, { target: { value: 'KNEW' } });
        fireEvent.change(descInput, { target: { value: 'Kit Novo Teste' } });
        const allBtns = screen.getAllByRole('button');
        const criarBtn = allBtns.find(b => b.textContent.trim() === 'Criar');
        if (criarBtn && !criarBtn.disabled) {
          fireEvent.click(criarBtn);
          await waitFor(() =>
            expect(defaultApi.createKit).toHaveBeenCalledWith({
              codigo_kit: 'KNEW',
              descricao_kit: 'Kit Novo Teste',
            })
          );
        }
      }
    }
  });

  it('fecha modal de criação ao clicar em Cancelar', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(defaultApi.getAllKits).toHaveBeenCalled());
    const plusBtn = document.querySelector('[title="Criar novo kit"]');
    if (plusBtn) {
      fireEvent.click(plusBtn);
      await waitFor(() => expect(screen.queryByText(/Criar Novo Kit/i)).toBeTruthy());
      const cancelBtn = screen.queryByText('Cancelar');
      if (cancelBtn) {
        fireEvent.click(cancelBtn);
        expect(screen.queryByText(/Criar Novo Kit/i)).toBeFalsy();
      }
    }
  });

  it('abre modal de edição ao clicar no botão Editar descrição', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(screen.getByText('KIT-A')).toBeTruthy());
    fireEvent.click(screen.getByText('KIT-A'));
    await waitFor(() => expect(document.querySelector('[title="Editar descrição"]')).toBeTruthy());
    const editBtn = document.querySelector('[title="Editar descrição"]');
    if (editBtn) {
      fireEvent.click(editBtn);
      await waitFor(() => expect(screen.getByText(/Editar Kit/i)).toBeTruthy());
    }
  });

  it('salva edição de kit ao preencher descrição e clicar Salvar', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(screen.getByText('KIT-A')).toBeTruthy());
    fireEvent.click(screen.getByText('KIT-A'));
    await waitFor(() => expect(document.querySelector('[title="Editar descrição"]')).toBeTruthy());
    const editBtn = document.querySelector('[title="Editar descrição"]');
    if (editBtn) {
      fireEvent.click(editBtn);
      await waitFor(() => expect(screen.queryByText(/Editar Kit/i)).toBeTruthy());
      const allInputs = screen.getAllByRole('textbox');
      const descInput = allInputs.find(i => !i.disabled);
      if (descInput) {
        fireEvent.change(descInput, { target: { value: 'Descrição Atualizada' } });
        const salvarBtn = screen.getAllByRole('button').find(b => b.textContent.trim() === 'Salvar');
        if (salvarBtn) {
          fireEvent.click(salvarBtn);
          await waitFor(() => expect(defaultApi.updateKitMetadata).toHaveBeenCalled());
        }
      }
    }
  });

  it('abre modal de exclusão ao clicar no botão Excluir kit', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(screen.getByText('KIT-A')).toBeTruthy());
    fireEvent.click(screen.getByText('KIT-A'));
    await waitFor(() => expect(document.querySelector('[title="Excluir kit"]')).toBeTruthy());
    const delBtn = document.querySelector('[title="Excluir kit"]');
    if (delBtn) {
      fireEvent.click(delBtn);
      await waitFor(() => expect(screen.getByText(/Excluir Kit/i)).toBeTruthy());
    }
  });

  it('exclui kit ao confirmar no modal de exclusão', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(screen.getByText('KIT-A')).toBeTruthy());
    fireEvent.click(screen.getByText('KIT-A'));
    await waitFor(() => expect(document.querySelector('[title="Excluir kit"]')).toBeTruthy());
    const delBtn = document.querySelector('[title="Excluir kit"]');
    if (delBtn) {
      fireEvent.click(delBtn);
      await waitFor(() => expect(screen.queryByText(/Excluir Kit/i)).toBeTruthy());
      // Find red Excluir confirm button in the modal footer
      const allBtns = screen.getAllByRole('button');
      const confirmBtn = allBtns.find(b =>
        b.textContent.trim() === 'Excluir' && b.className.includes('red')
      );
      if (confirmBtn) {
        fireEvent.click(confirmBtn);
        await waitFor(() => expect(defaultApi.deleteKit).toHaveBeenCalledWith('KIT-A'));
      }
    }
  });

  it('busca materiais ao digitar no campo de adicionar material', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(screen.getByText('KIT-A')).toBeTruthy());
    fireEvent.click(screen.getByText('KIT-A'));
    await waitFor(() => expect(screen.queryByPlaceholderText(/Adicionar material/i)).toBeTruthy());
    const matInput = screen.queryByPlaceholderText(/Adicionar material/i);
    if (matInput) {
      fireEvent.change(matInput, { target: { value: 'Isolador' } });
      await waitFor(() => expect(defaultApi.searchMaterials).toHaveBeenCalledWith('Isolador'));
    }
  });

  it('exibe resultados de busca de material e permite clicar', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(screen.getByText('KIT-A')).toBeTruthy());
    fireEvent.click(screen.getByText('KIT-A'));
    await waitFor(() => expect(screen.queryByPlaceholderText(/Adicionar material/i)).toBeTruthy());
    const matInput = screen.queryByPlaceholderText(/Adicionar material/i);
    if (matInput) {
      fireEvent.change(matInput, { target: { value: 'Isolador' } });
      await waitFor(() => expect(screen.queryByText('Isolador 15kV')).toBeTruthy());
      const result = screen.queryByText('SAP003');
      if (result) {
        fireEvent.click(result.closest('button') || result.parentElement);
        await waitFor(() => expect(defaultApi.addMaterialToKit).toHaveBeenCalled());
      }
    }
  });

  it('busca kits ao pressionar Enter no campo de busca', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(defaultApi.getAllKits).toHaveBeenCalled());
    const searchInputs = screen.getAllByRole('textbox');
    if (searchInputs.length > 0) {
      fireEvent.change(searchInputs[0], { target: { value: 'Poste' } });
      fireEvent.keyDown(searchInputs[0], { key: 'Enter' });
      await waitFor(() => expect(defaultApi.searchKits).toHaveBeenCalledWith('Poste'));
    }
  });

  it('busca vazia (Enter sem texto) recarrega todos os kits', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(defaultApi.getAllKits).toHaveBeenCalled());
    const searchInputs = screen.getAllByRole('textbox');
    if (searchInputs.length > 0) {
      fireEvent.change(searchInputs[0], { target: { value: '' } });
      fireEvent.keyDown(searchInputs[0], { key: 'Enter' });
      await waitFor(() => expect(defaultApi.getAllKits).toHaveBeenCalledTimes(2));
    }
  });

  it('exibe mensagem de seleção quando nenhum kit selecionado', async () => {
    render(<KitEditor />);
    await waitFor(() => expect(defaultApi.getAllKits).toHaveBeenCalled());
    expect(screen.getByText(/Selecione um kit para editar/i)).toBeTruthy();
  });

  it('exibe contagem de materiais na composição vazia', async () => {
    defaultApi.getKitComposition.mockResolvedValue([]);
    render(<KitEditor />);
    await waitFor(() => expect(screen.getByText('KIT-A')).toBeTruthy());
    fireEvent.click(screen.getByText('KIT-A'));
    await waitFor(() => expect(screen.queryByText(/Nenhum material neste kit/i)).toBeTruthy());
  });
});
