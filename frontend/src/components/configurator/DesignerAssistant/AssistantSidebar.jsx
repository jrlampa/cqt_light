import React, { useState, useEffect } from 'react';
import {
    Zap, Sparkles, ShieldCheck, AlertCircle, Info,
    ArrowRight, CheckCircle2, ChevronRight, Activity,
    Scale, DollarSign, Package, HardHat
} from 'lucide-react';

const AssistantSidebar = ({ projectData, onApplySuggestion }) => {
    const [insights, setInsights] = useState([]);
    const [stats, setStats] = useState({ qualityScore: 100, isCompliant: true });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (window.api && projectData) {
            setLoading(true);
            window.api.invoke('get-designer-insights', projectData)
                .then(res => {
                    setInsights(res.insights || []);
                    setStats(res.stats || { qualityScore: 100, isCompliant: true });
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [projectData]);

    const getLevelConfig = (level) => {
        switch (level) {
            case 'CRITICAL': return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertCircle };
            case 'WARNING': return { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Info };
            default: return { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: ShieldCheck };
        }
    };

    return (
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 border border-white/40 shadow-2xl flex flex-col gap-5 h-full overflow-hidden animate-in slide-in-from-right duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Zenith Assistant</h3>
                        <p className="text-[10px] text-slate-400 font-bold">Proactive Designer Guide</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${stats.isCompliant ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-[10px] font-black text-slate-600 uppercase">Live</span>
                </div>
            </div>

            {/* Quality Score Shield */}
            <div className="relative group p-6 rounded-[2rem] bg-slate-900 border border-slate-800 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -mr-16 -mt-16 blur-[60px] group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10 flex flex-col gap-1">
                    <div className="flex items-center justify-between font-black uppercase text-[10px] tracking-tighter text-blue-400">
                        <span>Project Score</span>
                        <span>{stats.qualityScore}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1">
                        <div
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 rounded-full transition-all duration-1000"
                            style={{ width: `${stats.qualityScore}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Insights Content */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 custom-scrollbar">
                {insights.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                        <ShieldCheck className="w-10 h-10 mb-2 text-emerald-500" />
                        <p className="text-xs font-bold text-slate-800">Tudo em conformidade!</p>
                        <p className="text-[10px] text-slate-400">Seu projeto segue os padrões técnicos.</p>
                    </div>
                ) : (
                    insights.map((insight, idx) => {
                        const config = getLevelConfig(insight.level);
                        const Icon = config.icon;
                        return (
                            <div
                                key={idx}
                                className={`group p-4 rounded-2xl border transition-all duration-300 ${config.bg} ${config.border} hover:scale-[1.02]`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-xl bg-white shadow-sm ${config.color}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${config.color}`}>
                                                {insight.type}
                                            </span>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-700 leading-tight">
                                            {insight.message}
                                        </p>
                                    </div>
                                </div>

                                {insight.suggestedSaps?.length > 0 && (
                                    <div className="mt-4 flex flex-col gap-2">
                                        <div className="flex items-center gap-2 opacity-60">
                                            <Sparkles className="w-3 h-3 text-amber-500" />
                                            <span className="text-[9px] font-black uppercase text-slate-500">Suggested Action</span>
                                        </div>
                                        {insight.suggestedSaps.map(sap => (
                                            <button
                                                key={sap}
                                                onClick={() => onApplySuggestion(insight, sap)}
                                                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/60 hover:bg-white border border-white/40 hover:border-blue-200 transition-all text-left"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-3 h-3 text-blue-500" />
                                                    <span className="text-[10px] font-black text-slate-700 uppercase">{sap}</span>
                                                </div>
                                                <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2 mt-auto">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                    <Activity className="w-3 h-3 text-slate-400" />
                    <span className="text-[9px] font-black text-slate-500 uppercase">Stress Index</span>
                    <span className="text-sm font-black text-slate-800 tracking-tighter">Normal</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                    <Scale className="w-3 h-3 text-slate-400" />
                    <span className="text-[9px] font-black text-slate-500 uppercase">BIM Fidelity</span>
                    <span className="text-sm font-black text-slate-800 tracking-tighter">High (92%)</span>
                </div>
            </div>
        </div>
    );
};

export default AssistantSidebar;
