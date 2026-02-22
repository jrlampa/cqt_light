import React from 'react';
import { X, AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react';

const AuditReport = ({ isOpen, onClose, report, isLoading }) => {
    if (!isOpen) return null;

    const getSeverityStyles = (severity) => {
        switch (severity.toUpperCase()) {
            case 'CRITICAL':
                return 'bg-red-500/10 border-red-500/50 text-red-700';
            case 'WARNING':
                return 'bg-amber-500/10 border-amber-500/50 text-amber-700';
            case 'INFO':
                return 'bg-blue-500/10 border-blue-500/50 text-blue-700';
            default:
                return 'bg-gray-500/10 border-gray-500/50 text-gray-700';
        }
    };

    const getIcon = (severity) => {
        switch (severity.toUpperCase()) {
            case 'CRITICAL':
                return <AlertCircle className="w-5 h-5 text-red-600" />;
            case 'WARNING':
                return <AlertTriangle className="w-5 h-5 text-amber-600" />;
            case 'INFO':
                return <Info className="w-5 h-5 text-blue-600" />;
            default:
                return <CheckCircle className="w-5 h-5 text-green-600" />;
        }
    };

    return (
        <div className={`fixed inset-y-0 right-0 w-96 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="h-full bg-white/80 backdrop-blur-xl border-l border-white/20 shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-teal-600/5 to-blue-600/5">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Auditoria Técnica</h2>
                        <p className="text-sm text-gray-500">Validação SotA em tempo real</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-3">
                            <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-500 animate-pulse">Consultando Audit Engine...</p>
                        </div>
                    ) : report && report.length > 0 ? (
                        report.map((item, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-xl border flex gap-4 transition-all hover:scale-[1.02] ${getSeverityStyles(item.severity)}`}
                            >
                                <div className="mt-1 shrink-0">{getIcon(item.severity)}</div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wider">{item.code}</span>
                                        {item.element_id && (
                                            <span className="px-1.5 py-0.5 bg-black/5 rounded text-[10px] font-mono">{item.element_id}</span>
                                        )}
                                    </div>
                                    <p className="text-sm leading-relaxed font-medium">{item.message}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 space-y-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Tudo em Conformidade</h3>
                                <p className="text-sm text-gray-500 px-6">
                                    Nenhuma inconformidade técnica detectada. O projeto respeita as normas da concessionária e PRODIST.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest text-center">
                        Zenith Engineering Audit • LIGHT 2016 Standards
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditReport;
