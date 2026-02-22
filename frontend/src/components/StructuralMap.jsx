import React, { useState, useMemo, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Layers, MessageSquare, Flag, CheckCircle, ShieldAlert } from 'lucide-react';

// Memoized Marker Component for Performance
const StructureMarker = memo(({ s, viewMode, topPos, isReviewMode, flags = [], onAddFlag, onResolveFlag }) => {
    const sapCode = s.sap || (s.isTrafo ? '10005432' : '10001234');
    const bimStatus = s.isTrafo ? 'Zenith Master' : 'ABNT Standard';
    const activeFlags = flags.filter(f => f.pole_id === s.id && f.status === 'open');

    return (
        <React.Fragment>
            {/* 2.5D Vertical Extension (Poste) */}
            {viewMode === '2.5D' && (
                <Polyline
                    positions={[[s.lat, s.lng], topPos]}
                    pathOptions={{
                        color: s.isTrafo ? '#f59e0b' : '#475569',
                        weight: 5,
                        opacity: 0.9
                    }}
                />
            )}

            {/* Equipment Marker at the Top */}
            <Marker position={topPos} icon={activeFlags.length > 0 && isReviewMode ? L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="bg-red-500 rounded-full p-1 animate-bounce border-2 border-white shadow-lg"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            }) : undefined}>
                <Popup minWidth={240}>
                    <div className="p-3 space-y-3 font-sans">
                        <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${s.isTrafo ? 'bg-amber-500 shadow-sm shadow-amber-200' : 'bg-slate-500 shadow-sm shadow-slate-200'}`} />
                                <h4 className="font-bold text-gray-900 text-sm leading-tight">{s.type}</h4>
                            </div>
                            <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold border border-blue-100 uppercase">
                                BIM Active
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="text-gray-400">SAP Code:</div>
                            <div className="font-mono font-semibold text-gray-700">{sapCode}</div>
                            <div className="text-gray-400">Class:</div>
                            <div className="text-gray-700 font-medium">{bimStatus}</div>
                        </div>

                        {/* Review Mode Content */}
                        {isReviewMode && (
                            <div className="mt-3 pt-3 border-t bg-slate-50 p-2 rounded-lg">
                                <h5 className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">
                                    <ShieldAlert className="w-3 h-3" /> Governança Técnica
                                </h5>

                                {activeFlags.length > 0 ? (
                                    <div className="space-y-2">
                                        {activeFlags.map(f => (
                                            <div key={f.id} className="bg-white p-2 rounded border border-red-100 text-[10px] flex justify-between items-start">
                                                <span>{f.message}</span>
                                                <button
                                                    onClick={() => onResolveFlag(f.id)}
                                                    className="text-emerald-600 hover:text-emerald-700"
                                                >
                                                    <CheckCircle className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[9px] text-gray-400 italic">Nenhum alerta pendente.</p>
                                )}

                                <button
                                    onClick={() => {
                                        const msg = prompt('Descreva o alerta técnico:');
                                        if (msg) onAddFlag(s.id, msg);
                                    }}
                                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600 text-white rounded text-[10px] font-bold hover:bg-indigo-700 transition-colors"
                                >
                                    <Flag className="w-3 h-3" /> Emitir Alerta
                                </button>
                            </div>
                        )}

                        <div className="pt-2 mt-2 border-t flex items-center justify-between opacity-50">
                            <span className="text-[9px] text-gray-400 uppercase tracking-widest">Vista: {viewMode}</span>
                            <span className="text-[9px] text-gray-400 uppercase tracking-widest tracking-tighter">ID: {s.id}</span>
                        </div>
                    </div>
                </Popup>
            </Marker>
        </React.Fragment>
    );
});

StructureMarker.displayName = 'StructureMarker';

const StructuralMap = ({ structures = [], initialPos = [-22.15018, -42.92185] }) => {
    const [viewMode, setViewMode] = useState('2.5D');
    const [mapType, setMapType] = useState('osm');
    const [isReviewMode, setIsReviewMode] = useState(false);
    const [flags, setFlags] = useState([]);

    useEffect(() => {
        const fetchFlags = async () => {
            if (window.api && window.api.getAuditFlags) {
                const results = await window.api.getAuditFlags();
                setFlags(results);
            }
        };
        fetchFlags();
    }, []);

    const handleAddFlag = async (poleId, message) => {
        if (!window.api) return;
        await window.api.addAuditFlag({
            pole_id: poleId.toString(),
            severity: 'medium',
            message
        });
        const results = await window.api.getAuditFlags();
        setFlags(results);
    };

    const handleResolveFlag = async (id) => {
        if (!window.api) return;
        await window.api.updateAuditFlagStatus(id, 'resolved');
        const results = await window.api.getAuditFlags();
        setFlags(results);
    };

    // Default test structures
    const displayStructures = useMemo(() => structures.length > 0 ? structures : [
        { id: 1, lat: -22.15018, lng: -42.92185, type: 'POSTE_DT_12/600', height: 12 },
        { id: 2, lat: -22.15050, lng: -42.92220, type: 'POSTE_DT_11/300', height: 11 },
        { id: 3, lat: -22.15080, lng: -42.92150, type: 'TRANSFORMADOR_45KVA', height: 10, isTrafo: true },
    ], [structures]);

    const processedMapData = useMemo(() => {
        const topPositions = displayStructures.map(s => ({
            ...s,
            topPos: viewMode === '2.5D' ? [s.lat + 0.0001, s.lng + 0.0001] : [s.lat, s.lng]
        }));

        const spans = [];
        for (let i = 0; i < topPositions.length - 1; i++) {
            spans.push({ start: topPositions[i].topPos, end: topPositions[i + 1].topPos });
        }

        return { topPositions, spans };
    }, [displayStructures, viewMode]);

    return (
        <div className="h-full w-full rounded-2xl overflow-hidden shadow-2xl relative border border-white/20">
            {/* Premium Map Toolbar */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-white/40 flex flex-col gap-1">
                    <button
                        onClick={() => setIsReviewMode(!isReviewMode)}
                        className={`p-2 rounded-lg transition-all ${isReviewMode ? 'bg-amber-500 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                        title="Review Mode (Geral)"
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode(viewMode === '2D' ? '2.5D' : '2D')}
                        className={`p-2 rounded-lg transition-all ${viewMode === '2.5D' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                        title="Vista 2.5D"
                    >
                        <Box className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setMapType(mapType === 'osm' ? 'satellite' : 'osm')}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-all"
                        title="Satélite"
                    >
                        <Layers className="w-5 h-5" />
                    </button>
                </div>
            </div>

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

                {processedMapData.spans.map((span, idx) => (
                    <Polyline
                        key={`span-${idx}`}
                        positions={[span.start, span.end]}
                        pathOptions={{ color: '#3b82f6', weight: 2, opacity: 0.7, dashArray: '5, 5' }}
                    />
                ))}

                {processedMapData.topPositions.map((s) => (
                    <StructureMarker
                        key={s.id}
                        s={s}
                        viewMode={viewMode}
                        topPos={s.topPos}
                        isReviewMode={isReviewMode}
                        flags={flags}
                        onAddFlag={handleAddFlag}
                        onResolveFlag={handleResolveFlag}
                    />
                ))}
            </MapContainer>

            <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg text-white border border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-mono uppercase tracking-widest">Analytics Estrutural SotA</span>
                </div>
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
