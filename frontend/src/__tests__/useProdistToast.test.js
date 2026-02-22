/**
 * useProdistToast — testes unitários
 *
 * Testa o hook que carrega limites PRODIST e retorna toast de aviso
 * quando a norma da concessionária sobrepõe a ABNT.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useProdistToast, { formatarMensagemProdist } from '../hooks/useProdistToast';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const LIMITES_PRODIST = {
  BT_ALIMENTADOR: { prodist_pct: 5, abnt_pct: 7, mais_restritivo: 'PRODIST' },
  BT_RAMAL: { prodist_pct: 2, abnt_pct: 7, mais_restritivo: 'PRODIST' },
  MT: { prodist_pct: 3, abnt_pct: 2, mais_restritivo: 'ABNT' },
};

// ── formatarMensagemProdist ──────────────────────────────────────────────────

describe('formatarMensagemProdist', () => {
  it('retorna mensagem com BT e MT quando ambos presentes', () => {
    const msg = formatarMensagemProdist(LIMITES_PRODIST);
    expect(msg).toBeTruthy();
    expect(msg).toContain('PRODIST');
    expect(msg).toContain('BT');
  });

  it('inclui percentual BT_ALIMENTADOR PRODIST na mensagem', () => {
    const msg = formatarMensagemProdist(LIMITES_PRODIST);
    expect(msg).toContain('5%');
  });

  it('inclui percentual ABNT BT na mensagem', () => {
    const msg = formatarMensagemProdist(LIMITES_PRODIST);
    expect(msg).toContain('7%');
  });

  it('inclui referência ao Módulo 6 PRODIST', () => {
    const msg = formatarMensagemProdist(LIMITES_PRODIST);
    expect(msg).toContain('Módulo 6');
  });

  it('inclui referência à ANEEL', () => {
    const msg = formatarMensagemProdist(LIMITES_PRODIST);
    expect(msg).toContain('ANEEL');
  });

  it('inclui percentual MT na mensagem', () => {
    const msg = formatarMensagemProdist(LIMITES_PRODIST);
    expect(msg).toContain('3%');
  });

  it('retorna null quando limites ausentes', () => {
    expect(formatarMensagemProdist(null)).toBeNull();
    expect(formatarMensagemProdist({})).toBeNull();
    expect(formatarMensagemProdist(undefined)).toBeNull();
  });

  it('retorna null quando BT_ALIMENTADOR não é mais restritivo que ABNT', () => {
    const limitesSemMaisRestritivo = {
      BT_ALIMENTADOR: { prodist_pct: 7, abnt_pct: 5, mais_restritivo: 'ABNT' },
    };
    // Sem MT também → sem mensagem
    const msg = formatarMensagemProdist(limitesSemMaisRestritivo);
    expect(msg).toBeNull();
  });

  it('inclui MT mesmo quando BT não é mais restritivo', () => {
    const limites = {
      MT: { prodist_pct: 3, abnt_pct: 2, mais_restritivo: 'ABNT' },
    };
    const msg = formatarMensagemProdist(limites);
    expect(msg).toContain('MT');
  });

  it('inclui MT mesmo quando mais_restritivo é ABNT (concessionária sempre aplica PRODIST)', () => {
    const limites = {
      BT_ALIMENTADOR: { prodist_pct: 7, abnt_pct: 5, mais_restritivo: 'ABNT' },
      MT: { prodist_pct: 3, abnt_pct: 2, mais_restritivo: 'ABNT' },
    };
    // BT não é mais restritivo → não aparece; MT sempre aparece
    const msg = formatarMensagemProdist(limites);
    expect(msg).not.toBeNull();
    expect(msg).toContain('MT');
    expect(msg).not.toContain('BT:');
  });
});

// ── useProdistToast hook ─────────────────────────────────────────────────────

describe('useProdistToast', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('toast é null antes da resposta da API', () => {
    fetch.mockReturnValue(new Promise(() => {})); // nunca resolve
    const { result } = renderHook(() => useProdistToast());
    expect(result.current.toast).toBeNull();
  });

  it('define toast com mensagem quando API retorna limites PRODIST', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => LIMITES_PRODIST,
    });
    const { result } = renderHook(() => useProdistToast());
    await waitFor(() => expect(result.current.toast).not.toBeNull());
    expect(result.current.toast.mensagem).toContain('PRODIST');
  });

  it('toast.tipo é "aviso"', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => LIMITES_PRODIST,
    });
    const { result } = renderHook(() => useProdistToast());
    await waitFor(() => expect(result.current.toast).not.toBeNull());
    expect(result.current.toast.tipo).toBe('aviso');
  });

  it('clearToast remove o toast', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => LIMITES_PRODIST,
    });
    const { result } = renderHook(() => useProdistToast());
    await waitFor(() => expect(result.current.toast).not.toBeNull());
    act(() => result.current.clearToast());
    expect(result.current.toast).toBeNull();
  });

  it('não crasha quando API retorna erro HTTP', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const { result } = renderHook(() => useProdistToast());
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    expect(result.current.toast).toBeNull();
  });

  it('não crasha quando fetch rejeita (rede offline)', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useProdistToast());
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    expect(result.current.toast).toBeNull();
  });

  it('não define toast quando limites não geram mensagem', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ BT_ALIMENTADOR: { mais_restritivo: 'ABNT', prodist_pct: 7, abnt_pct: 5 } }),
    });
    const { result } = renderHook(() => useProdistToast());
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    expect(result.current.toast).toBeNull();
  });
});
