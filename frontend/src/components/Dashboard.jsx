import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
    TrendingUp, Users, Package, DollarSign, ArrowUpRight, ArrowDownRight,
    Activity, PieChart as PieIcon, BarChart3, Info
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard = () => {
    const [data, setData] = useState({
        materialsByType: [],
        contractorPerformance: [],
        costTrends: [],
        summary: { totalCost: 0, totalMaterials: 0, efficiency: 0, activeProjects: 0 }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!window.api) return;
            try {
                const result = await window.api.getDashboardMetrics();
                if (result) {
                    setData(result);
                }
            } catch (err) {
                console.error('Failed to fetch dashboard metrics:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const statsCards = [
        { label: 'Custo Total Estimado', value: `R$ ${(data.summary.totalCost / 1000).toFixed(1)}k`, icon: DollarSign, trend: '+12%', color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Materiais Catalogados', value: data.summary.totalMaterials.toLocaleString(), icon: Package, trend: '+5k', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Eficiência de Campo', value: `${data.summary.efficiency}%`, icon: Users, trend: '+2.4%', color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Projetos Ativos', value: data.summary.activeProjects, icon: Activity, trend: 'Estável', color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium animate-pulse">Carregando Analytics Zenith...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full space-y-8 overflow-y-auto pr-2 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Zenith Analytics</h2>
                    <p className="text-gray-500 mt-2">Visão tática e inteligência competitiva sobre ativos e serviços.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 shadow-sm transition-all">
                        Exportar BI
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
                        Atualizar Insights
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((card, i) => (
                    <div key={i} className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/40 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${card.bg}`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${card.trend.includes('-') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {card.trend}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-gray-500 mb-1">{card.label}</p>
                        <p className="text-2xl font-black text-gray-800 tracking-tight">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Material Distribution (Pie Chart) */}
                <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/40 shadow-sm lg:col-span-1">
                    <div className="flex items-center gap-3 mb-8">
                        <PieIcon className="w-5 h-5 text-blue-500" />
                        <h3 className="font-bold text-gray-800">Distribuição de Materiais</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.materialsByType}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.materialsByType.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Contractor Performance (Bar Chart) */}
                <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/40 shadow-sm lg:col-span-2">
                    <div className="flex items-center gap-3 mb-8">
                        <BarChart3 className="w-5 h-5 text-emerald-500" />
                        <h3 className="font-bold text-gray-800">Performance de Empresas Terceiras (HH)</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.contractorPerformance}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="hh" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                <Bar dataKey="meta" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Comparative Trends */}
            <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/40 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                        <h3 className="font-bold text-gray-800">Variação de Custos SAP vs Mercado</h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                        <div className="flex items-center gap-1.5 text-blue-600">
                            <span className="w-2 h-2 rounded-full bg-blue-600" /> Preço SAP
                        </div>
                        <div className="flex items-center gap-1.5 text-purple-600">
                            <span className="w-2 h-2 rounded-full bg-purple-600" /> Preço Médio
                        </div>
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.costTrends}>
                            <defs>
                                <linearGradient id="colorSap" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area type="monotone" dataKey="sap" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSap)" strokeWidth={3} />
                            <Area type="monotone" dataKey="market" stroke="#8b5cf6" fillOpacity={0} strokeWidth={3} strokeDasharray="5 5" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Footer Insight */}
            <div className="bg-slate-900 p-6 rounded-3xl text-white flex items-center gap-4">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                    <Info className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-sm opacity-90 italic">
                    <strong>Insight do Especialista:</strong> Notamos uma variação de 15% nos custos de cruzetas poliméricas na Regional Norte. Recomenda-se auditoria no lote 2025/B.
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
