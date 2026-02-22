/**
 * useQuedaTensao — Hook React para cálculo de queda de tensão via API backend.
 *
 * Thin frontend: a lógica ABNT NBR 5410 / NBR 14039 reside no backend.
 * Este hook apenas encapsula as chamadas fetch com estado de loading/error.
 *
 * Endpoints consumidos:
 *   POST /api/queda-tensao/calcular  — calcula queda de tensão por trecho
 *   GET  /api/queda-tensao/tensoes   — lista tensões nominais disponíveis
 *
 * @typedef {{ id: string, poste_a: string, poste_b: string,
 *   comprimento_m: number, secao_mm2?: number,
 *   nivel?: string, material?: string, num_fases?: number,
 *   corrente_a?: number, potencia_w?: number, fator_potencia?: number
 * }} TrechoInput
 *
 * @typedef {{ trechos: object[], queda_maxima_pct: number,
 *   queda_total_v: number, rede_conforme: boolean }} ResultadoQueda
 */

import { useState, useCallback } from 'react';

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:8000';

/**
 * Hook que encapsula as chamadas ao serviço de queda de tensão.
 *
 * @returns {{ resultado: ResultadoQueda|null, tensoes: object[], loading: boolean,
 *   error: string|null, calcular: Function, obterTensoes: Function, clearError: Function }}
 */
export function useQuedaTensao() {
  const [resultado, setResultado] = useState(null);
  const [tensoes, setTensoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Calcula queda de tensão para uma lista de trechos.
   *
   * @param {TrechoInput[]} trechos - Lista de trechos com dados elétricos.
   * @param {number} tensao_nom_v - Tensão nominal em Volts (ex: 220, 13800).
   * @returns {Promise<ResultadoQueda|null>}
   */
  const calcular = useCallback(async (trechos, tensao_nom_v) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${BASE_URL}/api/queda-tensao/calcular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trechos, tensao_nom_v }),
      });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }
      const data = await resp.json();
      setResultado(data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtém lista de tensões nominais disponíveis.
   *
   * @returns {Promise<object|null>}
   */
  const obterTensoes = useCallback(async () => {
    try {
      const resp = await fetch(`${BASE_URL}/api/queda-tensao/tensoes`);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }
      const data = await resp.json();
      setTensoes(data.tensoes ?? data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { resultado, tensoes, loading, error, calcular, obterTensoes, clearError };
}
