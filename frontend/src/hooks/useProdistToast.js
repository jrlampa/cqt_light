/**
 * useProdistToast — Avisa o usuário sobre normas PRODIST ativas ao inicializar.
 *
 * Chama GET /api/prodist/limites uma vez na montagem e retorna um aviso toast
 * quando os limites PRODIST diferem dos limites ABNT, indicando que a norma
 * da concessionária está sendo aplicada (ABNT ignorada onde aplicável).
 *
 * "Zero custo" — usa apenas o backend local FastAPI.
 */

import { useState, useEffect, useCallback } from 'react';

const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL ?? 'http://localhost:8000';

/**
 * @typedef {{ prodist_pct: number, abnt_pct: number, mais_restritivo: string }} LimiteQueda
 * @typedef {{ BT_ALIMENTADOR?: LimiteQueda, BT_RAMAL?: LimiteQueda, MT?: LimiteQueda }} LimitesProdist
 */

/** Prefixo comum do aviso PRODIST para fácil localização em testes e logs. */
const PREFIXO_AVISO = '⚠️ PRODIST Módulo 6 ativo. Limites de queda: ';
/** Sufixo fixo da mensagem de aviso PRODIST. */
const SUFIXO_AVISO = '. Norma da concessionária aplicada conforme ANEEL.';

/**
 * Formata mensagem de aviso PRODIST vs ABNT em pt-BR.
 * MT é sempre incluído (norma concessionária aplica-se independente de qual é mais restritiva).
 * @param {LimitesProdist|null|undefined} limites - Resposta de GET /api/prodist/limites
 * @returns {string|null}
 */
function formatarMensagemProdist(limites) {
  const bt = limites?.BT_ALIMENTADOR;
  const mt = limites?.MT;
  const partes = [];
  if (bt && bt.mais_restritivo === 'PRODIST') {
    partes.push(`BT: ${bt.prodist_pct}% PRODIST (ABNT ${bt.abnt_pct}% ignorada)`);
  }
  if (mt) {
    partes.push(`MT: ${mt.prodist_pct}% PRODIST (norma concessionária)`);
  }
  if (partes.length === 0) return null;
  return `${PREFIXO_AVISO}${partes.join(' | ')}${SUFIXO_AVISO}`;
}

/**
 * Hook que carrega os limites PRODIST na montagem e retorna um toast de aviso.
 * @returns {{ toast: {mensagem: string, tipo: string}|null, clearToast: Function }}
 */
export default function useProdistToast() {
  const [toast, setToast] = useState(null);

  const carregarLimites = useCallback(async () => {
    try {
      const resp = await fetch(`${BACKEND_URL}/api/prodist/limites`);
      if (!resp.ok) return;
      const limites = await resp.json();
      const mensagem = formatarMensagemProdist(limites);
      if (mensagem) {
        setToast({ mensagem, tipo: 'aviso' });
      }
    } catch {
      // Silencioso: backend pode não estar disponível (modo offline/Electron)
    }
  }, []);

  useEffect(() => {
    carregarLimites();
  }, [carregarLimites]);

  const clearToast = useCallback(() => setToast(null), []);

  return { toast, clearToast };
}

export { formatarMensagemProdist };
