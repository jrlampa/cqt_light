/**
 * Tests for PosteSearch component
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PosteSearch } from '../components/PosteSearch';

const samplePostes = [
  { sap: 'P001', descricao: 'Poste Madeira 10m' },
  { sap: 'P002', descricao: 'Poste Concreto 11m' },
];

const baseProps = {
  posteQuery: '',
  posteResults: [],
  showPosteDropdown: false,
  posteHighlight: -1,
  posteInputRef: { current: null },
  onSearch: vi.fn(),
  onSelect: vi.fn(),
  onKeyDown: vi.fn(),
};

describe('PosteSearch', () => {
  it('renderiza campo de busca com placeholder correto', () => {
    render(<PosteSearch {...baseProps} />);
    const input = screen.getByPlaceholderText('Buscar poste...');
    expect(input).toBeTruthy();
  });

  it('exibe label "Poste (adiciona aos materiais)"', () => {
    render(<PosteSearch {...baseProps} />);
    expect(screen.getByText(/Poste \(adiciona aos materiais\)/i)).toBeTruthy();
  });

  it('não exibe dropdown quando showPosteDropdown é false', () => {
    render(<PosteSearch {...baseProps} posteResults={samplePostes} />);
    expect(screen.queryByText('Poste Madeira 10m')).toBeNull();
  });

  it('exibe resultados quando showPosteDropdown é true', () => {
    render(<PosteSearch {...baseProps} showPosteDropdown posteResults={samplePostes} />);
    expect(screen.getByText('P001')).toBeTruthy();
    expect(screen.getByText(/Poste Madeira 10m/)).toBeTruthy();
    expect(screen.getByText('P002')).toBeTruthy();
  });

  it('não exibe dropdown quando lista está vazia mesmo com showPosteDropdown=true', () => {
    const { container } = render(<PosteSearch {...baseProps} showPosteDropdown posteResults={[]} />);
    // No dropdown div should be rendered
    expect(container.querySelectorAll('button').length).toBe(0);
  });

  it('chama onSearch ao digitar no input', () => {
    const onSearch = vi.fn();
    render(<PosteSearch {...baseProps} onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('Buscar poste...');
    fireEvent.change(input, { target: { value: 'Poste' } });
    expect(onSearch).toHaveBeenCalledWith('Poste');
  });

  it('chama onKeyDown ao pressionar tecla no input', () => {
    const onKeyDown = vi.fn();
    render(<PosteSearch {...baseProps} onKeyDown={onKeyDown} />);
    const input = screen.getByPlaceholderText('Buscar poste...');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('chama onSelect ao clicar num resultado (mousedown)', () => {
    const onSelect = vi.fn();
    render(<PosteSearch {...baseProps} showPosteDropdown onSelect={onSelect} posteResults={samplePostes} />);
    const btn = screen.getByText('P001').closest('button');
    fireEvent.mouseDown(btn);
    expect(onSelect).toHaveBeenCalledWith(samplePostes[0]);
  });

  it('aplica destaque no item com posteHighlight', () => {
    const { container } = render(
      <PosteSearch {...baseProps} showPosteDropdown posteResults={samplePostes} posteHighlight={0} />
    );
    const buttons = container.querySelectorAll('button');
    // First button should have bg-green-100 class
    expect(buttons[0].className).toContain('bg-green-100');
  });

  it('exibe valor correto no input quando posteQuery tem valor', () => {
    render(<PosteSearch {...baseProps} posteQuery="madeira" />);
    const input = screen.getByPlaceholderText('Buscar poste...');
    expect(input.value).toBe('madeira');
  });
});
