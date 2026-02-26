/**
 * TransformerLoadSimulator.jsx
 * Simulador de Carga de Transformadores — Fase 3 do Roadmap (BOM Automation & Engineering IQ)
 *
 * Calcula:
 *  - Demanda total (kVA) com fator de demanda configurável
 *  - Corrente nominal no primário e secundário
 *  - Queda de tensão estimada na rede BT (PRODIST Módulo 8)
 *  - Sugestão de potência nominal do transformador (ABNT NBR 14039)
 *  - Nível de carregamento (%) e status de conformidade
 */
import React, { useState, useMemo } from 'react';
import { Zap, AlertTriangle, CheckCircle, Info, TrendingUp } from 'lucide-react';
import {
    POTENCIAS_PADRAO,
    TENSOES_PRIMARIAS,
    TENSOES_SECUNDARIAS,
    FP_DEFAULT,
    calcularDemandaTotal,
    sugerirTransformador,
    calcularCorrenteNominal,
    calcularQuedaTensao,
    nivelCarregamento,
} from '../utils/transformerCalculations';

const TransformerLoadSimulator = () => {
    const [ucs, setUcs] = useState(50);
    const [demandaUC, setDemandaUC] = useState(3000); // VA por UC (padrão residencial BT)
    const [fatorDemanda, setFatorDemanda] = useState(0.6); // fator de demanda típico urbano
    const [tensaoPrimaria, setTensaoPrimaria] = useState(13800);
    const [tensaoSecundaria, setTensaoSecundaria] = useState(220);
    const [comprimentoRede, setComprimentoRede] = useState(300); // metros
    const [potenciaInstalada, setPotenciaInstalada] = useState(75); // kVA do trafo atual
    const [resistencia, setResistencia] = useState(0.306); // Ω/km — cabo Al 35mm²
    const [reatancia, setReatancia] = useState(0.087);    // Ω/km — cabo Al 35mm²

    const calc = useMemo(() => {
        const demanda = calcularDemandaTotal(ucs, demandaUC, fatorDemanda);
        const sugerido = sugerirTransformador(demanda);
        const iSecundario = calcularCorrenteNominal(demanda, tensaoSecundaria);
        const iPrimario = calcularCorrenteNominal(demanda, tensaoPrimaria);
        const iNomTrafo = calcularCorrenteNominal(potenciaInstalada, tensaoSecundaria);
        const quedaPct = calcularQuedaTensao(iSecundario, resistencia, reatancia, comprimentoRede, tensaoSecundaria);
        const carregamento = nivelCarregamento(demanda, potenciaInstalada);
        const quedaOk = quedaPct <= 7.5; // PRODIST Módulo 8: máx 7,5% em BT
        return { demanda, sugerido, iSecundario, iPrimario, iNomTrafo, quedaPct, carregamento, quedaOk };
    }, [ucs, demandaUC, fatorDemanda, tensaoPrimaria, tensaoSecundaria, comprimentoRede, potenciaInstalada, resistencia, reatancia]);

    const inputClass = 'w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white';
    const labelClass = 'text-xs font-semibold text-gray-600 uppercase tracking-wide';

    return (
        <div className="h-full w-full overflow-y-auto p-6 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/30">
                    <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Simulador de Carga — Transformador BT</h2>
                    <p className="text-xs text-gray-400">Conforme ANEEL/PRODIST Módulo 8 e ABNT NBR 14039</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm p-6 space-y-4">
                    <h3 className="font-bold text-gray-700 text-sm uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        Parâmetros da Rede
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Nº de UCs</label>
                            <input type="number" min={1} value={ucs} onChange={e => setUcs(+e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Demanda por UC (VA)</label>
                            <input type="number" min={100} step={100} value={demandaUC} onChange={e => setDemandaUC(+e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Fator de Demanda</label>
                            <input type="number" min={0.1} max={1} step={0.05} value={fatorDemanda} onChange={e => setFatorDemanda(+e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Comprimento Rede (m)</label>
                            <input type="number" min={10} step={10} value={comprimentoRede} onChange={e => setComprimentoRede(+e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Tensão Primária (V)</label>
                            <select value={tensaoPrimaria} onChange={e => setTensaoPrimaria(+e.target.value)} className={inputClass}>
                                {TENSOES_PRIMARIAS.map(t => <option key={t} value={t}>{t / 1000} kV</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Tensão Secundária (V)</label>
                            <select value={tensaoSecundaria} onChange={e => setTensaoSecundaria(+e.target.value)} className={inputClass}>
                                {TENSOES_SECUNDARIAS.map(t => <option key={t} value={t}>{t} V</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Potência Instalada (kVA)</label>
                            <select value={potenciaInstalada} onChange={e => setPotenciaInstalada(+e.target.value)} className={inputClass}>
                                {POTENCIAS_PADRAO.map(p => <option key={p} value={p}>{p} kVA</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Resist. Cabo (Ω/km)</label>
                            <input type="number" min={0.01} step={0.001} value={resistencia} onChange={e => setResistencia(+e.target.value)} className={inputClass} />
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="flex flex-col gap-4">
                    {/* Carregamento */}
                    <div className={`rounded-3xl border p-5 ${calc.carregamento.bg}`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-black uppercase tracking-widest text-gray-600">Nível de Carregamento</span>
                            <span className={`text-xs font-black px-2 py-1 rounded-full bg-white/60 ${calc.carregamento.color}`}>
                                {calc.carregamento.status}
                            </span>
                        </div>
                        <div className="text-4xl font-black tabular-nums leading-none mb-2 text-gray-800">
                            {calc.carregamento.pct.toFixed(1)}%
                        </div>
                        <div className="w-full bg-white/50 rounded-full h-2.5">
                            <div
                                className={`h-2.5 rounded-full transition-all duration-500 ${calc.carregamento.pct > 90 ? 'bg-red-500' : calc.carregamento.pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(calc.carregamento.pct, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Metrics grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Demanda Total', value: `${calc.demanda.toFixed(2)} kVA`, icon: '⚡' },
                            { label: 'Trafo Sugerido', value: `${calc.sugerido} kVA`, icon: '🔁' },
                            { label: 'I Secundário', value: `${calc.iSecundario.toFixed(1)} A`, icon: '🔌' },
                            { label: 'I Primário', value: `${calc.iPrimario.toFixed(2)} A`, icon: '🔌' },
                        ].map(m => (
                            <div key={m.label} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm p-4">
                                <div className="text-lg mb-1">{m.icon}</div>
                                <div className="text-lg font-black text-gray-800 tabular-nums">{m.value}</div>
                                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{m.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Queda de tensão */}
                    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${calc.quedaOk ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        {calc.quedaOk
                            ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            : <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                        <div>
                            <p className="text-sm font-bold text-gray-700">
                                Queda de Tensão BT: <span className={`tabular-nums ${calc.quedaOk ? 'text-emerald-600' : 'text-red-600'}`}>{calc.quedaPct.toFixed(2)}%</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {calc.quedaOk
                                    ? 'Conforme PRODIST Módulo 8 (máx 7,5%)'
                                    : '⚠️ Excede limite PRODIST Módulo 8 (7,5%). Considere reforço de rede ou trafo mais próximo.'}
                            </p>
                        </div>
                    </div>

                    {/* Recomendações normativas */}
                    {calc.sugerido !== potenciaInstalada && (
                        <div className="rounded-2xl border bg-indigo-50 border-indigo-200 p-4 flex items-start gap-3">
                            <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-indigo-700">Recomendação Técnica</p>
                                <p className="text-xs text-indigo-600 mt-0.5">
                                    {calc.sugerido > potenciaInstalada
                                        ? `Substituir transformador atual (${potenciaInstalada} kVA) por ${calc.sugerido} kVA para suportar a demanda prevista com margem de 20%.`
                                        : `Transformador atual (${potenciaInstalada} kVA) está superdimensionado. Considere ${calc.sugerido} kVA para otimizar perdas em vazio.`}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <p className="text-[10px] text-gray-400 text-center">
                * Cálculos baseados em ANEEL PRODIST Módulo 8, NBR 14039 e guia CEMIG DS-EL-01-1. FP assumido: {FP_DEFAULT}.
            </p>
        </div>
    );
};

export default TransformerLoadSimulator;
