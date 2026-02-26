import React, { useState, useMemo, memo, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, WMSTileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import NormativeExplorer from './NormativeExplorer';
import { Activity } from 'lucide-react';

// Modular Components
import MapToolbar from './map/MapToolbar';
import StructureMarker from './map/StructureMarker';
import BimInspector from './map/BimInspector';
import FieldAuditModal from './map/FieldAuditModal';

// Free IBGE WMS endpoints (zero-cost, public API)
const WMS_LAYERS = {
    ibge_municipios: {
        url: 'https://geoservicos.ibge.gov.br/geoserver/wms',
        layers: 'CGEO:BCG_Municipio_A',
        label: 'Municípios IBGE',
    },
};

const StructuralMap = ({ initialPos = [-22.15018, -42.92185] }) => {
    const [viewMode, setViewMode] = useState('2.5D');
    const [mapType, setMapType] = useState('osm');
    const [isReviewMode, setIsReviewMode] = useState(false);
    const [flags, setFlags] = useState([]);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [selectedSap, setSelectedSap] = useState(null);
    const [assets, setAssets] = useState([]);
    const [auditAsset, setAuditAsset] = useState(null);
    const [wmsLayer, setWmsLayer] = useState('none');

    const fetchGisData = async () => {
        if (!window.api) return;
        // 1. Fetch Flags
        const flagResults = await window.api.getAuditFlags();
        setFlags(flagResults);

        // 2. Fetch GIS Assets (BIM Twin)
        const assetResults = await window.api.getAllGisAssets();
        setAssets(assetResults);
    };

    useEffect(() => {
        fetchGisData();
        // Fallback: Populate initial test data if empty
        const seedData = async () => {
            if (window.api) {
                const current = await window.api.getAllGisAssets();
                if (current.length === 0) {
                    await window.api.upsertGisAsset({
                        pole_id: 'P-ZENITH-01', sap_material: '391016', lat: -22.15018, lng: -42.92185,
                        altura: 12, estado_conservacao: 'bom', vida_util_estimada: 30
                    });
                    await window.api.upsertGisAsset({
                        pole_id: 'P-ZENITH-02', sap_material: '392025', lat: -22.15050, lng: -42.92220,
                        altura: 11, estado_conservacao: 'regular', vida_util_estimada: 15
                    });
                    fetchGisData();
                }
            }
        };
        seedData();
    }, []);

    const handleAddFlag = async (poleId, message) => {
        if (!window.api) return;
        await window.api.addAuditFlag({ pole_id: poleId.toString(), severity: 'medium', message });
        fetchGisData();
    };

    const handleResolveFlag = async (id) => {
        if (!window.api) return;
        await window.api.updateAuditFlagStatus(id, 'resolved');
        fetchGisData();
    };

    const handleScheduleMaintenance = async (poleId, type) => {
        if (!window.api) return;
        const note = prompt(`Tipo de serviço para ${type}:`, 'Inspeção Preventiva');
        if (note) {
            await window.api.scheduleMaintenance({
                pole_id: poleId.toString(),
                priority: 'medium',
                job_type: 'inspection',
                scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                notes: note
            });
            alert('Manutenção agendada com sucesso!');
        }
    };

    const processedMapData = useMemo(() => {
        const topPositions = assets.map(s => ({
            ...s,
            topPos: viewMode === '2.5D' ? [s.lat + 0.0001, s.lng + 0.0001] : [s.lat, s.lng]
        }));
        const spans = [];
        for (let i = 0; i < topPositions.length - 1; i++) {
            spans.push({ start: topPositions[i].topPos, end: topPositions[i + 1].topPos });
        }
        return { topPositions, spans };
    }, [assets, viewMode]);

    return (
        <div className="h-full w-full rounded-2xl overflow-hidden shadow-2xl relative border border-white/20">
            {/* Normative Inspector Layer (Legacy Connector) */}
            {selectedSap && <NormativeExplorer sapCode={selectedSap} onClose={() => setSelectedSap(null)} />}

            {/* Premium BIM Inspector (Zenith Side Panel) */}
            {selectedAsset && (
                <BimInspector
                    asset={selectedAsset}
                    onClose={() => setSelectedAsset(null)}
                    onAudit={() => setAuditAsset(selectedAsset)}
                />
            )}

            {auditAsset && (
                <FieldAuditModal
                    asset={auditAsset}
                    onClose={() => setAuditAsset(null)}
                    onSave={() => {
                        fetchGisData();
                        setAuditAsset(null);
                        setSelectedAsset(null);
                    }}
                />
            )}

            {/* Premium Map Toolbar */}
            <MapToolbar
                viewMode={viewMode} setViewMode={setViewMode}
                mapType={mapType} setMapType={setMapType}
                isReviewMode={isReviewMode} setIsReviewMode={setIsReviewMode}
                wmsLayer={wmsLayer} setWmsLayer={setWmsLayer}
            />

            <MapContainer
                center={initialPos}
                zoom={19}
                className="h-full w-full outline-none bg-slate-900"
                zoomControl={false}
            >
                <TileLayer
                    url={mapType === 'osm' ? "https://{s}.tile.osm.org/{z}/{x}/{y}.png" : "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"}
                    opacity={mapType === 'satellite' ? 0.9 : 1}
                />

                {/* WMS Layer — IBGE public service (zero-cost) */}
                {wmsLayer !== 'none' && WMS_LAYERS[wmsLayer] && (
                    <WMSTileLayer
                        url={WMS_LAYERS[wmsLayer].url}
                        layers={WMS_LAYERS[wmsLayer].layers}
                        format="image/png"
                        transparent={true}
                        opacity={0.5}
                        version="1.1.1"
                    />
                )}

                {processedMapData.spans.map((span, idx) => (
                    <Polyline
                        key={`span-${idx}`}
                        positions={[span.start, span.end]}
                        pathOptions={{ color: '#3b82f6', weight: 2, opacity: 0.7, dashArray: '5, 5' }}
                    />
                ))}

                {processedMapData.topPositions.map((s) => (
                    <StructureMarker
                        key={s.pole_id}
                        s={s}
                        viewMode={viewMode}
                        topPos={s.topPos}
                        isReviewMode={isReviewMode}
                        flags={flags}
                        onAddFlag={handleAddFlag}
                        onResolveFlag={handleResolveFlag}
                        onSchedule={handleScheduleMaintenance}
                        onSelect={setSelectedAsset}
                        healthData={s.bim_lifecycle}
                    />
                ))}
            </MapContainer>

            {/* Experience Overlays */}
            <div className={`absolute bottom-4 left-4 z-[1000] flex flex-col gap-2 transition-all duration-500 ${selectedAsset ? 'opacity-0 pointer-events-none translate-x-[-20px]' : 'opacity-100'}`}>
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg text-white border border-white/10 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                    <span className="text-xs font-mono uppercase tracking-widest">Ativos BIM Mapeados: {assets.length}</span>
                </div>
                {wmsLayer !== 'none' && WMS_LAYERS[wmsLayer] && (
                    <div className="bg-emerald-600/80 backdrop-blur-md px-4 py-1.5 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest border border-emerald-400/50">
                        WMS: {WMS_LAYERS[wmsLayer].label}
                    </div>
                )}
                {isReviewMode && (
                    <div className="bg-amber-600/80 backdrop-blur-md px-4 py-1.5 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest border border-amber-400/50">
                        Z-Review Mode Ativo
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(StructuralMap);
