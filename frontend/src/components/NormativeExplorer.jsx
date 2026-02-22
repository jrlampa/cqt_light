import React, { useState, useEffect } from 'react';
import { BookOpen, Search, ExternalLink, ShieldCheck, X } from 'lucide-react';

const NormativeExplorer = ({ sapCode, onClose }) => {
    const [norms, setNorms] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchNorms = async () => {
            if (!window.api || !sapCode) return;
            setLoading(true);
            try {
                const results = await window.api.getNormsBySap(sapCode);
                setNorms(results);
            } catch (error) {
                console.error('Failed to fetch norms:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchNorms();
    }, [sapCode]);

    return (
        <div className="absolute top-4 left-4 z-[1001] w-80 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden flex flex-col max-h-[80vh] animate-in slide-in-from-left-8 duration-500">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-white/20 rounded-xl">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <h3 className="text-lg font-bold">Inteligência Normativa</h3>
                <p className="text-xs opacity-80 font-mono mt-1">Ref: {sapCode}</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-gray-400 font-medium">Consultando RAG Normativo...</p>
                    </div>
                ) : norms.length > 0 ? (
                    norms.map((norm, i) => (
                        <div key={i} className="p-4 bg-white/40 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all group">
                            <div className="flex items-start justify-between mb-2">
                                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold uppercase">
                                    {norm.fonte || 'Norma LIGHT'}
                                </span>
                                <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                            </div>
                            <p className="text-[11px] text-gray-700 leading-relaxed font-medium">
                                {norm.contexto || 'Contexto técnico indexado via RAG.'}
                            </p>
                            <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                                <span className="text-[9px] text-gray-400">Pág: {norm.pagina || '-'}</span>
                                <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold">
                                    <ShieldCheck className="w-3 h-3" /> VERIFICADO
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 px-6">
                        <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-xs text-gray-500 font-medium">Nenhuma referência normativa específica encontrada para este código SAP.</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50/50 border-t border-gray-100 italic text-[9px] text-gray-400 text-center">
                Powered by Zenith Normative Intelligence RAG
            </div>
        </div>
    );
};

export default NormativeExplorer;
