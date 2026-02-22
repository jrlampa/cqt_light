/**
 * useRedeAnalise — Hook React para integração com a API de análise de topologia de rede.
 *
 * Endpoint coberto (MEMORY.md):
 *   POST /api/rede/analisar — análise de conectividade BFS, comprimentos MT/BT, estatísticas
 *
 * Normas: ABNT NBR 14565 / PRODIST Módulo 6 (via backend).
 */

import { useState, useCallback } from 'react';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/** @param {string} path  @param {object} body  @returns {Promise<object>} */
async function postJson(path, body) {
  const resp = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const detail = await resp.json().catch(() => ({ detail: resp.statusText }));
    throw new Error(detail?.detail ?? `HTTP ${resp.status}`);
  }
  return resp.json();
}

/**
 * useRedeAnalise — análise de topologia da rede elétrica via backend FastAPI.
 *
 * @returns {{
 *   analisar: (rede: object) => Promise<object>,
 *   loading: boolean,
 *   error: string|null,
 *   clearError: () => void,
 * }}
 */
export function useRedeAnalise() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Analisa topologia de rede elétrica.
   * @param {{ postes: object[], trechos: object[], transformadores: object[] }} rede
   * @returns {Promise<{
   *   conectada: boolean,
   *   postes_isolados: string[],
   *   comprimento_mt_m: number,
   *   comprimento_bt_m: number,
   *   comprimento_total_m: number,
   *   num_postes: number,
   *   num_trechos: number,
   *   num_transformadores: number,
   *   avisos: string[],
   * }>}
   */
  const analisar = useCallback(async (rede) => {
    setLoading(true);
    setError(null);
    try {
      return await postJson('/api/rede/analisar', rede);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { analisar, loading, error, clearError };
}
