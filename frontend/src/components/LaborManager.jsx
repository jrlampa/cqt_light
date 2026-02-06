import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Edit2, Save, X, Plus, Trash2, Upload } from 'lucide-react';

const LaborManager = () => {
  const [labor, setLabor] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabor, setNewLabor] = useState({ codigo_mo: '', descricao: '', unidade: 'UN', preco_bruto: 0 });

  useEffect(() => {
    loadLabor();
  }, []);

  const loadLabor = async () => {
    if (!window.api) return;
    setLoading(true);
    const data = await window.api.getAllLabor();
    setLabor(data || []);
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Search functionality - filter locally for now
      if (searchQuery.trim()) {
        const filtered = labor.filter(l =>
          l.codigo_mo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.descricao?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setLabor(filtered);
      } else {
        loadLabor();
      }
    }
  };

  const startEdit = (item) => {
    setEditingId(item.codigo_mo);
    setEditData({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    if (!window.api) return;
    await window.api.upsertLabor({
      codigoMo: editData.codigo_mo,
      descricao: editData.descricao,
      unidade: editData.unidade,
      precoBruto: editData.preco_bruto
    });
    setEditingId(null);
    setEditData({});
    loadLabor();
  };

  const handleDelete = async (codigoMo) => {
    if (!window.api || !confirm('Excluir este item?')) return;
    await window.api.deleteLabor(codigoMo);
    loadLabor();
  };

  const handleAddNew = async () => {
    if (!window.api || !newLabor.codigo_mo) return;
    await window.api.upsertLabor({
      codigoMo: newLabor.codigo_mo,
      descricao: newLabor.descricao,
      unidade: newLabor.unidade,
      precoBruto: newLabor.preco_bruto
    });
    setNewLabor({ codigo_mo: '', descricao: '', unidade: 'UN', preco_bruto: 0 });
    setShowAddForm(false);
    loadLabor();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-bold text-gray-800">Mão de Obra (Custo Modular)</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Serviço
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200 text-purple-700 text-sm">
          <strong>Nota:</strong> Importe os custos modulares do arquivo XLSM usando o script de seed.
          Os serviços podem ser vinculados aos kits na aba "Kits".
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
            <div className="grid grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Código"
                value={newLabor.codigo_mo}
                onChange={(e) => setNewLabor({ ...newLabor, codigo_mo: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 font-mono"
              />
              <input
                type="text"
                placeholder="Descrição"
                value={newLabor.descricao}
                onChange={(e) => setNewLabor({ ...newLabor, descricao: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 col-span-2"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="UN"
                  value={newLabor.unidade}
                  onChange={(e) => setNewLabor({ ...newLabor, unidade: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-gray-300 w-16"
                />
                <input
                  type="number"
                  placeholder="Preço Bruto"
                  value={newLabor.preco_bruto}
                  onChange={(e) => setNewLabor({ ...newLabor, preco_bruto: parseFloat(e.target.value) || 0 })}
                  className="px-3 py-2 rounded-lg border border-gray-300 flex-1"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAddNew}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2"
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
              placeholder="Buscar por código ou descrição..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
          <button
            onClick={loadLabor}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition"
          >
            Recarregar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {labor.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Descrição</th>
                <th className="px-4 py-3 text-center">Unidade</th>
                <th className="px-4 py-3 text-right">Preço Bruto (R$)</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {labor.map((item) => (
                <tr key={item.codigo_mo} className="hover:bg-gray-50">
                  {editingId === item.codigo_mo ? (
                    <>
                      <td className="px-4 py-2 font-mono text-purple-600">{item.codigo_mo}</td>
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
                          value={editData.preco_bruto || 0}
                          onChange={(e) => setEditData({ ...editData, preco_bruto: parseFloat(e.target.value) || 0 })}
                          className="w-28 px-2 py-1 border rounded text-right"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={saveEdit} className="p-1 text-purple-600 hover:bg-purple-50 rounded">
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
                      <td className="px-4 py-2 font-mono text-purple-600">{item.codigo_mo}</td>
                      <td className="px-4 py-2 text-gray-700">{item.descricao}</td>
                      <td className="px-4 py-2 text-center text-gray-500">{item.unidade}</td>
                      <td className="px-4 py-2 text-right font-medium">{item.preco_bruto?.toFixed(2)}</td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => startEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item.codigo_mo)} className="p-1 text-red-600 hover:bg-red-50 rounded">
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
        ) : (
          <div className="text-center py-16">
            <DollarSign className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">Nenhum Serviço Cadastrado</h3>
            <p className="text-gray-400 mb-4">Use o botão acima para adicionar serviços manualmente.</p>
            <p className="text-gray-400 text-sm">
              Ou importe do arquivo <code className="bg-gray-100 px-2 py-1 rounded">PLANILHA CUSTO MODULAR/*.xlsm</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LaborManager;
