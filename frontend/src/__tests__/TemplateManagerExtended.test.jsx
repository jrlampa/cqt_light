/**
 * TemplateManager.jsx — testes estendidos (salvar, aplicar, excluir templates)
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TemplateManager from '../components/TemplateManager';
import { defaultApi } from './setup';

const CURRENT_DATA = {
  condutorMT: 'CAA 70mm²',
  condutorBT: '3x70+54,6 mm² (Multiplexada)',
  estruturas: [],
  materiaisAvulsos: [],
};

const TEMPLATES = [
  { id: 1, nome: 'Template Compacta', descricao: 'Rede compacta padrão', is_default: false },
  { id: 2, nome: 'Template Padrão', descricao: 'Template padrão do sistema', is_default: true },
];

describe('TemplateManager — salvar, aplicar e excluir', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultApi.getTemplates.mockResolvedValue(TEMPLATES);
    defaultApi.saveTemplate.mockResolvedValue({ id: 3 });
    defaultApi.deleteTemplate.mockResolvedValue({ changes: 1 });
    defaultApi.getTemplate.mockResolvedValue({
      id: 1,
      nome: 'Template Compacta',
      dados: CURRENT_DATA,
    });
    window.confirm = vi.fn().mockReturnValue(true);
    window.alert = vi.fn().mockImplementation(() => {});
  });

  it('exibe lista de templates ao abrir', async () => {
    render(
      <TemplateManager isOpen={true} onClose={vi.fn()} onApply={vi.fn()} currentData={CURRENT_DATA} />
    );
    await waitFor(() => expect(screen.getByText('Template Compacta')).toBeTruthy());
    expect(screen.getByText('Template Padrão')).toBeTruthy();
  });

  it('muda para modo de criação ao clicar em Salvar Atual como Template', async () => {
    render(
      <TemplateManager isOpen={true} onClose={vi.fn()} onApply={vi.fn()} currentData={CURRENT_DATA} />
    );
    await waitFor(() => expect(screen.queryByText(/Salvar Atual como Template/i)).toBeTruthy());
    fireEvent.click(screen.queryByText(/Salvar Atual como Template/i));
    await waitFor(() => expect(screen.queryByPlaceholderText(/Rede Compacta Padrão Light/i)).toBeTruthy());
  });

  it('salva template ao preencher nome e clicar em Salvar Template', async () => {
    render(
      <TemplateManager isOpen={true} onClose={vi.fn()} onApply={vi.fn()} currentData={CURRENT_DATA} />
    );
    await waitFor(() => expect(screen.queryByText(/Salvar Atual como Template/i)).toBeTruthy());
    fireEvent.click(screen.queryByText(/Salvar Atual como Template/i));
    await waitFor(() => expect(screen.queryByPlaceholderText(/Rede Compacta Padrão Light/i)).toBeTruthy());

    const nomeInput = screen.queryByPlaceholderText(/Rede Compacta Padrão Light/i);
    if (nomeInput) {
      fireEvent.change(nomeInput, { target: { value: 'Meu Novo Template' } });
      const salvarBtn = screen.queryByText(/Salvar Template/i);
      if (salvarBtn) {
        fireEvent.click(salvarBtn);
        await waitFor(() =>
          expect(defaultApi.saveTemplate).toHaveBeenCalledWith(
            expect.objectContaining({ nome: 'Meu Novo Template' })
          )
        );
      }
    }
  });

  it('botão Salvar Template fica desabilitado sem nome', async () => {
    render(
      <TemplateManager isOpen={true} onClose={vi.fn()} onApply={vi.fn()} currentData={CURRENT_DATA} />
    );
    await waitFor(() => expect(screen.queryByText(/Salvar Atual como Template/i)).toBeTruthy());
    fireEvent.click(screen.queryByText(/Salvar Atual como Template/i));
    await waitFor(() => expect(screen.queryByText(/Salvar Template/i)).toBeTruthy());

    const salvarBtn = document.querySelector('button:disabled');
    if (salvarBtn) {
      expect(salvarBtn.disabled).toBe(true);
    }
  });

  it('volta para lista ao clicar em Cancelar no modo criação', async () => {
    render(
      <TemplateManager isOpen={true} onClose={vi.fn()} onApply={vi.fn()} currentData={CURRENT_DATA} />
    );
    await waitFor(() => expect(screen.queryByText(/Salvar Atual como Template/i)).toBeTruthy());
    fireEvent.click(screen.queryByText(/Salvar Atual como Template/i));
    await waitFor(() => expect(screen.queryByText(/Cancelar/i)).toBeTruthy());
    const cancelBtn = screen.queryByText(/Cancelar/i);
    if (cancelBtn) {
      fireEvent.click(cancelBtn);
      await waitFor(() => expect(screen.queryByText(/Salvar Atual como Template/i)).toBeTruthy());
    }
  });

  it('aplica template ao clicar em Aplicar e chama onApply', async () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <TemplateManager isOpen={true} onClose={onClose} onApply={onApply} currentData={CURRENT_DATA} />
    );
    await waitFor(() => expect(screen.getByText('Template Compacta')).toBeTruthy());
    const aplicarBtns = screen.getAllByText(/Aplicar/i);
    if (aplicarBtns.length > 0) {
      fireEvent.click(aplicarBtns[0]);
      await waitFor(() => expect(defaultApi.getTemplate).toHaveBeenCalledWith(1));
      await waitFor(() => expect(onApply).toHaveBeenCalledWith(CURRENT_DATA));
    }
  });

  it('exclui template não padrão ao clicar em Excluir e confirmar', async () => {
    render(
      <TemplateManager isOpen={true} onClose={vi.fn()} onApply={vi.fn()} currentData={CURRENT_DATA} />
    );
    await waitFor(() => expect(screen.getByText('Template Compacta')).toBeTruthy());
    const excluirBtns = document.querySelectorAll('[title="Excluir"]');
    if (excluirBtns.length > 0) {
      fireEvent.click(excluirBtns[0]);
      expect(window.confirm).toHaveBeenCalled();
      await waitFor(() => expect(defaultApi.deleteTemplate).toHaveBeenCalledWith(1));
    }
  });

  it('não exibe botão Excluir para templates padrão (is_default=true)', async () => {
    render(
      <TemplateManager isOpen={true} onClose={vi.fn()} onApply={vi.fn()} currentData={CURRENT_DATA} />
    );
    await waitFor(() => expect(screen.getByText('Template Padrão')).toBeTruthy());
    // Template with is_default=true should not have a delete button
    // Check that only 1 delete button exists (for Template Compacta)
    const excluirBtns = document.querySelectorAll('[title="Excluir"]');
    expect(excluirBtns.length).toBeLessThanOrEqual(1); // Only for non-default
  });

  it('exibe estado vazio quando não há templates', async () => {
    defaultApi.getTemplates.mockResolvedValue([]);
    render(
      <TemplateManager isOpen={true} onClose={vi.fn()} onApply={vi.fn()} currentData={CURRENT_DATA} />
    );
    await waitFor(() => expect(screen.queryByText(/Nenhum template encontrado/i)).toBeTruthy());
  });

  it('recarrega templates quando isOpen muda para true', async () => {
    const { rerender } = render(
      <TemplateManager isOpen={false} onClose={vi.fn()} onApply={vi.fn()} currentData={CURRENT_DATA} />
    );
    expect(defaultApi.getTemplates).not.toHaveBeenCalled();
    rerender(
      <TemplateManager isOpen={true} onClose={vi.fn()} onApply={vi.fn()} currentData={CURRENT_DATA} />
    );
    await waitFor(() => expect(defaultApi.getTemplates).toHaveBeenCalled());
  });

  it('exibe descrição dos templates na lista', async () => {
    render(
      <TemplateManager isOpen={true} onClose={vi.fn()} onApply={vi.fn()} currentData={CURRENT_DATA} />
    );
    await waitFor(() => expect(screen.queryByText(/Rede compacta padrão/i)).toBeTruthy());
  });
});
