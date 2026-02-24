import React, { useMemo, useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Zap, HardHat, Info, AlertOctagon, Sparkles, ArrowRight, CheckCircle, ShieldCheck, FileText, Truck, Activity, Package } from 'lucide-react';

const BudgetIntelligence = ({ data, structures, materialsAvulsos, engineeringReport, condutorMT, onApplyOptimization, onGenerateMemorial }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [zones, setZones] = useState([]);
    const [selectedZone, setSelectedZone] = useState('Urbano');
    const [sagReport, setSagReport] = useState(null);
    const [smartBOM, setSmartBOM] = useState(null);
    const [projectRisk, setProjectRisk] = useState(null);
    const [compReport, setCompReport] = useState(null);

    const stats = useMemo(() => {
        const total = data.totalGeral || 0;
        const totalMat = data.totalMaterial || 0;
        const efficiency = total > 0 ? (totalMat / total * 100).toFixed(1) : 0;
        const costPerPoint = structures.length > 0 ? (total / structures.length).toFixed(2) : 0;

        // Health Score Calculation (Zenith Standard)
        const engStatus = (!engineeringReport || engineeringReport.status === 'SAFE') && (!sagReport || sagReport.status === 'SAFE') ? 50 : 20;
        const optStatus = suggestions.length === 0 ? 50 : 30;
        const healthScore = engStatus + optStatus;

        return { total, efficiency, costPerPoint, healthScore };
    }, [data, structures, engineeringReport, sagReport, suggestions]);

    useEffect(() => {
        if (window.api) {
            window.api.getPricingZones().then(setZones).catch(console.error);
        }
    }, []);

    useEffect(() => {
        if (window.api && structures.length > 0) {
            window.api.assessProjectRisk(structures).then(setProjectRisk).catch(console.error);
            window.api.validateStructures(structures).then(setCompReport).catch(console.error);
        }
    }, [structures]);

    useEffect(() => {
        if (window.api && materialsAvulsos.length > 0) {
            window.api.findCostSavings(materialsAvulsos, selectedZone).then(setSuggestions).catch(console.error);
            window.api.rationalizeBOM(materialsAvulsos, structures).then(setSmartBOM).catch(console.error);
        } else {
            setSuggestions([]);
            setSmartBOM(null);
        }

        if (window.api && condutorMT) {
            // Cycle 27: Spatial Logic
            const p1 = structures[0]?.coords;
            const p2 = structures[1]?.coords;

            window.api.calculateSag({
                span: 35,
                conductor: condutorMT,
                p1,
                p2
            }).then(setSagReport).catch(console.error);
        }
    }, [materialsAvulsos, selectedZone, condutorMT, structures]);

    return (
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-5 border border-white/40 shadow-2xl shadow-blue-500/5 h-full flex flex-col gap-4 animate-in slide-in-from-right-4 duration-500 overflow-y-auto">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" /> Project Intelligence
                </h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[9px] font-black rounded-full uppercase">SotA V27</span>
            </div>

            {/* Logistics & Labor Analytics (Cycle 28) */}
            <div className="bg-slate-100/50 p-3 rounded-2xl flex flex-col gap-2">
                <div className="flex flex-wrap gap-1">
                    {zones.map(z => (
                        <button
                            key={z.id}
                            onClick={() => setSelectedZone(z.nome)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${selectedZone === z.nome ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {z.nome}
                        </button>
                    ))}
                </div>
                {smartBOM?.analytics && (
                    <div className="flex flex-col gap-1 px-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Truck className="w-3 h-3 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-600">{smartBOM.analytics.totalWeightKg}kg Est.</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <HardHat className="w-3 h-3 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-600">{smartBOM.analytics.laborHours} HH Est.</span>
                            </div>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${smartBOM.analytics.totalWeightKg > 2000 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                            {smartBOM.analytics.logisticsMessage}
                        </span>
                    </div>
                )}
            </div>

            {/* Health Score Shield */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">Project Health</p>
                        <p className="text-3xl font-black text-white tracking-tighter">{stats.healthScore}%</p>
                    </div>
                    <div className={`p-3 rounded-2xl ${stats.healthScore >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                </div>
            </div>

            {/* Design Compatibility Alerts (Cycle 28) */}
            {compReport?.alerts?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-3xl">
                    <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <AlertOctagon className="w-3 h-3" /> Alertas de Design
                    </p>
                    <div className="space-y-1.5">
                        {compReport.alerts.map((alert, idx) => (
                            <div key={idx} className={`text-[9px] font-bold p-1.5 rounded-lg flex items-start gap-2 ${alert.type === 'CRITICAL' ? 'text-red-700 bg-red-100' : 'text-amber-800 bg-amber-100/50'}`}>
                                <Info className="w-2.5 h-2.5 mt-0.5" />
                                {alert.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Asset Lifecycle & Risk (Cycle 27) */}
            {projectRisk && (
                <div className={`p-4 rounded-3xl border transition-all ${projectRisk.overallRisk === 'HIGH' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-3 h-3" /> Asset Lifecycle (Half-BIM)
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${projectRisk.overallRisk === 'HIGH' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}`}>
                            Risco: {projectRisk.overallRisk}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/50 p-2 rounded-xl border border-slate-200/50">
                            <p className="text-[8px] text-slate-400 font-bold uppercase">Saúde Média</p>
                            <p className="text-sm font-black text-slate-800">{projectRisk.averageScore}%</p>
                        </div>
                        <div className="bg-white/50 p-2 rounded-xl border border-slate-200/50">
                            <p className="text-[8px] text-slate-400 font-bold uppercase">Críticos</p>
                            <p className="text-sm font-black text-red-600">{projectRisk.criticalCount}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Engineering Metrics (Mechanical & Vertical) */}
            <div className="grid grid-cols-2 gap-2">
                <div className={`p-3 rounded-2xl border transition-all ${engineeringReport?.status === 'CRITICAL' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Carga (Mech)</p>
                    <p className={`text-base font-black tracking-tighter ${engineeringReport?.status === 'CRITICAL' ? 'text-red-600' : 'text-slate-800'}`}>
                        {engineeringReport?.utilizationPercent || 0}%
                    </p>
                </div>
                <div className={`p-3 rounded-2xl border transition-all ${sagReport?.status === 'CRITICAL' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Gabarito (Sag)</p>
                    <p className={`text-base font-black tracking-tighter ${sagReport?.status === 'CRITICAL' ? 'text-red-600' : 'text-slate-800'}`}>
                        {sagReport?.clearanceM || 0}m
                    </p>
                </div>
            </div>

            {/* Smart BOM Summary */}
            {smartBOM && (
                <div className="bg-slate-900/5 p-4 rounded-3xl border border-slate-200/50">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Package className="w-3 h-3" /> Smart BOM Groups
                    </p>
                    <div className="space-y-2">
                        {smartBOM.summary.map(s => (
                            <div key={s.name} className="flex justify-between items-center bg-white/50 p-2 rounded-xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-600">{s.name}</span>
                                <span className="text-[10px] font-black text-slate-900">R$ {s.total.toLocaleString('pt-BR')}</span>
                            </div>
                        ))}
                    </div>
                    {smartBOM.analytics && (
                        <div className="mt-3 pt-2 border-t border-slate-200 border-dashed flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Custo Logístico (Est.)</span>
                            <span className="text-[10px] font-black text-blue-600">R$ {smartBOM.analytics.freightEstimate.toLocaleString('pt-BR')}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Action Area */}
            <div className="mt-auto pt-2 flex flex-col gap-2">
                <button
                    onClick={onGenerateMemorial}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                >
                    <FileText className="w-4 h-4" /> Relatório Técnico
                </button>
            </div>
        </div>
    );
};

export default BudgetIntelligence;
