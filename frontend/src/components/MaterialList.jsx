import React from 'react';
import { Package, Search, Plus, Trash2, Pencil } from 'lucide-react';

export const MaterialList = ({
  materiaisAvulsos,
  activeTab,
  setActiveTab,
  searchMaterial,
  materialQuery,
  materialResults,
  showMaterialDropdown,
  materialHighlight,
  handleMaterialKeyDown,
  selectMaterial, // This handles opening the qty popup for materials
  removeMaterial,
  materialRef,
  setMaterialQuery,
  setShowMaterialDropdown,
  setMaterialHighlight
}) => {
  if (activeTab !== 'materiais') return null;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 border-r border-gray-200">
      {/* List Header/Tabs (Using same style as StructureList for seamless switch if needed, currently conditional render in parent) */}
      {/* This logic assumes parent handles visibility or passes activeTab */}

      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Search */}
        <div className="relative mb-4">
          <label className="text-xs font-semibold text-gray-600 mb-2 block">Adicionar Material Avulso (Ctrl+M)</label>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-purple-500 transition" />
            <input
              ref={materialRef}
              type="text"
              value={materialQuery}
              onChange={(e) => searchMaterial(e.target.value)}
              onKeyDown={handleMaterialKeyDown}
              placeholder="Digite o código ou descrição..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-50/50 outline-none transition shadow-sm"
            />
          </div>

          {/* Dropdown */}
          {showMaterialDropdown && materialResults.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
              {materialResults.map((mat, idx) => (
                <button
                  key={mat.sap}
                  onMouseDown={(e) => { e.preventDefault(); selectMaterial(mat); }}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition flex items-center gap-3 ${idx === materialHighlight ? 'bg-purple-50' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${idx === materialHighlight ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {mat.sap}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-800 line-clamp-1">{mat.descricao}</span>
                    <span className="text-xs text-gray-500">{mat.unidade} - R$ {(mat.preco_unitario || 0).toFixed(2)}</span>
                  </div>
                  <Plus className={`w-4 h-4 ml-auto ${idx === materialHighlight ? 'text-purple-500' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {materiaisAvulsos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
              <Package className="w-12 h-12 mb-2" />
              <p className="text-sm">Nenhum material avulso</p>
            </div>
          ) : (
            materiaisAvulsos.map((mat) => (
              <div key={mat.id} className="group flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 font-bold text-xs flex items-center justify-center border border-purple-100">
                    {mat.sap}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm line-clamp-1" title={mat.descricao}>{mat.descricao}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{mat.quantidade} {mat.unidade}</span>
                      <span>R$ {(mat.preco_unitario || 0).toFixed(2)}/un</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-700 text-sm">R$ {((mat.quantidade || 1) * (mat.preco_unitario || 0)).toFixed(2)}</span>
                  <button
                    onClick={() => removeMaterial(mat.id)}
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
