/**
 * Testes para o componente Toast.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Toast from '../components/Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renderiza a mensagem', () => {
    render(<Toast mensagem="Aviso PRODIST" />);
    expect(screen.getByText('Aviso PRODIST')).toBeDefined();
  });

  it('tem role="alert" para acessibilidade', () => {
    render(<Toast mensagem="Teste" />);
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('exibe ícone de aviso por padrão', () => {
    render(<Toast mensagem="Teste" />);
    expect(screen.getByText('⚠️')).toBeDefined();
  });

  it('exibe ícone correto para tipo "erro"', () => {
    render(<Toast mensagem="Erro" tipo="erro" />);
    expect(screen.getByText('❌')).toBeDefined();
  });

  it('exibe ícone correto para tipo "sucesso"', () => {
    render(<Toast mensagem="OK" tipo="sucesso" />);
    expect(screen.getByText('✅')).toBeDefined();
  });

  it('exibe ícone correto para tipo "info"', () => {
    render(<Toast mensagem="Info" tipo="info" />);
    expect(screen.getByText('ℹ️')).toBeDefined();
  });

  it('usa tipo "aviso" como padrão para tipo desconhecido', () => {
    render(<Toast mensagem="Desconhecido" tipo="xyz" />);
    expect(screen.getByText('⚠️')).toBeDefined();
  });

  it('fecha ao clicar no botão ×', () => {
    render(<Toast mensagem="Fechar" duracao={0} />);
    const btn = screen.getByLabelText('Fechar notificação');
    fireEvent.click(btn);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('chama onFechar ao clicar em ×', () => {
    const onFechar = vi.fn();
    render(<Toast mensagem="CB" duracao={0} onFechar={onFechar} />);
    fireEvent.click(screen.getByLabelText('Fechar notificação'));
    expect(onFechar).toHaveBeenCalledOnce();
  });

  it('some automaticamente após duracao ms', async () => {
    render(<Toast mensagem="Auto" duracao={3000} />);
    expect(screen.getByRole('alert')).toBeDefined();
    act(() => { vi.advanceTimersByTime(3001); });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('chama onFechar após duracao', () => {
    const onFechar = vi.fn();
    render(<Toast mensagem="CB2" duracao={2000} onFechar={onFechar} />);
    act(() => { vi.advanceTimersByTime(2001); });
    expect(onFechar).toHaveBeenCalledOnce();
  });

  it('duracao=0 não fecha automaticamente', () => {
    render(<Toast mensagem="Permanente" duracao={0} />);
    act(() => { vi.advanceTimersByTime(10000); });
    expect(screen.getByRole('alert')).toBeDefined();
  });
});
