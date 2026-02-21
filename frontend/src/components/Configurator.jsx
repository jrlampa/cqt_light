import React, { useState, useEffect } from 'react';

// Hooks
import { useBudgetCalculator } from '../hooks/useBudgetCalculator';
import { useKeyboardNav } from '../hooks/useKeyboardNav';

// Constantes
import { CONDUTORES_MT, CONDUTORES_BT } from '../constants/conductors';

// Utils
import { exportMaterialsToExcel } from '../utils/excelExporter';
import {
  loadConfiguratorState,
  saveConfiguratorState,
  clearConfiguratorState,
} from '../utils/configuratorStorage';

// Componentes filhos
import { ConfiguratorToolbar } from './ConfiguratorToolbar';
import { ConductorSelector } from './ConductorSelector';
import { PosteSearch } from './PosteSearch';
import { QuantityPopup } from './QuantityPopup';
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

/**
 * Configurator — Orquestrador principal da tela de montagem de orçamentos.
 * Responsabilidade: coordenar estado, busca, seleção e modais.
 */
const Configurator = () => {
  const initial = loadConfiguratorState();

  // --- ESTADO PRINCIPAL ---
  const [activeTab, setActiveTab] = useState('estruturas');
  const [condutorMT, setCondutorMT] = useState(initial.condutorMT || CONDUTORES_MT[0]);
  const [condutorBT, setCondutorBT] = useState(initial.condutorBT || CONDUTORES_BT[2]);
  const [estruturas, setEstruturas] = useState(initial.estruturas || []);
  const [materiaisAvulsos, setMateriaisAvulsos] = useState(initial.materiaisAvulsos || []);

  const [structureQuery, setStructureQuery] = useState('');
  const [structureResults, setStructureResults] = useState([]);
  const [showStructureDropdown, setShowStructureDropdown] = useState(false);

  const [materialQuery, setMaterialQuery] = useState('');
  const [materialResults, setMaterialResults] = useState([]);
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);

  const [posteQuery, setPosteQuery] = useState('');
  const [posteResults, setPosteResults] = useState([]);
  const [showPosteDropdown, setShowPosteDropdown] = useState(false);

  const [showMTDropdown, setShowMTDropdown] = useState(false);
  const [showBTDropdown, setShowBTDropdown] = useState(false);

  const [showQtyPopup, setShowQtyPopup] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const [pendingType, setPendingType] = useState('structure');
  const [qty, setQty] = useState(1);

  const [showBudgetHistory, setShowBudgetHistory] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [isManualKitManagerOpen, setIsManualKitManagerOpen] = useState(false);
  const [isPriceManagerOpen, setIsPriceManagerOpen] = useState(false);
  const [showKitDetails, setShowKitDetails] = useState(false);
  const [selectedKit, setSelectedKit] = useState(null);
  const [showPriceManagement, setShowPriceManagement] = useState(false);
  const [empresaAtiva, setEmpresaAtiva] = useState(null);

  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [pendingResolutionKit, setPendingResolutionKit] = useState(null);
  const [pendingResolutionMaterials, setPendingResolutionMaterials] = useState([]);

  const [sufixos, setSufixos] = useState([]);
  const [manualTemplates, setManualTemplates] = useState([]);

  // --- HOOKS ---
  const { custoData, setCustoData, calculateTotal } = useBudgetCalculator();

  const closeAllDropdowns = () => {
    setShowStructureDropdown(false);
    setShowMaterialDropdown(false);
    setShowPosteDropdown(false);
    setShowMTDropdown(false);
    setShowBTDropdown(false);
    setShowQtyPopup(false);
  };

  const actions = {
    onEscape: closeAllDropdowns,
    onCopy: () => copySummary(),
    onCalculate: () => calculateTotal({
      estruturas, materiaisAvulsos, condutorMT, condutorBT, sufixos, templates: manualTemplates,
    }),
  };

  const nav = useKeyboardNav(actions);

  // --- EFEITOS ---
  useEffect(() => {
    if (window.api) {
      window.api.getAllSufixos().then(setSufixos).catch(console.error);
      window.api.getAllTemplatesManuais().then(setManualTemplates).catch(console.error);
    }
  }, []);

  useEffect(() => {
    saveConfiguratorState({ condutorMT, condutorBT, estruturas, materiaisAvulsos });
  }, [condutorMT, condutorBT, estruturas, materiaisAvulsos]);

  useEffect(() => {
    calculateTotal({
      estruturas, materiaisAvulsos, condutorMT, condutorBT, sufixos, templates: manualTemplates,
    });
  }, [estruturas, materiaisAvulsos, condutorMT, condutorBT, sufixos, manualTemplates, calculateTotal]);

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
    alert('Orçamento carregado com sucesso!');
  };

  const loadTemplate = (data) => {
    if (!data) return;
    setCondutorMT(data.condutorMT);
    setCondutorBT(data.condutorBT);
    setEstruturas(data.estruturas || []);
    setMateriaisAvulsos(data.materiaisAvulsos || []);
  };

  const searchPoste = async (query) => {
    setPosteQuery(query);
    if (!window.api || !query.trim()) { setPosteResults([]); setShowPosteDropdown(false); return; }
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

  const selectPoste = (mat) => {
    setMateriaisAvulsos(prev => [...prev, { ...mat, id: Date.now(), quantidade: 1 }]);
    setPosteQuery('');
    setPosteResults([]);
    setShowPosteDropdown(false);
  };

  const openQtyPopup = (item, type) => {
    closeAllDropdowns();
    if (type === 'structure') setStructureQuery('');
    if (type === 'material') setMaterialQuery('');
    setPendingItem(item);
    setPendingType(type);
    setQty(1);
    setShowQtyPopup(true);
    nav.focusQty();
  };

  const confirmAddItem = () => {
    if (!pendingItem) return;

    if (pendingType === 'structure') {
      if (pendingItem.tipo === 'manual' && pendingItem.materiais_json) {
        let materials = [];
        try {
          materials = typeof pendingItem.materiais_json === 'string'
            ? JSON.parse(pendingItem.materiais_json)
            : pendingItem.materiais_json;
        } catch (e) { console.error('Erro ao parsear materiais', e); }

        const hasPartials = materials.some(m => m.isPartial || (m.codigo && m.codigo.trim().endsWith('/')));
        if (hasPartials) {
          setPendingResolutionKit(pendingItem);
          setPendingResolutionMaterials(materials);
          setShowResolutionModal(true);
          setShowQtyPopup(false);
          return;
        }
      }

      setEstruturas(prev => [{ ...pendingItem, id: Date.now(), quantidade: qty }, ...prev]);
      setStructureQuery('');
      setStructureResults([]);
      setShowStructureDropdown(false);
      nav.focusStructure();
    } else {
      setMateriaisAvulsos(prev => [{ ...pendingItem, id: Date.now(), quantidade: qty }, ...prev]);
      setMaterialQuery('');
      setMaterialResults([]);
      setShowMaterialDropdown(false);
      nav.focusMaterial();
    }
    setShowQtyPopup(false);
    setPendingItem(null);
  };

  const handleResolutionConfirm = (resolvedMaterials) => {
    setEstruturas(prev => [{
      ...pendingResolutionKit, id: Date.now(), quantidade: qty, materiaisResolvidos: resolvedMaterials,
    }, ...prev]);
    setStructureQuery('');
    setStructureResults([]);
    setShowStructureDropdown(false);
    nav.focusStructure();
    setShowResolutionModal(false);
    setPendingResolutionKit(null);
    setPendingResolutionMaterials([]);
    setPendingItem(null);
  };

  const removeStructure = (id) => setEstruturas(prev => prev.filter(e => e.id !== id));
  const removeMaterial = (id) => setMateriaisAvulsos(prev => prev.filter(m => m.id !== id));
  const openKitDetails = (kit) => { setSelectedKit(kit); setShowKitDetails(true); };

  const updateKitMateriais = (materiaisExtras) => {
    if (!selectedKit) return;
    setEstruturas(prev => prev.map(kit =>
      kit.id === selectedKit.id ? { ...kit, materiaisExtras } : kit
    ));
  };

  const clearAll = () => {
    if (!confirm('Limpar toda a configuração?')) return;
    setEstruturas([]);
    setMateriaisAvulsos([]);
    setCustoData({ materiais: [], totalMaterial: 0, totalServico: 0, totalGeral: 0 });
    clearConfiguratorState();
  };

  const copySummary = () => {
    const summary =
      `ORÇAMENTO CQT LIGHT\n\n` +
      `Material: R$ ${custoData.totalMaterial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
      `Mão de Obra: R$ ${custoData.totalServico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
      `TOTAL: R$ ${custoData.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
      `Materiais (${custoData.materiais.length}):\n` +
      custoData.materiais.map(m =>
        `${m.sap} - ${m.descricao} (${m.quantidade} ${m.unidade}) - R$ ${m.subtotal.toFixed(2)}`
      ).join('\n');

    navigator.clipboard.writeText(summary)
      .then(() => alert('Resumo copiado para área de transferência!'));
  };

  // --- NAVEGAÇÃO POR TECLADO ---
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
    if (e.key === 'ArrowDown') { e.preventDefault(); nav.setPosteHighlight(p => Math.min(p + 1, posteResults.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); nav.setPosteHighlight(p => Math.max(p - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); selectPoste(posteResults[nav.posteHighlight]); }
  };

  const handleMTNav = (e) => {
    if (!showMTDropdown) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); nav.setMtHighlight(p => Math.min(p + 1, CONDUTORES_MT.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); nav.setMtHighlight(p => Math.max(p - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); setCondutorMT(CONDUTORES_MT[nav.mtHighlight]); setShowMTDropdown(false); }
    else if (e.key === 'Escape') { e.preventDefault(); setShowMTDropdown(false); }
  };

  const handleBTNav = (e) => {
    if (!showBTDropdown) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); nav.setBtHighlight(p => Math.min(p + 1, CONDUTORES_BT.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); nav.setBtHighlight(p => Math.max(p - 1, 0)); }
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
      {/* Modal de Quantidade */}
      {showQtyPopup && (
        <QuantityPopup
          pendingItem={pendingItem}
          pendingType={pendingType}
          qty={qty}
          setQty={setQty}
          qtyInputRef={nav.qtyInputRef}
          onConfirm={confirmAddItem}
          onCancel={() => setShowQtyPopup(false)}
          onKeyDown={handleQtyNav}
        />
      )}

      <ManualKitManager isOpen={isManualKitManagerOpen} onClose={() => setIsManualKitManagerOpen(false)} />
      <PriceManager isOpen={isPriceManagerOpen} onClose={() => setIsPriceManagerOpen(false)} />

      {/* Painel esquerdo */}
      <div className="w-72 flex flex-col gap-2 overflow-y-auto pr-1">
        <ConfiguratorToolbar
          totalKits={totalKits}
          totalMats={totalMats}
          showExport={custoData.materiais.length > 0}
          onClear={clearAll}
          onExportExcel={() => exportMaterialsToExcel(custoData.materiais, custoData)}
          onOpenHistory={() => setShowBudgetHistory(true)}
          onOpenTemplates={() => setShowTemplateManager(true)}
          onOpenManualKits={() => setIsManualKitManagerOpen(true)}
          onOpenPriceManager={() => setIsPriceManagerOpen(true)}
        />

        <CompanySelector
          onCompanyChange={(empresa) => {
            setEmpresaAtiva(empresa);
            calculateTotal({ estruturas, materiaisAvulsos });
          }}
        />

        <PosteSearch
          posteQuery={posteQuery}
          posteResults={posteResults}
          showPosteDropdown={showPosteDropdown}
          posteHighlight={nav.posteHighlight}
          posteInputRef={nav.posteInputRef}
          onSearch={searchPoste}
          onSelect={selectPoste}
          onKeyDown={handlePosteNav}
        />

        <ConductorSelector
          condutorMT={condutorMT}
          condutorBT={condutorBT}
          showMTDropdown={showMTDropdown}
          showBTDropdown={showBTDropdown}
          setCondutorMT={setCondutorMT}
          setCondutorBT={setCondutorBT}
          setShowMTDropdown={setShowMTDropdown}
          setShowBTDropdown={setShowBTDropdown}
          mtHighlight={nav.mtHighlight}
          btHighlight={nav.btHighlight}
          setMtHighlight={nav.setMtHighlight}
          setBtHighlight={nav.setBtHighlight}
          handleMTNav={handleMTNav}
          handleBTNav={handleBTNav}
        />
      </div>

      {/* Área central */}
      <div className="flex-1 flex flex-col bg-gray-50 border-r border-gray-200">
        {activeTab === 'estruturas' ? (
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
        )}
      </div>

      <SummaryFooter
        custoData={custoData}
        condutorMT={condutorMT}
        condutorBT={condutorBT}
        copySummary={copySummary}
        showBudgetHistory={showBudgetHistory}
        setShowBudgetHistory={setShowBudgetHistory}
        estruturas={estruturas}
      />

      <BudgetHistory
        isOpen={showBudgetHistory}
        onClose={() => setShowBudgetHistory(false)}
        onLoad={loadBudget}
        currentData={{ materiais: custoData.materiais, totalGeral: custoData.totalGeral, condutorMT, condutorBT, estruturas, materiaisAvulsos }}
      />

      <TemplateManager
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        onApply={loadTemplate}
        currentData={{ condutorMT, condutorBT, estruturas, materiaisAvulsos }}
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
