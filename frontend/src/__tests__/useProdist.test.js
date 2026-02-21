/**
 * Testes para o hook useProdist.
 * Usa vi.stubGlobal('fetch') para simular chamadas ao backend.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useProdist from '../hooks/useProdist';

// ─── Helper para mockar fetch ─────────────────────────────────────────────────

function mockFetch(data, ok = true, status = 200) {
  const json = vi.fn().mockResolvedValue(data);
  const resp = { ok, status, json };
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resp));
}

function mockFetchErro() {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Falha de rede')));
}

// ─── Dados de resposta mock (sem dados mockados em produção — apenas em testes) ──

const RESP_CLASSIFICACAO = {
  classificacao: 'ADEQUADA',
  relacao_vc_vr: 0.98,
  nivel: 'BT',
  aviso_toast: null,
  norma_aplicada: 'ANEEL_PRODIST',
};

const RESP_QUEDA = {
  queda_pct: 3.5,
  queda_v: 7.7,
  conforme_prodist: true,
  limite_prodist_pct: 5.0,
  conforme_abnt: true,
  limite_abnt_pct: 7.0,
  mais_restritivo: 'ANEEL_PRODIST',
  aviso_toast: 'ABNT ignorada conforme norma da concessionária (ANEEL/PRODIST)',
  norma_aplicada: 'ANEEL_PRODIST',
};

const RESP_LIMITES = {
  BT_ALIMENTADOR: { prodist_pct: 5.0, abnt_pct: 7.0, mais_restritivo: 'ANEEL_PRODIST' },
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('useProdist — estado inicial', () => {
  it('carregando=false e erro=null no início', () => {
    const { result } = renderHook(() => useProdist());
    expect(result.current.carregando).toBe(false);
    expect(result.current.erro).toBeNull();
  });

  it('expõe as três funções', () => {
    const { result } = renderHook(() => useProdist());
    expect(typeof result.current.classificarTensao).toBe('function');
    expect(typeof result.current.calcularQuedaAlimentador).toBe('function');
    expect(typeof result.current.obterLimites).toBe('function');
  });
});

describe('useProdist — classificarTensao', () => {
  it('retorna classificação ADEQUADA', async () => {
    mockFetch(RESP_CLASSIFICACAO);
    const { result } = renderHook(() => useProdist());
    let res;
    await act(async () => {
      res = await result.current.classificarTensao(220, 220, 'BT');
    });
    expect(res.classificacao).toBe('ADEQUADA');
    expect(res.norma_aplicada).toBe('ANEEL_PRODIST');
  });

  it('chama o endpoint correto', async () => {
    mockFetch(RESP_CLASSIFICACAO);
    const { result } = renderHook(() => useProdist());
    await act(async () => {
      await result.current.classificarTensao(200, 220, 'BT');
    });
    const [url, opts] = vi.mocked(fetch).mock.calls[0];
    expect(url).toContain('/api/prodist/classificar-tensao');
    const body = JSON.parse(opts.body);
    expect(body.tensao_medida_v).toBe(200);
    expect(body.nivel).toBe('BT');
  });

  it('retorna null em erro de rede', async () => {
    mockFetchErro();
    const { result } = renderHook(() => useProdist());
    let res;
    await act(async () => {
      res = await result.current.classificarTensao(200, 220, 'BT');
    });
    expect(res).toBeNull();
    expect(result.current.erro).toBe('Falha de rede');
  });

  it('retorna null em HTTP 422', async () => {
    mockFetch({ detail: 'nivel inválido' }, false, 422);
    const { result } = renderHook(() => useProdist());
    let res;
    await act(async () => {
      res = await result.current.classificarTensao(200, 220, 'XX');
    });
    expect(res).toBeNull();
    expect(result.current.erro).toContain('nivel inválido');
  });

  it('carregando=true durante chamada', async () => {
    let resolveFn;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(
      () => new Promise(r => { resolveFn = () => r({ ok: true, json: async () => RESP_CLASSIFICACAO }); })
    ));
    const { result } = renderHook(() => useProdist());
    let promise;
    act(() => { promise = result.current.classificarTensao(220, 220, 'BT'); });
    expect(result.current.carregando).toBe(true);
    await act(async () => { resolveFn(); await promise; });
    expect(result.current.carregando).toBe(false);
  });
});

describe('useProdist — calcularQuedaAlimentador', () => {
  it('retorna resultado de queda', async () => {
    mockFetch(RESP_QUEDA);
    const { result } = renderHook(() => useProdist());
    let res;
    await act(async () => {
      res = await result.current.calcularQuedaAlimentador(10, 0.22, 220, 'BT_ALIMENTADOR');
    });
    expect(res.queda_pct).toBe(3.5);
    expect(res.aviso_toast).toContain('ABNT ignorada');
  });

  it('chama o endpoint correto', async () => {
    mockFetch(RESP_QUEDA);
    const { result } = renderHook(() => useProdist());
    await act(async () => {
      await result.current.calcularQuedaAlimentador(10, 0.22, 220, 'MT');
    });
    const [url, opts] = vi.mocked(fetch).mock.calls[0];
    expect(url).toContain('/api/prodist/queda-alimentador');
    const body = JSON.parse(opts.body);
    expect(body.tipo_rede).toBe('MT');
  });

  it('retorna null em erro de rede', async () => {
    mockFetchErro();
    const { result } = renderHook(() => useProdist());
    let res;
    await act(async () => {
      res = await result.current.calcularQuedaAlimentador(10, 0.22, 220);
    });
    expect(res).toBeNull();
  });

  it('retorna null em HTTP 422', async () => {
    mockFetch({ detail: 'corrente inválida' }, false, 422);
    const { result } = renderHook(() => useProdist());
    let res;
    await act(async () => {
      res = await result.current.calcularQuedaAlimentador(-1, 0.22, 220);
    });
    expect(res).toBeNull();
  });
});

describe('useProdist — obterLimites', () => {
  it('retorna limites PRODIST vs ABNT', async () => {
    mockFetch(RESP_LIMITES);
    const { result } = renderHook(() => useProdist());
    let res;
    await act(async () => {
      res = await result.current.obterLimites();
    });
    expect(res.BT_ALIMENTADOR.prodist_pct).toBe(5.0);
  });

  it('chama o endpoint GET correto', async () => {
    mockFetch(RESP_LIMITES);
    const { result } = renderHook(() => useProdist());
    await act(async () => {
      await result.current.obterLimites();
    });
    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(url).toContain('/api/prodist/limites');
  });

  it('retorna null em erro de rede', async () => {
    mockFetchErro();
    const { result } = renderHook(() => useProdist());
    let res;
    await act(async () => {
      res = await result.current.obterLimites();
    });
    expect(res).toBeNull();
  });

  it('retorna null em HTTP 500', async () => {
    mockFetch({}, false, 500);
    const { result } = renderHook(() => useProdist());
    let res;
    await act(async () => {
      res = await result.current.obterLimites();
    });
    expect(res).toBeNull();
  });
});
