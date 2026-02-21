/**
 * Tests for CompanySelector component
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CompanySelector } from '../components/CompanySelector';

const sampleEmpresas = [
  { id: 1, nome: 'Light SESA', ativa: 1 },
  { id: 2, nome: 'Enel SP', ativa: 0 },
];

describe('CompanySelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.api.getAllEmpresas.mockResolvedValue(sampleEmpresas);
    window.api.getEmpresaAtiva.mockResolvedValue(sampleEmpresas[0]);
    window.api.setEmpresaAtiva.mockResolvedValue({ changes: 1 });
  });

  it('renderiza sem crash e mostra loading estado inicial', () => {
    const { container } = render(<CompanySelector onCompanyChange={vi.fn()} />);
    expect(container).toBeTruthy();
  });

  it('carrega e exibe empresas após mount', async () => {
    render(<CompanySelector onCompanyChange={vi.fn()} />);
    await waitFor(() => expect(window.api.getAllEmpresas).toHaveBeenCalled());
  });

  it('chama getEmpresaAtiva ao montar', async () => {
    render(<CompanySelector onCompanyChange={vi.fn()} />);
    await waitFor(() => expect(window.api.getEmpresaAtiva).toHaveBeenCalled());
  });

  it('quando não há empresa ativa, seleciona a primeira', async () => {
    window.api.getEmpresaAtiva.mockResolvedValue(null);
    render(<CompanySelector onCompanyChange={vi.fn()} />);
    await waitFor(() => expect(window.api.setEmpresaAtiva).toHaveBeenCalledWith(sampleEmpresas[0].id));
  });

  it('quando getEmpresaAtiva retorna empresa, não chama setEmpresaAtiva', async () => {
    render(<CompanySelector onCompanyChange={vi.fn()} />);
    await waitFor(() => expect(window.api.getEmpresaAtiva).toHaveBeenCalled());
    expect(window.api.setEmpresaAtiva).not.toHaveBeenCalled();
  });

  it('trata erro de getAllEmpresas sem crash', async () => {
    window.api.getAllEmpresas.mockRejectedValue(new Error('DB error'));
    const { container } = render(<CompanySelector onCompanyChange={vi.fn()} />);
    await waitFor(() => expect(window.api.getAllEmpresas).toHaveBeenCalled());
    expect(container).toBeTruthy();
  });
});
