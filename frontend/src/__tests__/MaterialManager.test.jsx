/**
 * MaterialManager.jsx — testes unitários
 * Gerenciador de materiais (CRUD completo)
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import MaterialManager from '../components/MaterialManager';
import { defaultApi } from './setup';

const MATERIAIS_MOCK = [
  { sap: 'MAT001', descricao: 'Condutor CAA 35mm²', unidade: 'M', preco_unitario: 12.5 },
  { sap: 'MAT002', descricao: 'Isolador pino 15kV', unidade: 'UN', preco_unitario: 45.0 },
  { sap: 'MAT003', descricao: 'Cruzeta dupla 2,40m', unidade: 'UN', preco_unitario: 78.9 },
];

describe('MaterialManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultApi.getAllMaterials.mockResolvedValue(MATERIAIS_MOCK);
    defaultApi.searchMaterials.mockResolvedValue([MATERIAIS_MOCK[0]]);
    defaultApi.upsertMaterial.mockResolvedValue({ changes: 1 });
    defaultApi.deleteMaterial.mockResolvedValue({ changes: 1 });
  });

  it('renderiza título Gerenciar Materiais', async () => {
    render(<MaterialManager />);
    expect(screen.getByText('Gerenciar Materiais')).toBeTruthy();
  });

  it('carrega materiais ao montar', async () => {
    render(<MaterialManager />);
    await waitFor(() => expect(defaultApi.getAllMaterials).toHaveBeenCalled());
  });

  it('exibe lista de materiais', async () => {
    render(<MaterialManager />);
    await waitFor(() => expect(screen.getByText('Condutor CAA 35mm²')).toBeTruthy());
    expect(screen.getByText('Isolador pino 15kV')).toBeTruthy();
  });

  it('exibe contador de materiais', async () => {
    render(<MaterialManager />);
    await waitFor(() => expect(screen.getByText(/3 materiais/)).toBeTruthy());
  });

  it('exibe mensagem de 0 materiais quando lista está vazia', async () => {
    defaultApi.getAllMaterials.mockResolvedValue([]);
    render(<MaterialManager />);
    await waitFor(() => expect(screen.getByText(/0 materiais/)).toBeTruthy());
  });

  it('busca materiais ao digitar e clicar em Buscar', async () => {
    render(<MaterialManager />);
    const input = screen.getByPlaceholderText('Buscar por SAP ou descrição...');
    fireEvent.change(input, { target: { value: 'CAA' } });
    fireEvent.click(screen.getByText('Buscar'));
    await waitFor(() => expect(defaultApi.searchMaterials).toHaveBeenCalledWith('CAA'));
  });

  it('busca materiais ao pressionar Enter', async () => {
    render(<MaterialManager />);
    const input = screen.getByPlaceholderText('Buscar por SAP ou descrição...');
    fireEvent.change(input, { target: { value: 'isolador' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(defaultApi.searchMaterials).toHaveBeenCalledWith('isolador'));
  });

  it('abre formulário de novo material ao clicar em Novo Material', async () => {
    render(<MaterialManager />);
    fireEvent.click(screen.getByText('Novo Material'));
    expect(screen.getByPlaceholderText('SAP')).toBeTruthy();
  });

  it('fecha formulário ao clicar em Novo Material novamente (toggle)', async () => {
    render(<MaterialManager />);
    fireEvent.click(screen.getByText('Novo Material'));
    expect(screen.getByPlaceholderText('SAP')).toBeTruthy();
    fireEvent.click(screen.getByText('Novo Material'));
    await waitFor(() => expect(screen.queryByPlaceholderText('SAP')).toBeFalsy());
  });

  it('não crasha quando window.api não está disponível', () => {
    const backup = window.api;
    window.api = undefined;
    expect(() => render(<MaterialManager />)).not.toThrow();
    window.api = backup;
  });

  it('exibe unidades dos materiais', async () => {
    render(<MaterialManager />);
    await waitFor(() => expect(screen.getAllByText('M').length).toBeGreaterThan(0));
  });

  it('exibe preços formatados', async () => {
    render(<MaterialManager />);
    await waitFor(() => expect(screen.getByText('12.50')).toBeTruthy());
  });
});
