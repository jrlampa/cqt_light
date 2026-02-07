import React, { useState, useEffect, useRef } from 'react';
import { Calculator, FolderOpen, LayoutTemplate, Trash2, Save, FileText, Download, Search, Zap, DollarSign, Edit2 } from 'lucide-react';

// Hooks
import { useBudgetCalculator } from '../hooks/useBudgetCalculator';
import { useKeyboardNav } from '../hooks/useKeyboardNav';

// Components
import { StructureList } from './StructureList';
import { MaterialList } from './MaterialList';
import { SummaryFooter } from './SummaryFooter';
import BudgetHistory from './BudgetHistory';
import TemplateManager from './TemplateManager';
import ManualKitManager from './ManualKitManager';
import PriceManager from './PriceManager';
import { KitResolutionModal } from './KitResolutionModal';
import { KitDetailsModal } from './KitDetailsModal';
import { CompanySelector } from './CompanySelector';
import { PriceManagementModal } from './PriceManagementModal';
import { exportMaterialsToExcel } from '../utils/excelExporter';

// Conductor options
const CONDUTORES_MT = [
  { id: 'cab_21_caa', label: 'Cabo 21 mm² CAA', tipo: 'Convencional' },
  { id: 'cab_53_caa', label: 'Cabo 53 mm² CAA', tipo: 'Convencional' },
  { id: 'cab_201_ca', label: 'Cabo 201 mm² CA', tipo: 'Convencional' },
  { id: 'cab_53_spacer', label: 'Cabo 53 mm² Spacer', tipo: 'Compacta' },
  { id: 'cab_185_spacer', label: 'Cabo 185 mm² Spacer', tipo: 'Compacta' },
];

const CONDUTORES_BT = [
  { id: 'mult_35', label: 'Multiplex 35 mm²', tipo: 'Multiplexada' },
  { id: 'mult_50', label: 'Multiplex 50 mm²', tipo: 'Multiplexada' },
  { id: 'mult_70', label: 'Multiplex 70 mm²', tipo: 'Multiplexada' },
  { id: 'mult_120', label: 'Multiplex 120 mm²', tipo: 'Multiplexada' },
  { id: 'cab_4awg', label: 'Cabo 4 AWG', tipo: 'Nua' },
  { id: 'cab_2awg', label: 'Cabo 2 AWG', tipo: 'Nua' },
  { id: 'cab_1_0awg', label: 'Cabo 1/0 AWG', tipo: 'Nua' },
];

// Persistence
const loadState = () => {
  try {
    const saved = localStorage.getItem('cqt_state_v3');
    return saved ? JSON.parse(saved) : {};
  } catch (err) {
    console.error('Failed to load state', err);
    return {};
  }
};

const saveState = (state) => {
  try {
    localStorage.setItem('cqt_state_v3', JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state', err);
  }
};

const Configurator = () => {
  const initial = loadState();

  // --- STATE ---
  const [activeTab, setActiveTab] = useState('estruturas'); // 'estruturas' or 'materiais'
  const [condutorMT, setCondutorMT] = useState(initial.condutorMT || CONDUTORES_MT[0]);
  const [condutorBT, setCondutorBT] = useState(initial.condutorBT || CONDUTORES_BT[2]);

  // Lists
  const [estruturas, setEstruturas] = useState(initial.estruturas || []);
  const [materiaisAvulsos, setMateriaisAvulsos] = useState(initial.materiaisAvulsos || []);

  // Search State
  const [structureQuery, setStructureQuery] = useState('');
  const [structureResults, setStructureResults] = useState([]);
  const [showStructureDropdown, setShowStructureDropdown] = useState(false);

  const [materialQuery, setMaterialQuery] = useState('');
  const [materialResults, setMaterialResults] = useState([]);
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);

  const [posteQuery, setPosteQuery] = useState('');
  const [posteResults, setPosteResults] = useState([]);
  const [showPosteDropdown, setShowPosteDropdown] = useState(false);

  // Conductors Selection
  const [showMTDropdown, setShowMTDropdown] = useState(false);
  const [showBTDropdown, setShowBTDropdown] = useState(false);

  // Modals
  const [showQtyPopup, setShowQtyPopup] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const [pendingType, setPendingType] = useState('structure'); // 'structure' or 'material'
  const [qty, setQty] = useState(1);

  const [showBudgetHistory, setShowBudgetHistory] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [isManualKitManagerOpen, setIsManualKitManagerOpen] = useState(false);
  const [isPriceManagerOpen, setIsPriceManagerOpen] = useState(false);
  const [showKitDetails, setShowKitDetails] = useState(false);
  const [selectedKit, setSelectedKit] = useState(null);
  const [showPriceManagement, setShowPriceManagement] = useState(false);
  const [empresaAtiva, setEmpresaAtiva] = useState(null);

  // Resolution State
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [pendingResolutionKit, setPendingResolutionKit] = useState(null);
  const [pendingResolutionMaterials, setPendingResolutionMaterials] = useState([]);

  // Resolution Data
  const [sufixos, setSufixos] = useState([]);
  const [manualTemplates, setManualTemplates] = useState([]);

  // --- HOOKS ---
  const { custoData, setCustoData, calculateTotal } = useBudgetCalculator();

  // Define actions for keyboard nav
  const actions = {
    onEscape: () => {
      setShowStructureDropdown(false);
      setShowMaterialDropdown(false);
      setShowPosteDropdown(false);
      setShowMTDropdown(false);
      setShowBTDropdown(false);
      setShowQtyPopup(false);
    },
    onCopy: () => copySummary(),
    onCalculate: () => calculateTotal({
      estruturas,
      materiaisAvulsos,
      condutorMT,
      condutorBT,
      sufixos,
      templates: manualTemplates
    })
  };

  const nav = useKeyboardNav(actions);

  // --- EFFECTS ---
  // Load Resolution Data
  useEffect(() => {
    if (window.api) {
      window.api.getAllSufixos().then(setSufixos).catch(console.error);
      window.api.getAllTemplatesManuais().then(setManualTemplates).catch(console.error);
    }
  }, []);

  // Save state
  useEffect(() => {
    saveState({ condutorMT, condutorBT, estruturas, materiaisAvulsos });
  }, [condutorMT, condutorBT, estruturas, materiaisAvulsos]);

  // Recalculate when items change
  useEffect(() => {
    calculateTotal({
      estruturas,
      materiaisAvulsos,
      condutorMT,
      condutorBT,
      sufixos,
      templates: manualTemplates
    });
  }, [estruturas, materiaisAvulsos, condutorMT, condutorBT, sufixos, manualTemplates, calculateTotal]);

  // Reload data when ManualKitManager closes
  useEffect(() => {
    if (!isManualKitManagerOpen && window.api) {
      window.api.getAllTemplatesManuais().then(setManualTemplates).catch(console.error);
    }
  }, [isManualKitManagerOpen]);


  // --- HANDLERS ---
  const loadBudget = (data) => {
    if (!data) return;
    setCondutorMT(data.condutorMT);
    setCondutorBT(data.condutorBT);
    setEstruturas(data.estruturas || []);
    setMateriaisAvulsos(data.materiaisAvulsos || []);
    alert('✅ Orçamento carregado com sucesso!');
  };

  const loadTemplate = (data) => {
    if (!data) return;
    setCondutorMT(data.condutorMT);
    setCondutorBT(data.condutorBT);
    setEstruturas(data.estruturas || []);
    setMateriaisAvulsos(data.materiaisAvulsos || []);
  };

  // Search
  const searchPoste = async (query) => {
    setPosteQuery(query);
    if (!window.api || !query.trim()) { setPosteResults([]); setShowPosteDropdown(false); return; }
    // Filter only poles from materials search
    const results = await window.api.searchMaterials(query);
    const poles = results.filter(m => m.descricao.toUpperCase().includes('POSTE'));
    setPosteResults(poles);
    setShowPosteDropdown(poles.length > 0);
    nav.setPosteHighlight(0);
  };

  const searchStructure = async (query) => {
    setStructureQuery(query);
    if (!window.api || !query.trim()) { setStructureResults([]); setShowStructureDropdown(false); return; }
    const results = await window.api.searchKits(query);
    setStructureResults(results || []);
    setShowStructureDropdown((results || []).length > 0);
    nav.setStructureHighlight(0);
  };

  const searchMaterial = async (query) => {
    setMaterialQuery(query);
    if (!window.api || !query.trim()) { setMaterialResults([]); setShowMaterialDropdown(false); return; }
    const results = await window.api.searchMaterials(query);
    setMaterialResults((results || []).slice(0, 15));
    setShowMaterialDropdown((results || []).length > 0);
    nav.setMaterialHighlight(0);
  };

  // Selection
  const selectPoste = (mat) => {
    const entry = { ...mat, id: Date.now(), quantidade: 1 };
    setMateriaisAvulsos(prev => [...prev, entry]);
    setPosteQuery('');
    setPosteResults([]);
    setShowPosteDropdown(false);
  };

  const openQtyPopup = (item, type) => {
    // Close all dropdowns first to prevent modal stacking
    setShowStructureDropdown(false);
    setShowMaterialDropdown(false);
    setShowPosteDropdown(false);
    setShowMTDropdown(false);
    setShowBTDropdown(false);

    // Clear search queries
    if (type === 'structure') setStructureQuery('');
    if (type === 'material') setMaterialQuery('');

    // Open quantity popup
    setPendingItem(item);
    setPendingType(type);
    setQty(1);
    setShowQtyPopup(true);
    nav.focusQty();
  };

  const confirmAddItem = () => {
    if (!pendingItem) return;

    if (pendingType === 'structure') {
      // Check for Manual Template requiring resolution
      if (pendingItem.tipo === 'manual' && pendingItem.materiais_json) {
        let materials = [];
        try {
          materials = typeof pendingItem.materiais_json === 'string'
            ? JSON.parse(pendingItem.materiais_json)
            : pendingItem.materiais_json;
        } catch (e) { console.error("Error parsing materials", e); }

        const hasPartials = materials.some(m => m.isPartial || (m.codigo && m.codigo.trim().endsWith('/')));

        if (hasPartials) {
          setPendingResolutionKit(pendingItem);
          setPendingResolutionMaterials(materials);
          setShowResolutionModal(true);
          setShowQtyPopup(false); // Close qty, open resolution
          return; // Stop here, wait for resolution
        }
      }

      const entry = { ...pendingItem, id: Date.now(), quantidade: qty };
      setEstruturas(prev => [entry, ...prev]);
      setStructureQuery('');
      setStructureResults([]);
      setShowStructureDropdown(false);
      nav.focusStructure();
    } else {
      const entry = { ...pendingItem, id: Date.now(), quantidade: qty };
      setMateriaisAvulsos(prev => [entry, ...prev]);
      setMaterialQuery('');
      setMaterialResults([]);
      setShowMaterialDropdown(false);
      nav.focusMaterial();
    }
    setShowQtyPopup(false);
    setPendingItem(null);
  };

  const handleResolutionConfirm = (resolvedMaterials) => {
    const entry = {
      ...pendingResolutionKit,
      id: Date.now(),
      quantidade: qty,
      materiaisResolvidos: resolvedMaterials
    };

    setEstruturas(prev => [entry, ...prev]);
    setStructureQuery('');
    setStructureResults([]);
    setShowStructureDropdown(false);
    nav.focusStructure();

    setShowResolutionModal(false);
    setPendingResolutionKit(null);
    setPendingResolutionMaterials([]);
    setPendingItem(null); // Clear pending item finally
  };

  const removeStructure = (id) => setEstruturas(prev => prev.filter(e => e.id !== id));
  const removeMaterial = (id) => setMateriaisAvulsos(prev => prev.filter(m => m.id !== id));

  const openKitDetails = (kit) => {
    setSelectedKit(kit);
    setShowKitDetails(true);
  };

  const updateKitMateriais = (materiaisExtras) => {
    if (!selectedKit) return;
    setEstruturas(prev => prev.map(kit =>
      kit.id === selectedKit.id
        ? { ...kit, materiaisExtras }
        : kit
    ));
  };

  const clearAll = () => {
    if (!confirm('Limpar toda a configuração?')) return;
    setEstruturas([]);
    setMateriaisAvulsos([]);
    setCustoData({ materiais: [], totalMaterial: 0, totalServico: 0, totalGeral: 0 });
    localStorage.removeItem('cqt_state_v3');
  };

  const copySummary = () => {
    const summary = `ORÇAMENTO CQT LIGHT\n\n` +
      `Material: R$ ${custoData.totalMaterial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
      `Mão de Obra: R$ ${custoData.totalServico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
      `TOTAL: R$ ${custoData.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
      `Materiais (${custoData.materiais.length}):\n` +
      custoData.materiais.map(m =>
        `${m.sap} - ${m.descricao} (${m.quantidade} ${m.unidade}) - R$ ${m.subtotal.toFixed(2)}`
      ).join('\n');

    navigator.clipboard.writeText(summary).then(() => {
      alert('✅ Resumo copiado para área de transferência!');
    });
  };

  // Keyboard Wrappers for Lists
  const handleStructureNav = (e) => {
    if (!showStructureDropdown || structureResults.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); nav.setStructureHighlight(prev => Math.min(prev + 1, structureResults.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); nav.setStructureHighlight(prev => Math.max(prev - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); openQtyPopup(structureResults[nav.structureHighlight], 'structure'); }
  };

  const handleMaterialNav = (e) => {
    if (!showMaterialDropdown || materialResults.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); nav.setMaterialHighlight(prev => Math.min(prev + 1, materialResults.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); nav.setMaterialHighlight(prev => Math.max(prev - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); openQtyPopup(materialResults[nav.materialHighlight], 'material'); }
  };

  const handlePosteNav = (e) => {
    if (!showPosteDropdown || posteResults.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); nav.setPosteHighlight(prev => Math.min(prev + 1, posteResults.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); nav.setPosteHighlight(prev => Math.max(prev - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); selectPoste(posteResults[nav.posteHighlight]); }
  };

  // MT/BT Conductor Dropdown Navigation
  const handleMTNav = (e) => {
    if (!showMTDropdown) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); nav.setMtHighlight(prev => Math.min(prev + 1, CONDUTORES_MT.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); nav.setMtHighlight(prev => Math.max(prev - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); setCondutorMT(CONDUTORES_MT[nav.mtHighlight]); setShowMTDropdown(false); }
    else if (e.key === 'Escape') { e.preventDefault(); setShowMTDropdown(false); }
  };

  const handleBTNav = (e) => {
    if (!showBTDropdown) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); nav.setBtHighlight(prev => Math.min(prev + 1, CONDUTORES_BT.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); nav.setBtHighlight(prev => Math.max(prev - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); setCondutorBT(CONDUTORES_BT[nav.btHighlight]); setShowBTDropdown(false); }
    else if (e.key === 'Escape') { e.preventDefault(); setShowBTDropdown(false); }
  };

  const handleQtyNav = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); confirmAddItem(); }
    if (e.key === 'Escape') { e.preventDefault(); setShowQtyPopup(false); }
  };


  const totalKits = estruturas.reduce((sum, e) => sum + (e.quantidade || 1), 0);
  const totalMats = materiaisAvulsos.reduce((sum, m) => sum + (m.quantidade || 1), 0);

  return (
    <div className="h-full flex gap-4 relative">
      {/* Quantity Popup */}
      {showQtyPopup && pendingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={() => setShowQtyPopup(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-80 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Quantidade</h3>
            <p className="text-sm text-gray-600 mb-4">
              <span className={`font-mono font-bold ${pendingType === 'structure' ? 'text-orange-600' : 'text-blue-600'}`}>
                {pendingType === 'structure' ? pendingItem.codigo_kit : pendingItem.sap}
              </span>
              <br />
              <span className="text-xs text-gray-500">
                {pendingType === 'structure' ? pendingItem.descricao_kit : pendingItem.descricao}
              </span>
            </p>
            <input
              ref={nav.qtyInputRef}
              type="number"
              min="1"
              step="0.01"
              value={qty}
              onChange={(e) => setQty(Math.max(0.01, parseFloat(e.target.value) || 1))}
              onKeyDown={handleQtyNav}
              className="w-full px-4 py-3 text-2xl text-center font-bold border-2 border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-200"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowQtyPopup(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Cancelar</button>
              <button onClick={confirmAddItem} className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold">Adicionar</button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">Enter para confirmar</p>
          </div>
        </div>
      )}

      <ManualKitManager
        isOpen={isManualKitManagerOpen}
        onClose={() => {
          setIsManualKitManagerOpen(false);
          // Refresh if needed, though usually it's just templates
        }}
      />

      <PriceManager
        isOpen={isPriceManagerOpen}
        onClose={() => setIsPriceManagerOpen(false)}
      />

      {/* Left Panel */}
      <div className="w-72 flex flex-col gap-2 overflow-y-auto pr-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-500" />
            <h2 className="font-bold text-gray-800 text-sm">Configurador</h2>
            <button
              onClick={() => setShowBudgetHistory(true)}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition ml-1"
              title="Histórico de Orçamentos"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowTemplateManager(true)}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-purple-600 transition ml-1"
              title="Gerenciar Templates"
            >
              <LayoutTemplate className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsManualKitManagerOpen(true)}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Package className="w-4 h-4" /> Gerenciar Kits
            </button>

            <button
              onClick={() => setIsPriceManagerOpen(true)}
              className="px-4 py-2 border border-blue-200 bg-blue-50 rounded-xl hover:bg-blue-100 text-blue-700 text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <DollarSign className="w-4 h-4" /> Gestão de Preços
            </button>
          </div>
        </div>

        {/* Company Selector */}
        <CompanySelector
          onCompanyChange={(empresa) => {
            setEmpresaAtiva(empresa);
            // Recalcular custos com nova empresa
            calculateTotal({ estruturas, materiaisAvulsos });
          }}
        />

        {/* Action Buttons */}
        <div className="flex gap-2">

          <button
            onClick={clearAll}
            disabled={totalKits === 0 && totalMats === 0}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Trash2 className="w-3 h-3" /> Limpar
          </button>
          <button
            onClick={() => alert('Salvar como Kit - Em breve!')}
            disabled={totalKits === 0 && totalMats === 0}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Save className="w-3 h-3" /> Kit
          </button>
          <button
            onClick={() => alert('Relatório PDF - Em breve!')}
            disabled={totalKits === 0 && totalMats === 0}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <FileText className="w-3 h-3" /> Relatório
          </button>
        </div>

        {/* Export Button */}
        {
          custoData.materiais.length > 0 && (
            <button
              onClick={() => exportMaterialsToExcel(custoData.materiais, custoData)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 transition"
            >
              <Download className="w-3 h-3" /> Exportar Excel
            </button>
          )
        }

        {/* Poste */}
        <div className="relative">
          <label className="text-xs text-gray-500 uppercase font-bold">Poste (adiciona aos materiais)</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={nav.posteInputRef}
              type="text"
              value={posteQuery}
              onChange={(e) => searchPoste(e.target.value)}
              onKeyDown={handlePosteNav}
              placeholder="Buscar poste..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition"
            />
          </div>
          {showPosteDropdown && posteResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border max-h-32 overflow-y-auto">
              {posteResults.map((mat, idx) => (
                <button
                  key={mat.sap}
                  onMouseDown={(e) => { e.preventDefault(); selectPoste(mat); }}
                  className={`w-full text-left px-2 py-1.5 text-xs flex gap-2 ${idx === nav.posteHighlight ? 'bg-green-100' : 'hover:bg-gray-50'}`}
                >
                  <span className="font-mono font-bold text-green-600">{mat.sap}</span>
                  <span className="text-gray-500 truncate text-[10px]">{mat.descricao}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conductors */}
        <div className="grid grid-cols-2 gap-2">
          {/* MT Conductor */}
          <div className="relative">
            <label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 text-orange-500" /> MT
            </label>
            <button
              onClick={() => { nav.setMtHighlight(0); setShowMTDropdown(!showMTDropdown); }}
              onKeyDown={handleMTNav}
              className="w-full text-left px-2 py-1.5 bg-orange-50 border border-orange-100 rounded-lg text-xs font-medium text-orange-700 truncate focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              {condutorMT.label}
            </button>
            {showMTDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border max-h-40 overflow-y-auto">
                <div className="p-1 space-y-0.5">
                  <div className="text-[9px] text-gray-400 px-2 py-1 font-bold bg-gray-50">CONVENCIONAL</div>
                  {CONDUTORES_MT.filter(c => c.tipo === 'Convencional').map((c, idx) => (
                    <button key={c.id} onClick={() => { setCondutorMT(c); setShowMTDropdown(false); }} className={`w-full text-left px-2 py-1.5 text-xs text-gray-700 rounded block ${idx === nav.mtHighlight ? 'bg-orange-100' : 'hover:bg-orange-50'}`}>{c.label}</button>
                  ))}
                  <div className="text-[9px] text-gray-400 px-2 py-1 font-bold bg-gray-50 mt-1">COMPACTA</div>
                  {CONDUTORES_MT.filter(c => c.tipo === 'Compacta').map((c) => (
                    <button key={c.id} onClick={() => { setCondutorMT(c); setShowMTDropdown(false); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-orange-50 text-gray-700 rounded block">{c.label}</button>
                  ))}
                  {/* ISOLADA - TODO: Adicionar condutores isolados ao CONDUTORES_MT se necessário */}
                  {CONDUTORES_MT.filter(c => c.tipo === 'Isolada').length > 0 && (
                    <>
                      <div className="text-[9px] text-gray-400 px-2 py-1 font-bold bg-gray-50 mt-1">ISOLADA</div>
                      {CONDUTORES_MT.filter(c => c.tipo === 'Isolada').map((c) => (
                        <button key={c.id} onClick={() => { setCondutorMT(c); setShowMTDropdown(false); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-orange-50 text-gray-700 rounded block">{c.label}</button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* BT Conductor */}
          <div className="relative">
            <label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 text-blue-500" /> BT
            </label>
            <button
              onClick={() => { nav.setBtHighlight(0); setShowBTDropdown(!showBTDropdown); }}
              onKeyDown={handleBTNav}
              className="w-full text-left px-2 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs font-medium text-blue-700 truncate focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {condutorBT.label}
            </button>
            {showBTDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border max-h-40 overflow-y-auto">
                <div className="p-1 space-y-0.5">
                  <div className="text-[9px] text-gray-400 px-2 py-1 font-bold bg-gray-50">MULTIPLEXADA</div>
                  {CONDUTORES_BT.filter(c => c.tipo === 'Multiplexada').map((c, idx) => (
                    <button key={c.id} onClick={() => { setCondutorBT(c); setShowBTDropdown(false); }} className={`w-full text-left px-2 py-1.5 text-xs text-gray-700 rounded block ${idx === nav.btHighlight ? 'bg-blue-100' : 'hover:bg-blue-50'}`}>{c.label}</button>
                  ))}
                  <div className="text-[9px] text-gray-400 px-2 py-1 font-bold bg-gray-50 mt-1">REDE NUA</div>
                  {CONDUTORES_BT.filter(c => c.tipo === 'Nua').map((c) => (
                    <button key={c.id} onClick={() => { setCondutorBT(c); setShowBTDropdown(false); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-50 text-gray-700 rounded block">{c.label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area: Structure List or Material List */}
      <div className="flex-1 flex flex-col bg-gray-50 border-r border-gray-200">
        {/* Simple Tabs for switching if needed, though current design shows one based on activeTab state */}
        {/* Since StructureList handles structures and MaterialList handles activeTab check, we render both components
             but only one will display based on activeTab prop logic inside them (if wrapped nicely) or conditional render here.
             Looking at extraction, they expect activeTab prop but MaterialList returns null if not active. 
             StructureList has tabs inside. Ideally we lift tabs out or keep them sync.
             Let's render conditionally for clarity.
         */}
        {
          activeTab === 'estruturas' ? (
            <div className="flex-1 flex flex-col h-full">
              <div className="px-4 py-2 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setShowManualKitManager(true)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition border border-transparent hover:border-blue-100 flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  Gerenciar Kits
                </button>
              </div>
              <StructureList
                estruturas={estruturas}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                searchStructure={searchStructure}
                structureQuery={structureQuery}
                structureResults={structureResults}
                showStructureDropdown={showStructureDropdown}
                structureHighlight={nav.structureHighlight}
                handleStructureKeyDown={handleStructureNav}
                selectStructure={(item) => openQtyPopup(item, 'structure')}
                removeStructure={removeStructure}
                onKitClick={openKitDetails}
                structureRef={nav.structureRef}
                setStructureQuery={setStructureQuery}
                setShowStructureDropdown={setShowStructureDropdown}
                setStructureHighlight={nav.setStructureHighlight}
              />
            </div>
          ) : (
            <MaterialList
              materiaisAvulsos={materiaisAvulsos}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              searchMaterial={searchMaterial}
              materialQuery={materialQuery}
              materialResults={materialResults}
              showMaterialDropdown={showMaterialDropdown}
              materialHighlight={nav.materialHighlight}
              handleMaterialKeyDown={handleMaterialNav}
              selectMaterial={(item) => openQtyPopup(item, 'material')}
              removeMaterial={removeMaterial}
              materialRef={nav.materialRef}
              setMaterialQuery={setMaterialQuery}
              setShowMaterialDropdown={setShowMaterialDropdown}
              setMaterialHighlight={nav.setMaterialHighlight}
            />
          )
        }
      </div>

      {/* Footer */}
      <SummaryFooter
        custoData={custoData}
        condutorMT={condutorMT}
        condutorBT={condutorBT}
        copySummary={copySummary}
        showBudgetHistory={showBudgetHistory}
        setShowBudgetHistory={setShowBudgetHistory}
        estruturas={estruturas}
      />

      {/* Modals */}
      <BudgetHistory
        isOpen={showBudgetHistory}
        onClose={() => setShowBudgetHistory(false)}
        onLoad={loadBudget}
        currentData={{
          materiais: custoData.materiais,
          totalGeral: custoData.totalGeral,
          condutorMT,
          condutorBT,
          estruturas,
          materiaisAvulsos
        }}
      />

      <TemplateManager
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        onApply={loadTemplate}
        currentData={{
          condutorMT,
          condutorBT,
          estruturas,
          materiaisAvulsos
        }}
      />

      <KitDetailsModal
        isOpen={showKitDetails}
        onClose={() => setShowKitDetails(false)}
        kit={selectedKit}
        onSaveMateriais={updateKitMateriais}
      />

      <PriceManagementModal
        isOpen={showPriceManagement}
        onClose={() => setShowPriceManagement(false)}
        empresaAtiva={empresaAtiva}
      />

      <KitResolutionModal
        isOpen={showResolutionModal}
        onClose={() => setShowResolutionModal(false)}
        kit={pendingResolutionKit}
        materials={pendingResolutionMaterials}
        onConfirm={handleResolutionConfirm}
      />
    </div>
  );
};

export default Configurator;
