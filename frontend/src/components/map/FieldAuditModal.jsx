import React, { useState } from 'react';
import { X, ClipboardCheck, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const FieldAuditModal = ({ asset, onClose, onSave }) => {
    const [condicao, setCondicao] = useState('bom');
    const [obs, setObs] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await window.api.addVistoria({
                pole_id: asset.pole_id,
                condicao,
                obs,
                auditor: 'Zenith Master'
            });
            onSave();
            onClose();
        } catch (err) {
            console.error('Audit Error:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-blue-400" />
                        <div>
                            <h3 className="font-bold text-sm tracking-tight">Vistoria de Campo</h3>
                            <p className="text-[10px] text-slate-400 uppercase">{asset.pole_id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Info className="w-3 h-3" /> Condição Estrutural Encontrada
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {['bom', 'regular', 'precário', 'critico'].map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setCondicao(c)}
                                    className={`py-3 px-4 rounded-xl border-2 text-xs font-bold uppercase transition-all ${condicao === c
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 flex items-center justify-between'
                                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'
                                        }`}
                                >
                                    {c}
                                    {condicao === c && <CheckCircle className="w-4 h-4 ml-2" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Observações Técnicas</label>
                        <textarea
                            value={obs}
                            onChange={(e) => setObs(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none h-32"
                            placeholder="Descreva detalhes como rachaduras, oxidação, inclinação..."
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all uppercase"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all uppercase flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {saving ? 'Salvando...' : 'Finalizar Vistoria'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FieldAuditModal;
