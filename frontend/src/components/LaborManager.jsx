import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Edit2, Save, X, Plus } from 'lucide-react';

const LaborManager = () => {
  const [servicos, setServicos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newServico, setNewServico] = useState({ codigo: '', descricao: '', preco_bruto: 0 });

  useEffect(() => { loadServicos(); }, []);

  const loadServicos = async () => {
    if (!window.api) return;
    const data = await window.api.getAllServicos();
    setServicos(data || []);
  };

  const handleSearch = async () => {
    if (!window.api) return;
    if (searchQuery.trim()) {
      const results = await window.api.searchServicos(searchQuery);
      setServicos(results || []);
    } else {
      await loadServicos();
    }
  };

  const startEdit = (item) => { setEditingId(item.codigo); setEditData({ ...item }); };
  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const saveEdit = async () => {
    if (!window.api) return;
    await window.api.upsertServico({ codigo: editData.codigo, descricao: editData.descricao, precoBruto: editData.preco_bruto });
    setEditingId(null);
    handleSearch();
  };

  const handleAddNew = async () => {
    if (!window.api || !newServico.codigo) return;
    await window.api.upsertServico({ codigo: newServico.codigo, descricao: newServico.descricao, precoBruto: newServico.preco_bruto });
    setNewServico({ codigo: '', descricao: '', preco_bruto: 0 });
    setShowAddForm(false);
    loadServicos();
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-bold text-gray-800">Serviços CM</h2>
          </div>
          <button onClick={() => setShowAddForm(!showAddForm)} className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo
          </button>
        </div>

        {showAddForm && (
          <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-200 grid grid-cols-4 gap-3">
            <input type="text" placeholder="Código" value={newServico.codigo} onChange={(e) => setNewServico({ ...newServico, codigo: e.target.value })} className="px-3 py-2 rounded-lg border font-mono" />
            <input type="text" placeholder="Descrição" value={newServico.descricao} onChange={(e) => setNewServico({ ...newServico, descricao: e.target.value })} className="px-3 py-2 rounded-lg border col-span-2" />
            <div className="flex gap-2">
              <input type="number" placeholder="Preço" value={newServico.preco_bruto} onChange={(e) => setNewServico({ ...newServico, preco_bruto: parseFloat(e.target.value) || 0 })} className="px-3 py-2 rounded-lg border flex-1" />
              <button onClick={handleAddNew} className="px-3 py-2 bg-purple-500 text-white rounded-lg"><Save className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Buscar..." className="w-full pl-10 pr-4 py-3 rounded-xl border bg-white/80" />
          </div>
          <button onClick={handleSearch} className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600">Buscar</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {servicos.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr><th className="px-4 py-3 text-left">Código</th><th className="px-4 py-3 text-left">Descrição</th><th className="px-4 py-3 text-right">Preço (R$)</th><th className="px-4 py-3 w-20"></th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {servicos.map((item) => (
                <tr key={item.codigo} className="hover:bg-gray-50">
                  {editingId === item.codigo ? (
                    <>
                      <td className="px-4 py-2 font-mono text-purple-600">{item.codigo}</td>
                      <td className="px-4 py-2"><input type="text" value={editData.descricao || ''} onChange={(e) => setEditData({ ...editData, descricao: e.target.value })} className="w-full px-2 py-1 border rounded" /></td>
                      <td className="px-4 py-2 text-right"><input type="number" value={editData.preco_bruto || 0} onChange={(e) => setEditData({ ...editData, preco_bruto: parseFloat(e.target.value) || 0 })} className="w-28 px-2 py-1 border rounded text-right" /></td>
                      <td className="px-4 py-2 flex gap-1"><button onClick={saveEdit} className="p-1 text-green-600"><Save className="w-4 h-4" /></button><button onClick={cancelEdit} className="p-1 text-red-600"><X className="w-4 h-4" /></button></td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 font-mono text-purple-600 font-medium">{item.codigo}</td>
                      <td className="px-4 py-2 text-gray-700">{item.descricao}</td>
                      <td className="px-4 py-2 text-right font-bold">{item.preco_bruto?.toFixed(2)}</td>
                      <td className="px-4 py-2"><button onClick={() => startEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button></td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16"><DollarSign className="w-16 h-16 mx-auto text-gray-300 mb-4" /><p className="text-gray-400">Nenhum serviço encontrado</p></div>
        )}
        <div className="px-4 py-3 bg-gray-50 text-sm text-gray-500 border-t">{servicos.length} serviços</div>
      </div>
    </div>
  );
};

export default LaborManager;
