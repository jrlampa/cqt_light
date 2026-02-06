import React, { useState, useEffect } from 'react';
import { Wrench, Search, Plus, Trash2, Package, Layers, Edit2 } from 'lucide-react';

const KitEditor = () => {
  const [kits, setKits] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKit, setSelectedKit] = useState(null);
  const [composition, setComposition] = useState([]);
  const [loading, setLoading] = useState(false);

  // Material search for adding to kit
  const [materialQuery, setMaterialQuery] = useState('');
  const [materialResults, setMaterialResults] = useState([]);

  useEffect(() => {
    loadKits();
  }, []);

  const loadKits = async () => {
    if (!window.api) return;
    setLoading(true);
    const data = await window.api.getAllKits();
    setKits(data?.slice(0, 100) || []);
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!window.api) return;
    if (searchQuery.trim()) {
      const results = await window.api.searchKits(searchQuery);
      setKits(results || []);
    } else {
      await loadKits();
    }
  };

  const handleSelectKit = async (kit) => {
    if (!window.api) return;
    setSelectedKit(kit);
    const comp = await window.api.getKitComposition(kit.codigo_kit);
    setComposition(comp || []);
  };

  const handleSearchMaterial = async (query) => {
    setMaterialQuery(query);
    if (!window.api || !query.trim()) {
      setMaterialResults([]);
      return;
    }
    const results = await window.api.searchMaterials(query);
    setMaterialResults(results?.slice(0, 10) || []);
  };

  const handleAddMaterial = async (sap) => {
    if (!window.api || !selectedKit) return;
    await window.api.addMaterialToKit({
      codigoKit: selectedKit.codigo_kit,
      sap: sap,
      quantidade: 1
    });
    setMaterialQuery('');
    setMaterialResults([]);
    // Reload composition
    const comp = await window.api.getKitComposition(selectedKit.codigo_kit);
    setComposition(comp || []);
  };

  const handleUpdateQty = async (id, qty) => {
    if (!window.api) return;
    await window.api.updateKitMaterialQty({ id, quantidade: parseFloat(qty) || 0 });
    // Reload composition
    const comp = await window.api.getKitComposition(selectedKit.codigo_kit);
    setComposition(comp || []);
  };

  const handleRemoveMaterial = async (id) => {
    if (!window.api) return;
    await window.api.removeMaterialFromKit(id);
    // Reload composition
    const comp = await window.api.getKitComposition(selectedKit.codigo_kit);
    setComposition(comp || []);
  };

  // Calculate kit total
  const kitTotal = composition.reduce((sum, c) => sum + (c.subtotal || 0), 0);

  return (
    <div className="flex gap-6 h-[calc(100vh-12rem)]">
      {/* Kit List */}
      <div className="w-1/3 glass-panel rounded-2xl flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Wrench className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-gray-800">Kits</h2>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Buscar kits..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white/80 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {kits.map((kit) => (
            <button
              key={kit.codigo_kit}
              onClick={() => handleSelectKit(kit)}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${selectedKit?.codigo_kit === kit.codigo_kit ? 'bg-orange-50' : ''
                }`}
            >
              <span className="font-mono font-bold text-orange-600">{kit.codigo_kit}</span>
              <p className="text-sm text-gray-600 truncate">{kit.descricao_kit}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Kit Detail */}
      <div className="flex-1 glass-panel rounded-2xl flex flex-col">
        {selectedKit ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xl font-bold text-orange-600">{selectedKit.codigo_kit}</span>
                  <p className="text-gray-600">{selectedKit.descricao_kit}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 uppercase">Custo do Kit</span>
                  <p className="text-xl font-bold text-gray-800">
                    R$ {kitTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Add Material */}
              <div className="relative mt-4">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={materialQuery}
                  onChange={(e) => handleSearchMaterial(e.target.value)}
                  placeholder="Adicionar material (buscar por SAP ou descrição)..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white/80 text-sm"
                />
                {materialResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-xl border max-h-48 overflow-y-auto">
                    {materialResults.map((mat) => (
                      <button
                        key={mat.sap}
                        onClick={() => handleAddMaterial(mat.sap)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2 text-sm"
                      >
                        <span className="font-mono text-blue-600">{mat.sap}</span>
                        <span className="text-gray-600 truncate flex-1">{mat.descricao}</span>
                        <Plus className="w-4 h-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Composition Table */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left">SAP</th>
                    <th className="px-4 py-3 text-left">Descrição</th>
                    <th className="px-4 py-3 text-center">Un</th>
                    <th className="px-4 py-3 text-right w-24">Qtd</th>
                    <th className="px-4 py-3 text-right">Unit (R$)</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {composition.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-blue-600">{item.sap}</td>
                      <td className="px-4 py-2 text-gray-700 truncate max-w-xs">{item.descricao}</td>
                      <td className="px-4 py-2 text-center text-gray-500">{item.unidade}</td>
                      <td className="px-4 py-2 text-right">
                        <input
                          type="number"
                          value={item.quantidade}
                          onChange={(e) => handleUpdateQty(item.id, e.target.value)}
                          className="w-20 px-2 py-1 border rounded text-right text-sm"
                          step="0.01"
                        />
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600">{item.preco_unitario?.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-medium">{item.subtotal?.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleRemoveMaterial(item.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {composition.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Nenhum material neste kit.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Wrench className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Selecione um kit para editar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KitEditor;
