import React, { useState, useEffect } from 'react';
import { Layers, Search, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';

const MaterialManager = () => {
  const [materials, setMaterials] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ sap: '', descricao: '', unidade: 'UN', preco_unitario: 0 });

  // Load materials on mount
  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    if (!window.api) return;
    setLoading(true);
    const data = await window.api.getAllMaterials();
    setMaterials(data?.slice(0, 100) || []); // Limit for performance
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!window.api) return;
    setLoading(true);
    if (searchQuery.trim()) {
      const results = await window.api.searchMaterials(searchQuery);
      setMaterials(results || []);
    } else {
      await loadMaterials();
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const startEdit = (mat) => {
    setEditingId(mat.sap);
    setEditData({ ...mat });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    if (!window.api) return;
    await window.api.upsertMaterial(editData);
    setEditingId(null);
    setEditData({});
    handleSearch();
  };

  const handleDelete = async (sap) => {
    if (!window.api || !confirm('Excluir este material?')) return;
    await window.api.deleteMaterial(sap);
    handleSearch();
  };

  const handleAddNew = async () => {
    if (!window.api || !newMaterial.sap) return;
    await window.api.upsertMaterial(newMaterial);
    setNewMaterial({ sap: '', descricao: '', unidade: 'UN', preco_unitario: 0 });
    setShowAddForm(false);
    handleSearch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-emerald-500" />
            <h2 className="text-xl font-bold text-gray-800">Gerenciar Materiais</h2>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Material
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="mb-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="grid grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="SAP"
                value={newMaterial.sap}
                onChange={(e) => setNewMaterial({ ...newMaterial, sap: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 font-mono"
              />
              <input
                type="text"
                placeholder="Descrição"
                value={newMaterial.descricao}
                onChange={(e) => setNewMaterial({ ...newMaterial, descricao: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 col-span-2"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="UN"
                  value={newMaterial.unidade}
                  onChange={(e) => setNewMaterial({ ...newMaterial, unidade: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-gray-300 w-16"
                />
                <input
                  type="number"
                  placeholder="Preço"
                  value={newMaterial.preco_unitario}
                  onChange={(e) => setNewMaterial({ ...newMaterial, preco_unitario: parseFloat(e.target.value) || 0 })}
                  className="px-3 py-2 rounded-lg border border-gray-300 flex-1"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAddNew}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar por SAP ou descrição..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">SAP</th>
              <th className="px-4 py-3 text-left">Descrição</th>
              <th className="px-4 py-3 text-center">Unidade</th>
              <th className="px-4 py-3 text-right">Preço (R$)</th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {materials.map((mat) => (
              <tr key={mat.sap} className="hover:bg-gray-50">
                {editingId === mat.sap ? (
                  <>
                    <td className="px-4 py-2 font-mono text-blue-600">{mat.sap}</td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={editData.descricao || ''}
                        onChange={(e) => setEditData({ ...editData, descricao: e.target.value })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="text"
                        value={editData.unidade || ''}
                        onChange={(e) => setEditData({ ...editData, unidade: e.target.value })}
                        className="w-16 px-2 py-1 border rounded text-center"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        value={editData.preco_unitario || 0}
                        onChange={(e) => setEditData({ ...editData, preco_unitario: parseFloat(e.target.value) || 0 })}
                        className="w-24 px-2 py-1 border rounded text-right"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={saveEdit} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                          <Save className="w-4 h-4" />
                        </button>
                        <button onClick={cancelEdit} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 font-mono text-blue-600">{mat.sap}</td>
                    <td className="px-4 py-2 text-gray-700 truncate max-w-md">{mat.descricao}</td>
                    <td className="px-4 py-2 text-center text-gray-500">{mat.unidade}</td>
                    <td className="px-4 py-2 text-right font-medium">{mat.preco_unitario?.toFixed(2)}</td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => startEdit(mat)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(mat.sap)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 bg-gray-50 text-sm text-gray-500 border-t">
          Mostrando {materials.length} materiais • Total no banco: 26.636
        </div>
      </div>
    </div>
  );
};

export default MaterialManager;
