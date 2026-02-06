import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Layers, X, Calculator, Zap, Plus, ChevronDown, Wrench } from 'lucide-react';

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

  const structureRef = useRef(null);
  const materialRef = useRef(null);
  const qtyInputRef = useRef(null);

  // Save state
  useEffect(() => {
    saveState({ condutorMT, condutorBT, estruturas, materiaisAvulsos });
  }, [condutorMT, condutorBT, estruturas, materiaisAvulsos]);

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

    // Combine with loose materials
    const allMaterials = [...kitData.materiais];
    let looseTotal = 0;

    materiaisAvulsos.forEach(mat => {
      const qty = mat.quantidade || 1;
      const price = mat.preco_unitario || 0;
      const subtotal = qty * price;
      looseTotal += subtotal;

      // Check if material already exists in list
      const existing = allMaterials.find(m => m.sap === mat.sap);
      if (existing) {
        existing.quantidade = (existing.quantidade || 0) + qty;
        existing.subtotal = (existing.subtotal || 0) + subtotal;
      } else {
        allMaterials.push({
          sap: mat.sap,
          descricao: mat.descricao,
          unidade: mat.unidade,
          preco_unitario: price,
          quantidade: qty,
          subtotal: subtotal
        });
      }
    });

    const totalMaterial = kitData.totalMaterial + looseTotal;
    const totalServico = kitData.totalServico || 0;

    setCalcTime(performance.now() - start);
    setCustoData({
      materiais: allMaterials.sort((a, b) => (a.descricao || '').localeCompare(b.descricao || '')),
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

  const totalKits = estruturas.reduce((sum, e) => sum + (e.quantidade || 1), 0) + (selectedPoste ? 1 : 0);
  const totalMats = materiaisAvulsos.reduce((sum, m) => sum + (m.quantidade || 1), 0);

  return (
    <div className="h-full flex gap-4 relative">
      {/* Quantity Popup */}
      {showQtyPopup && pendingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowQtyPopup(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-80" onClick={e => e.stopPropagation()}>
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
          </div>
          {(totalKits > 0 || totalMats > 0) && <button onClick={clearAll} className="text-[10px] text-red-500 hover:underline">Limpar</button>}
        </div>

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
                <button key={mat.sap} onMouseDown={(e) => { e.preventDefault(); selectPoste(mat); }} className={`w-full text-left px-2 py-1.5 text-xs flex gap-2 ${idx === posteHighlight ? 'bg-green-100' : 'hover:bg-gray-50'}`}>
                  <span className="font-mono font-bold text-green-600">{mat.sap}</span>
                  <span className="text-gray-500 truncate text-[10px]">{mat.descricao}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conductors */}
        <div className="grid grid-cols-2 gap-1">
          <div className="relative">
            <label className="text-[10px] text-gray-500 uppercase font-bold">MT</label>
            <button onClick={() => { setShowMTDropdown(!showMTDropdown); setShowBTDropdown(false); setMtHighlight(0); }} onKeyDown={handleMTKeyDown} className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg border text-[10px] ${condutorMT ? 'border-orange-400 bg-orange-50' : 'border-gray-200'}`}>
              <span className={condutorMT ? 'font-medium truncate' : 'text-gray-400'}>{condutorMT ? condutorMT.label.split(' ')[1] : 'Selec.'}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            {showMTDropdown && (
              <div className="absolute z-50 w-40 mt-1 bg-white rounded-lg shadow-xl border max-h-32 overflow-y-auto">
                {CONDUTORES_MT.map((opt, idx) => (
                  <button key={opt.id} onMouseDown={(e) => { e.preventDefault(); setCondutorMT(opt); setShowMTDropdown(false); }} className={`w-full text-left px-2 py-1.5 text-[10px] flex justify-between ${idx === mtHighlight ? 'bg-orange-100' : 'hover:bg-orange-50'}`}>
                    <span>{opt.label}</span><span className="text-gray-400">{opt.tipo}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <label className="text-[10px] text-gray-500 uppercase font-bold">BT</label>
            <button onClick={() => { setShowBTDropdown(!showBTDropdown); setShowMTDropdown(false); setBtHighlight(0); }} onKeyDown={handleBTKeyDown} className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg border text-[10px] ${condutorBT ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
              <span className={condutorBT ? 'font-medium truncate' : 'text-gray-400'}>{condutorBT ? condutorBT.label.split(' ')[1] : 'Selec.'}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            {showBTDropdown && (
              <div className="absolute z-50 w-40 mt-1 bg-white rounded-lg shadow-xl border max-h-32 overflow-y-auto">
                {CONDUTORES_BT.map((opt, idx) => (
                  <button key={opt.id} onMouseDown={(e) => { e.preventDefault(); setCondutorBT(opt); setShowBTDropdown(false); }} className={`w-full text-left px-2 py-1.5 text-[10px] flex justify-between ${idx === btHighlight ? 'bg-blue-100' : 'hover:bg-blue-50'}`}>
                    <span>{opt.label}</span><span className="text-gray-400">{opt.tipo}</span>
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
                  <button key={kit.codigo_kit} onMouseDown={(e) => { e.preventDefault(); openQtyPopup(kit, 'structure'); }} className={`w-full text-left px-2 py-1.5 text-xs flex items-center gap-1 ${idx === structureHighlight ? 'bg-orange-100' : 'hover:bg-gray-50'}`}>
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
                  <button key={mat.sap} onMouseDown={(e) => { e.preventDefault(); openQtyPopup(mat, 'material'); }} className={`w-full text-left px-2 py-1.5 text-xs flex items-center gap-1 ${idx === materialHighlight ? 'bg-blue-100' : 'hover:bg-gray-50'}`}>
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
                  <th className="px-3 py-2 text-left">SAP</th>
                  <th className="px-3 py-2 text-left">Descrição</th>
                  <th className="px-3 py-2 text-center">Un</th>
                  <th className="px-3 py-2 text-right">Qtd</th>
                  <th className="px-3 py-2 text-right">Unit</th>
                  <th className="px-3 py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {custoData.materiais.map((mat, idx) => (
                  <tr key={mat.sap || idx} className="hover:bg-blue-50/50">
                    <td className="px-3 py-1.5 font-mono text-blue-700 font-bold text-xs">{mat.sap}</td>
                    <td className="px-3 py-1.5 text-gray-700 text-xs truncate max-w-[250px]">{mat.descricao}</td>
                    <td className="px-3 py-1.5 text-center text-gray-400 text-xs">{mat.unidade}</td>
                    <td className="px-3 py-1.5 text-right text-xs">{mat.quantidade?.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right text-gray-400 text-xs">{mat.preco_unitario?.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right font-bold text-emerald-700 text-xs">{mat.subtotal?.toFixed(2)}</td>
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
    </div>
  );
};

export default Configurator;
