/**
 * useKml — Hook React para importação de traçados GPS (KML/GPX)
 * via API do backend CQT Light.
 *
 * Thin frontend: apenas lê o arquivo e delega ao backend.
 * Zero custo: backend usa stdlib (xml.etree.ElementTree).
 *
 * @module useKml
 */

import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * @typedef {Object} PontoGPS
 * @property {number} id
 * @property {number} latitude
 * @property {number} longitude
 * @property {number|null} altitude_m
 * @property {string} nome
 */

/**
 * @typedef {Object} ResultadoTrace
 * @property {string} formato - 'kml' | 'gpx'
 * @property {string} nome_arquivo
 * @property {number} total_pontos
 * @property {number} comprimento_total_m
 * @property {PontoGPS[]} pontos
 */

/**
 * Hook para importar traçados GPS (KML ou GPX) via backend.
 *
 * @returns {{
 *   loading: boolean,
 *   error: string|null,
 *   resultado: ResultadoTrace|null,
 *   importarTrace: (arquivo: File) => Promise<ResultadoTrace|null>,
 *   limpar: () => void,
 * }}
 */
export function useKml() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);

  /**
   * Importa um arquivo KML ou GPX.
   * @param {File} arquivo - Arquivo selecionado pelo usuário.
   * @returns {Promise<ResultadoTrace|null>}
   */
  const importarTrace = useCallback(async (arquivo) => {
    if (!arquivo) {
      setError('Nenhum arquivo selecionado');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const conteudo_xml = await arquivo.text();
      const body = {
        conteudo_xml,
        nome_arquivo: arquivo.name || '',
      };

      const res = await fetch(`${API_URL}/api/trace/importar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Erro HTTP ${res.status}`);
      }

      const data = await res.json();
      setResultado(data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Limpa o resultado e o erro. */
  const limpar = useCallback(() => {
    setResultado(null);
    setError(null);
  }, []);

  return { loading, error, resultado, importarTrace, limpar };
}
