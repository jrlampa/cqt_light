import React from 'react';
import { Calculator, FolderOpen, LayoutTemplate, Trash2, Save, FileText, Download, Zap, DollarSign, Package, ShieldCheck, AlertOctagon } from 'lucide-react';

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
import AuditReport from './AuditReport';
import BudgetIntelligence from './BudgetIntelligence';
import { QuantityModal } from './configurator/QuantityModal';

// Utils & Hook
import { exportMaterialsToExcel } from '../utils/excelExporter';
import { useConfigurator } from './configurator/useConfigurator';
import { CONDUTORES_MT, CONDUTORES_BT } from './configurator/ConductorData';

const Configurator = ({ onStateChange }) => {
  const { state, handlers, nav } = useConfigurator(onStateChange);

  return (
    <div className="h-full flex gap-4 relative">
      {/* Quantity Popup (Extracted) */}
      <QuantityModal
        isOpen={state.showQtyPopup}
        item={state.pendingItem}
        type={state.pendingType}
        qty={state.qty}
        setQty={state.setQty}
        onConfirm={handlers.confirmAddItem}
        onCancel={() => state.setShowQtyPopup(false)}
        nav={nav}
      />

      <ManualKitManager
        isOpen={state.isManualKitManagerOpen}
        onClose={() => state.setIsManualKitManagerOpen(false)}
      />

      <PriceManager
        isOpen={state.isPriceManagerOpen}
        onClose={() => state.setIsPriceManagerOpen(false)}
      />

      {/* Left Panel */}
      <div className="w-72 flex flex-col gap-2 overflow-y-auto pr-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-500" />
            <h2 className="font-bold text-gray-800 text-sm">Configurador</h2>
            <button
              onClick={() => state.setShowBudgetHistory(true)}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition ml-1"
              title="Histórico de Orçamentos"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
            <button
              onClick={() => state.setShowAssistant(!state.showAssistant)}
              className={`p-1 rounded-lg transition ml-1 ${state.showAssistant ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500 hover:text-blue-600'}`}
              title="Alternar Assistente de Projeto"
            >
              <Zap className="w-4 h-4" />
            </button>
            <button
              onClick={() => state.setShowTemplateManager(true)}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-purple-600 transition ml-1"
              title="Gerenciar Templates"
            >
              <LayoutTemplate className="w-4 h-4" />
            </button>
            <button
              onClick={() => state.setIsManualKitManagerOpen(true)}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Package className="w-4 h-4" /> Gerenciar Kits
            </button>
            <button
              onClick={() => state.setIsPriceManagerOpen(true)}
              className="px-4 py-2 border border-blue-200 bg-blue-50 rounded-xl hover:bg-blue-100 text-blue-700 text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <DollarSign className="w-4 h-4" /> Gestão de Preços
            </button>
          </div>
        </div>

        <CompanySelector
          onCompanyChange={(empresa) => {
            state.setEmpresaAtiva(empresa);
            handlers.onCalculate();
          }}
        />

        {state.showAssistant && (
          <div className="flex-1 mt-2">
            <BudgetIntelligence
              data={state.custoData}
              structures={state.estruturas}
              materialsAvulsos={state.materiaisAvulsos}
              engineeringReport={state.engineeringReport}
              condutorMT={state.condutorMT}
              onApplyOptimization={handlers.applyOptimization}
              onGenerateMemorial={handlers.handleGenerateMemorial}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handlers.clearAll}
            disabled={state.estruturas.length === 0 && state.materiaisAvulsos.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Trash2 className="w-3 h-3" /> Limpar
          </button>
          <button
            onClick={() => alert('Salvar como Kit - Em breve!')}
            disabled={state.estruturas.length === 0 && state.materiaisAvulsos.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Save className="w-3 h-3" /> Kit
          </button>
          <button
            onClick={() => alert('Relatório PDF - Em breve!')}
            disabled={state.estruturas.length === 0 && state.materiaisAvulsos.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <FileText className="w-3 h-3" /> Relatório
          </button>
        </div>

        {state.custoData.materiais.length > 0 && (
          <button
            onClick={() => exportMaterialsToExcel(state.custoData.materiais, state.custoData)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 transition"
          >
            <Download className="w-3 h-3" /> Exportar Excel
          </button>
        )}

        {/* Engineering Alert */}
        {state.engineeringReport && state.engineeringReport.status !== 'SAFE' && (
          <div className={`mt-2 p-3 rounded-xl border flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 ${state.engineeringReport.status === 'CRITICAL' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
            <div className="flex items-center gap-3">
              <AlertOctagon className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest">Engineering Alert ({state.engineeringReport.status})</p>
                <p className="text-[11px] font-medium leading-tight">{state.engineeringReport.recommendation}</p>
              </div>
            </div>
            {state.engineeringReport.status === 'CRITICAL' && (
              <button
                onClick={handlers.applyEngineeringFix}
                className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition"
              >
                Auto-Corrigir Estrutura (SotA Fix)
              </button>
            )}
          </div>
        )}

        <button
          onClick={handlers.runAudit}
          className="w-full flex items-center justify-center gap-2 px-3 py-3 mt-2 text-sm rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 text-white font-bold hover:from-teal-700 hover:to-blue-700 transition shadow-lg shadow-teal-500/20"
        >
          <ShieldCheck className="w-5 h-5" /> Auditar Projeto
        </button>

        <button
          onClick={() => {
            const kitCode = state.condutorMT.label.includes('Spacer') ? 'K-ZENITH-COMP' : 'K-ZENITH-CONV';
            const kit = { id: Date.now(), codigo_kit: kitCode, descricao_kit: 'KIT AUTO-SUGERIDO', quantidade: 1, tipo: 'auto' };
            state.setEstruturas(prev => [kit, ...prev]);
            alert('🚀 Smart Spec: Materiais otimizados adicionados com sucesso!');
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-3 mt-2 text-sm rounded-xl border-2 border-dashed border-blue-400 text-blue-600 font-black hover:bg-blue-50 transition"
        >
          <Zap className="w-4 h-4" /> Smart Spec (Auto-Fill)
        </button>

        {/* Poste Search */}
        <div className="relative">
          <label htmlFor="poste-search" className="text-xs text-gray-700 uppercase font-bold">Poste (adiciona aos materiais)</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="poste-search"
              ref={nav.posteInputRef}
              type="text"
              value={state.posteQuery}
              onChange={(e) => handlers.searchPoste(e.target.value)}
              onKeyDown={(e) => {
                if (!state.showPosteDropdown || state.posteResults.length === 0) return;
                if (e.key === 'ArrowDown') { e.preventDefault(); nav.setPosteHighlight(prev => Math.min(prev + 1, state.posteResults.length - 1)); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); nav.setPosteHighlight(prev => Math.max(prev - 1, 0)); }
                else if (e.key === 'Enter') { e.preventDefault(); handlers.openQtyPopup(state.posteResults[nav.posteHighlight], 'material'); }
              }}
              placeholder="Buscar poste..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition"
            />
          </div>
          {state.showPosteDropdown && state.posteResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border max-h-32 overflow-y-auto">
              {state.posteResults.map((mat, idx) => (
                <button
                  key={mat.sap}
                  onMouseDown={(e) => { e.preventDefault(); handlers.openQtyPopup(mat, 'material'); }}
                  className={`w-full text-left px-2 py-1.5 text-xs flex gap-2 ${idx === nav.posteHighlight ? 'bg-green-100' : 'hover:bg-gray-50'}`}
                >
                  <span className="font-mono font-bold text-green-600">{mat.sap}</span>
                  <span className="text-gray-700 truncate text-[10px]">{mat.descricao}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conductors Selection */}
        <div className="grid grid-cols-2 gap-2">
          {/* MT */}
          <div className="relative">
            <label className="text-[10px] text-gray-700 uppercase font-bold flex items-center gap-1"><Zap className="w-3 h-3 text-orange-500" /> MT</label>
            <button
              onClick={() => { nav.setMtHighlight(0); state.setShowMTDropdown(!state.showMTDropdown); }}
              className="w-full text-left px-2 py-1.5 bg-orange-50 border border-orange-100 rounded-lg text-xs font-medium text-orange-700 truncate"
            >
              {state.condutorMT.label}
            </button>
            {state.showMTDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border max-h-40 overflow-y-auto">
                <div className="p-1 space-y-0.5">
                  {CONDUTORES_MT.map((c, idx) => (
                    <button key={c.id} onClick={() => { state.setCondutorMT(c); state.setShowMTDropdown(false); }} className={`w-full text-left px-2 py-1.5 text-xs text-gray-700 rounded ${idx === nav.mtHighlight ? 'bg-orange-100' : 'hover:bg-orange-50'}`}>{c.label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* BT */}
          <div className="relative">
            <label className="text-[10px] text-gray-700 uppercase font-bold flex items-center gap-1"><Zap className="w-3 h-3 text-blue-500" /> BT</label>
            <button
              onClick={() => { nav.setBtHighlight(0); state.setShowBTDropdown(!state.showBTDropdown); }}
              className="w-full text-left px-2 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs font-medium text-blue-700 truncate"
            >
              {state.condutorBT.label}
            </button>
            {state.showBTDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border max-h-40 overflow-y-auto">
                <div className="p-1 space-y-0.5">
                  {CONDUTORES_BT.map((c, idx) => (
                    <button key={c.id} onClick={() => { state.setCondutorBT(c); state.setShowBTDropdown(false); }} className={`w-full text-left px-2 py-1.5 text-xs text-gray-700 rounded ${idx === nav.btHighlight ? 'bg-blue-100' : 'hover:bg-blue-50'}`}>{c.label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-gray-50 border-r border-gray-200">
        {state.activeTab === 'estruturas' ? (
          <StructureList
            estruturas={state.estruturas}
            activeTab={state.activeTab}
            setActiveTab={state.setActiveTab}
            searchStructure={handlers.searchStructure}
            structureQuery={state.structureQuery}
            structureResults={state.structureResults}
            showStructureDropdown={state.showStructureDropdown}
            structureHighlight={nav.structureHighlight}
            handleStructureKeyDown={(e) => {
              if (!state.showStructureDropdown || state.structureResults.length === 0) return;
              if (e.key === 'ArrowDown') { e.preventDefault(); nav.setStructureHighlight(prev => Math.min(prev + 1, state.structureResults.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); nav.setStructureHighlight(prev => Math.max(prev - 1, 0)); }
              else if (e.key === 'Enter') { e.preventDefault(); handlers.openQtyPopup(state.structureResults[nav.structureHighlight], 'structure'); }
            }}
            selectStructure={(item) => handlers.openQtyPopup(item, 'structure')}
            removeStructure={handlers.removeStructure}
            onKitClick={handlers.openKitDetails}
            structureRef={nav.structureRef}
            setStructureQuery={state.setStructureQuery}
            setShowStructureDropdown={state.setShowStructureDropdown}
            setStructureHighlight={nav.setStructureHighlight}
          />
        ) : (
          <MaterialList
            materiaisAvulsos={state.materiaisAvulsos}
            activeTab={state.activeTab}
            setActiveTab={state.setActiveTab}
            searchMaterial={handlers.searchMaterial}
            materialQuery={state.materialQuery}
            materialResults={state.materialResults}
            showMaterialDropdown={state.showMaterialDropdown}
            materialHighlight={nav.materialHighlight}
            handleMaterialKeyDown={(e) => {
              if (!state.showMaterialDropdown || state.materialResults.length === 0) return;
              if (e.key === 'ArrowDown') { e.preventDefault(); nav.setMaterialHighlight(prev => Math.min(prev + 1, state.materialResults.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); nav.setMaterialHighlight(prev => Math.max(prev - 1, 0)); }
              else if (e.key === 'Enter') { e.preventDefault(); handlers.openQtyPopup(state.materialResults[nav.materialHighlight], 'material'); }
            }}
            selectMaterial={(item) => handlers.openQtyPopup(item, 'material')}
            removeMaterial={handlers.removeMaterial}
            materialRef={nav.materialRef}
            setMaterialQuery={state.setMaterialQuery}
            setShowMaterialDropdown={state.setShowMaterialDropdown}
            setMaterialHighlight={nav.setMaterialHighlight}
          />
        )}
      </div>

      <SummaryFooter
        custoData={state.custoData}
        condutorMT={state.condutorMT}
        condutorBT={state.condutorBT}
        copySummary={handlers.copySummary}
        showBudgetHistory={state.showBudgetHistory}
        setShowBudgetHistory={state.setShowBudgetHistory}
        estruturas={state.estruturas}
      />

      {/* Modals */}
      <BudgetHistory
        isOpen={state.showBudgetHistory}
        onClose={() => state.setShowBudgetHistory(false)}
        onLoad={handlers.loadBudget}
        currentData={{ ...state, materiais: state.custoData.materiais, totalGeral: state.custoData.totalGeral }}
      />
      <TemplateManager
        isOpen={state.showTemplateManager}
        onClose={() => state.setShowTemplateManager(false)}
        onApply={handlers.loadTemplate}
        currentData={state}
      />
      <KitDetailsModal
        isOpen={state.showKitDetails}
        onClose={() => state.setShowKitDetails(false)}
        kit={state.selectedKit}
        onSaveMateriais={handlers.updateKitMateriais}
      />
      <PriceManagementModal
        isOpen={state.showPriceManagement}
        onClose={() => state.setShowPriceManagement(false)}
        empresaAtiva={state.empresaAtiva}
      />
      <KitResolutionModal
        isOpen={state.showResolutionModal}
        onClose={() => state.setShowResolutionModal(false)}
        kit={state.pendingResolutionKit}
        materials={state.pendingResolutionMaterials}
        onConfirm={handlers.handleResolutionConfirm}
      />
      <AuditReport
        isOpen={state.showAuditReport}
        onClose={() => state.setShowAuditReport(false)}
        report={state.auditResults}
        isLoading={state.isAuditing}
      />
    </div>
  );
};

export default Configurator;
