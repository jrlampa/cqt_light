/**
 * useProdist — Hook para classificação de tensão e queda de alimentador via ANEEL/PRODIST.
 *
 * Chama o backend FastAPI (/api/prodist/*) e retorna o resultado incluindo
 * aviso_toast quando a norma PRODIST sobrepõe a ABNT.
 *
 * "Zero custo" — usa apenas a API local (backend rodando em localhost).
 */

import { useState, useCallback } from 'react';

const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL ?? 'http://localhost:8000';

/**
 * @typedef {object} ResultadoClassificacao
 * @property {'ADEQUADA'|'PRECÁRIA'|'CRÍTICA'} classificacao
 * @property {number} relacao_vc_vr
 * @property {string} nivel
 * @property {string|null} aviso_toast
 * @property {string} norma_aplicada
 */

/**
 * @typedef {object} ResultadoQuedaAlimentador
 * @property {number} queda_pct
 * @property {number} queda_v
 * @property {boolean} conforme_prodist
 * @property {number} limite_prodist_pct
 * @property {boolean} conforme_abnt
 * @property {number} limite_abnt_pct
 * @property {string} mais_restritivo
 * @property {string|null} aviso_toast
 * @property {string} norma_aplicada
 */

export default function useProdist() {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  /**
   * Classifica a tensão de entrega conforme PRODIST Módulo 8.
   * @param {number} tensao_medida_v - Tensão medida no ponto de entrega (V)
   * @param {number} tensao_referencia_v - Tensão de referência (V)
   * @param {'BT'|'MT'} nivel - Nível de tensão
   * @returns {Promise<ResultadoClassificacao|null>}
   */
  const classificarTensao = useCallback(async (tensao_medida_v, tensao_referencia_v, nivel = 'BT') => {
    setCarregando(true);
    setErro(null);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/prodist/classificar-tensao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tensao_medida_v, tensao_referencia_v, nivel }),
      });
      if (!resp.ok) {
        const detail = await resp.json().catch(() => ({}));
        throw new Error(detail?.detail ?? `Erro HTTP ${resp.status}`);
      }
      return await resp.json();
    } catch (e) {
      setErro(e.message);
      return null;
    } finally {
      setCarregando(false);
    }
  }, []);

  /**
   * Calcula queda de tensão no alimentador com limites PRODIST (Módulo 6).
   * @param {number} corrente_a - Corrente de carga (A)
   * @param {number} resistencia_ohm - Resistência do trecho (Ω)
   * @param {number} tensao_nominal_v - Tensão nominal (V)
   * @param {'BT_ALIMENTADOR'|'BT_RAMAL'|'MT'} tipo_rede - Tipo do alimentador
   * @returns {Promise<ResultadoQuedaAlimentador|null>}
   */
  const calcularQuedaAlimentador = useCallback(async (
    corrente_a,
    resistencia_ohm,
    tensao_nominal_v,
    tipo_rede = 'BT_ALIMENTADOR',
  ) => {
    setCarregando(true);
    setErro(null);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/prodist/queda-alimentador`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corrente_a, resistencia_ohm, tensao_nominal_v, tipo_rede }),
      });
      if (!resp.ok) {
        const detail = await resp.json().catch(() => ({}));
        throw new Error(detail?.detail ?? `Erro HTTP ${resp.status}`);
      }
      return await resp.json();
    } catch (e) {
      setErro(e.message);
      return null;
    } finally {
      setCarregando(false);
    }
  }, []);

  /**
   * Obtém os limites PRODIST vs ABNT para exibição informativa.
   * @returns {Promise<object|null>}
   */
  const obterLimites = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/prodist/limites`);
      if (!resp.ok) throw new Error(`Erro HTTP ${resp.status}`);
      return await resp.json();
    } catch (e) {
      setErro(e.message);
      return null;
    } finally {
      setCarregando(false);
    }
  }, []);

  return {
    carregando,
    erro,
    classificarTensao,
    calcularQuedaAlimentador,
    obterLimites,
  };
}
