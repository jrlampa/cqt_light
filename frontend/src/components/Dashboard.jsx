import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    Package,
    Layers,
    DollarSign,
    TrendingUp,
    AlertCircle,
    ShieldCheck,
    ShieldAlert,
    Database
} from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState({ materials: 0, kits: 0, servicos: 0, abntViolations: 0 });
    const [zeroPriceCount, setZeroPriceCount] = useState(0);
    const [exportingBim, setExportingBim] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        if (!window.api) return;
        const data = await window.api.getStats();
        setStats(data || { materials: 0, kits: 0, servicos: 0, abntViolations: 0 });

        // Check for alerts (zero price materials)
        const zeroPrices = await window.api.getZeroPriceMaterials();
        setZeroPriceCount(zeroPrices.length);
    };

    const handleExportBim = async () => {
        setExportingBim(true);
        try {
            const result = await window.api.exportBimMetadata();
            alert(`Sucesso: ${result.message}`);
        } catch (error) {
            alert(`Erro ao exportar BIM: ${error.message}`);
        } finally {
            setExportingBim(false);
        }
    };

    const cards = [
        {
            title: 'Materiais Cadastrados',
            value: stats.materials.toLocaleString('pt-BR'),
            icon: Layers,
            color: 'bg-blue-500',
            description: 'Itens no banco de dados'
        },
        {
            title: 'Kits de Montagem',
            value: stats.kits.toLocaleString('pt-BR'),
            icon: Package,
            color: 'bg-emerald-500',
            description: 'Estruturas prontas'
        },
        {
            title: 'Serviços & Mão de Obra',
            value: stats.servicos.toLocaleString('pt-BR'),
            icon: DollarSign,
            color: 'bg-indigo-500',
            description: 'Tabela de serviços'
        }
    ];

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Visão Geral</h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportBim}
                        disabled={exportingBim}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        <Database className="w-4 h-4" />
                        {exportingBim ? 'Exportando BIM...' : 'Exportar Metadados BIM'}
                    </button>
                    <button
                        onClick={loadStats}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Atualizar"
                    >
                        <BarChart3 className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 border border-gray-100 flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${card.color} text-white shadow-lg shadow-${card.color}/30`}>
                            <card.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{card.title}</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{card.value}</h3>
                            <p className="text-xs text-gray-400 mt-1">{card.description}</p>
                        </div>
                    </div>
                ))}

                {/* ABNT Status Card */}
                <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 border border-gray-100 flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${stats.abntViolations > 0 ? 'bg-orange-500' : 'bg-emerald-500'} text-white shadow-lg`}>
                        {stats.abntViolations > 0 ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Padrão ABNT/NBR</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.abntViolations.toLocaleString('pt-BR')}</h3>
                        <p className="text-xs text-gray-400 mt-1">Violações detectadas</p>
                    </div>
                </div>
            </div>

            {/* Alerts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        Alertas do Sistema
                    </h3>

                    <div className="space-y-4">
                        {zeroPriceCount > 0 && (
                            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <div>
                                        <p className="font-medium text-red-900">Materiais sem Preço</p>
                                        <p className="text-sm text-red-700">{zeroPriceCount} itens precisam de revisão urgente.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {stats.abntViolations > 0 && (
                            <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                                    <div>
                                        <p className="font-medium text-orange-900">Padronização de Descrições</p>
                                        <p className="text-sm text-orange-700">{stats.abntViolations} materiais não seguem NBR.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {zeroPriceCount === 0 && stats.abntViolations === 0 && (
                            <div className="flex items-center justify-center h-24 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <span className="flex items-center gap-2 text-sm">
                                    <TrendingUp className="w-4 h-4" />
                                    Sistema saudável. Nenhum alerta.
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-sm p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Package className="w-48 h-48 transform rotate-12" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 relative z-10">Gestão Enterprise</h3>
                    <p className="text-slate-300 text-sm mb-6 max-w-sm relative z-10">
                        Utilize o módulo de Importação para atualizar preços em massa via Excel ou CSV.
                    </p>
                    <div className="gap-2 flex relative z-10">
                        <div className="h-1 w-12 bg-emerald-500 rounded-full" />
                        <div className="h-1 w-8 bg-blue-500 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
