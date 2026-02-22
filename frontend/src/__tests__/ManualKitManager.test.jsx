/**
 * ManualKitManager.jsx — testes unitários (smoke tests)
 * Gerenciador de kits manuais/templates parciais
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ManualKitManager from '../components/ManualKitManager';
import { defaultApi } from './setup';

const TEMPLATES_MANUAIS_MOCK = [
  { id: 1, nome_template: 'Kit E-10/500', kit_base: 'TE-01', materiais: [], observacao: '' },
  { id: 2, nome_template: 'Kit Padrão MT', kit_base: 'TE-02', materiais: [], observacao: 'uso interno' },
];

describe('ManualKitManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultApi.getAllTemplatesManuais.mockResolvedValue(TEMPLATES_MANUAIS_MOCK);
    defaultApi.saveTemplateManual.mockResolvedValue({ id: 3 });
    defaultApi.deleteTemplateManual.mockResolvedValue({ changes: 1 });
    defaultApi.searchMaterials.mockResolvedValue([]);
  });

  it('não carrega templates quando isOpen=false', () => {
    render(<ManualKitManager isOpen={false} onClose={vi.fn()} />);
    expect(defaultApi.getAllTemplatesManuais).not.toHaveBeenCalled();
  });

  it('carrega templates quando isOpen=true', async () => {
    render(<ManualKitManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(defaultApi.getAllTemplatesManuais).toHaveBeenCalled());
  });

  it('exibe lista de templates manuais', async () => {
    render(<ManualKitManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Kit E-10/500')).toBeTruthy());
    expect(screen.getByText('Kit Padrão MT')).toBeTruthy();
  });

  it('exibe mensagem quando não há templates', async () => {
    defaultApi.getAllTemplatesManuais.mockResolvedValue([]);
    render(<ManualKitManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/Nenhum template/i)).toBeTruthy());
  });

  it('recarrega templates quando isOpen muda de false para true', async () => {
    const { rerender } = render(<ManualKitManager isOpen={false} onClose={vi.fn()} />);
    expect(defaultApi.getAllTemplatesManuais).not.toHaveBeenCalled();
    rerender(<ManualKitManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(defaultApi.getAllTemplatesManuais).toHaveBeenCalled());
  });

  it('não crasha quando window.api não está disponível', () => {
    const backup = window.api;
    window.api = undefined;
    expect(() => render(<ManualKitManager isOpen={true} onClose={vi.fn()} />)).not.toThrow();
    window.api = backup;
  });

  it('exibe campo de busca de templates', async () => {
    render(<ManualKitManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(defaultApi.getAllTemplatesManuais).toHaveBeenCalled());
    expect(screen.getByPlaceholderText(/Buscar templates/i)).toBeTruthy();
  });

  it('filtra templates ao digitar no campo de busca', async () => {
    render(<ManualKitManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Kit E-10/500')).toBeTruthy());
    const searchInput = screen.getByPlaceholderText(/Buscar templates/i);
    fireEvent.change(searchInput, { target: { value: 'MT' } });
    await waitFor(() => expect(screen.queryByText('Kit E-10/500')).toBeFalsy());
    expect(screen.getByText('Kit Padrão MT')).toBeTruthy();
  });

  it('exibe botão de novo kit', async () => {
    render(<ManualKitManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(defaultApi.getAllTemplatesManuais).toHaveBeenCalled());
    const novoBtn = screen.queryByText(/Novo Kit/i);
    expect(novoBtn).toBeTruthy();
  });

  it('muda para view de edição ao clicar em Novo Kit', async () => {
    render(<ManualKitManager isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => expect(defaultApi.getAllTemplatesManuais).toHaveBeenCalled());
    const novoBtn = screen.queryByText(/Novo Kit/i);
    if (novoBtn) {
      fireEvent.click(novoBtn);
      await waitFor(() => expect(screen.queryByPlaceholderText(/Ex: SEU_CODIGO/i)).toBeTruthy());
    }
  });
});
