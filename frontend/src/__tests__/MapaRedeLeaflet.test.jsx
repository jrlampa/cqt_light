/**
 * MapaRede — testes de inicialização com window.L mockado.
 *
 * Estratégia: ao definir window.L antes de renderizar, carregarLeaflet()
 * resolve imediatamente, permitindo testar o código de inicialização
 * do mapa (lines 78–98) e de renderização de postes/trechos/tracado (115–186).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import MapaRede from '../components/MapaRede.jsx';

// ── Helpers de mock Leaflet ───────────────────────────────────────────────────

function makeMockMap() {
  const mapa = {
    setView: vi.fn(),
    remove: vi.fn(),
    eachLayer: vi.fn(),    // não itera por padrão — sem camadas anteriores
    fitBounds: vi.fn(),
  };
  mapa.setView.mockReturnValue(mapa);
  return mapa;
}

function makeMockLayer() {
  const layer = {
    _cqtLayer: undefined,
    bindTooltip: vi.fn(),
    addTo: vi.fn(),
  };
  layer.bindTooltip.mockReturnValue(layer);
  return layer;
}

function makeMockL(mockMap) {
  return {
    map: vi.fn(() => mockMap),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    polyline: vi.fn(() => makeMockLayer()),
    circleMarker: vi.fn(() => makeMockLayer()),
  };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('MapaRede — inicialização com Leaflet mockado', () => {
  let mockMap;
  let mockL;

  beforeEach(() => {
    vi.clearAllMocks();
    mockMap = makeMockMap();
    mockL = makeMockL(mockMap);
    window.L = mockL;
  });

  afterEach(() => {
    delete window.L;
    vi.restoreAllMocks();
  });

  // ── Inicialização do mapa (linhas 78–98) ─────────────────────────────────

  it('chama L.map com o containerRef', async () => {
    render(<MapaRede />);
    await waitFor(() => expect(mockL.map).toHaveBeenCalled());
    expect(mockL.map).toHaveBeenCalledWith(expect.any(HTMLElement));
  });

  it('chama setView com as coordenadas de centro padrão', async () => {
    render(<MapaRede />);
    await waitFor(() => expect(mockMap.setView).toHaveBeenCalled());
    const [[lat, lon], zoom] = mockMap.setView.mock.calls[0];
    expect(lat).toBeCloseTo(-22.15018, 3);
    expect(lon).toBeCloseTo(-42.92185, 3);
    expect(zoom).toBe(15);
  });

  it('chama setView com props de centro customizadas', async () => {
    render(<MapaRede centro={{ lat: -23.0, lon: -43.0 }} zoom={12} />);
    await waitFor(() => expect(mockMap.setView).toHaveBeenCalled());
    const [[lat, lon], zoom] = mockMap.setView.mock.calls[0];
    expect(lat).toBeCloseTo(-23.0, 2);
    expect(lon).toBeCloseTo(-43.0, 2);
    expect(zoom).toBe(12);
  });

  it('adiciona tile layer OSM ao mapa', async () => {
    render(<MapaRede />);
    await waitFor(() => expect(mockL.tileLayer).toHaveBeenCalled());
    const [url] = mockL.tileLayer.mock.calls[0];
    expect(url).toContain('openstreetmap.org');
  });

  it('remove estado de carregando após inicialização', async () => {
    render(<MapaRede />);
    await waitFor(() =>
      expect(screen.queryByTestId('mapa-carregando')).toBeNull()
    );
  });

  // ── Renderização de postes (linhas 140–156) ───────────────────────────────

  it('cria circleMarker para cada poste', async () => {
    const postes = [
      { id: 'P1', lat: -22.15018, lon: -42.92185, altura_m: 11 },
      { id: 'P2', lat: -22.151, lon: -42.922, altura_m: 13 },
    ];
    render(<MapaRede postes={postes} />);
    await waitFor(() => expect(mockL.circleMarker).toHaveBeenCalled());
    // Um circleMarker por poste, mais zero por trecho/tracado
    expect(mockL.circleMarker.mock.calls.length).toBeGreaterThanOrEqual(postes.length);
  });

  it('circleMarker do poste inclui lat/lon corretos', async () => {
    const postes = [{ id: 'P1', lat: -22.15018, lon: -42.92185 }];
    render(<MapaRede postes={postes} />);
    await waitFor(() => expect(mockL.circleMarker).toHaveBeenCalled());
    const [coords] = mockL.circleMarker.mock.calls[0];
    expect(coords[0]).toBeCloseTo(-22.15018, 4);
    expect(coords[1]).toBeCloseTo(-42.92185, 4);
  });

  // ── Renderização de trechos (linhas 123–138) ──────────────────────────────

  it('cria polyline para cada trecho', async () => {
    const trechos = [
      {
        id: 'T1',
        lat_ini: -22.15018, lon_ini: -42.92185,
        lat_fim: -22.151,  lon_fim: -42.922,
        nivel: 'MT',
      },
    ];
    render(<MapaRede trechos={trechos} />);
    await waitFor(() => expect(mockL.polyline).toHaveBeenCalled());
    expect(mockL.polyline).toHaveBeenCalledTimes(1);
  });

  // ── Renderização do traçado GPS (linhas 158–174) ──────────────────────────

  it('cria circleMarker para cada ponto de tracado GPS', async () => {
    const tracado = [
      { id: 0, latitude: -22.15018, longitude: -42.92185, nome: '' },
      { id: 1, latitude: -22.151,   longitude: -42.922,   nome: 'WP1' },
    ];
    render(<MapaRede tracado={tracado} />);
    await waitFor(() => expect(mockL.circleMarker).toHaveBeenCalled());
    expect(mockL.circleMarker.mock.calls.length).toBeGreaterThanOrEqual(tracado.length);
  });

  // ── fitBounds (linhas 177–187) ────────────────────────────────────────────

  it('chama fitBounds quando há postes', async () => {
    const postes = [{ id: 'P1', lat: -22.15018, lon: -42.92185 }];
    render(<MapaRede postes={postes} />);
    await waitFor(() => expect(mockMap.fitBounds).toHaveBeenCalled());
  });

  it('não chama fitBounds quando rede está vazia', async () => {
    render(<MapaRede postes={[]} trechos={[]} tracado={[]} />);
    await waitFor(() => expect(mockL.map).toHaveBeenCalled());
    // Aguarda async completo antes de verificar
    await act(async () => {});
    expect(mockMap.fitBounds).not.toHaveBeenCalled();
  });

  // ── Erro de carregamento (linha 100–103) ─────────────────────────────────

  it('exibe mensagem de erro quando Leaflet falha', async () => {
    // Simula Leaflet não disponível: remove window.L e faz script.onerror disparar
    delete window.L;

    // Mock document.querySelector para simular "script não existe ainda"
    const origQuery = document.querySelector.bind(document);
    vi.spyOn(document, 'querySelector').mockImplementation((sel) => {
      if (sel === `link[href="${'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'}"]` ||
          sel === `script[src="${'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'}"]`) {
        return null;
      }
      return origQuery(sel);
    });

    // Mock document.head.appendChild para disparar onerror
    const origAppend = document.head.appendChild.bind(document.head);
    vi.spyOn(document.head, 'appendChild').mockImplementation((el) => {
      if (el.tagName === 'SCRIPT') {
        setTimeout(() => el.onerror?.(), 0);
        return el;
      }
      return origAppend(el);
    });

    render(<MapaRede />);
    await waitFor(
      () => expect(screen.queryByTestId('mapa-erro')).not.toBeNull(),
      { timeout: 2000 }
    );
    expect(screen.getByTestId('mapa-erro').textContent).toContain('Erro');
  });
});
