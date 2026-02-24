import React from 'react';
import { X, Activity, ShieldAlert, Calendar, Info, Clock, ClipboardCheck } from 'lucide-react';

const BimInspector = ({ asset, onClose, onAudit }) => {
    if (!asset) return null;

    const health = asset.bim_lifecycle?.health || 100;
    const status = asset.bim_lifecycle?.status || 'healthy';

    const getStatusColor = (s) => {
        if (s === 'healthy') return 'text-emerald-500';
        if (s === 'warning') return 'text-amber-500';
        return 'text-red-500';
    };

    return (
        <div className="absolute top-4 left-4 bottom-4 w-80 bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl z-[2000] rounded-2xl flex flex-col overflow-hidden animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-sm tracking-tight">{asset.pole_id || 'Asset details'}</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{asset.material_desc || 'BIM Generic'}</p>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Health Gauge */}
                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Saúde Estrutural</span>
                        <span className={`text-lg font-black ${getStatusColor(status)}`}>{health}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${status === 'healthy' ? 'bg-emerald-500' : status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${health}%` }}
                        />
                    </div>
                </div>

                {/* Lifecycle Card */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> Ciclo de Vida (BIM Prediction)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[9px] text-gray-500">Idade Atual</p>
                            <p className="text-sm font-bold text-gray-800">{asset.bim_lifecycle?.ageYears || 0} anos</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-gray-500">Remanecente</p>
                            <p className="text-sm font-bold text-indigo-600">{asset.bim_lifecycle?.remainingLife || 0} anos</p>
                        </div>
                    </div>
                </div>

                {/* BIM Information Grid */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                        <Info className="w-3 h-3" /> Metadados de Ativo
                    </h4>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[11px] border-b border-slate-50 pb-1">
                            <span className="text-gray-500">Altura Nominal</span>
                            <span className="font-semibold">{asset.altura || 'N/A'} m</span>
                        </div>
                        <div className="flex justify-between text-[11px] border-b border-slate-50 pb-1">
                            <span className="text-gray-500">Instalação</span>
                            <span className="font-semibold">{asset.data_instalacao || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-[11px] border-b border-slate-50 pb-1">
                            <span className="text-gray-500">Lat/Lng</span>
                            <span className="font-mono text-[9px]">{asset.lat?.toFixed(5)}, {asset.lng?.toFixed(5)}</span>
                        </div>
                    </div>
                </div>

                {/* Normative Quick Link */}
                <div className="pt-4 grid grid-cols-2 gap-2">
                    <button className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-200">
                        <ShieldAlert className="w-3 h-3" /> Normas
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onAudit(); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100"
                    >
                        <ClipboardCheck className="w-3 h-3" /> Vistoria
                    </button>
                </div>
            </div>

            {/* Footer / Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100">
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100">
                    <Calendar className="w-4 h-4" /> Agendar Manutenção
                </button>
            </div>
        </div>
    );
};

export default BimInspector;
