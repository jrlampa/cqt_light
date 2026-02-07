import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Layers, X, Calculator, Zap, Plus, ChevronDown, Wrench, Save, FileText, Trash2, Pencil, Download, FolderOpen, LayoutTemplate } from 'lucide-react';
import { exportBudgetToExcel } from '../utils/excelExporter';
import BudgetHistory from './BudgetHistory';
import TemplateManager from './TemplateManager';

// Conductor options
const CONDUTORES_MT = [
  { id: 'cab_21_caa', label: 'Cabo 21 mm² CAA', tipo: 'Convencional' },
  { id: 'cab_53_caa', label: 'Cabo 53 mm² CAA', tipo: 'Convencional' },
  { id: 'cab_201_ca', label: 'Cabo 201 mm² CA', tipo: 'Convencional' },
  { id: 'cab_53_spacer', label: 'Cabo 53 mm² Spacer', tipo: 'Compacta' },
  { id: 'cab_201_spacer', label: 'Cabo 201 mm² Spacer', tipo: 'Compacta' },
  { id: 'cab_50_pr', label: 'Cabo 50 mm² PR', tipo: 'Protegida' },
  { id: 'cab_185_pr', label: 'Cabo 185 mm² PR', tipo: 'Protegida' },
];

const CONDUTORES_BT = [
  { id: 'mult_35', label: 'Multiplex 35 mm²', tipo: 'Multiplexada' },
  { id: 'mult_70', label: 'Multiplex 70 mm²', tipo: 'Multiplexada' },
  { id: 'mult_120', label: 'Multiplex 120 mm²', tipo: 'Multiplexada' },
  { id: 'cab_4awg', label: 'Cabo 4 AWG', tipo: 'Nua' },
  { id: 'cab_2awg', label: 'Cabo 2 AWG', tipo: 'Nua' },
  { id: 'cab_1_0awg', label: 'Cabo 1/0 AWG', tipo: 'Nua' },
];

// Persistence
const loadState = () => {
  try {
    const saved = localStorage.getItem('cqt_configurator_state');
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
};
const saveState = (state) => {
  try { localStorage.setItem('cqt_configurator_state', JSON.stringify(state)); } catch { }
};

const Configurator = () => {
  const initial = loadState() || {};

  // Poste
  const [posteQuery, setPosteQuery] = useState('');
  const [posteResults, setPosteResults] = useState([]);

  const [showPosteDropdown, setShowPosteDropdown] = useState(false);
  const [posteHighlight, setPosteHighlight] = useState(0);

  // Conductors
  const [condutorMT, setCondutorMT] = useState(initial.condutorMT || null);
  const [condutorBT, setCondutorBT] = useState(initial.condutorBT || null);
  const [showMTDropdown, setShowMTDropdown] = useState(false);
  const [showBTDropdown, setShowBTDropdown] = useState(false);
  const [mtHighlight, setMtHighlight] = useState(0);
  const [btHighlight, setBtHighlight] = useState(0);

  // Structures (kits)
  const [estruturas, setEstruturas] = useState(initial.estruturas || []);
  const [structureQuery, setStructureQuery] = useState('');
  const [structureResults, setStructureResults] = useState([]);
  const [showStructureDropdown, setShowStructureDropdown] = useState(false);
  const [structureHighlight, setStructureHighlight] = useState(0);

  // Loose materials
  const [materiaisAvulsos, setMateriaisAvulsos] = useState(initial.materiaisAvulsos || []);
  const [materialQuery, setMaterialQuery] = useState('');
  const [materialResults, setMaterialResults] = useState([]);
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [materialHighlight, setMaterialHighlight] = useState(0);

  // Quantity popup
  const [showQtyPopup, setShowQtyPopup] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const [pendingType, setPendingType] = useState('structure'); // 'structure' or 'material'
  const [qty, setQty] = useState(1);

  // Results
  const [custoData, setCustoData] = useState({ materiais: [], totalMaterial: 0, totalServico: 0, totalGeral: 0 });
  const [calcTime, setCalcTime] = useState(0);

  // Refs for keyboard navigation
  const posteInputRef = useRef(null);
  const estruturaInputRef = useRef(null);
  const materialInputRef = useRef(null);

  const structureRef = useRef(null);
  const materialRef = useRef(null);
  const qtyInputRef = useRef(null);

  // Save state
  useEffect(() => {
    saveState({ condutorMT, condutorBT, estruturas, materiaisAvulsos });
  }, [condutorMT, condutorBT, estruturas, materiaisAvulsos]);

  // Budget History
  const [showBudgetHistory, setShowBudgetHistory] = useState(false);

  const loadBudget = (data) => {
    if (!data) return;
    setCondutorMT(data.condutorMT);
    setCondutorBT(data.condutorBT);
    setEstruturas(data.estruturas || []);
    setMateriaisAvulsos(data.materiaisAvulsos || []);
    alert('✅ Orçamento carregado com sucesso! Clique em "Calcular" para atualizar os valores.');
  };

  // Template Manager
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  const loadTemplate = (data) => {
    if (!data) return;
    setCondutorMT(data.condutorMT);
    setCondutorBT(data.condutorBT);
    setEstruturas(data.estruturas || []);
    setMateriaisAvulsos(data.materiaisAvulsos || []);
    // Templates might not have full prices, but should structure the project
  };

  // Global shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'f') { e.preventDefault(); structureRef.current?.focus(); }
      if (e.ctrlKey && e.key === 'm') { e.preventDefault(); materialRef.current?.focus(); }
      if (e.key === 'Escape') {
        setShowPosteDropdown(false);
        setShowMTDropdown(false);
        setShowBTDropdown(false);
        setShowStructureDropdown(false);
        setShowMaterialDropdown(false);
        setShowQtyPopup(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Recalculate when data changes
  useEffect(() => { calculateTotal(); }, [estruturas, materiaisAvulsos]);

  // Focus qty input
  useEffect(() => {
    if (showQtyPopup && qtyInputRef.current) {
      qtyInputRef.current.focus();
      qtyInputRef.current.select();
    }
  }, [showQtyPopup]);

  // Search functions
  const searchPoste = async (query) => {
    setPosteQuery(query);
    if (!window.api || !query.trim()) { setPosteResults([]); setShowPosteDropdown(false); return; }
    const results = await window.api.searchMaterials(query);
    // Filter for materials containing POSTE in description
    const postes = (results || []).filter(m => m.descricao?.toUpperCase().includes('POSTE'));
    setPosteResults(postes.slice(0, 10));
    setShowPosteDropdown(postes.length > 0);
    setPosteHighlight(0);
  };

  const searchStructure = async (query) => {
    setStructureQuery(query);
    if (!window.api || !query.trim()) { setStructureResults([]); setShowStructureDropdown(false); return; }
    const results = await window.api.searchKits(query);
    const filtered = results.filter(k => !estruturas.find(e => e.codigo_kit === k.codigo_kit));
    setStructureResults(filtered.slice(0, 15));
    setShowStructureDropdown(filtered.length > 0);
    setStructureHighlight(0);
  };

  const searchMaterial = async (query) => {
    setMaterialQuery(query);
    if (!window.api || !query.trim()) { setMaterialResults([]); setShowMaterialDropdown(false); return; }
    const results = await window.api.searchMaterials(query);
    setMaterialResults((results || []).slice(0, 15));
    setShowMaterialDropdown(results && results.length > 0);
    setMaterialHighlight(0);
  };

  // Selection functions - Poste adds directly to materials with qty=1
  const selectPoste = (mat) => {
    // Add poste as material with qty 1
    const entry = { ...mat, id: Date.now(), quantidade: 1 };
    setMateriaisAvulsos(prev => [...prev, entry]);
    setPosteQuery('');
    setPosteResults([]);
    setShowPosteDropdown(false);
  };

  const openQtyPopup = (item, type) => {
    setPendingItem(item);
    setPendingType(type);
    setQty(1);
    setShowQtyPopup(true);
    if (type === 'structure') {
      setShowStructureDropdown(false);
      setStructureQuery('');
      setStructureResults([]);
    } else {
      setShowMaterialDropdown(false);
      setMaterialQuery('');
      setMaterialResults([]);
    }
  };

  const confirmAddItem = () => {
    if (!pendingItem) return;

    if (pendingType === 'structure') {
      const entry = { ...pendingItem, id: Date.now(), quantidade: qty };
      setEstruturas(prev => [...prev, entry]);
    } else if (pendingType === 'edit_material') {
      // Editing existing material - update or add to materiaisAvulsos
      const existing = materiaisAvulsos.find(m => m.sap === pendingItem.sap);
      if (existing) {
        setMateriaisAvulsos(prev => prev.map(m =>
          m.sap === pendingItem.sap ? { ...m, quantidade: qty } : m
        ));
      } else {
        const entry = { ...pendingItem, id: Date.now(), quantidade: qty };
        setMateriaisAvulsos(prev => [...prev, entry]);
      }
    } else {
      const entry = { ...pendingItem, id: Date.now(), quantidade: qty };
      setMateriaisAvulsos(prev => [...prev, entry]);
    }

    setShowQtyPopup(false);
    setPendingItem(null);
    setQty(1);
  };

  const removeStructure = (id) => { setEstruturas(prev => prev.filter(e => e.id !== id)); };
  const removeMaterial = (id) => { setMateriaisAvulsos(prev => prev.filter(m => m.id !== id)); };

  // Edit material in consolidated view
  const editConsolidatedMaterial = (mat) => {
    // Find if this material exists in materiaisAvulsos
    const existing = materiaisAvulsos.find(m => m.sap === mat.sap);
    if (existing) {
      setPendingItem(existing);
      setPendingType('edit_material');
      setQty(existing.quantidade || 1);
      setShowQtyPopup(true);
    } else {
      // Add as new loose material for editing
      const newMat = { ...mat, id: Date.now() };
      setPendingItem(newMat);
      setPendingType('edit_material');
      setQty(mat.quantidade || 1);
      setShowQtyPopup(true);
    }
  };

  // Delete material from consolidated view (only if in materiaisAvulsos)
  const deleteConsolidatedMaterial = (sap) => {
    // Remove all instances of this material from materiaisAvulsos
    setMateriaisAvulsos(prev => prev.filter(m => m.sap !== sap));
  };

  // Calculate total costs
  const calculateTotal = async () => {
    if (!window.api) return;

    // Kits from structures
    const kitList = [];
    estruturas.forEach(e => {
      const count = e.quantidade || 1;
      for (let i = 0; i < count; i++) kitList.push(e.codigo_kit);
    });

    const start = performance.now();

    // Get kit materials
    let kitData = { materiais: [], totalMaterial: 0, totalServico: 0 };
    if (kitList.length > 0) {
      kitData = await window.api.getCustoTotal(kitList) || kitData;
    }

    // Build consolidated materials with categories
    const allMaterials = [];

    // 1. Add POSTES (from materiaisAvulsos that contain "POSTE")
    const postes = [];
    materiaisAvulsos.forEach(mat => {
      if (mat.descricao?.toUpperCase().includes('POSTE')) {
        const qty = mat.quantidade || 1;
        const price = mat.preco_unitario || 0;
        postes.push({
          sap: mat.sap,
          descricao: mat.descricao,
          unidade: mat.unidade,
          preco_unitario: price,
          quantidade: qty,
          subtotal: qty * price,
          categoria: 'POSTE'
        });
      }
    });

    // 2. Add KITS/STRUCTURES as line items
    const kitsMap = new Map();
    estruturas.forEach(e => {
      const qty = e.quantidade || 1;
      const price = e.preco_kit || 0;
      const key = e.codigo_kit;

      if (kitsMap.has(key)) {
        const existing = kitsMap.get(key);
        existing.quantidade += qty;
        existing.subtotal += qty * price;
      } else {
        kitsMap.set(key, {
          sap: e.codigo_kit,
          descricao: e.descricao_kit || e.codigo_kit,
          unidade: 'KIT',
          preco_unitario: price,
          quantidade: qty,
          subtotal: qty * price,
          categoria: 'KIT'
        });
      }
    });

    // 3. CONSOLIDATE ALL MATERIALS BY SAP (kit materials + loose materials)
    // This prevents duplicates when same material appears in kit and as loose item
    const consolidatedMaterials = new Map();

    // Add kit materials
    kitData.materiais.forEach(mat => {
      const key = mat.sap;
      if (consolidatedMaterials.has(key)) {
        const existing = consolidatedMaterials.get(key);
        existing.quantidade += mat.quantidade || 0;
        existing.subtotal += mat.subtotal || 0;
      } else {
        consolidatedMaterials.set(key, {
          ...mat,
          categoria: 'MATERIAL'
        });
      }
    });

    // Add loose materials (excluding postes, merge by SAP)
    let looseTotal = 0;
    materiaisAvulsos.forEach(mat => {
      if (!mat.descricao?.toUpperCase().includes('POSTE')) {
        const key = mat.sap;
        const qty = mat.quantidade || 1;
        const price = mat.preco_unitario || 0;
        const subtotal = qty * price;
        looseTotal += subtotal;

        if (consolidatedMaterials.has(key)) {
          // Merge with existing (from kits)
          const existing = consolidatedMaterials.get(key);
          existing.quantidade += qty;
          existing.subtotal += subtotal;
        } else {
          // New material
          consolidatedMaterials.set(key, {
            sap: mat.sap,
            descricao: mat.descricao,
            unidade: mat.unidade,
            preco_unitario: price,
            quantidade: qty,
            subtotal: subtotal,
            categoria: 'MATERIAL'
          });
        }
      }
    });

    // Combine all in order: Postes, Kits, Consolidated Materials
    allMaterials.push(...postes);
    allMaterials.push(...Array.from(kitsMap.values()));
    allMaterials.push(...Array.from(consolidatedMaterials.values()));

    const totalMaterial = kitData.totalMaterial + looseTotal +
      postes.reduce((sum, p) => sum + p.subtotal, 0) +
      Array.from(kitsMap.values()).reduce((sum, k) => sum + k.subtotal, 0);
    const totalServico = kitData.totalServico || 0;

    setCalcTime(performance.now() - start);
    setCustoData({
      materiais: allMaterials,
      totalMaterial,
      totalServico,
      totalGeral: totalMaterial + totalServico
    });
  };

  const clearAll = () => {
    setPosteQuery('');
    setCondutorMT(null);
    setCondutorBT(null);
    setEstruturas([]);
    setMateriaisAvulsos([]);
    setCustoData({ materiais: [], totalMaterial: 0, totalServico: 0, totalGeral: 0 });
    localStorage.removeItem('cqt_configurator_state');
  };

  // Copy summary to clipboard
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

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      // ESC: Clear all
      if (e.key === 'Escape') {
        clearAll();
        setTimeout(() => posteInputRef.current?.focus(), 100);
      }
      // Ctrl+P: Copy summary
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        copySummary();
      }
      // Ctrl+Enter: Calculate
      if (e.ctrlKey && e.key === 'Enter') {
        calculateTotal();
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [custoData]);

  // Keyboard handlers
  const handlePosteKeyDown = (e) => {
    if (!showPosteDropdown || posteResults.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setPosteHighlight(prev => Math.min(prev + 1, posteResults.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setPosteHighlight(prev => Math.max(prev - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); selectPoste(posteResults[posteHighlight]); }
  };

  const handleMTKeyDown = (e) => {
    if (!showMTDropdown) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setMtHighlight(prev => Math.min(prev + 1, CONDUTORES_MT.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setMtHighlight(prev => Math.max(prev - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); setCondutorMT(CONDUTORES_MT[mtHighlight]); setShowMTDropdown(false); }
  };

  const handleBTKeyDown = (e) => {
    if (!showBTDropdown) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setBtHighlight(prev => Math.min(prev + 1, CONDUTORES_BT.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setBtHighlight(prev => Math.max(prev - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); setCondutorBT(CONDUTORES_BT[btHighlight]); setShowBTDropdown(false); }
  };

  const handleStructureKeyDown = (e) => {
    if (!showStructureDropdown || structureResults.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setStructureHighlight(prev => Math.min(prev + 1, structureResults.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setStructureHighlight(prev => Math.max(prev - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); openQtyPopup(structureResults[structureHighlight], 'structure'); }
  };

  const handleMaterialKeyDown = (e) => {
    if (!showMaterialDropdown || materialResults.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setMaterialHighlight(prev => Math.min(prev + 1, materialResults.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setMaterialHighlight(prev => Math.max(prev - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); openQtyPopup(materialResults[materialHighlight], 'material'); }
  };

  const handleQtyKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); confirmAddItem(); }
    if (e.key === 'Escape') { e.preventDefault(); setShowQtyPopup(false); }
  };

  const totalKits = estruturas.reduce((sum, e) => sum + (e.quantidade || 1), 0);
  const totalMats = materiaisAvulsos.reduce((sum, m) => sum + (m.quantidade || 1), 0);

  return (
    <div className="h-full flex gap-4 relative">
      {/* Quantity Popup */}
      {showQtyPopup && pendingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowQtyPopup(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-80" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Quantidade</h3>
            <p className="text-sm text-gray-600 mb-4">
              <span className={`font - mono font - bold ${pendingType === 'structure' ? 'text-orange-600' : 'text-blue-600'} `}>
                {pendingType === 'structure' ? pendingItem.codigo_kit : pendingItem.sap}
              </span>
              <br />
              <span className="text-xs text-gray-500">
                {pendingType === 'structure' ? pendingItem.descricao_kit : pendingItem.descricao}
              </span>
            </p>
            <input
              ref={qtyInputRef}
              type="number"
              min="1"
              step="0.01"
              value={qty}
              onChange={(e) => setQty(Math.max(0.01, parseFloat(e.target.value) || 1))}
              onKeyDown={handleQtyKeyDown}
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
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1">
          <button
            onClick={clearAll}
            disabled={totalKits === 0 && totalMats === 0}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Trash2 className="w-3 h-3" /> Limpar
          </button>
          <button
            onClick={() => alert('Salvar como Kit - Em breve!')}
            disabled={totalKits === 0 && totalMats === 0}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Save className="w-3 h-3" /> Kit
          </button>
          <button
            onClick={() => alert('Salvar para Relatório - Em breve!')}
            disabled={totalKits === 0 && totalMats === 0}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <FileText className="w-3 h-3" /> Relatório
          </button>
        </div>

        {/* Export Button */}
        {custoData.materiais.length > 0 && (
          <button
            onClick={() => exportMaterialsToExcel(custoData.materiais, custoData)}
            className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 transition"
          >
            <Download className="w-3 h-3" /> Exportar Excel
          </button>
        )}

        {/* Poste */}
        <div className="relative">
          <label className="text-[10px] text-gray-500 uppercase font-bold">Poste (adiciona aos materiais)</label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input type="text" value={posteQuery} onChange={(e) => searchPoste(e.target.value)} onKeyDown={handlePosteKeyDown} placeholder="Buscar poste..." className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-gray-200 text-xs" />
          </div>
          {showPosteDropdown && posteResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border max-h-32 overflow-y-auto">
              {posteResults.map((mat, idx) => (
                <button key={mat.sap} onMouseDown={(e) => { e.preventDefault(); selectPoste(mat); }} className={`w - full text - left px - 2 py - 1.5 text - xs flex gap - 2 ${idx === posteHighlight ? 'bg-green-100' : 'hover:bg-gray-50'} `}>
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
              onClick={() => { setShowMTDropdown(!showMTDropdown); setShowBTDropdown(false); setMtHighlight(0); }}
              onKeyDown={handleMTKeyDown}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition ${condutorMT ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100 shadow-sm' : 'border-gray-200 hover:border-orange-300'}`}
            >
              <div className="flex flex-col items-start">
                {condutorMT ? (
                  <>
                    <span className="font-bold text-orange-700">{condutorMT.label.split(' ')[1]}</span>
                    <span className="text-[9px] text-orange-600">{condutorMT.tipo}</span>
                  </>
                ) : (
                  <span className="text-gray-400 text-xs">Selecionar...</span>
                )}
              </div>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            {showMTDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border max-h-40 overflow-y-auto">
                {CONDUTORES_MT.map((opt, idx) => (
                  <button
                    key={opt.id}
                    onMouseDown={(e) => { e.preventDefault(); setCondutorMT(opt); setShowMTDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex justify-between items-center ${idx === mtHighlight ? 'bg-orange-100' : 'hover:bg-orange-50'}`}
                  >
                    <span className="font-semibold text-orange-700">{opt.label}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-orange-200 text-orange-700 rounded">{opt.tipo}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* BT Conductor */}
          <div className="relative">
            <label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 text-blue-500" /> BT
            </label>
            <button
              onClick={() => { setShowBTDropdown(!showBTDropdown); setShowMTDropdown(false); setBtHighlight(0); }}
              onKeyDown={handleBTKeyDown}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition ${condutorBT ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm' : 'border-gray-200 hover:border-blue-300'}`}
            >
              <div className="flex flex-col items-start">
                {condutorBT ? (
                  <>
                    <span className="font-bold text-blue-700">{condutorBT.label.split(' ')[1]}</span>
                    <span className="text-[9px] text-blue-600">{condutorBT.tipo}</span>
                  </>
                ) : (
                  <span className="text-gray-400 text-xs">Selecionar...</span>
                )}
              </div>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            {showBTDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border max-h-40 overflow-y-auto">
                {CONDUTORES_BT.map((opt, idx) => (
                  <button
                    key={opt.id}
                    onMouseDown={(e) => { e.preventDefault(); setCondutorBT(opt); setShowBTDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex justify-between items-center ${idx === btHighlight ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                  >
                    <span className="font-semibold text-blue-700">{opt.label}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-blue-200 text-blue-700 rounded">{opt.tipo}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Structures */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1"><Package className="w-3 h-3" /> Estruturas</span>
            <span className="text-[10px] text-gray-400">{estruturas.length}</span>
          </div>
          <div className="relative mt-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input ref={structureRef} type="text" value={structureQuery} onChange={(e) => searchStructure(e.target.value)} onKeyDown={handleStructureKeyDown} placeholder="Buscar... (Ctrl+F)" className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-gray-200 text-xs" />
            {showStructureDropdown && structureResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border max-h-40 overflow-y-auto">
                {structureResults.map((kit, idx) => (
                  <button key={kit.codigo_kit} onMouseDown={(e) => { e.preventDefault(); openQtyPopup(kit, 'structure'); }} className={`w - full text - left px - 2 py - 1.5 text - xs flex items - center gap - 1 ${idx === structureHighlight ? 'bg-orange-100' : 'hover:bg-gray-50'} `}>
                    <span className="font-mono font-bold text-orange-600">{kit.codigo_kit}</span>
                    <span className="text-gray-500 truncate flex-1 text-[10px]">{kit.descricao_kit}</span>
                    <Plus className="w-3 h-3 text-gray-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
          {estruturas.length > 0 && (
            <div className="mt-1 space-y-0.5 max-h-20 overflow-y-auto">
              {estruturas.map(e => (
                <div key={e.id} className="flex items-center justify-between px-2 py-1 bg-orange-50 rounded border border-orange-200 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="bg-orange-200 text-orange-800 px-1 rounded text-[10px] font-bold">{e.quantidade || 1}x</span>
                    <span className="font-mono font-bold text-orange-700">{e.codigo_kit}</span>
                  </div>
                  <button onClick={() => removeStructure(e.id)} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Loose Materials */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1"><Wrench className="w-3 h-3" /> Materiais Avulsos</span>
            <span className="text-[10px] text-gray-400">{materiaisAvulsos.length}</span>
          </div>
          <div className="relative mt-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input ref={materialRef} type="text" value={materialQuery} onChange={(e) => searchMaterial(e.target.value)} onKeyDown={handleMaterialKeyDown} placeholder="SAP ou descrição... (Ctrl+M)" className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-gray-200 text-xs" />
            {showMaterialDropdown && materialResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border max-h-40 overflow-y-auto">
                {materialResults.map((mat, idx) => (
                  <button key={mat.sap} onMouseDown={(e) => { e.preventDefault(); openQtyPopup(mat, 'material'); }} className={`w - full text - left px - 2 py - 1.5 text - xs flex items - center gap - 1 ${idx === materialHighlight ? 'bg-blue-100' : 'hover:bg-gray-50'} `}>
                    <span className="font-mono font-bold text-blue-600">{mat.sap}</span>
                    <span className="text-gray-500 truncate flex-1 text-[10px]">{mat.descricao}</span>
                    <Plus className="w-3 h-3 text-gray-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
          {materiaisAvulsos.length > 0 && (
            <div className="mt-1 space-y-0.5 max-h-20 overflow-y-auto">
              {materiaisAvulsos.map(m => (
                <div key={m.id} className="flex items-center justify-between px-2 py-1 bg-blue-50 rounded border border-blue-200 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="bg-blue-200 text-blue-800 px-1 rounded text-[10px] font-bold">{m.quantidade || 1}x</span>
                    <span className="font-mono font-bold text-blue-700">{m.sap}</span>
                  </div>
                  <button onClick={() => removeMaterial(m.id)} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
          <span className="font-bold text-gray-700 flex items-center gap-2 text-sm"><Layers className="w-4 h-4" /> Materiais Consolidados</span>
          <span className="text-xs text-gray-400">{custoData.materiais.length} itens</span>
        </div>

        {custoData.materiais.length > 0 ? (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-[10px] uppercase text-gray-500 sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left">SAP</th>
                  <th className="px-2 py-2 text-left">Descrição</th>
                  <th className="px-2 py-2 text-center">Un</th>
                  <th className="px-2 py-2 text-right">Qtd</th>
                  <th className="px-2 py-2 text-right">Unit</th>
                  <th className="px-2 py-2 text-right">Subtotal</th>
                  <th className="px-2 py-2 text-center w-16">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {custoData.materiais.map((mat, idx) => (
                  <tr key={mat.sap || idx} className="hover:bg-blue-50/50 group">
                    <td className="px-2 py-1.5 font-mono text-blue-700 font-bold text-xs">{mat.sap}</td>
                    <td className="px-2 py-1.5 text-gray-700 text-xs truncate max-w-[200px]">{mat.descricao}</td>
                    <td className="px-2 py-1.5 text-center text-gray-400 text-xs">{mat.unidade}</td>
                    <td className="px-2 py-1.5 text-right text-xs">{mat.quantidade?.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-right text-gray-400 text-xs">{mat.preco_unitario?.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-right font-bold text-emerald-700 text-xs">{mat.subtotal?.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => editConsolidatedMaterial(mat)}
                          className="p-1 rounded hover:bg-blue-100 text-blue-500"
                          title="Alterar quantidade"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteConsolidatedMaterial(mat.sap)}
                          className="p-1 rounded hover:bg-red-100 text-red-500"
                          title="Excluir material"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Package className="w-12 h-12 mx-auto text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm">Adicione estruturas ou materiais</p>
              <p className="text-[10px] text-gray-300 mt-1"><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+F</kbd> estruturas · <kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+M</kbd> materiais</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div>
                <span className="text-[10px] text-gray-500 uppercase">Material</span>
                <p className="text-base font-bold text-emerald-600">R$ {custoData.totalMaterial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase">M.O.</span>
                <p className="text-base font-bold text-purple-600">R$ {custoData.totalServico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Total</span>
                {calcTime > 0 && <span className="text-[10px] text-gray-400 flex items-center"><Zap className="w-2.5 h-2.5 text-yellow-500" />{calcTime.toFixed(0)}ms</span>}
              </div>
              <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                R$ {custoData.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Summary Footer */}
      {custoData.totalGeral > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-emerald-500 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-blue-500 px-4 py-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Calculator className="w-4 h-4" />
                <span>TOTAL GERAL</span>
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                R$ {custoData.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex gap-3 text-xs mt-2">
                <div>
                  <span className="text-gray-500">Mat:</span>
                  <span className="text-emerald-600 font-semibold ml-1">
                    R$ {custoData.totalMaterial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">M.O.:</span>
                  <span className="text-purple-600 font-semibold ml-1">
                    R$ {custoData.totalServico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 w-full mt-3">
                <button
                  onClick={copySummary}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2 text-sm font-semibold border border-gray-200"
                  title="Copiar resumo para área de transferência"
                >
                  <FileText className="w-4 h-4" />
                  Copiar
                </button>
                <button
                  onClick={() => exportBudgetToExcel(custoData, estruturas, 'Orcamento_CQT')}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition flex items-center justify-center gap-2 text-sm font-semibold shadow-md"
                  title="Baixar planilha completa em Excel"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">Ctrl+P</kbd>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Budget History Modal */}
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

      {/* Template Manager Modal */}
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
    </div>
  );
};

export default Configurator;
