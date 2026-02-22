import React, { useState, useMemo, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Layers } from 'lucide-react';

// Fix for default Leaflet icons in React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Memoized Marker Component for Performance
const StructureMarker = memo(({ s, viewMode, topPos }) => {
    const sapCode = s.sap || (s.isTrafo ? '10005432' : '10001234');
    const bimStatus = s.isTrafo ? 'Zenith Master' : 'ABNT Standard';

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
            <Marker position={topPos}>
                <Popup minWidth={200}>
                    <div className="p-3 space-y-2 font-sans">
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

                            <div className="text-gray-400">Height:</div>
                            <div className="text-gray-700 font-medium">{s.height}m</div>
                        </div>

                        <div className="pt-2 mt-2 border-t flex items-center justify-between">
                            <span className="text-[9px] text-gray-400 uppercase tracking-widest">Perspective: {viewMode}</span>
                            <button className="text-[10px] text-indigo-600 font-bold hover:underline">Ver Detalhes SAP</button>
                        </div>
                    </div>
                </Popup>
            </Marker>
        </React.Fragment>
    );
});

StructureMarker.displayName = 'StructureMarker';

const StructuralMap = ({ structures = [], initialPos = [-22.15018, -42.92185] }) => {
    const [viewMode, setViewMode] = useState('2.5D'); // '2D' or '2.5D'
    const [mapType, setMapType] = useState('osm');

    // Default test structures if none provided
    const displayStructures = useMemo(() => structures.length > 0 ? structures : [
        { id: 1, lat: -22.15018, lng: -42.92185, type: 'POSTE_DT_12/600', height: 12 },
        { id: 2, lat: -22.15050, lng: -42.92220, type: 'POSTE_DT_11/300', height: 11 },
        { id: 3, lat: -22.15080, lng: -42.92150, type: 'TRANSFORMADOR_45KVA', height: 10, isTrafo: true },
    ], [structures]);

    // Optimized span and position calculation
    const processedMapData = useMemo(() => {
        const topPositions = displayStructures.map(s => ({
            ...s,
            topPos: viewMode === '2.5D' ? [s.lat + 0.0001, s.lng + 0.0001] : [s.lat, s.lng]
        }));

        const spans = [];
        for (let i = 0; i < topPositions.length - 1; i++) {
            spans.push({
                start: topPositions[i].topPos,
                end: topPositions[i + 1].topPos
            });
        }

        return { topPositions, spans };
    }, [displayStructures, viewMode]);

    return (
        <div className="h-full w-full rounded-2xl overflow-hidden shadow-2xl relative border border-white/20">
            {/* Premium Map Toolbar */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-white/40 flex flex-col gap-1">
                    <button
                        onClick={() => setViewMode(viewMode === '2D' ? '2.5D' : '2D')}
                        className={`p-2 rounded-lg transition-all ${viewMode === '2.5D' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                        title="Alternar Vista 2.5D"
                    >
                        <Box className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setMapType(mapType === 'osm' ? 'satellite' : 'osm')}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-all"
                        title="Alternar Satélite"
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
                    url={mapType === 'osm'
                        ? "https://{s}.tile.osm.org/{z}/{x}/{y}.png"
                        : "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                    }
                    opacity={mapType === 'satellite' ? 0.9 : 1}
                />

                {/* Optimized Conductor Spans */}
                {processedMapData.spans.map((span, idx) => (
                    <Polyline
                        key={`span-${idx}`}
                        positions={[span.start, span.end]}
                        pathOptions={{
                            color: '#3b82f6',
                            weight: 2,
                            opacity: 0.7,
                            dashArray: '5, 5'
                        }}
                    />
                ))}

                {/* Optimized Memoized Markers */}
                {processedMapData.topPositions.map((s) => (
                    <StructureMarker
                        key={s.id}
                        s={s}
                        viewMode={viewMode}
                        topPos={s.topPos}
                    />
                ))}
            </MapContainer>

            {/* Overlay info */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg text-white border border-white/10">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-mono uppercase tracking-widest">Live Structural Analytics</span>
                </div>
            </div>
        </div>
    );
};

export default memo(StructuralMap);
