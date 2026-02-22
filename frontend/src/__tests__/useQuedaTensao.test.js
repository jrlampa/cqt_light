/**
 * Testes para useQuedaTensao — hook React para cálculo de queda de tensão.
 *
 * Cobre: calcular (sucesso, erro HTTP, erro rede), obterTensoes (sucesso, erro),
 * estados loading/error, clearError e chamadas fetch corretas.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useQuedaTensao } from '../hooks/useQuedaTensao';

const TRECHO_BASE = {
  id: 'T01',
  poste_a: 'P1',
  poste_b: 'P2',
  comprimento_m: 100.0,
  secao_mm2: 35.0,
  nivel: 'BT',
  material: 'AL',
  num_fases: 3,
  potencia_w: 5000,
};

const RESULTADO_OK = {
  trechos: [
    {
      trecho_id: 'T01',
      queda_pct: 2.5,
      queda_v: 5.5,
      corrente_a: 7.59,
      conforme: true,
    },
  ],
  queda_maxima_pct: 2.5,
  queda_total_v: 5.5,
  tensao_nominal_v: 220,
  limite_pct: 7.0,
  rede_conforme: true,
};

const TENSOES_OK = {
  tensoes: [
    { codigo: 'BT_220', tensao_v: 220, descricao: '220 V (BT bifásico)' },
    { codigo: 'MT_13800', tensao_v: 13800, descricao: '13,8 kV (MT)' },
  ],
};

describe('useQuedaTensao', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── Estado inicial ──────────────────────────────────────────────────────────

  it('inicia com resultado null', () => {
    const { result } = renderHook(() => useQuedaTensao());
    expect(result.current.resultado).toBeNull();
  });

  it('inicia com tensoes []', () => {
    const { result } = renderHook(() => useQuedaTensao());
    expect(result.current.tensoes).toEqual([]);
  });

  it('inicia com loading false', () => {
    const { result } = renderHook(() => useQuedaTensao());
    expect(result.current.loading).toBe(false);
  });

  it('inicia com error null', () => {
    const { result } = renderHook(() => useQuedaTensao());
    expect(result.current.error).toBeNull();
  });

  // ── calcular — sucesso ──────────────────────────────────────────────────────

  it('calcular chama fetch com método POST', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => RESULTADO_OK,
    });
    const { result } = renderHook(() => useQuedaTensao());

    await act(async () => {
      await result.current.calcular([TRECHO_BASE], 220);
    });

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/queda-tensao/calcular');
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('application/json');
  });

  it('calcular envia trechos e tensao_nom_v no body', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => RESULTADO_OK,
    });
    const { result } = renderHook(() => useQuedaTensao());

    await act(async () => {
      await result.current.calcular([TRECHO_BASE], 220);
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.tensao_nom_v).toBe(220);
    expect(body.trechos[0].id).toBe('T01');
  });

  it('calcular define resultado com dados da API', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => RESULTADO_OK,
    });
    const { result } = renderHook(() => useQuedaTensao());

    await act(async () => {
      await result.current.calcular([TRECHO_BASE], 220);
    });

    expect(result.current.resultado).toEqual(RESULTADO_OK);
  });

  it('calcular retorna dados da API', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => RESULTADO_OK,
    });
    const { result } = renderHook(() => useQuedaTensao());

    let retorno;
    await act(async () => {
      retorno = await result.current.calcular([TRECHO_BASE], 220);
    });

    expect(retorno).toEqual(RESULTADO_OK);
  });

  it('calcular limpa loading após sucesso', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => RESULTADO_OK,
    });
    const { result } = renderHook(() => useQuedaTensao());

    await act(async () => {
      await result.current.calcular([TRECHO_BASE], 220);
    });

    expect(result.current.loading).toBe(false);
  });

  // ── calcular — erros ────────────────────────────────────────────────────────

  it('calcular define error em HTTP 422', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
    });
    const { result } = renderHook(() => useQuedaTensao());

    await act(async () => {
      await result.current.calcular([TRECHO_BASE], 220);
    });

    expect(result.current.error).toContain('422');
    expect(result.current.resultado).toBeNull();
  });

  it('calcular retorna null em erro', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useQuedaTensao());

    let retorno;
    await act(async () => {
      retorno = await result.current.calcular([TRECHO_BASE], 220);
    });

    expect(retorno).toBeNull();
  });

  it('calcular limpa loading em caso de erro', async () => {
    fetchMock.mockRejectedValueOnce(new Error('timeout'));
    const { result } = renderHook(() => useQuedaTensao());

    await act(async () => {
      await result.current.calcular([TRECHO_BASE], 220);
    });

    expect(result.current.loading).toBe(false);
  });

  // ── obterTensoes — sucesso ──────────────────────────────────────────────────

  it('obterTensoes chama GET /api/queda-tensao/tensoes', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => TENSOES_OK,
    });
    const { result } = renderHook(() => useQuedaTensao());

    await act(async () => {
      await result.current.obterTensoes();
    });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/queda-tensao/tensoes');
  });

  it('obterTensoes define tensoes com dados da API', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => TENSOES_OK,
    });
    const { result } = renderHook(() => useQuedaTensao());

    await act(async () => {
      await result.current.obterTensoes();
    });

    expect(result.current.tensoes).toHaveLength(2);
    expect(result.current.tensoes[0].codigo).toBe('BT_220');
  });

  it('obterTensoes retorna null em erro', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useQuedaTensao());

    let retorno;
    await act(async () => {
      retorno = await result.current.obterTensoes();
    });

    expect(retorno).toBeNull();
    expect(result.current.error).toBe('offline');
  });

  // ── clearError ───────────────────────────────────────────────────────────────

  it('clearError limpa o erro', async () => {
    fetchMock.mockRejectedValueOnce(new Error('falha'));
    const { result } = renderHook(() => useQuedaTensao());

    await act(async () => {
      await result.current.calcular([TRECHO_BASE], 220);
    });

    expect(result.current.error).toBeTruthy();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
