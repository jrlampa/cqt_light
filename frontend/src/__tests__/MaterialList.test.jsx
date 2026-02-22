/**
 * Tests for MaterialList component
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MaterialList } from '../components/MaterialList';

const sampleMaterials = [
  { sap: 'MAT001', descricao: 'Condutor CAA 35mm²', unidade: 'M', preco_unitario: 3.50, quantidade: 100 },
  { sap: 'MAT002', descricao: 'Cruzeta Madeira 2,20m', unidade: 'UN', preco_unitario: 45.00, quantidade: 5 },
];

const baseProps = {
  materiaisAvulsos: sampleMaterials,
  activeTab: 'materiais',
  setActiveTab: vi.fn(),
  searchMaterial: vi.fn(),
  materialQuery: '',
  materialResults: [],
  showMaterialDropdown: false,
  materialHighlight: -1,
  handleMaterialKeyDown: vi.fn(),
  selectMaterial: vi.fn(),
  removeMaterial: vi.fn(),
  materialRef: { current: null },
  setMaterialQuery: vi.fn(),
  setShowMaterialDropdown: vi.fn(),
  setMaterialHighlight: vi.fn(),
};

describe('MaterialList', () => {
  it('renderiza null quando activeTab !== "materiais"', () => {
    const { container } = render(<MaterialList {...baseProps} activeTab="estruturas" />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza quando activeTab = "materiais"', () => {
    const { container } = render(<MaterialList {...baseProps} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('exibe campo de busca de material avulso', () => {
    render(<MaterialList {...baseProps} />);
    expect(screen.getByPlaceholderText(/Digite o código ou descrição/i)).toBeTruthy();
  });

  it('exibe label "Adicionar Material Avulso"', () => {
    render(<MaterialList {...baseProps} />);
    expect(screen.getByText(/Adicionar Material Avulso/i)).toBeTruthy();
  });

  it('exibe materiais avulsos na lista', () => {
    render(<MaterialList {...baseProps} />);
    expect(screen.getByText('MAT001')).toBeTruthy();
    expect(screen.getByText('MAT002')).toBeTruthy();
  });

  it('searchMaterial chamada ao digitar', () => {
    render(<MaterialList {...baseProps} />);
    const input = screen.getByPlaceholderText(/Digite o código ou descrição/i);
    fireEvent.change(input, { target: { value: 'CAA' } });
    expect(baseProps.searchMaterial).toHaveBeenCalledWith('CAA');
  });

  it('exibe dropdown de resultados quando showMaterialDropdown=true e resultados existem', () => {
    const results = [{ sap: 'MAT003', descricao: 'Chave Fusível', unidade: 'UN', preco_unitario: 150 }];
    render(<MaterialList {...baseProps} showMaterialDropdown materialResults={results} />);
    expect(screen.getByText('MAT003')).toBeTruthy();
  });

  it('não exibe dropdown quando lista de resultados vazia', () => {
    render(<MaterialList {...baseProps} showMaterialDropdown materialResults={[]} />);
    expect(screen.queryByText('Chave Fusível')).toBeNull();
  });

  it('lista vazia exibe sem materiais', () => {
    render(<MaterialList {...baseProps} materiaisAvulsos={[]} />);
    expect(screen.queryByText('MAT001')).toBeNull();
  });
});
