/**
 * Testes para useGeo — hook de georreferenciamento
 *
 * Coordenadas de referência (MEMORY.md):
 *   UTM 23K: 788547 E, 7634925 N
 *   Decimal: -22.15018, -42.92185
 *   Raios: 100 m · 500 m · 1 km
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeo } from '../hooks/useGeo.js';

// Dados de referência
const REF_LAT = -22.15018;
const REF_LON = -42.92185;
const REF_EASTING = 788547;
const REF_NORTHING = 7634925;

function mockFetchOk(data) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
  });
}

function mockFetchError(status = 422, detail = 'Erro de validação') {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: 'Unprocessable Entity',
    json: async () => ({ detail }),
  });
}

describe('useGeo', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Estado inicial ──────────────────────────────────────────────────────────

  it('estado inicial: loading false, error null', () => {
    const { result } = renderHook(() => useGeo());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('expõe as três funções de geo', () => {
    const { result } = renderHook(() => useGeo());
    expect(typeof result.current.convertUtmToDecimal).toBe('function');
    expect(typeof result.current.convertDecimalToUtm).toBe('function');
    expect(typeof result.current.calcularBuffer).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  // ── convertUtmToDecimal ─────────────────────────────────────────────────────

  it('convertUtmToDecimal — retorna lat/lon no sucesso', async () => {
    vi.stubGlobal('fetch', mockFetchOk({ latitude: REF_LAT, longitude: REF_LON }));
    const { result } = renderHook(() => useGeo());

    let data;
    await act(async () => {
      data = await result.current.convertUtmToDecimal(REF_EASTING, REF_NORTHING, 23, false);
    });

    expect(data.latitude).toBeCloseTo(REF_LAT, 3);
    expect(data.longitude).toBeCloseTo(REF_LON, 3);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('convertUtmToDecimal — envia POST correto', async () => {
    const fetchMock = mockFetchOk({ latitude: REF_LAT, longitude: REF_LON });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useGeo());

    await act(async () => {
      await result.current.convertUtmToDecimal(REF_EASTING, REF_NORTHING, 23, false);
    });

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/geo/utm-to-decimal');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.easting).toBe(REF_EASTING);
    expect(body.northing).toBe(REF_NORTHING);
    expect(body.zone_number).toBe(23);
    expect(body.northern).toBe(false);
  });

  it('convertUtmToDecimal — define error e relança em caso de falha', async () => {
    vi.stubGlobal('fetch', mockFetchError(422, 'easting inválido'));
    const { result } = renderHook(() => useGeo());

    let caughtError;
    await act(async () => {
      try {
        await result.current.convertUtmToDecimal(-1, -1, 23, false);
      } catch (e) {
        caughtError = e;
      }
    });

    expect(caughtError).toBeDefined();
    expect(result.current.error).toBe('easting inválido');
    expect(result.current.loading).toBe(false);
  });

  // ── convertDecimalToUtm ─────────────────────────────────────────────────────

  it('convertDecimalToUtm — retorna easting/northing/zona', async () => {
    vi.stubGlobal('fetch', mockFetchOk({
      easting: REF_EASTING,
      northing: REF_NORTHING,
      zona: '23K',
    }));
    const { result } = renderHook(() => useGeo());

    let data;
    await act(async () => {
      data = await result.current.convertDecimalToUtm(REF_LAT, REF_LON);
    });

    expect(data.easting).toBe(REF_EASTING);
    expect(data.northing).toBe(REF_NORTHING);
    expect(data.zona).toBe('23K');
  });

  it('convertDecimalToUtm — envia POST correto', async () => {
    const fetchMock = mockFetchOk({ easting: REF_EASTING, northing: REF_NORTHING, zona: '23K' });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useGeo());

    await act(async () => {
      await result.current.convertDecimalToUtm(REF_LAT, REF_LON);
    });

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/geo/decimal-to-utm');
    const body = JSON.parse(opts.body);
    expect(body.latitude).toBe(REF_LAT);
    expect(body.longitude).toBe(REF_LON);
  });

  it('convertDecimalToUtm — define error em caso de falha', async () => {
    vi.stubGlobal('fetch', mockFetchError(422, 'lat inválido'));
    const { result } = renderHook(() => useGeo());

    await act(async () => {
      try { await result.current.convertDecimalToUtm(999, 999); } catch {}
    });

    expect(result.current.error).toBe('lat inválido');
  });

  // ── calcularBuffer ──────────────────────────────────────────────────────────

  it('calcularBuffer 100m — retorna bbox e radius_m', async () => {
    const bbox = { min_lat: -22.16, max_lat: -22.14, min_lon: -42.93, max_lon: -42.91 };
    vi.stubGlobal('fetch', mockFetchOk({ radius_m: 100, bbox }));
    const { result } = renderHook(() => useGeo());

    let data;
    await act(async () => {
      data = await result.current.calcularBuffer(REF_LAT, REF_LON, 100);
    });

    expect(data.radius_m).toBe(100);
    expect(data.bbox.min_lat).toBeLessThan(REF_LAT);
  });

  it('calcularBuffer 500m — envia radius_m correto', async () => {
    const fetchMock = mockFetchOk({ radius_m: 500, bbox: {} });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useGeo());

    await act(async () => {
      await result.current.calcularBuffer(REF_LAT, REF_LON, 500);
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.radius_m).toBe(500);
  });

  it('calcularBuffer 1km — radius_m = 1000', async () => {
    const fetchMock = mockFetchOk({ radius_m: 1000, bbox: {} });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useGeo());

    await act(async () => {
      await result.current.calcularBuffer(REF_LAT, REF_LON, 1000);
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.radius_m).toBe(1000);
  });

  it('calcularBuffer — define error em caso de falha', async () => {
    vi.stubGlobal('fetch', mockFetchError(422, 'radius_m inválido'));
    const { result } = renderHook(() => useGeo());

    await act(async () => {
      try { await result.current.calcularBuffer(REF_LAT, REF_LON, -1); } catch {}
    });

    expect(result.current.error).toBe('radius_m inválido');
  });

  // ── clearError ──────────────────────────────────────────────────────────────

  it('clearError — limpa error após falha', async () => {
    vi.stubGlobal('fetch', mockFetchError());
    const { result } = renderHook(() => useGeo());

    await act(async () => {
      try { await result.current.convertUtmToDecimal(-1, -1, 23, false); } catch {}
    });
    expect(result.current.error).toBeTruthy();

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  // ── loading state ───────────────────────────────────────────────────────────

  it('loading é true durante fetch e false depois', async () => {
    let resolvePromise;
    const fetchMock = vi.fn().mockReturnValue(
      new Promise((res) => { resolvePromise = res; })
    );
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useGeo());

    // Iniciar chamada sem await
    act(() => {
      result.current.convertUtmToDecimal(REF_EASTING, REF_NORTHING, 23, false).catch(() => {});
    });
    expect(result.current.loading).toBe(true);

    // Resolver o fetch
    await act(async () => {
      resolvePromise({ ok: true, json: async () => ({ lat: REF_LAT, lon: REF_LON }) });
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.loading).toBe(false);
  });
});
