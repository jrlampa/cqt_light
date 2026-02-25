import React, { useState, useEffect } from 'react';
import {
    Zap, Sparkles, ShieldCheck, AlertCircle, Info,
    ChevronRight, Activity, Scale, Package,
    AlertTriangle, Check, ZapOff, HardHat, FileText, ArrowLeftRight
} from 'lucide-react';

const AssistantSidebar = ({ projectData, onApplySuggestion }) => {
    const [insights, setInsights] = useState([]);
    const [stats, setStats] = useState({
        qualityScore: 100,
        isCompliant: true,
        stressLevel: 'SAFE',
        stressPercent: 0,
        loadDaN: 0,
        demandKVA: 0,
        suggestedTransf: 0,
        vdropPercent: 0,
        vdropLevel: 'SAFE',
        costPerPole: 0,
        potentialSavings: 0,
        estimatedTCO: 0,
        tcoHorizonYears: 10,
        safetyFactor: 0,
        climateScenarios: [],
        technicalLossKW: 0,
        annualLossRS: 0,
        unbalancePercent: 0,
        neutralLossW: 0,
        balancingStatus: 'SAFE'
    });
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    const handleGenerateMemorial = async () => {
        try {
            setExporting(true);
            const result = await window.api.invoke('generate-technical-memorial', projectData);
            if (result && result.content) {
                await window.api.invoke('save-pdf-report', {
                    filename: result.filename,
                    content: `data:application/pdf;base64,${btoa(result.content)}`
                });
            }
        } catch (error) {
            console.error('Failed to export memorial:', error);
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        if (window.api && projectData) {
            setLoading(true);
            window.api.invoke('get-designer-insights', projectData)
                .then(res => {
                    setInsights(res.insights || []);
                    setStats(res.stats || stats);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [projectData]);

    const getLevelConfig = (level) => {
        switch (level) {
            case 'CRITICAL': return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertCircle };
            case 'WARNING': return { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle };
            default: return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: ShieldCheck };
        }
    };

    return (
        <div id="zenith-assistant-sidebar" className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-white/40 shadow-2xl flex flex-col gap-6 h-full overflow-hidden animate-in fade-in slide-in-from-right duration-700">
            {/* Header Zenith Style */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/40">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Zenith IQ</h3>
                        <p className="text-[10px] text-slate-400 font-bold tracking-tight">Evolução V2.0</p>
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors ${stats.isCompliant ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${stats.isCompliant ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                    {stats.isCompliant ? 'Projeto Saudável' : 'Revisão Necessária'}
                </div>
            </div>

            {/* Quality Gauge Shield */}
            <div className="relative group p-6 rounded-[2.5rem] bg-slate-900 border border-slate-800 overflow-hidden shadow-xl shadow-slate-900/20">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full -mr-24 -mt-24 blur-[80px] group-hover:bg-blue-600/20 transition-all duration-1000" />
                <div className="relative z-10">
                    <div className="flex items-baseline justify-between mb-2">
                        <span className="text-[10px] font-black uppercase text-blue-400/80 tracking-widest">BIM Compliance</span>
                        <span className="text-3xl font-black text-white tracking-tighter">{stats.qualityScore}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r transition-all duration-1000 ease-out ${stats.qualityScore > 80 ? 'from-blue-600 to-indigo-400' : 'from-amber-500 to-orange-400'}`}
                            style={{ width: `${stats.qualityScore}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Live Insights Scroller */}
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 custom-scrollbar">
                {insights.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95 duration-500">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                            <Check className="w-8 h-8 text-emerald-500" />
                        </div>
                        <p className="text-sm font-black text-slate-800">Conformidade Total</p>
                        <p className="text-[11px] text-slate-400 font-medium px-6">Projeto validado pelo motor Zenith.</p>
                    </div>
                ) : (
                    insights.map((insight, idx) => {
                        const config = getLevelConfig(insight.level);
                        const InsightIcon = config.icon;
                        const isValueEng = insight.type === 'ENGENHARIA_VALOR' || insight.type === 'ECONOMIA_INTELIGENTE';

                        return (
                            <div
                                key={`${insight.type}-${idx}`}
                                className={`group p-4 rounded-[1.8rem] border-2 transition-all duration-500 ${isValueEng ? 'bg-blue-50/50 border-blue-200' : `${config.bg} ${config.border}`} hover:bg-white hover:border-blue-400 shadow-sm`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-xl bg-white shadow-sm border ${isValueEng ? 'border-blue-200 text-blue-600' : `${config.border} ${config.color}`}`}>
                                        <InsightIcon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${isValueEng ? 'text-blue-600' : config.color}`}>
                                                {isValueEng ? 'Engenharia de Valor' : insight.type}
                                            </span>
                                            {isValueEng && <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />}
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-800 leading-tight">
                                            {insight.message}
                                        </p>

                                        {
                                            insight.suggestedSap && (
                                                <div className="mt-3 flex flex-col gap-2">
                                                    <button
                                                        onClick={() => onApplySuggestion && onApplySuggestion(insight, insight.suggestedSap)}
                                                        className="w-full flex items-center justify-between p-2 rounded-xl bg-white/50 hover:bg-white border border-slate-200/50 hover:border-blue-400 transition-all group/opt"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1 rounded-lg bg-blue-50 text-blue-600">
                                                                <ArrowLeftRight className="w-3 h-3" />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-tight text-slate-600 group-hover/opt:text-blue-600">
                                                                Trocar por {insight.suggestedSap}
                                                            </span>
                                                        </div>
                                                        <ChevronRight className="w-3 h-3 text-slate-300 group-hover/opt:translate-x-0.5" />
                                                    </button>
                                                </div>
                                            )
                                        }

                                        {
                                            insight.impact && (
                                                <p className={`mt-2 text-[9px] font-black uppercase tracking-wider ${isValueEng ? 'text-blue-600' : 'text-emerald-600'}`}>
                                                    {insight.impact}
                                                </p>
                                            )
                                        }
                                    </div>
                                </div>
                            </div >
                        );
                    })
                )}
            </div >

            {/* Premium Smart Metrics Dashboard */}
            < div className="flex flex-col gap-3 mt-auto" >
                {/* 1. Climate Resilience Scenarios */}
                {
                    stats.climateScenarios && Array.isArray(stats.climateScenarios) && stats.climateScenarios.length > 0 && (
                        <div className="p-4 rounded-[1.8rem] bg-slate-900 text-white border border-white/10 shadow-lg">
                            <div className="flex items-center gap-2 mb-3">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Resiliência de Rede</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {stats.climateScenarios.map((s, idx) => (
                                    <div key={idx} className="flex flex-col bg-white/5 p-2 rounded-xl border border-white/5">
                                        <span className="text-[7px] font-black uppercase opacity-60 mb-1 truncate">{s.scenario.split(' ')[0]}</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-[11px] font-black ${s.utilization > 90 ? 'text-red-400' : s.utilization > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                {s.utilization}%
                                            </span>
                                        </div>
                                        <div className="w-full h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                                            <div
                                                className={`h-full ${s.utilization > 90 ? 'bg-red-500' : s.utilization > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${Math.min(100, s.utilization)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* 2. Physical & Efficiency Matrix */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-[1.8rem] bg-slate-50 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Scale className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Desequilíbrio</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <p className="text-lg font-black text-slate-800">{stats.unbalancePercent}%</p>
                            <div className={`w-2 h-2 rounded-full ${stats.balancingStatus === 'SAFE' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                        </div>
                    </div>
                    <div className="p-4 rounded-[1.8rem] bg-indigo-50 border border-indigo-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Activity className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[8px] font-black uppercase text-indigo-400 tracking-wider">P. Neutro</span>
                        </div>
                        <p className="text-lg font-black text-slate-800">{stats.neutralLossW} W</p>
                    </div>
                </div>

                {/* 3. Budget Matrix & Health IQ */}
                <div className="p-5 rounded-[2.5rem] bg-white border border-slate-200 flex flex-col gap-4 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                                <Package className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">CAPEX Executivo</span>
                                <p className="text-sm font-black text-slate-800">R$ {parseFloat(stats.totalCAPEX || (stats.costPerPole * (projectData?.poles?.length || 1))).toFixed(2)}</p>
                            </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${stats.healthStatus === 'EXCELLENT' ? 'bg-emerald-100 text-emerald-700' :
                            stats.healthStatus === 'GOOD' ? 'bg-blue-100 text-blue-700' :
                                stats.healthStatus === 'REGULAR' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {stats.healthStatus || 'N/A'}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-1">
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-[8px] font-black uppercase text-slate-400">Materiais</span>
                            <p className="text-[11px] font-bold text-slate-700">R$ {parseFloat(stats.totalMaterial || 0).toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                            <span className="text-[8px] font-black uppercase text-indigo-400">Mão de Obra</span>
                            <p className="text-[11px] font-bold text-indigo-700">R$ {parseFloat(stats.totalLabor || 0).toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 w-full" />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">TCO Real (10 anos)</span>
                                <p className="text-sm font-black text-indigo-900">R$ {stats.estimatedTCO}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black uppercase text-slate-400">Custo/kVA</span>
                            <p className="text-[11px] font-black text-slate-800">R$ {parseFloat(stats.costPerKVA || 0).toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* 4. Pareto List: Top 5 Cost Drivers */}
                {
                    insights.length > 0 && Array.isArray(projectData.materials) && (
                        <div className="p-4 rounded-[2rem] bg-slate-50 border border-slate-200/50">
                            <div className="flex items-center gap-2 mb-3">
                                <Activity className="w-3 h-3 text-slate-400" />
                                <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Top 5 Drivers de Custo</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                {[...projectData.materials]
                                    .sort((a, b) => ((b.preco || 0) * (b.quantidade || 1)) - ((a.preco || 0) * (a.quantidade || 1)))
                                    .slice(0, 5)
                                    .map((m, i) => (
                                        <div key={i} className="flex items-center justify-between text-[10px]">
                                            <span className="text-slate-600 font-bold truncate max-w-[120px]">{m.descricao}</span>
                                            <span className="text-slate-900 font-black">R$ {((m.preco || 0) * (m.quantidade || 1)).toFixed(0)}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )
                }

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                    {insights.some(i => i.suggestedSap) && (
                        <button
                            className="w-full py-3 rounded-2xl bg-blue-600 text-white font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Otimizar Tudo (Eng. Valor)
                        </button>
                    )}
                    <button
                        onClick={handleGenerateMemorial}
                        disabled={exporting}
                        className="w-full py-4 rounded-[1.8rem] bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {exporting ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <HardHat className="w-4 h-4" />
                        )}
                        {exporting ? 'Gerando...' : 'Exportar Memorial Técnico'}
                    </button>
                </div>
            </div >
        </div >
    );
};

export default AssistantSidebar;
