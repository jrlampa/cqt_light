/**
 * MapaRede — Componente React com mapa Leaflet + OpenStreetMap para visualização
 * de redes elétricas 2.5D.
 *
 * Uso de API pública e gratuita (OSM/Leaflet — zero custo).
 * Utiliza Leaflet via CDN carregado dinamicamente (sem dependência npm).
 *
 * Props:
 *   postes    — array de { id, lat, lon, altura_m?, tipo? }
 *   trechos   — array de { id, lat_ini, lon_ini, lat_fim, lon_fim, nivel? }
 *   centro    — { lat, lon } — ponto central do mapa
 *   zoom      — zoom inicial (padrão 15)
 *   altura    — altura do container em px (padrão 450)
 */

import { useEffect, useRef, useState } from 'react';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

const CORES_NIVEL = {
  MT: '#ef4444',  // vermelho — Média Tensão
  BT: '#3b82f6',  // azul — Baixa Tensão
};

/** Carrega CSS e JS do Leaflet via CDN (idempotente). */
function carregarLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve(window.L);
      return;
    }
    // CSS
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    // JS
    if (!document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
      const script = document.createElement('script');
      script.src = LEAFLET_JS;
      script.onload = () => resolve(window.L);
      script.onerror = () => reject(new Error('Falha ao carregar Leaflet'));
      document.head.appendChild(script);
    } else {
      // Script já existe mas window.L ainda não disponível
      const check = setInterval(() => {
        if (window.L) {
          clearInterval(check);
          resolve(window.L);
        }
      }, 50);
    }
  });
}

export default function MapaRede({
  postes = [],
  trechos = [],
  tracado = [],
  centro = { lat: -22.15018, lon: -42.92185 },
  zoom = 15,
  altura = 450,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Inicializar mapa
  useEffect(() => {
    let mapa = null;

    carregarLeaflet()
      .then((L) => {
        if (!containerRef.current) return;

        // Evita re-criar mapa em StrictMode
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        mapa = L.map(containerRef.current).setView(
          [centro.lat, centro.lon],
          zoom
        );

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(mapa);

        mapRef.current = mapa;
        setCarregando(false);
      })
      .catch((err) => {
        setErro(err.message);
        setCarregando(false);
      });

    return () => {
      if (mapa) mapa.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atualizar postes e trechos sempre que props mudarem
  useEffect(() => {
    const mapa = mapRef.current;
    if (!mapa || !window.L) return;
    const L = window.L;

    // Remover camadas anteriores de postes/trechos (layer group)
    mapa.eachLayer((layer) => {
      if (layer._cqtLayer) mapa.removeLayer(layer);
    });

    // Renderizar trechos (polylines 2.5D)
    trechos.forEach((trecho) => {
      const cor = CORES_NIVEL[trecho.nivel] ?? '#6b7280';
      const linha = L.polyline(
        [
          [trecho.lat_ini, trecho.lon_ini],
          [trecho.lat_fim, trecho.lon_fim],
        ],
        { color: cor, weight: 3, opacity: 0.85 }
      );
      linha._cqtLayer = true;
      linha.bindTooltip(
        `Trecho ${trecho.id ?? ''} — ${trecho.nivel ?? 'BT'}`,
        { sticky: true }
      );
      linha.addTo(mapa);
    });

    // Renderizar postes (círculos)
    postes.forEach((poste) => {
      const circulo = L.circleMarker([poste.lat, poste.lon], {
        radius: 6,
        fillColor: '#f97316',
        color: '#92400e',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      });
      circulo._cqtLayer = true;
      circulo.bindTooltip(
        `Poste ${poste.id ?? ''}${poste.altura_m ? ` — ${poste.altura_m}m` : ''}`,
        { sticky: true }
      );
      circulo.addTo(mapa);
    });

    // Renderizar pontos do traçado GPS importado (KML/GPX)
    tracado.forEach((ponto) => {
      const circulo = L.circleMarker([ponto.latitude, ponto.longitude], {
        radius: 4,
        fillColor: '#8b5cf6', // roxo — GPS importado
        color: '#5b21b6',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.8,
      });
      circulo._cqtLayer = true;
      circulo.bindTooltip(
        `GPS ${ponto.nome || (ponto.id != null ? String(ponto.id) : '')}`,
        { sticky: true }
      );
      circulo.addTo(mapa);
    });

    // Ajustar viewport se houver elementos
    const todosLatLon = [
      ...postes.map((p) => [p.lat, p.lon]),
      ...trechos.flatMap((t) => [
        [t.lat_ini, t.lon_ini],
        [t.lat_fim, t.lon_fim],
      ]),
      ...tracado.map((p) => [p.latitude, p.longitude]),
    ];
    if (todosLatLon.length > 0) {
      mapa.fitBounds(todosLatLon, { padding: [30, 30], maxZoom: 17 });
    }
  }, [postes, trechos, tracado]);

  return (
    <div className="flex flex-col gap-2">
      {/* Legenda */}
      <div className="flex items-center gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-1 bg-red-500 rounded" /> MT
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-1 bg-blue-500 rounded" /> BT
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-orange-400 border border-orange-900" />{' '}
          Poste
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-purple-400 border border-purple-900" />{' '}
          GPS
        </span>
        <span className="ml-auto text-gray-400">
          © OpenStreetMap — Mapa 2.5D
        </span>
      </div>

      {/* Container do mapa */}
      <div
        ref={containerRef}
        data-testid="mapa-container"
        style={{ height: `${altura}px` }}
        className="w-full rounded-lg border border-gray-200 overflow-hidden relative"
      >
        {carregando && (
          <div
            data-testid="mapa-carregando"
            className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10"
          >
            <span className="text-gray-500 text-sm">Carregando mapa…</span>
          </div>
        )}
        {erro && (
          <div
            data-testid="mapa-erro"
            className="absolute inset-0 flex items-center justify-center bg-red-50 z-10"
          >
            <span className="text-red-600 text-sm">
              Erro ao carregar mapa: {erro}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
