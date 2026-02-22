/**
 * useGeo — Hook React para integração com a API de georreferenciamento do backend.
 *
 * Endpoints cobertos (MEMORY.md):
 *   POST /api/geo/utm-to-decimal
 *   POST /api/geo/decimal-to-utm
 *   POST /api/geo/buffer
 *
 * Coordenadas de referência (MEMORY.md):
 *   UTM 23K: 788547 E, 7634925 N
 *   Decimal: -22.15018, -42.92185
 *   Raios de teste: 100 m · 500 m · 1 km
 */

import { useState, useCallback } from 'react';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * Faz uma chamada JSON ao backend e retorna o resultado ou lança erro.
 * @param {string} path
 * @param {object} body
 * @returns {Promise<object>}
 */
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
 * useGeo — conversões e buffer geo via backend FastAPI.
 *
 * @returns {{
 *   convertUtmToDecimal: (easting: number, northing: number, zone_number?: number, northern?: boolean) => Promise<{latitude: number, longitude: number}>,
 *   convertDecimalToUtm: (lat: number, lon: number) => Promise<{easting: number, northing: number, zone_number: number, northern: boolean}>,
 *   calcularBuffer: (lat: number, lon: number, radius_m: number) => Promise<object>,
 *   loading: boolean,
 *   error: string|null,
 *   clearError: () => void,
 * }}
 */
export function useGeo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  const convertUtmToDecimal = useCallback(
    async (easting, northing, zone_number = 23, northern = false) => {
      setLoading(true);
      setError(null);
      try {
        const result = await postJson('/api/geo/utm-to-decimal', {
          easting,
          northing,
          zone_number,
          northern,
        });
        return result;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const convertDecimalToUtm = useCallback(async (lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      const result = await postJson('/api/geo/decimal-to-utm', { latitude: lat, longitude: lon });
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const calcularBuffer = useCallback(async (lat, lon, radius_m) => {
    setLoading(true);
    setError(null);
    try {
      const result = await postJson('/api/geo/buffer', { latitude: lat, longitude: lon, radius_m });
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    convertUtmToDecimal,
    convertDecimalToUtm,
    calcularBuffer,
    loading,
    error,
    clearError,
  };
}
