/**
 * Testes estendidos para MapaRede — prop tracado (GPS trace)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MapaRede from '../components/MapaRede.jsx';

describe('MapaRede — prop tracado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('aceita prop tracado sem erro', () => {
    const tracado = [
      { id: 1, latitude: -22.15018, longitude: -42.92185, nome: 'P1' },
    ];
    expect(() => render(<MapaRede tracado={tracado} />)).not.toThrow();
  });

  it('aceita tracado vazio como padrão', () => {
    expect(() => render(<MapaRede />)).not.toThrow();
  });

  it('aceita tracado com múltiplos pontos', () => {
    const tracado = [
      { id: 1, latitude: -22.15018, longitude: -42.92185, nome: 'A' },
      { id: 2, latitude: -22.151, longitude: -42.922, nome: 'B' },
      { id: 3, latitude: -22.152, longitude: -42.923, nome: 'C' },
    ];
    expect(() => render(<MapaRede tracado={tracado} />)).not.toThrow();
  });

  it('exibe "GPS" na legenda', () => {
    render(<MapaRede />);
    expect(screen.getByText('GPS')).toBeTruthy();
  });

  it('renderiza container do mapa mesmo com tracado', () => {
    const tracado = [{ id: 1, latitude: -22.15018, longitude: -42.92185, nome: 'X' }];
    render(<MapaRede tracado={tracado} />);
    expect(screen.getByTestId('mapa-container')).toBeTruthy();
  });
});
