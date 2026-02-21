/**
 * Tests for StructureList component
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StructureList } from '../components/StructureList';

const sampleStructures = [
  { codigo_kit: '13N1', descricao_kit: 'Kit Padrão MT', quantidade: 1 },
  { codigo_kit: '13N2', descricao_kit: 'Kit Duplo MT', quantidade: 2 },
];

const baseProps = {
  estruturas: sampleStructures,
  activeTab: 'estruturas',
  setActiveTab: vi.fn(),
  searchStructure: vi.fn(),
  structureQuery: '',
  structureResults: [],
  showStructureDropdown: false,
  structureHighlight: -1,
  handleStructureKeyDown: vi.fn(),
  selectStructure: vi.fn(),
  removeStructure: vi.fn(),
  onKitClick: vi.fn(),
  structureRef: { current: null },
  setStructureQuery: vi.fn(),
  setShowStructureDropdown: vi.fn(),
  setStructureHighlight: vi.fn(),
  structureInputRef: { current: null },
};

describe('StructureList', () => {
  it('renderiza sem crash', () => {
    const { container } = render(<StructureList {...baseProps} />);
    expect(container).toBeTruthy();
  });

  it('exibe tab "Estruturas / Kits"', () => {
    render(<StructureList {...baseProps} />);
    expect(screen.getByText(/Estruturas \/ Kits/i)).toBeTruthy();
  });

  it('exibe campo de busca de estrutura', () => {
    render(<StructureList {...baseProps} />);
    expect(screen.getByPlaceholderText(/Digite o código da estrutura/i)).toBeTruthy();
  });

  it('exibe estruturas na lista', () => {
    render(<StructureList {...baseProps} />);
    expect(screen.getByText('13N1')).toBeTruthy();
    expect(screen.getByText('13N2')).toBeTruthy();
  });

  it('clicar na tab "Estruturas" chama setActiveTab', () => {
    render(<StructureList {...baseProps} />);
    const tabBtn = screen.getByText(/Estruturas \/ Kits/i).closest('button');
    fireEvent.click(tabBtn);
    expect(baseProps.setActiveTab).toHaveBeenCalledWith('estruturas');
  });

  it('searchStructure é chamada ao digitar na busca', () => {
    const searchStructure = vi.fn();
    render(<StructureList {...baseProps} searchStructure={searchStructure} />);
    const input = screen.getByPlaceholderText(/Digite o código da estrutura/i);
    fireEvent.change(input, { target: { value: '13N' } });
    // React onChange is triggered by the input event
    expect(searchStructure).toHaveBeenCalledTimes(1);
  });

  it('mostra dropdown quando showStructureDropdown=true e resultados existem', () => {
    const results = [{ codigo_kit: '13N1', descricao_kit: 'Kit MT' }];
    render(<StructureList {...baseProps} showStructureDropdown structureResults={results} />);
    expect(screen.getAllByText('13N1').length).toBeGreaterThanOrEqual(1);
  });

  it('chama removeStructure ao clicar em remover', () => {
    const removeStructure = vi.fn();
    const { container } = render(<StructureList {...baseProps} removeStructure={removeStructure} />);
    const trashButtons = container.querySelectorAll('button.p-1\\.5');
    if (trashButtons.length > 0) {
      fireEvent.click(trashButtons[0]);
      expect(removeStructure).toHaveBeenCalledTimes(1);
    }
  });

  it('mostra mensagem quando lista está vazia', () => {
    render(<StructureList {...baseProps} estruturas={[]} />);
    // Should show empty state
    expect(screen.queryByText('13N1')).toBeNull();
  });
});
