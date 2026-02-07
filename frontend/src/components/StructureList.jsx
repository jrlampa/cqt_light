import React from 'react';
import { Layers, Search, Plus, Trash2, Zap, X } from 'lucide-react';

export const StructureList = ({
  estruturas,
  activeTab,
  setActiveTab,
  searchStructure,
  structureQuery,
  structureResults,
  showStructureDropdown,
  structureHighlight,
  handleStructureKeyDown,
  selectStructure,
  removeStructure,
  structureRef,
  setStructureQuery,
  setShowStructureDropdown,
  setStructureHighlight,
  structureInputRef
}) => {
  return (
    <div className="flex-1 flex flex-col bg-gray-50 border-r border-gray-200">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab('estruturas')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'estruturas' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Layers className="w-4 h-4" />
          Estruturas / Kits
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Search */}
        <div className="relative mb-4">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Adicionar Estrutura (Ctrl+F)</label>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition" />
            <input
              ref={structureRef}
              type="text"
              value={structureQuery}
              onChange={(e) => searchStructure(e.target.value)}
              onKeyDown={handleStructureKeyDown}
              placeholder="Digite o código da estrutura..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition shadow-sm"
            />
          </div>

          {/* Dropdown */}
          {showStructureDropdown && structureResults.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
              {structureResults.map((kit, idx) => (
                <button
                  key={kit.codigo_kit}
                  onMouseDown={(e) => { e.preventDefault(); selectStructure(kit); }}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition flex items-center gap-3 ${idx === structureHighlight ? 'bg-blue-50' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm ${idx === structureHighlight ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {kit.codigo_kit}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-800 line-clamp-1">{kit.descricao_kit}</span>
                    <span className="text-xs text-gray-500">Valor Serviço: R$ {(kit.custo_servico || 0).toFixed(2)}</span>
                  </div>
                  <Plus className={`w-4 h-4 ml-auto ${idx === structureHighlight ? 'text-blue-500' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {estruturas.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
              <Layers className="w-12 h-12 mb-2" />
              <p className="text-sm">Nenhuma estrutura adicionada</p>
            </div>
          ) : (
            estruturas.map((est) => (
              <div key={est.id} className="group flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-100">
                    {est.codigo_kit}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm line-clamp-1" title={est.descricao_kit}>{est.descricao_kit}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{est.quantidade} un</span>
                      <span>R$ {(est.preco_kit || 0).toFixed(2)}/un</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-700 text-sm">R$ {((est.quantidade || 1) * (est.preco_kit || 0)).toFixed(2)}</span>
                  <button
                    onClick={() => removeStructure(est.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
