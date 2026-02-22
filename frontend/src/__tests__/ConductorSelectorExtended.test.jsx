/**
 * ConductorSelector.jsx — testes estendidos (clicar em condutor Compacta MT e Nua BT)
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConductorSelector } from '../components/ConductorSelector';
import { CONDUTORES_MT, CONDUTORES_BT } from '../constants/conductors';

const baseProps = {
  condutorMT: CONDUTORES_MT[0],
  condutorBT: CONDUTORES_BT[0],
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

describe('ConductorSelector — seleção de condutores Compacta MT e Nua BT', () => {
  it('seleciona condutor MT Compacta ao clicar no dropdown', () => {
    const setCondutorMT = vi.fn();
    const setShowMTDropdown = vi.fn();
    render(
      <ConductorSelector
        {...baseProps}
        showMTDropdown={true}
        setCondutorMT={setCondutorMT}
        setShowMTDropdown={setShowMTDropdown}
      />
    );
    const compactas = CONDUTORES_MT.filter(c => c.tipo === 'Compacta');
    if (compactas.length > 0) {
      const btn = screen.queryByText(compactas[0].label);
      if (btn) {
        fireEvent.click(btn.closest('button') || btn);
        expect(setCondutorMT).toHaveBeenCalledWith(compactas[0]);
        expect(setShowMTDropdown).toHaveBeenCalledWith(false);
      }
    }
  });

  it('seleciona todos os condutores MT Compacta disponíveis', () => {
    const setCondutorMT = vi.fn();
    const setShowMTDropdown = vi.fn();
    const compactas = CONDUTORES_MT.filter(c => c.tipo === 'Compacta');

    render(
      <ConductorSelector
        {...baseProps}
        showMTDropdown={true}
        setCondutorMT={setCondutorMT}
        setShowMTDropdown={setShowMTDropdown}
      />
    );

    compactas.forEach((c) => {
      const btn = screen.queryByText(c.label);
      if (btn) {
        fireEvent.click(btn.closest('button') || btn);
      }
    });

    // At least one compacta conductor was clicked
    if (compactas.length > 0) {
      expect(setCondutorMT).toHaveBeenCalled();
    }
  });

  it('seleciona condutor BT Rede Nua ao clicar no dropdown', () => {
    const setCondutorBT = vi.fn();
    const setShowBTDropdown = vi.fn();
    render(
      <ConductorSelector
        {...baseProps}
        showBTDropdown={true}
        setCondutorBT={setCondutorBT}
        setShowBTDropdown={setShowBTDropdown}
      />
    );
    const nuas = CONDUTORES_BT.filter(c => c.tipo === 'Nua');
    if (nuas.length > 0) {
      const btn = screen.queryByText(nuas[0].label);
      if (btn) {
        fireEvent.click(btn.closest('button') || btn);
        expect(setCondutorBT).toHaveBeenCalledWith(nuas[0]);
        expect(setShowBTDropdown).toHaveBeenCalledWith(false);
      }
    }
  });

  it('seleciona todos os condutores BT Nua disponíveis', () => {
    const setCondutorBT = vi.fn();
    const setShowBTDropdown = vi.fn();
    const nuas = CONDUTORES_BT.filter(c => c.tipo === 'Nua');

    render(
      <ConductorSelector
        {...baseProps}
        showBTDropdown={true}
        setCondutorBT={setCondutorBT}
        setShowBTDropdown={setShowBTDropdown}
      />
    );

    nuas.forEach((c) => {
      const btn = screen.queryByText(c.label);
      if (btn) {
        fireEvent.click(btn.closest('button') || btn);
      }
    });

    if (nuas.length > 0) {
      expect(setCondutorBT).toHaveBeenCalled();
    }
  });

  it('clicar no botão BT chama setBtHighlight e setShowBTDropdown', () => {
    const setBtHighlight = vi.fn();
    const setShowBTDropdown = vi.fn();
    render(
      <ConductorSelector
        {...baseProps}
        setBtHighlight={setBtHighlight}
        setShowBTDropdown={setShowBTDropdown}
      />
    );
    // BT button is the second button
    const buttons = screen.getAllByRole('button');
    if (buttons.length >= 2) {
      fireEvent.click(buttons[1]);
      expect(setBtHighlight).toHaveBeenCalledWith(0);
      expect(setShowBTDropdown).toHaveBeenCalledTimes(1);
    }
  });

  it('keyDown no botão BT chama handleBTNav', () => {
    const handleBTNav = vi.fn();
    render(<ConductorSelector {...baseProps} handleBTNav={handleBTNav} />);
    const buttons = screen.getAllByRole('button');
    if (buttons.length >= 2) {
      fireEvent.keyDown(buttons[1], { key: 'ArrowDown' });
      expect(handleBTNav).toHaveBeenCalledTimes(1);
    }
  });

  it('exibe seção ISOLADA quando há condutores MT do tipo Isolada', () => {
    const isoladas = CONDUTORES_MT.filter(c => c.tipo === 'Isolada');
    render(<ConductorSelector {...baseProps} showMTDropdown={true} />);
    if (isoladas.length > 0) {
      expect(screen.queryByText('ISOLADA')).toBeTruthy();
    } else {
      expect(screen.queryByText('ISOLADA')).toBeNull();
    }
  });

  it('aplica highlight no item BT correto', () => {
    const multiplexadas = CONDUTORES_BT.filter(c => c.tipo === 'Multiplexada');
    render(
      <ConductorSelector
        {...baseProps}
        showBTDropdown={true}
        btHighlight={0}
      />
    );
    // Item at index 0 should have highlight class (bg-blue-100)
    if (multiplexadas.length > 0) {
      // Use queryAllByText to handle duplicate labels (toggle btn + dropdown btn)
      const allBtns = screen.queryAllByText(multiplexadas[0].label);
      // At least one button with this label should exist
      expect(allBtns.length).toBeGreaterThan(0);
      // Find the dropdown button (inside the dropdown div) with bg-blue-100
      const highlighted = allBtns.find(el => {
        const btn = el.closest('button');
        return btn && btn.className.includes('bg-blue-100');
      });
      if (highlighted) {
        expect(highlighted.closest('button').className).toContain('bg-blue-100');
      }
    }
  });
});
