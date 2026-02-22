/**
 * useIfc — Hook React para integração com a API de exportação IFC2X3 do backend.
 *
 * Endpoints cobertos (MEMORY.md):
 *   POST /api/ifc/export    — exporta rede elétrica em IFC2X3 STEP
 *   POST /api/ifc/validate  — valida conteúdo IFC2X3 gerado
 *
 * Half-way BIM: suporte a postes, trechos e transformadores (MEMORY.md).
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
 * useIfc — exportação e validação IFC2X3 STEP via backend FastAPI.
 *
 * @returns {{
 *   exportar: (rede: object) => Promise<{ifc_content: string}>,
 *   validar: (ifc_content: string) => Promise<{valid: boolean, errors: string[]}>,
 *   loading: boolean,
 *   error: string|null,
 *   clearError: () => void,
 * }}
 */
export function useIfc() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Exporta rede elétrica em formato IFC2X3 STEP.
   * @param {{ postes: object[], trechos: object[], transformadores: object[] }} rede
   * @returns {Promise<{ifc_content: string}>}
   */
  const exportar = useCallback(async (rede) => {
    setLoading(true);
    setError(null);
    try {
      return await postJson('/api/ifc/export', rede);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Valida um conteúdo IFC2X3 STEP.
   * @param {string} ifc_content  Texto completo do arquivo IFC
   * @returns {Promise<{valid: boolean, errors: string[]}>}
   */
  const validar = useCallback(async (ifc_content) => {
    setLoading(true);
    setError(null);
    try {
      return await postJson('/api/ifc/validate', { ifc_content });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { exportar, validar, loading, error, clearError };
}
