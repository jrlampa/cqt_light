/**
 * Testes para useIfc — hook de exportação IFC2X3 STEP (Half-way BIM)
 *
 * MEMORY.md: endpoints POST /api/ifc/export e POST /api/ifc/validate
 * Coordenadas de referência: -22.15018, -42.92185 (Zona 23K)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIfc } from '../hooks/useIfc.js';

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

const REDE_SIMPLES = {
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

const IFC_MINIMO = `ISO-10303-21;\nHEADER;\nENDAEC;\nDATA;\nENDDATA;\nEND-ISO-10303-21;`;

// ── testes ───────────────────────────────────────────────────────────────────

describe('useIfc', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('estado inicial: loading false, error null', () => {
    const { result } = renderHook(() => useIfc());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('expõe as funções exportar, validar e clearError', () => {
    const { result } = renderHook(() => useIfc());
    expect(typeof result.current.exportar).toBe('function');
    expect(typeof result.current.validar).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  // ── exportar ──────────────────────────────────────────────────────────────

  it('exportar — retorna ifc_content no sucesso', async () => {
    vi.stubGlobal('fetch', mockFetchOk({ ifc_content: IFC_MINIMO }));
    const { result } = renderHook(() => useIfc());

    let data;
    await act(async () => {
      data = await result.current.exportar(REDE_SIMPLES);
    });

    expect(data.ifc_content).toContain('ISO-10303-21');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('exportar — envia POST para /api/ifc/export com a rede', async () => {
    const fetchMock = mockFetchOk({ ifc_content: IFC_MINIMO });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useIfc());

    await act(async () => {
      await result.current.exportar(REDE_SIMPLES);
    });

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/ifc/export');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.postes).toHaveLength(2);
    expect(body.trechos).toHaveLength(1);
    expect(body.transformadores).toHaveLength(1);
  });

  it('exportar — rede com apenas postes (sem trechos/transformadores)', async () => {
    const fetchMock = mockFetchOk({ ifc_content: IFC_MINIMO });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useIfc());

    await act(async () => {
      await result.current.exportar({ postes: [REDE_SIMPLES.postes[0]], trechos: [], transformadores: [] });
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.postes).toHaveLength(1);
    expect(body.trechos).toHaveLength(0);
  });

  it('exportar — define error e relança em caso de falha HTTP', async () => {
    vi.stubGlobal('fetch', mockFetchError(500, 'Erro interno'));
    const { result } = renderHook(() => useIfc());

    let caughtError;
    await act(async () => {
      try {
        await result.current.exportar(REDE_SIMPLES);
      } catch (e) {
        caughtError = e;
      }
    });

    expect(caughtError).toBeDefined();
    expect(caughtError.message).toBe('Erro interno');
    expect(result.current.error).toBe('Erro interno');
    expect(result.current.loading).toBe(false);
  });

  it('exportar — loading true durante fetch, false depois', async () => {
    let resolvePromise;
    const fetchMock = vi.fn().mockReturnValue(
      new Promise((res) => { resolvePromise = res; })
    );
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useIfc());

    act(() => {
      result.current.exportar(REDE_SIMPLES).catch(() => {});
    });
    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise({ ok: true, json: async () => ({ ifc_content: IFC_MINIMO }) });
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.loading).toBe(false);
  });

  // ── validar ───────────────────────────────────────────────────────────────

  it('validar — IFC válido: valid=true, errors=[]', async () => {
    vi.stubGlobal('fetch', mockFetchOk({ valid: true, errors: [] }));
    const { result } = renderHook(() => useIfc());

    let data;
    await act(async () => {
      data = await result.current.validar(IFC_MINIMO);
    });

    expect(data.valid).toBe(true);
    expect(data.errors).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it('validar — IFC inválido: valid=false, errors preenchidos', async () => {
    vi.stubGlobal('fetch', mockFetchOk({ valid: false, errors: ['Header ausente', 'DATA inválido'] }));
    const { result } = renderHook(() => useIfc());

    let data;
    await act(async () => {
      data = await result.current.validar('conteudo_invalido');
    });

    expect(data.valid).toBe(false);
    expect(data.errors).toHaveLength(2);
  });

  it('validar — envia POST para /api/ifc/validate com ifc_content', async () => {
    const fetchMock = mockFetchOk({ valid: true, errors: [] });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useIfc());

    await act(async () => {
      await result.current.validar(IFC_MINIMO);
    });

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/ifc/validate');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.ifc_content).toBe(IFC_MINIMO);
  });

  it('validar — define error em caso de falha HTTP', async () => {
    vi.stubGlobal('fetch', mockFetchError(422, 'ifc_content obrigatório'));
    const { result } = renderHook(() => useIfc());

    await act(async () => {
      try { await result.current.validar(''); } catch {}
    });

    expect(result.current.error).toBe('ifc_content obrigatório');
  });

  it('validar — loading true durante fetch, false depois', async () => {
    let resolvePromise;
    const fetchMock = vi.fn().mockReturnValue(
      new Promise((res) => { resolvePromise = res; })
    );
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useIfc());

    act(() => {
      result.current.validar(IFC_MINIMO).catch(() => {});
    });
    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise({ ok: true, json: async () => ({ valid: true, errors: [] }) });
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.loading).toBe(false);
  });

  // ── clearError ────────────────────────────────────────────────────────────

  it('clearError — limpa error após falha', async () => {
    vi.stubGlobal('fetch', mockFetchError(500, 'server error'));
    const { result } = renderHook(() => useIfc());

    await act(async () => {
      try { await result.current.exportar(REDE_SIMPLES); } catch {}
    });
    expect(result.current.error).toBeTruthy();

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  it('clearError — não afeta estado quando não há error', () => {
    const { result } = renderHook(() => useIfc());
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});
