import React, { memo } from 'react';
import { Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { MessageSquare, CheckCircle, ShieldAlert, Calendar } from 'lucide-react';

const StructureMarker = memo(({ s, viewMode, topPos, isReviewMode, flags = [], onAddFlag, onResolveFlag, onSelect, onSchedule, healthData }) => {
    const sapCode = s.sap || s.sap_material || (s.isTrafo ? '10005432' : '10001234');
    const activeFlags = flags.filter(f => f.pole_id === s.id && f.status === 'open');

    // Health Color Logic
    let healthColor = 'bg-slate-500';
    if (healthData) {
        if (healthData.status === 'healthy') healthColor = 'bg-emerald-500';
        else if (healthData.status === 'warning') healthColor = 'bg-amber-500';
        else if (healthData.status === 'critical') healthColor = 'bg-red-500';
    }

    return (
        <React.Fragment>
            {/* 2.5D Vertical Extension (Poste) */}
            {viewMode === '2.5D' && (
                <Polyline
                    positions={[[s.lat, s.lng], topPos]}
                    pathOptions={{
                        color: s.isTrafo ? '#f59e0b' : (healthData ? (healthData.status === 'critical' ? '#ef4444' : '#475569') : '#475569'),
                        weight: 5,
                        opacity: 0.9
                    }}
                />
            )}

            {/* Equipment Marker at the Top */}
            <Marker
                position={topPos}
                icon={activeFlags.length > 0 && isReviewMode ? L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div class="bg-red-500 rounded-full p-1 animate-bounce border-2 border-white shadow-lg"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg></div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                }) : L.divIcon({
                    className: 'structure-marker',
                    html: `<div class="w-4 h-4 rounded-full border-2 border-white shadow-md ${healthColor} transition-all duration-300"></div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                })}
            >
                <Popup minWidth={240}>
                    <div className="p-3 space-y-3 font-sans">
                        <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${s.isTrafo ? 'bg-amber-500 shadow-sm shadow-amber-200' : healthColor} `} />
                                <h4 className="font-bold text-gray-900 text-sm leading-tight">{s.type || s.pole_id}</h4>
                            </div>
                            <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold border border-blue-100 uppercase">
                                BIM Ativo
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="text-gray-400">Código SAP:</div>
                            <div className="font-mono font-semibold text-gray-700">{sapCode}</div>
                            {healthData && (
                                <React.Fragment>
                                    <div className="text-gray-400">Saúde Estrutural:</div>
                                    <div className={`font-bold ${healthData.status === 'critical' ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {healthData.health.toFixed(0)}%
                                    </div>
                                </React.Fragment>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => onSelect(s)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 text-white rounded text-[10px] font-bold hover:bg-slate-900 transition-colors"
                            >
                                <ShieldAlert className="w-3 h-3" /> BIM Inspector
                            </button>
                            <button
                                onClick={() => onSchedule(s.id || s.pole_id, s.type || s.pole_id)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600 text-white rounded text-[10px] font-bold hover:bg-indigo-700 transition-colors"
                            >
                                <Calendar className="w-3 h-3" /> Agendar
                            </button>
                        </div>

                        {/* Review Mode Content */}
                        {isReviewMode && (
                            <div className="mt-3 pt-3 border-t bg-slate-50 p-2 rounded-lg">
                                <h5 className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">
                                    <MessageSquare className="w-3 h-3" /> Governança Técnica
                                </h5>

                                {activeFlags.length > 0 && (
                                    <div className="space-y-2 mb-2">
                                        {activeFlags.map(f => (
                                            <div key={f.id} className="bg-white p-2 rounded border border-red-100 text-[10px] flex justify-between items-start italic">
                                                <span>"{f.message}"</span>
                                                <button onClick={() => onResolveFlag(f.id)} className="text-emerald-600"><CheckCircle className="w-3 h-3" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        const msg = prompt('Descreva o alerta técnico:');
                                        if (msg) onAddFlag(s.id || s.pole_id, msg);
                                    }}
                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-amber-500 text-white rounded text-[10px] font-bold"
                                >
                                    <Flag className="w-3 h-3" /> Emitir Alerta
                                </button>
                            </div>
                        )}
                    </div>
                </Popup>
            </Marker>
        </React.Fragment>
    );
});

StructureMarker.displayName = 'StructureMarker';

export default StructureMarker;
