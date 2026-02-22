/**
 * Testes para useRedeAnalise — hook de análise de topologia de rede elétrica.
 *
 * MEMORY.md: endpoint POST /api/rede/analisar
 * Normas: ABNT NBR 14565 / PRODIST Módulo 6 (via backend)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRedeAnalise } from '../hooks/useRedeAnalise.js';

// ── helpers ──────────────────────────────────────────────────────────────────

function mockFetchOk(data) {
  return vi.fn().mockResolvedValue({ ok: true, json: async () => data });
}

function mockFetchError(status = 422, detail = 'Erro de validação') {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: 'Unprocessable Entity',
    json: async () => ({ detail }),
  });
}

const REDE_CONECTADA = {
  postes: [
    { id: 'P1', x: 788547.0, y: 7634925.0, altura_m: 11, carga_kg: 600 },
    { id: 'P2', x: 788647.0, y: 7634925.0, altura_m: 11, carga_kg: 600 },
  ],
  trechos: [
    { id_inicio: 'P1', id_fim: 'P2', nivel: 'BT', comprimento_m: 100 },
  ],
  transformadores: [
    { id: 'TR1', x: 788547.0, y: 7634925.0, potencia_kva: 75, nivel: 'MT' },
  ],
};

const RESULTADO_CONECTADA = {
  conectada: true,
  postes_isolados: [],
  comprimento_mt_m: 0.0,
  comprimento_bt_m: 100.0,
  comprimento_total_m: 100.0,
  num_postes: 2,
  num_trechos: 1,
  num_transformadores: 1,
  avisos: [],
};

const RESULTADO_DESCONECTADA = {
  conectada: false,
  postes_isolados: ['P3'],
  comprimento_mt_m: 0.0,
  comprimento_bt_m: 100.0,
  comprimento_total_m: 100.0,
  num_postes: 3,
  num_trechos: 1,
  num_transformadores: 0,
  avisos: ['Rede desconectada: 1 poste(s) isolado(s)'],
};

// ── testes ───────────────────────────────────────────────────────────────────

describe('useRedeAnalise', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('estado inicial: loading false, error null', () => {
    const { result } = renderHook(() => useRedeAnalise());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('expõe as funções analisar e clearError', () => {
    const { result } = renderHook(() => useRedeAnalise());
    expect(typeof result.current.analisar).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  // ── analisar ──────────────────────────────────────────────────────────────

  it('analisar — retorna resultado completo para rede conectada', async () => {
    vi.stubGlobal('fetch', mockFetchOk(RESULTADO_CONECTADA));
    const { result } = renderHook(() => useRedeAnalise());

    let data;
    await act(async () => {
      data = await result.current.analisar(REDE_CONECTADA);
    });

    expect(data.conectada).toBe(true);
    expect(data.postes_isolados).toHaveLength(0);
    expect(data.comprimento_bt_m).toBe(100.0);
    expect(data.num_postes).toBe(2);
    expect(data.num_trechos).toBe(1);
    expect(data.num_transformadores).toBe(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('analisar — envia POST para /api/rede/analisar com os dados corretos', async () => {
    const fetchMock = mockFetchOk(RESULTADO_CONECTADA);
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useRedeAnalise());

    await act(async () => {
      await result.current.analisar(REDE_CONECTADA);
    });

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/rede/analisar');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.postes).toHaveLength(2);
    expect(body.trechos).toHaveLength(1);
    expect(body.transformadores).toHaveLength(1);
  });

  it('analisar — rede desconectada: conectada=false, postes_isolados preenchido', async () => {
    vi.stubGlobal('fetch', mockFetchOk(RESULTADO_DESCONECTADA));
    const { result } = renderHook(() => useRedeAnalise());

    let data;
    await act(async () => {
      data = await result.current.analisar({ ...REDE_CONECTADA, postes: [...REDE_CONECTADA.postes, { id: 'P3', x: 789000, y: 7635000, altura_m: 9, carga_kg: 400 }] });
    });

    expect(data.conectada).toBe(false);
    expect(data.postes_isolados).toContain('P3');
    expect(data.avisos).toHaveLength(1);
  });

  it('analisar — comprimento_mt_m e comprimento_bt_m presentes no resultado', async () => {
    const resultado = { ...RESULTADO_CONECTADA, comprimento_mt_m: 200.0, comprimento_bt_m: 150.0, comprimento_total_m: 350.0 };
    vi.stubGlobal('fetch', mockFetchOk(resultado));
    const { result } = renderHook(() => useRedeAnalise());

    let data;
    await act(async () => {
      data = await result.current.analisar(REDE_CONECTADA);
    });

    expect(data.comprimento_mt_m).toBe(200.0);
    expect(data.comprimento_bt_m).toBe(150.0);
    expect(data.comprimento_total_m).toBe(350.0);
  });

  it('analisar — avisos retornados quando sem transformadores', async () => {
    const resultado = { ...RESULTADO_CONECTADA, num_transformadores: 0, avisos: ['Nenhum transformador encontrado'] };
    vi.stubGlobal('fetch', mockFetchOk(resultado));
    const { result } = renderHook(() => useRedeAnalise());

    let data;
    await act(async () => {
      data = await result.current.analisar({ ...REDE_CONECTADA, transformadores: [] });
    });

    expect(data.avisos).toContain('Nenhum transformador encontrado');
  });

  it('analisar — define error e relança em caso de falha HTTP', async () => {
    vi.stubGlobal('fetch', mockFetchError(422, 'nivel inválido'));
    const { result } = renderHook(() => useRedeAnalise());

    let caughtError;
    await act(async () => {
      try {
        await result.current.analisar(REDE_CONECTADA);
      } catch (e) {
        caughtError = e;
      }
    });

    expect(caughtError).toBeDefined();
    expect(caughtError.message).toBe('nivel inválido');
    expect(result.current.error).toBe('nivel inválido');
    expect(result.current.loading).toBe(false);
  });

  it('analisar — loading true durante fetch, false depois', async () => {
    let resolvePromise;
    const fetchMock = vi.fn().mockReturnValue(
      new Promise((res) => { resolvePromise = res; })
    );
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useRedeAnalise());

    act(() => {
      result.current.analisar(REDE_CONECTADA).catch(() => {});
    });
    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise({ ok: true, json: async () => RESULTADO_CONECTADA });
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.loading).toBe(false);
  });

  it('analisar — rede vazia: num_postes=0, avisos preenchidos', async () => {
    const resultado = { ...RESULTADO_CONECTADA, num_postes: 0, num_trechos: 0, avisos: ['Nenhum trecho encontrado'] };
    vi.stubGlobal('fetch', mockFetchOk(resultado));
    const { result } = renderHook(() => useRedeAnalise());

    let data;
    await act(async () => {
      data = await result.current.analisar({ postes: [], trechos: [], transformadores: [] });
    });

    expect(data.num_postes).toBe(0);
    expect(data.avisos.length).toBeGreaterThan(0);
  });

  it('analisar — Content-Type application/json enviado', async () => {
    const fetchMock = mockFetchOk(RESULTADO_CONECTADA);
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useRedeAnalise());

    await act(async () => {
      await result.current.analisar(REDE_CONECTADA);
    });

    const opts = fetchMock.mock.calls[0][1];
    expect(opts.headers['Content-Type']).toBe('application/json');
  });

  // ── clearError ────────────────────────────────────────────────────────────

  it('clearError — limpa error após falha', async () => {
    vi.stubGlobal('fetch', mockFetchError(500, 'server error'));
    const { result } = renderHook(() => useRedeAnalise());

    await act(async () => {
      try { await result.current.analisar(REDE_CONECTADA); } catch {}
    });
    expect(result.current.error).toBeTruthy();

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  it('clearError — não afeta estado quando não há error', () => {
    const { result } = renderHook(() => useRedeAnalise());
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  it('analisar — erro quando fetch falha sem json (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network Error')));
    const { result } = renderHook(() => useRedeAnalise());

    let caughtError;
    await act(async () => {
      try { await result.current.analisar(REDE_CONECTADA); } catch (e) { caughtError = e; }
    });

    expect(caughtError.message).toBe('Network Error');
    expect(result.current.error).toBe('Network Error');
  });
});
