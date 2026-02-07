import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Package, Search, DollarSign } from 'lucide-react';

export const KitDetailsModal = ({ isOpen, onClose, kit, onSaveMateriais }) => {
  const [materiaisPadrao, setMateriaisPadrao] = useState([]);
  const [materiaisExtras, setMateriaisExtras] = useState(kit?.materiaisExtras || []);
  const [loading, setLoading] = useState(false);

  // Material search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (isOpen && kit) {
      loadKitComposition();
      setMateriaisExtras(kit.materiaisExtras || []);
    }
  }, [isOpen, kit]);

  const loadKitComposition = async () => {
    if (!window.api || !kit) return;
    setLoading(true);
    try {
      const composicao = await window.api.getKitComposition(kit.codigo_kit);
      setMateriaisPadrao(composicao || []);
    } catch (err) {
      console.error('Failed to load kit composition:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchMaterial = async (query) => {
    setSearchQuery(query);
    if (!window.api || !query.trim()) { setSearchResults([]); return; }
    const results = await window.api.searchMaterials(query);
    setSearchResults((results || []).slice(0, 10));
  };

  const addMaterialExtra = (material) => {
    const newMaterial = {
      sap: material.sap,
      descricao: material.descricao,
      unidade: material.unidade,
      preco_unitario: material.preco_unitario,
      quantidade: qty,
      subtotal: qty * material.preco_unitario
    };
    setMateriaisExtras(prev => [...prev, newMaterial]);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    setQty(1);
  };

  const removeMaterialExtra = (index) => {
    setMateriaisExtras(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSaveMateriais(materiaisExtras);
    onClose();
  };

  const custoMaterialPadrao = materiaisPadrao.reduce((sum, m) => sum + (m.subtotal || 0), 0);
  const custoMateriaisExtras = materiaisExtras.reduce((sum, m) => sum + (m.subtotal || 0), 0);
  const custoTotalMateriais = custoMaterialPadrao + custoMateriaisExtras;
  const custoServico = kit?.custo_servico || 0;
  const custoTotalKit = custoTotalMateriais + custoServico;

  if (!isOpen || !kit) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80]" onClick={onClose}>
      <div className="bg-white rounded-2xl w-[700px] max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 font-bold text-lg flex items-center justify-center border-2 border-blue-200">
                {kit.codigo_kit}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Detalhes do Kit</h2>
                <p className="text-sm text-gray-600">{kit.descricao_kit}</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Materiais Padrão */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              Materiais Padrão do Kit ({materiaisPadrao.length})
            </h3>
            {loading ? (
              <p className="text-sm text-gray-400 italic">Carregando...</p>
            ) : materiaisPadrao.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Nenhum material cadastrado</p>
            ) : (
              <div className="space-y-2">
                {materiaisPadrao.map((mat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm">
                    <div className="flex-1">
                      <span className="font-mono font-bold text-blue-600 text-xs">{mat.sap}</span>
                      <p className="text-gray-700">{mat.descricao}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>{mat.quantidade} {mat.unidade}</span>
                      <span className="font-bold">R$ {(mat.subtotal || 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Materiais Extras */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-500" />
                Materiais Extras ({materiaisExtras.length})
              </h3>
              <button
                onClick={() => setShowSearch(true)}
                className="px-3 py-1.5 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 transition flex items-center gap-2"
              >
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </div>

            {materiaisExtras.length === 0 ? (
              <p className="text-sm text-gray-400 italic text-center py-4 bg-gray-50 rounded-lg">
                Nenhum material extra adicionado
              </p>
            ) : (
              <div className="space-y-2">
                {materiaisExtras.map((mat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-purple-50 border border-purple-100 rounded-lg text-sm group">
                    <div className="flex-1">
                      <span className="font-mono font-bold text-purple-600 text-xs">{mat.sap}</span>
                      <p className="text-gray-700">{mat.descricao}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>{mat.quantidade} {mat.unidade}</span>
                      <span className="font-bold">R$ {(mat.subtotal || 0).toFixed(2)}</span>
                      <button
                        onClick={() => removeMaterialExtra(idx)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Material Search Modal */}
          {showSearch && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90]" onClick={() => setShowSearch(false)}>
              <div className="bg-white rounded-2xl p-6 w-[500px] shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg mb-4">Buscar Material</h3>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => searchMaterial(e.target.value)}
                    placeholder="Digite SAP ou descrição..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                    autoFocus
                  />
                </div>

                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Quantidade</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={qty}
                    onChange={(e) => setQty(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {searchResults.map((mat) => (
                      <button
                        key={mat.sap}
                        onClick={() => addMaterialExtra(mat)}
                        className="w-full text-left p-3 hover:bg-purple-50 rounded-lg transition text-sm border border-transparent hover:border-purple-200"
                      >
                        <span className="font-mono font-bold text-purple-600 text-xs block">{mat.sap}</span>
                        <span className="text-gray-700">{mat.descricao}</span>
                        <span className="text-xs text-gray-500 block">R$ {mat.preco_unitario.toFixed(2)}/{mat.unidade}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-gray-700">Resumo de Custos</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Materiais Padrão:</span>
                <span className="font-semibold">R$ {custoMaterialPadrao.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Materiais Extras:</span>
                <span className="font-semibold text-purple-600">R$ {custoMateriaisExtras.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Serviço (M.O.):</span>
                <span className="font-semibold">R$ {custoServico.toFixed(2)}</span>
              </div>
              <div className="border-t border-emerald-300 pt-2 mt-2 flex justify-between">
                <span className="font-bold text-gray-800">Total do Kit:</span>
                <span className="font-bold text-lg text-emerald-600">R$ {custoTotalKit.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 italic mt-2">
                * Valores multiplicados pela quantidade ({kit.quantidade} un) no cálculo final
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-2 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition text-sm font-semibold"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};
