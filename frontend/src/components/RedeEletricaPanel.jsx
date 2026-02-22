/**
 * RedeEletricaPanel — Painel integrado de análise de rede elétrica 2.5D.
 *
 * Integra: Mapa Leaflet/OSM, Importação GPS (KML/GPX), Análise de Topologia,
 * Cálculo de Queda de Tensão (ABNT NBR 5410/14039 + PRODIST) e Exportação IFC2X3 BIM.
 *
 * Thin frontend: toda a lógica de negócio reside no backend FastAPI.
 * Interface em pt-BR. Zero custo (OSM + APIs públicas). Arquitetura DDD.
 */

import { useState, useRef, useCallback } from 'react';
import { Upload, Network, Zap, FileBox, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import MapaRede from './MapaRede';
import Toast from './Toast';
import { useKml } from '../hooks/useKml';
import { useRedeAnalise } from '../hooks/useRedeAnalise';
import { useQuedaTensao } from '../hooks/useQuedaTensao';
import { useIfc } from '../hooks/useIfc';

/** Sub-tabs disponíveis */
const TABS = [
  { id: 'mapa',    label: 'Mapa',         icon: Network },
  { id: 'gps',     label: 'Importar GPS', icon: Upload  },
  { id: 'analise', label: 'Análise',      icon: Network },
  { id: 'queda',   label: 'Queda U',      icon: Zap     },
  { id: 'bim',     label: 'BIM / IFC',    icon: FileBox },
];

// ─── Sub-painel: Importar GPS (KML/GPX) ────────────────────────────────────

function PainelGPS({ onTracadoImportado }) {
  const { loading, error, resultado, importarTrace, limpar } = useKml();
  const inputRef = useRef(null);

  const handleFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await importarTrace(file);
    if (res) onTracadoImportado(res.pontos);
    e.target.value = '';
  }, [importarTrace, onTracadoImportado]);

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-gray-700">Importar Traçado GPS (KML / GPX)</h3>
      <p className="text-sm text-gray-500">
        Selecione um arquivo <strong>.kml</strong> (Google Earth) ou <strong>.gpx</strong> (GPS) para
        exibir o traçado no mapa.
      </p>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        aria-label="Selecionar arquivo KML ou GPX"
      >
        {loading ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
        {loading ? 'Importando...' : 'Selecionar Arquivo'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".kml,.gpx,.xml"
        onChange={handleFile}
        className="hidden"
        aria-hidden="true"
      />
      {error && (
        <div role="alert" className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded">
          <AlertTriangle size={14} /> {error}
        </div>
      )}
      {resultado && (
        <div className="bg-green-50 border border-green-200 rounded p-3 text-sm space-y-1">
          <p className="flex items-center gap-1 font-medium text-green-700">
            <CheckCircle size={14} /> Traçado importado com sucesso
          </p>
          <p>Formato: <strong>{resultado.formato?.toUpperCase()}</strong></p>
          <p>Pontos: <strong>{resultado.total_pontos}</strong></p>
          <p>Comprimento total: <strong>{resultado.comprimento_total_m?.toFixed(0)} m</strong></p>
          <button
            onClick={() => { limpar(); onTracadoImportado([]); }}
            className="text-xs text-gray-500 underline mt-1"
          >
            Limpar traçado
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-painel: Análise de Topologia ──────────────────────────────────────

function PainelAnalise({ postes, trechos, transformadores }) {
  const { analisar, loading, error } = useRedeAnalise();
  const [resultado, setResultado] = useState(null);

  const handleAnalisar = useCallback(async () => {
    try {
      const res = await analisar({ postes, trechos, transformadores });
      setResultado(res);
    } catch { /* erro já em hook.error */ }
  }, [analisar, postes, trechos, transformadores]);

  const temDados = postes.length > 0;

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-gray-700">Análise de Topologia</h3>
      <p className="text-sm text-gray-500">
        Verifica conectividade BFS, comprimentos MT/BT e avisos (ABNT NBR 14565 / PRODIST Módulo 6).
      </p>
      {!temDados && (
        <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
          Nenhum poste configurado. Adicione postes à rede antes de analisar.
        </p>
      )}
      <button
        onClick={handleAnalisar}
        disabled={loading || !temDados}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        aria-label="Analisar topologia da rede"
      >
        {loading ? <Loader size={16} className="animate-spin" /> : <Network size={16} />}
        {loading ? 'Analisando...' : 'Analisar Rede'}
      </button>
      {error && (
        <div role="alert" className="text-red-600 text-sm bg-red-50 p-2 rounded">
          <AlertTriangle size={14} className="inline mr-1" />{error}
        </div>
      )}
      {resultado && (
        <div className="space-y-2 text-sm">
          <div className={`flex items-center gap-2 font-medium ${resultado.conectada ? 'text-green-700' : 'text-red-700'}`}>
            {resultado.conectada
              ? <><CheckCircle size={14} /> Rede conectada</>
              : <><AlertTriangle size={14} /> Rede desconectada ({resultado.postes_isolados?.length} postes isolados)</>
            }
          </div>
          <table className="w-full border-collapse text-xs">
            <tbody>
              <tr className="border-b"><td className="py-1 text-gray-500">Postes</td><td className="font-medium">{resultado.num_postes}</td></tr>
              <tr className="border-b"><td className="py-1 text-gray-500">Trechos</td><td className="font-medium">{resultado.num_trechos}</td></tr>
              <tr className="border-b"><td className="py-1 text-gray-500">Transformadores</td><td className="font-medium">{resultado.num_transformadores}</td></tr>
              <tr className="border-b"><td className="py-1 text-gray-500">Comprimento MT</td><td className="font-medium">{resultado.comprimento_mt_m?.toFixed(1)} m</td></tr>
              <tr className="border-b"><td className="py-1 text-gray-500">Comprimento BT</td><td className="font-medium">{resultado.comprimento_bt_m?.toFixed(1)} m</td></tr>
              <tr><td className="py-1 text-gray-500">Total</td><td className="font-medium">{resultado.comprimento_total_m?.toFixed(1)} m</td></tr>
            </tbody>
          </table>
          {resultado.avisos?.length > 0 && (
            <ul className="text-amber-700 bg-amber-50 p-2 rounded space-y-1">
              {resultado.avisos.map((a, i) => (
                <li key={i} className="flex items-start gap-1">
                  <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />{a}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-painel: Queda de Tensão ──────────────────────────────────────────

function PainelQueda() {
  const { calcular, resultado, loading, error, clearError } = useQuedaTensao();
  const [tensaoNom, setTensaoNom] = useState(220);
  const [comprimento, setComprimento] = useState(100);
  const [corrente, setCorrente] = useState(10);
  const [nivel, setNivel] = useState('BT');

  const handleCalc = useCallback(async () => {
    clearError();
    const trecho = {
      id: 'T1',
      poste_a: 'P1',
      poste_b: 'P2',
      comprimento_m: Number(comprimento),
      secao_mm2: 35,
      nivel,
      material: 'AL',
      num_fases: 3,
      corrente_a: Number(corrente),
      fator_potencia: 0.92,
    };
    await calcular([trecho], Number(tensaoNom));
  }, [calcular, clearError, comprimento, corrente, nivel, tensaoNom]);

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-gray-700">Cálculo de Queda de Tensão</h3>
      <p className="text-sm text-gray-500">ABNT NBR 5410 (BT) / NBR 14039 (MT) + PRODIST Módulo 6.</p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-gray-600">Nível</span>
          <select value={nivel} onChange={e => setNivel(e.target.value)}
            className="border rounded px-2 py-1">
            <option value="BT">BT (Baixa Tensão)</option>
            <option value="MT">MT (Média Tensão)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-gray-600">Tensão Nominal (V)</span>
          <input type="number" value={tensaoNom} min={110} max={34500}
            onChange={e => setTensaoNom(e.target.value)}
            className="border rounded px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-gray-600">Comprimento (m)</span>
          <input type="number" value={comprimento} min={1} max={10000}
            onChange={e => setComprimento(e.target.value)}
            className="border rounded px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-gray-600">Corrente (A)</span>
          <input type="number" value={corrente} min={0.1} max={1000} step={0.1}
            onChange={e => setCorrente(e.target.value)}
            className="border rounded px-2 py-1" />
        </label>
      </div>
      <button
        onClick={handleCalc}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
        aria-label="Calcular queda de tensão"
      >
        {loading ? <Loader size={16} className="animate-spin" /> : <Zap size={16} />}
        {loading ? 'Calculando...' : 'Calcular Queda'}
      </button>
      {error && (
        <div role="alert" className="text-red-600 text-sm bg-red-50 p-2 rounded">
          <AlertTriangle size={14} className="inline mr-1" />{error}
        </div>
      )}
      {resultado && (
        <div className={`border rounded p-3 text-sm ${resultado.rede_conforme ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
          <p className={`font-medium mb-2 ${resultado.rede_conforme ? 'text-green-700' : 'text-red-700'}`}>
            {resultado.rede_conforme
              ? '✅ Rede conforme — queda dentro dos limites normativos'
              : '❌ Rede não conforme — queda excede limites normativos'}
          </p>
          <p>Queda máxima: <strong>{resultado.queda_maxima_pct?.toFixed(2)}%</strong></p>
          <p>Queda total: <strong>{resultado.queda_total_v?.toFixed(2)} V</strong></p>
        </div>
      )}
    </div>
  );
}

// ─── Sub-painel: BIM / IFC ────────────────────────────────────────────────

function PainelBim({ postes, trechos, transformadores }) {
  const { exportar, loading, error } = useIfc();
  const [toast, setToast] = useState(null);

  const handleExportar = useCallback(async () => {
    try {
      const res = await exportar({ postes, trechos, transformadores, titulo: 'CQT Light — IFC2X3' });
      if (res?.ifc_content) {
        const blob = new Blob([res.ifc_content], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rede_eletrica.ifc';
        a.click();
        URL.revokeObjectURL(url);
        setToast({ mensagem: 'Arquivo IFC2X3 exportado com sucesso!', tipo: 'sucesso' });
      }
    } catch (e) {
      setToast({ mensagem: `Erro ao exportar IFC: ${e.message}`, tipo: 'erro' });
    }
  }, [exportar, postes, trechos, transformadores]);

  const temDados = postes.length > 0;

  return (
    <div className="p-4 space-y-4">
      {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} onFechar={() => setToast(null)} />}
      <h3 className="font-semibold text-gray-700">Exportação BIM — IFC2X3 STEP</h3>
      <p className="text-sm text-gray-500">
        Gera arquivo <strong>.ifc</strong> (ISO 16739 IFC2X3) da rede elétrica para uso em
        plataformas BIM (Open BIM). Half-way BIM conforme requisito do projeto.
      </p>
      <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded space-y-1">
        <p>• Postes → IFCCOLUMN com Pset_PosteEletrico</p>
        <p>• Trechos → IFCFLOWSEGMENT com nível MT/BT</p>
        <p>• Transformadores → IFCELECTRICALDISTRIBUTIONELEMENT</p>
      </div>
      {!temDados && (
        <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
          Nenhum poste configurado. Configure a rede antes de exportar.
        </p>
      )}
      <button
        onClick={handleExportar}
        disabled={loading || !temDados}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        aria-label="Exportar IFC2X3"
      >
        {loading ? <Loader size={16} className="animate-spin" /> : <FileBox size={16} />}
        {loading ? 'Exportando...' : 'Exportar IFC2X3'}
      </button>
      {error && (
        <div role="alert" className="text-red-600 text-sm bg-red-50 p-2 rounded">
          <AlertTriangle size={14} className="inline mr-1" />{error}
        </div>
      )}
    </div>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────

/**
 * RedeEletricaPanel — painel principal de análise e visualização de rede elétrica.
 *
 * @param {{ postes?: object[], trechos?: object[], transformadores?: object[] }} props
 */
export default function RedeEletricaPanel({ postes = [], trechos = [], transformadores = [] }) {
  const [abaAtiva, setAbaAtiva] = useState('mapa');
  const [tracado, setTracado] = useState([]);

  const handleTracadoImportado = useCallback((pontos) => {
    setTracado(pontos);
    setAbaAtiva('mapa');
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs */}
      <div className="flex border-b bg-white" role="tablist" aria-label="Módulos de análise de rede">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={abaAtiva === id}
            onClick={() => setAbaAtiva(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors
              ${abaAtiva === id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {abaAtiva === 'mapa' && (
          <div className="h-full min-h-64">
            <MapaRede
              postes={postes}
              trechos={trechos}
              tracado={tracado}
            />
          </div>
        )}
        {abaAtiva === 'gps' && (
          <PainelGPS onTracadoImportado={handleTracadoImportado} />
        )}
        {abaAtiva === 'analise' && (
          <PainelAnalise postes={postes} trechos={trechos} transformadores={transformadores} />
        )}
        {abaAtiva === 'queda' && (
          <PainelQueda />
        )}
        {abaAtiva === 'bim' && (
          <PainelBim postes={postes} trechos={trechos} transformadores={transformadores} />
        )}
      </div>
    </div>
  );
}
