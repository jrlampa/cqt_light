/**
 * Tests for ConductorSelector component
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConductorSelector } from '../components/ConductorSelector';
import { CONDUTORES_MT, CONDUTORES_BT } from '../constants/conductors';

const condutorMT = CONDUTORES_MT[0];
const condutorBT = CONDUTORES_BT[0];

const baseProps = {
  condutorMT,
  condutorBT,
  showMTDropdown: false,
  showBTDropdown: false,
  setCondutorMT: vi.fn(),
  setCondutorBT: vi.fn(),
  setShowMTDropdown: vi.fn(),
  setShowBTDropdown: vi.fn(),
  mtHighlight: -1,
  btHighlight: -1,
  setMtHighlight: vi.fn(),
  setBtHighlight: vi.fn(),
  handleMTNav: vi.fn(),
  handleBTNav: vi.fn(),
};

describe('ConductorSelector', () => {
  it('exibe label MT', () => {
    render(<ConductorSelector {...baseProps} />);
    expect(screen.getByText('MT')).toBeTruthy();
  });

  it('exibe label BT', () => {
    render(<ConductorSelector {...baseProps} />);
    expect(screen.getByText('BT')).toBeTruthy();
  });

  it('exibe label do condutor MT selecionado', () => {
    render(<ConductorSelector {...baseProps} />);
    expect(screen.getByText(condutorMT.label)).toBeTruthy();
  });

  it('exibe label do condutor BT selecionado', () => {
    render(<ConductorSelector {...baseProps} />);
    expect(screen.getByText(condutorBT.label)).toBeTruthy();
  });

  it('não exibe dropdown MT quando showMTDropdown é false', () => {
    render(<ConductorSelector {...baseProps} />);
    expect(screen.queryByText('CONVENCIONAL')).toBeNull();
  });

  it('exibe dropdown MT com seções quando showMTDropdown é true', () => {
    render(<ConductorSelector {...baseProps} showMTDropdown />);
    expect(screen.getByText('CONVENCIONAL')).toBeTruthy();
    expect(screen.getByText('COMPACTA')).toBeTruthy();
  });

  it('não exibe dropdown BT quando showBTDropdown é false', () => {
    render(<ConductorSelector {...baseProps} />);
    expect(screen.queryByText('MULTIPLEXADA')).toBeNull();
  });

  it('exibe dropdown BT com seções quando showBTDropdown é true', () => {
    render(<ConductorSelector {...baseProps} showBTDropdown />);
    expect(screen.getByText('MULTIPLEXADA')).toBeTruthy();
    expect(screen.getByText('REDE NUA')).toBeTruthy();
  });

  it('clicar no botão MT chama setMtHighlight e setShowMTDropdown', () => {
    const setMtHighlight = vi.fn();
    const setShowMTDropdown = vi.fn();
    render(<ConductorSelector {...baseProps} setMtHighlight={setMtHighlight} setShowMTDropdown={setShowMTDropdown} />);
    // Click MT button (first button rendered)
    const [mtBtn] = screen.getAllByRole('button');
    fireEvent.click(mtBtn);
    expect(setMtHighlight).toHaveBeenCalledWith(0);
    expect(setShowMTDropdown).toHaveBeenCalledTimes(1);
  });

  it('selecionar condutor MT no dropdown chama setCondutorMT e fecha dropdown', () => {
    const setCondutorMT = vi.fn();
    const setShowMTDropdown = vi.fn();
    render(<ConductorSelector {...baseProps} showMTDropdown setCondutorMT={setCondutorMT} setShowMTDropdown={setShowMTDropdown} />);
    // Use second conductor (Cabo 53 mm² CAA) which is unique — avoids collision with the toggle button label
    const convencionais = CONDUTORES_MT.filter(c => c.tipo === 'Convencional');
    const secondLabel = convencionais[1].label;
    const btn = screen.getByText(secondLabel).closest('button');
    fireEvent.click(btn);
    expect(setCondutorMT).toHaveBeenCalledWith(convencionais[1]);
    expect(setShowMTDropdown).toHaveBeenCalledWith(false);
  });

  it('selecionar condutor BT no dropdown chama setCondutorBT e fecha dropdown', () => {
    const setCondutorBT = vi.fn();
    const setShowBTDropdown = vi.fn();
    render(<ConductorSelector {...baseProps} showBTDropdown setCondutorBT={setCondutorBT} setShowBTDropdown={setShowBTDropdown} />);
    // Use second Multiplexada to avoid collision with toggle button label
    const multiplexadas = CONDUTORES_BT.filter(c => c.tipo === 'Multiplexada');
    const secondLabel = multiplexadas[1].label;
    const btn = screen.getByText(secondLabel).closest('button');
    fireEvent.click(btn);
    expect(setCondutorBT).toHaveBeenCalledWith(multiplexadas[1]);
    expect(setShowBTDropdown).toHaveBeenCalledWith(false);
  });

  it('keyDown no botão MT chama handleMTNav', () => {
    const handleMTNav = vi.fn();
    render(<ConductorSelector {...baseProps} handleMTNav={handleMTNav} />);
    const [mtBtn] = screen.getAllByRole('button');
    fireEvent.keyDown(mtBtn, { key: 'ArrowDown' });
    expect(handleMTNav).toHaveBeenCalledTimes(1);
  });
});
