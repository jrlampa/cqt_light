import React, { useState, useEffect } from 'react';
import {
    Calendar, Clock, AlertCircle, CheckCircle2,
    ArrowRight, MapPin, Tool, ShieldAlert,
    TrendingUp, Filter, Search
} from 'lucide-react';

const MaintenanceBacklog = () => {
    const [backlog, setBacklog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchBacklog = async () => {
            if (!window.api) return;
            const data = await window.api.getMaintenanceBacklog();
            setBacklog(data);
            setLoading(false);
        };
        fetchBacklog();
    }, []);

    const getPriorityColor = (p) => {
        switch (p) {
            case 'emergencial': return 'bg-red-500';
            case 'alta': return 'bg-orange-500';
            case 'media': return 'bg-blue-500';
            default: return 'bg-slate-400';
        }
    };

    const handleStatusUpdate = async (id, status) => {
        if (!window.api) return;
        await window.api.updateMaintenanceStatus(id, status);
        const data = await window.api.getMaintenanceBacklog();
        setBacklog(data);
    };

    if (loading) return <div className="h-full flex items-center justify-center font-bold animate-pulse text-slate-400 uppercase tracking-widest">Acessando Backlog Zenith...</div>;

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header Control */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Governança de Ativos</h2>
                    <p className="text-slate-500 text-sm mt-1 uppercase tracking-wider font-bold">Gerenciamento de Manutenções Preditivas e Corretivas</p>
                </div>
                <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm gap-2">
                    <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>TODOS</button>
                    <button onClick={() => setFilter('alta')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === 'alta' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>CRÍTICOS</button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 overflow-hidden flex gap-8">
                {/* List Section */}
                <div className="flex-1 overflow-y-auto pr-4 space-y-4 pb-20">
                    {backlog.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 italic">
                            <ShieldAlert className="w-12 h-12 mb-4 opacity-20" />
                            <p>Nenhuma manutenção pendente no backlog.</p>
                        </div>
                    ) : (
                        backlog.map((job) => (
                            <div key={job.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getPriorityColor(job.prioridade)}`} />

                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-black text-slate-800">{job.pole_id}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black text-white uppercase ${getPriorityColor(job.prioridade)}`}>
                                                {job.prioridade}
                                            </span>
                                        </div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                            {job.tipo_servico === 'substituicao' ? 'Substituição Estrutural' : 'Inspeção Técnica de Campo'}
                                        </h4>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Previsão</p>
                                        <p className="text-sm font-black text-slate-700">{new Date(job.data_agendada).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold">{job.lat?.toFixed(5)}, {job.lng?.toFixed(5)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-indigo-500">
                                            <TrendingUp className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-bold uppercase">Saúde Preditiva: {job.pred_status || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleStatusUpdate(job.id, 'cancelado')}
                                            className="px-4 py-2 bg-slate-50 text-slate-400 text-[10px] font-black rounded-xl hover:bg-slate-100 transition-all uppercase"
                                        >
                                            Arquivar
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(job.id, 'executado')}
                                            className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-100 transition-all uppercase flex items-center gap-1.5"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Finalizado
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Info / Insights Section (Right Rail) */}
                <div className="w-80 space-y-6">
                    <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl">
                        <h4 className="text-xs font-black uppercase text-blue-400 mb-6 tracking-widest flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Insight Zenith
                        </h4>
                        <p className="text-sm opacity-90 leading-relaxed font-medium">
                            Baseado no histórico de degradação e vistorias recentes, priorizamos <span className="text-amber-400 font-bold">{backlog.filter(j => j.prioridade === 'alta').length} ativos</span> na Regional SUL para evitar falhas em cascata.
                        </p>
                        <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="opacity-50">Backlog Total</span>
                                <span className="font-bold">{backlog.length} un</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="opacity-50">Pendência Média</span>
                                <span className="font-bold text-red-400">14 dias</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100">
                        <AlertCircle className="w-5 h-5 text-indigo-600 mb-2" />
                        <h5 className="text-xs font-bold text-indigo-900 uppercase mb-2">Auditoria SotA</h5>
                        <p className="text-[11px] text-indigo-600/80 italic">
                            Ativos com vistorias divergentes do modelo preditivo serão destacados para re-avaliação humana pelo Tech Lead.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceBacklog;
