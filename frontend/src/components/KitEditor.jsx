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

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form fields
  const [newKitCode, setNewKitCode] = useState('');
  const [newKitDesc, setNewKitDesc] = useState('');
  const [editKitDesc, setEditKitDesc] = useState('');

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

  // CRUD Handlers
  const handleCreateKit = async () => {
    if (!window.api || !newKitCode.trim() || !newKitDesc.trim()) return;
    try {
      await window.api.createKit({ codigo_kit: newKitCode, descricao_kit: newKitDesc });
      setShowCreateModal(false);
      setNewKitCode('');
      setNewKitDesc('');
      await loadKits();
      // Auto-select the new kit
      const kit = await window.api.getKit(newKitCode);
      if (kit) handleSelectKit(kit);
    } catch (err) {
      alert('Erro ao criar kit: ' + err.message);
    }
  };

  const handleUpdateKit = async () => {
    if (!window.api || !selectedKit || !editKitDesc.trim()) return;
    try {
      await window.api.updateKitMetadata({ codigo_kit: selectedKit.codigo_kit, descricao_kit: editKitDesc });
      setShowEditModal(false);
      // Update local state
      setSelectedKit({ ...selectedKit, descricao_kit: editKitDesc });
      setKits(prev => prev.map(k => k.codigo_kit === selectedKit.codigo_kit ? { ...k, descricao_kit: editKitDesc } : k));
    } catch (err) {
      alert('Erro ao atualizar kit: ' + err.message);
    }
  };

  const handleDeleteKit = async () => {
    if (!window.api || !selectedKit) return;
    try {
      await window.api.deleteKit(selectedKit.codigo_kit);
      setShowDeleteModal(false);
      setSelectedKit(null);
      setComposition([]);
      await loadKits();
    } catch (err) {
      alert('Erro ao excluir kit: ' + err.message);
    }
  };

  // Calculate kit total
  const kitTotal = composition.reduce((sum, c) => sum + (c.subtotal || 0), 0);

  return (
    <>
      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-500" /> Criar Novo Kit
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Código do Kit</label>
                <input
                  type="text"
                  value={newKitCode}
                  onChange={(e) => setNewKitCode(e.target.value.toUpperCase())}
                  placeholder="Ex: SI3"
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Descrição</label>
                <input
                  type="text"
                  value={newKitDesc}
                  onChange={(e) => setNewKitDesc(e.target.value)}
                  placeholder="Ex: Estrutura Simples 3"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
              <button onClick={handleCreateKit} disabled={!newKitCode.trim() || !newKitDesc.trim()} className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed font-semibold">Criar</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedKit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-500" /> Editar Kit
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Código do Kit</label>
                <input
                  type="text"
                  value={selectedKit.codigo_kit}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg font-mono bg-gray-100 text-gray-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Descrição</label>
                <input
                  type="text"
                  value={editKitDesc}
                  onChange={(e) => setEditKitDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
              <button onClick={handleUpdateKit} disabled={!editKitDesc.trim()} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed font-semibold">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedKit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Excluir Kit
            </h3>
            <p className="text-gray-700 mb-3">Tem certeza que deseja excluir o kit <span className="font-mono font-bold text-orange-600">{selectedKit.codigo_kit}</span>?</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Esta ação <strong>não pode ser desfeita</strong>.
              </p>
              {composition.length > 0 && (
                <p className="text-sm text-yellow-800 mt-1">
                  {composition.length} {composition.length === 1 ? 'material será removido' : 'materiais serão removidos'} deste kit.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
              <button onClick={handleDeleteKit} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold">Excluir</button>
            </div>
          </div>
        </div>
      )}

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
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition flex items-center gap-1"
                title="Criar novo kit"
              >
                <Plus className="w-4 h-4" />
              </button>
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
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <span className="font-mono text-xl font-bold text-orange-600">{selectedKit.codigo_kit}</span>
                    <p className="text-gray-600">{selectedKit.descricao_kit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditKitDesc(selectedKit.descricao_kit); setShowEditModal(true); }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Editar kit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Excluir kit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-right ml-4">
                      <span className="text-xs text-gray-500 uppercase">Custo do Kit</span>
                      <p className="text-xl font-bold text-gray-800">
                        R$ {kitTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
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
    </>
  );
};

export default KitEditor;
