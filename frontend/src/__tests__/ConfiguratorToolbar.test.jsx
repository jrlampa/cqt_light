/**
 * Tests for ConfiguratorToolbar component
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfiguratorToolbar } from '../components/ConfiguratorToolbar';

const baseProps = {
  totalKits: 2,
  totalMats: 3,
  showExport: true,
  onClear: vi.fn(),
  onExportExcel: vi.fn(),
  onOpenHistory: vi.fn(),
  onOpenTemplates: vi.fn(),
  onOpenManualKits: vi.fn(),
  onOpenPriceManager: vi.fn(),
};

describe('ConfiguratorToolbar', () => {
  it('renderiza título "Configurador"', () => {
    render(<ConfiguratorToolbar {...baseProps} />);
    expect(screen.getByText('Configurador')).toBeTruthy();
  });

  it('botão Histórico chama onOpenHistory', () => {
    render(<ConfiguratorToolbar {...baseProps} />);
    const btn = screen.getByTitle(/Histórico de Orçamentos/i);
    fireEvent.click(btn);
    expect(baseProps.onOpenHistory).toHaveBeenCalledTimes(1);
  });

  it('botão Templates chama onOpenTemplates', () => {
    render(<ConfiguratorToolbar {...baseProps} />);
    const btn = screen.getByTitle(/Gerenciar Templates/i);
    fireEvent.click(btn);
    expect(baseProps.onOpenTemplates).toHaveBeenCalledTimes(1);
  });

  it('botão Kits chama onOpenManualKits', () => {
    render(<ConfiguratorToolbar {...baseProps} />);
    const btn = screen.getByTitle(/Gerenciar Kits Manuais/i);
    fireEvent.click(btn);
    expect(baseProps.onOpenManualKits).toHaveBeenCalledTimes(1);
  });

  it('botão Preços chama onOpenPriceManager', () => {
    render(<ConfiguratorToolbar {...baseProps} />);
    const btn = screen.getByTitle(/Gestão de Preços/i);
    fireEvent.click(btn);
    expect(baseProps.onOpenPriceManager).toHaveBeenCalledTimes(1);
  });

  it('botão Limpar chama onClear', () => {
    render(<ConfiguratorToolbar {...baseProps} />);
    const btn = screen.getByText('Limpar').closest('button');
    fireEvent.click(btn);
    expect(baseProps.onClear).toHaveBeenCalledTimes(1);
  });

  it('botão Limpar está desabilitado quando totalKits=0 e totalMats=0', () => {
    render(<ConfiguratorToolbar {...baseProps} totalKits={0} totalMats={0} />);
    const btn = screen.getByText('Limpar').closest('button');
    expect(btn.disabled).toBe(true);
  });

  it('botão Limpar habilitado quando totalKits > 0', () => {
    render(<ConfiguratorToolbar {...baseProps} totalKits={1} totalMats={0} />);
    const btn = screen.getByText('Limpar').closest('button');
    expect(btn.disabled).toBe(false);
  });

  it('botão Limpar habilitado quando totalMats > 0', () => {
    render(<ConfiguratorToolbar {...baseProps} totalKits={0} totalMats={1} />);
    const btn = screen.getByText('Limpar').closest('button');
    expect(btn.disabled).toBe(false);
  });

  it('botão Kit está desabilitado quando totalKits=0 e totalMats=0', () => {
    render(<ConfiguratorToolbar {...baseProps} totalKits={0} totalMats={0} />);
    const btn = screen.getByText('Kit').closest('button');
    expect(btn.disabled).toBe(true);
  });

  it('exibe botão "Kits" com texto', () => {
    render(<ConfiguratorToolbar {...baseProps} />);
    expect(screen.getByText('Kits')).toBeTruthy();
  });

  it('exibe botão "Preços" com texto', () => {
    render(<ConfiguratorToolbar {...baseProps} />);
    expect(screen.getByText('Preços')).toBeTruthy();
  });

  it('botão "Exportar Excel" aparece quando showExport=true e chama onExportExcel', () => {
    render(<ConfiguratorToolbar {...baseProps} showExport />);
    const btn = screen.getByText('Exportar Excel').closest('button');
    fireEvent.click(btn);
    expect(baseProps.onExportExcel).toHaveBeenCalledTimes(1);
  });

  it('botão "Exportar Excel" não aparece quando showExport=false', () => {
    render(<ConfiguratorToolbar {...baseProps} showExport={false} />);
    expect(screen.queryByText('Exportar Excel')).toBeNull();
  });
});
