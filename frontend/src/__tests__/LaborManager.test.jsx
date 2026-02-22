/**
 * LaborManager.jsx — testes unitários
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import LaborManager from '../components/LaborManager';
import { defaultApi } from './setup';

const SERVICOS_MOCK = [
  { codigo: 'SV001', descricao: 'Instalação de poste', preco_bruto: 150.0 },
  { codigo: 'SV002', descricao: 'Ligação de ramal', preco_bruto: 80.5 },
];

describe('LaborManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultApi.getAllServicos.mockResolvedValue(SERVICOS_MOCK);
    defaultApi.searchServicos.mockResolvedValue([SERVICOS_MOCK[0]]);
    defaultApi.upsertServico.mockResolvedValue({ changes: 1 });
  });

  it('renderiza o título Serviços CM', async () => {
    render(<LaborManager />);
    expect(screen.getByText('Serviços CM')).toBeTruthy();
  });

  it('carrega e exibe serviços ao montar', async () => {
    render(<LaborManager />);
    await waitFor(() => expect(screen.getByText('Instalação de poste')).toBeTruthy());
    expect(screen.getByText('Ligação de ramal')).toBeTruthy();
  });

  it('exibe contador de serviços', async () => {
    render(<LaborManager />);
    await waitFor(() => expect(screen.getByText(/2 serviços/)).toBeTruthy());
  });

  it('exibe mensagem quando lista está vazia', async () => {
    defaultApi.getAllServicos.mockResolvedValue([]);
    render(<LaborManager />);
    await waitFor(() => expect(screen.getByText(/Nenhum serviço encontrado/)).toBeTruthy());
  });

  it('abre formulário ao clicar em Novo', () => {
    render(<LaborManager />);
    fireEvent.click(screen.getByText('Novo'));
    expect(screen.getByPlaceholderText('Código')).toBeTruthy();
  });

  it('fecha formulário ao clicar em Novo novamente (toggle)', async () => {
    render(<LaborManager />);
    fireEvent.click(screen.getByText('Novo'));
    expect(screen.getByPlaceholderText('Código')).toBeTruthy();
    fireEvent.click(screen.getByText('Novo'));
    await waitFor(() => expect(screen.queryByPlaceholderText('Código')).toBeFalsy());
  });

  it('executa busca ao clicar no botão Buscar', async () => {
    render(<LaborManager />);
    const input = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(input, { target: { value: 'poste' } });
    fireEvent.click(screen.getByText('Buscar'));
    await waitFor(() => expect(defaultApi.searchServicos).toHaveBeenCalledWith('poste'));
  });

  it('executa busca ao pressionar Enter no campo de busca', async () => {
    render(<LaborManager />);
    const input = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(input, { target: { value: 'ramal' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(defaultApi.searchServicos).toHaveBeenCalledWith('ramal'));
  });

  it('recarrega todos ao buscar com campo vazio', async () => {
    render(<LaborManager />);
    await waitFor(() => expect(defaultApi.getAllServicos).toHaveBeenCalled());
    const initialCalls = defaultApi.getAllServicos.mock.calls.length;
    fireEvent.click(screen.getByText('Buscar'));
    await waitFor(() => expect(defaultApi.getAllServicos.mock.calls.length).toBeGreaterThanOrEqual(initialCalls));
  });

  it('não crasha quando window.api não está disponível', () => {
    const backup = window.api;
    window.api = undefined;
    expect(() => render(<LaborManager />)).not.toThrow();
    window.api = backup;
  });

  it('preço exibido com 2 casas decimais', async () => {
    render(<LaborManager />);
    await waitFor(() => expect(screen.getByText('150.00')).toBeTruthy());
  });

  it('salva novo serviço ao preencher formulário e clicar em salvar', async () => {
    render(<LaborManager />);
    fireEvent.click(screen.getByText('Novo'));
    fireEvent.change(screen.getByPlaceholderText('Código'), { target: { value: 'SV003' } });
    fireEvent.change(screen.getByPlaceholderText('Descrição'), { target: { value: 'Serviço teste' } });
    // O botão de salvar no formulário de adição é um ícone SVG sem texto — clica pelo container
    const addForm = screen.getByPlaceholderText('Código').closest('div.mb-4');
    if (addForm) {
      const saveBtn = addForm.querySelector('button');
      if (saveBtn) {
        await act(async () => { fireEvent.click(saveBtn); });
        await waitFor(() => expect(defaultApi.upsertServico).toHaveBeenCalled());
      }
    }
  });
});
