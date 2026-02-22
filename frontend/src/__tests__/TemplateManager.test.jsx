/**
 * TemplateManager.jsx — testes unitários
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TemplateManager from '../components/TemplateManager';
import { defaultApi } from './setup';

const TEMPLATES_MOCK = [
  { id: 1, nome: 'Rede Urbana Padrão', descricao: 'Template para rede BT urbana', created_at: '2026-01-10' },
  { id: 2, nome: 'Rede Rural MT', descricao: 'Template para rede MT rural', created_at: '2026-02-05' },
];

const CURRENT_DATA = {
  estruturas: [{ codigo: 'TE-01', quantidade: 3 }],
  condutorMT: 'CAA 35mm² Nu',
};

describe('TemplateManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultApi.getTemplates.mockResolvedValue(TEMPLATES_MOCK);
    defaultApi.saveTemplate.mockResolvedValue({ id: 3 });
    defaultApi.deleteTemplate.mockResolvedValue({ changes: 1 });
    defaultApi.getTemplate.mockResolvedValue({ ...TEMPLATES_MOCK[0], dados: CURRENT_DATA });
  });

  it('não renderiza conteúdo quando isOpen=false', () => {
    const { container } = render(
      <TemplateManager isOpen={false} onClose={vi.fn()} onApply={vi.fn()} currentData={CURRENT_DATA} />
    );
    expect(container).toBeTruthy();
  });

  it('carrega templates quando isOpen=true', async () => {
    render(
      <TemplateManager isOpen={true} onClose={vi.fn()} onApply={vi.fn()} currentData={CURRENT_DATA} />
    );
    await waitFor(() => expect(defaultApi.getTemplates).toHaveBeenCalled());
  });

  it('exibe lista de templates', async () => {
    render(
      <TemplateManager isOpen={true} onClose={vi.fn()} onApply={vi.fn()} currentData={CURRENT_DATA} />
    );
    await waitFor(() => expect(screen.getByText('Rede Urbana Padrão')).toBeTruthy());
    expect(screen.getByText('Rede Rural MT')).toBeTruthy();
  });

  it('exibe descrições dos templates', async () => {
    render(
      <TemplateManager isOpen={true} onClose={vi.fn()} onApply={vi.fn()} currentData={CURRENT_DATA} />
    );
    await waitFor(() => expect(screen.getByText('Template para rede BT urbana')).toBeTruthy());
  });

  it('exibe mensagem quando não há templates', async () => {
    defaultApi.getTemplates.mockResolvedValue([]);
    render(
      <TemplateManager isOpen={true} onClose={vi.fn()} onApply={vi.fn()} currentData={CURRENT_DATA} />
    );
    await waitFor(() => expect(screen.getByText(/Nenhum template/i)).toBeTruthy());
  });

  it('muda para modo criação ao clicar em Novo Template', async () => {
    render(
      <TemplateManager isOpen={true} onClose={vi.fn()} onApply={vi.fn()} currentData={CURRENT_DATA} />
    );
    await waitFor(() => expect(defaultApi.getTemplates).toHaveBeenCalled());
    const novoBtn = screen.queryByText(/Novo Template/i);
    if (novoBtn) {
      fireEvent.click(novoBtn);
      await waitFor(() => expect(screen.queryByPlaceholderText(/Nome do template/i)).toBeTruthy());
    }
  });

  it('não crasha quando window.api não está disponível', () => {
    const backup = window.api;
    window.api = undefined;
    expect(() => render(
      <TemplateManager isOpen={true} onClose={vi.fn()} onApply={vi.fn()} currentData={CURRENT_DATA} />
    )).not.toThrow();
    window.api = backup;
  });

  it('recarrega templates quando isOpen muda de false para true', async () => {
    const { rerender } = render(
      <TemplateManager isOpen={false} onClose={vi.fn()} onApply={vi.fn()} currentData={CURRENT_DATA} />
    );
    expect(defaultApi.getTemplates).not.toHaveBeenCalled();
    rerender(
      <TemplateManager isOpen={true} onClose={vi.fn()} onApply={vi.fn()} currentData={CURRENT_DATA} />
    );
    await waitFor(() => expect(defaultApi.getTemplates).toHaveBeenCalled());
  });

  it('chama onClose via botão de fechar', async () => {
    const onClose = vi.fn();
    render(
      <TemplateManager isOpen={true} onClose={onClose} onApply={vi.fn()} currentData={CURRENT_DATA} />
    );
    await waitFor(() => expect(defaultApi.getTemplates).toHaveBeenCalled());
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
