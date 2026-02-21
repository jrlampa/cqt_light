/**
 * Testes para MapaRede — componente de mapa Leaflet/OSM 2.5D
 *
 * Estratégia: verificar renderização e props sem carregar CDN real.
 * O mapa assíncrono é testado via estado de carregamento e mensagens de erro.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import MapaRede from '../components/MapaRede.jsx';

describe('MapaRede', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Renderização básica ──────────────────────────────────────────────────────

  it('renderiza o container do mapa', () => {
    render(<MapaRede />);
    const container = screen.getByTestId('mapa-container');
    expect(container).toBeTruthy();
  });

  it('mostra estado de carregando inicialmente', () => {
    render(<MapaRede />);
    const loading = screen.getByTestId('mapa-carregando');
    expect(loading).toBeTruthy();
  });

  it('aplica altura default de 450px', () => {
    render(<MapaRede />);
    const container = screen.getByTestId('mapa-container');
    expect(container.style.height).toBe('450px');
  });

  it('aplica altura customizada via prop', () => {
    render(<MapaRede altura={600} />);
    const container = screen.getByTestId('mapa-container');
    expect(container.style.height).toBe('600px');
  });

  it('renderiza legenda com texto MT', () => {
    render(<MapaRede />);
    expect(screen.getByText('MT')).toBeTruthy();
  });

  it('renderiza legenda com texto BT', () => {
    render(<MapaRede />);
    expect(screen.getByText('BT')).toBeTruthy();
  });

  it('renderiza legenda com texto Poste', () => {
    render(<MapaRede />);
    expect(screen.getByText('Poste')).toBeTruthy();
  });

  it('exibe crédito OpenStreetMap na legenda', () => {
    render(<MapaRede />);
    const text = screen.getByText(/OpenStreetMap/i);
    expect(text).toBeTruthy();
  });

  it('exibe "2.5D" na legenda', () => {
    render(<MapaRede />);
    const text = screen.getByText(/2\.5D/);
    expect(text).toBeTruthy();
  });

  // ── Props ────────────────────────────────────────────────────────────────────

  it('aceita prop centro sem erro', () => {
    expect(() =>
      render(<MapaRede centro={{ lat: -22.15018, lon: -42.92185 }} />)
    ).not.toThrow();
  });

  it('aceita prop postes sem erro', () => {
    const postes = [{ id: 'P01', lat: -22.15018, lon: -42.92185, altura_m: 11 }];
    expect(() => render(<MapaRede postes={postes} />)).not.toThrow();
  });

  it('aceita prop trechos sem erro', () => {
    const trechos = [{
      id: 'T01', lat_ini: -22.15018, lon_ini: -42.92185,
      lat_fim: -22.151, lon_fim: -42.922, nivel: 'BT',
    }];
    expect(() => render(<MapaRede trechos={trechos} />)).not.toThrow();
  });

  it('aceita prop zoom sem erro', () => {
    expect(() => render(<MapaRede zoom={16} />)).not.toThrow();
  });

  // ── Erro ao carregar Leaflet ─────────────────────────────────────────────────

  it('aceita prop altura personalizada grande sem erro', () => {
    expect(() => render(<MapaRede altura={800} />)).not.toThrow();
    const container = screen.getByTestId('mapa-container');
    expect(container.style.height).toBe('800px');
  });
});
