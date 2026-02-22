/**
 * Tests for QuantityPopup component
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuantityPopup } from '../components/QuantityPopup';

const estruturaPendente = {
  codigo_kit: '13N1',
  descricao_kit: 'Kit Poste Simples MT',
};

const materialPendente = {
  sap: 'MAT001',
  descricao: 'Condutor CAA 35mm²',
};

const baseProps = {
  pendingItem: estruturaPendente,
  pendingType: 'structure',
  qty: 1,
  setQty: vi.fn(),
  qtyInputRef: { current: null },
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
  onKeyDown: vi.fn(),
};

describe('QuantityPopup', () => {
  it('renderiza null quando pendingItem é null', () => {
    const { container } = render(<QuantityPopup {...baseProps} pendingItem={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('exibe título "Quantidade"', () => {
    render(<QuantityPopup {...baseProps} />);
    expect(screen.getByText('Quantidade')).toBeTruthy();
  });

  it('exibe codigo_kit para pendingType="structure"', () => {
    render(<QuantityPopup {...baseProps} />);
    expect(screen.getByText('13N1')).toBeTruthy();
    expect(screen.getByText('Kit Poste Simples MT')).toBeTruthy();
  });

  it('exibe SAP para pendingType="material"', () => {
    render(<QuantityPopup {...baseProps} pendingItem={materialPendente} pendingType="material" />);
    expect(screen.getByText('MAT001')).toBeTruthy();
    expect(screen.getByText('Condutor CAA 35mm²')).toBeTruthy();
  });

  it('input numérico tem value=qty', () => {
    render(<QuantityPopup {...baseProps} qty={3} />);
    const input = screen.getByRole('spinbutton');
    expect(input.value).toBe('3');
  });

  it('botão Cancelar chama onCancel', () => {
    const onCancel = vi.fn();
    render(<QuantityPopup {...baseProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancelar'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('botão Adicionar chama onConfirm', () => {
    const onConfirm = vi.fn();
    render(<QuantityPopup {...baseProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('Adicionar'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('clique no backdrop chama onCancel', () => {
    const onCancel = vi.fn();
    render(<QuantityPopup {...baseProps} onCancel={onCancel} />);
    // The outer fixed div is the backdrop
    const backdrop = screen.getByText('Quantidade').closest('.fixed');
    fireEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('clique dentro do modal não fecha (stopPropagation)', () => {
    const onCancel = vi.fn();
    render(<QuantityPopup {...baseProps} onCancel={onCancel} />);
    const modal = screen.getByText('Quantidade').closest('.bg-white');
    fireEvent.click(modal);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('keyDown no input chama onKeyDown', () => {
    const onKeyDown = vi.fn();
    render(<QuantityPopup {...baseProps} onKeyDown={onKeyDown} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('exibe dica de teclado "Enter para confirmar"', () => {
    render(<QuantityPopup {...baseProps} />);
    expect(screen.getByText('Enter para confirmar')).toBeTruthy();
  });
});
