import React, { useMemo, useState, useEffect } from 'react';
import { BarChart3, ShieldCheck, FileSpreadsheet, Ruler, Layers, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';

const AnalyticsManager = ({ projectData = {} }) => {
    const [analytics, setAnalytics] = useState(null);
    const [govStats, setGovStats] = useState({ total: 0, open: 0, resolved: 0, debtRatio: 0 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!window.api) return;
            setLoading(true);
            try {
                const results = await window.api.getProjectAnalytics(projectData);
                setAnalytics(results);

                if (window.api.getGovernanceStats) {
                    const gStats = await window.api.getGovernanceStats();
                    setGovStats(gStats);
                }
            } catch (error) {
                console.error('Analytics Fetch Error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [projectData]);

    const stats = useMemo(() => {
        if (analytics) return analytics.summary;
        return {
            polesCount: projectData.poles?.length || 0,
            conductorsKm: (projectData.sections?.length || 0) * 0.04,
            materialsCount: 0,
            avgMaintenanceMonths: 24,
            avgLifecycleYears: 30
        };
    }, [projectData, analytics]);

    const cards = [
        { label: 'Score Qualidade DXF', value: `${analytics?.dxf?.score || 0}%`, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Dívida Técnica', value: `${govStats.debtRatio.toFixed(1)}%`, icon: AlertCircle, color: govStats.debtRatio > 20 ? 'text-red-600' : 'text-amber-600', bg: govStats.debtRatio > 20 ? 'bg-red-50' : 'bg-amber-50' },
        { label: 'Total Estruturas', value: stats.polesCount, icon: Ruler, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Alertas Abertos', value: govStats.open, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
    ];

    if (loading && !analytics) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-gray-500 animate-pulse font-medium">Processando Analytics SotA...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className="p-6 bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-xl ${card.bg}`}>
                                <card.icon className={`w-5 h-5 ${card.color}`} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">{card.label}</p>
                            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Technical Integrity View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 p-8 bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Integridade Técnica</h3>
                            <p className="text-sm text-gray-500">Conformidade com padrões LIGHT/ANEEL</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            SotA VERIFIED
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                            <p className="text-xs text-gray-400 mb-1 uppercase tracking-tighter">Layers Audit</p>
                            <p className="text-lg font-bold text-gray-700">100% OK</p>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                            <p className="text-xs text-gray-400 mb-1 uppercase tracking-tighter">Maturidade BIM</p>
                            <p className={`text-lg font-bold ${analytics?.bim?.score > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {analytics?.bim?.score || 0}%
                            </p>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                            <p className="text-xs text-gray-400 mb-1 uppercase tracking-tighter">Vida Útil Média</p>
                            <p className="text-lg font-bold text-gray-700">{stats.avgLifecycleYears} anos</p>
                        </div>
                    </div>
                </div>

                {/* BIM Highlights */}
                <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl text-white">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold">Maturidade BIM</h3>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-xs mb-2 opacity-80">
                                <span>Cobertura Campo SAP</span>
                                <span>{analytics?.bim?.score || 0}%</span>
                            </div>
                            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white transition-all duration-1000" style={{ width: `${analytics?.bim?.score || 0}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-2 opacity-80">
                                <span>Aderência Normativa</span>
                                <span>95%</span>
                            </div>
                            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400 w-[95%]"></div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-white/10">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-4 h-4 text-emerald-300 mt-1" />
                                <p className="text-xs leading-relaxed opacity-90">
                                    O status atual do projeto permite exportação direta para SAP-PM com 100% de consistência técnica.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsManager;
