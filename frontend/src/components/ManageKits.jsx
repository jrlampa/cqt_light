import React, { useState, useEffect } from 'react';
import { Save, Trash2, Plus, Edit2, Search } from 'lucide-react';

const ManageKits = () => {
  const [kitCodes, setKitCodes] = useState([]);
  const [selectedKit, setSelectedKit] = useState('');
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState('');

  const loadKitCodes = async () => {
    if (!window.api) return;
    const codes = await window.api.getAllKitCodes();
    setKitCodes(codes || []);
  };

  const loadComposition = async (code) => {
    if (!window.api) return;
    const data = await window.api.getKitDetails(code);
    setItems(data || []);
  };

  const handleUpdateQty = async (id) => {
    if (!window.api) return;
    await window.api.updateKitItem(id, parseFloat(editQty));
    setEditingId(null);
    loadComposition(selectedKit);
  };

  useEffect(() => {
    loadKitCodes();
  }, []);

  useEffect(() => {
    if (selectedKit) loadComposition(selectedKit);
  }, [selectedKit]);

  const handleDelete = async (id) => {
    if (!window.api) return;
    if (confirm('Remover este item do kit?')) {
      await window.api.deleteKitItem(id);
      loadComposition(selectedKit);
    }
  };

  // Note: We need a backend method to ADD items too. 
  // Assuming 'addKitItem' exists in backend from previous step (I added it to database.js but maybe not exposed in main/preload completely?)
  // Let's check logic. I added `addKitItem` to `database.js` in Step 156.
  // Did I add to main.js? No. I added update/delete in Step 157.
  // I need to add 'add-kit-item' to main/preload if I want extensive CRUD.
  // For now, I'll implement the UI and then patch main/preload.

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <header className="flex justify-between items-end border-b border-white/10 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Composições de Kits</h2>
          <p className="text-gray-400">Gerencie os materiais associados a cada estrutura.</p>
        </div>

        <div className="w-72">
          <label className="block text-xs text-cyan-400 mb-1 font-semibold uppercase">Selecione o Kit/Estrutura</label>
          <select
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            value={selectedKit}
            onChange={(e) => setSelectedKit(e.target.value)}
          >
            <option value="">Selecione...</option>
            {kitCodes.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur-md">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-black/20 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-6 py-4">Código SAP</th>
              <th className="px-6 py-4">Descrição Material</th>
              <th className="px-6 py-4 text-center">Unidade</th>
              <th className="px-6 py-4 text-center">Quantidade</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-white/5 transition">
                <td className="px-6 py-4 font-mono text-cyan-300">{item.codigo_sap}</td>
                <td className="px-6 py-4">{item.descricao}</td>
                <td className="px-6 py-4 text-center text-gray-500">{item.unidade}</td>
                <td className="px-6 py-4 text-center font-medium text-white">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      className="w-20 bg-black/50 border border-cyan-500/50 rounded px-2 py-1 text-center focus:outline-none"
                      value={editQty}
                      onChange={(e) => setEditQty(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateQty(item.id)}
                      autoFocus
                    />
                  ) : (
                    item.quantidade
                  )}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  {editingId === item.id ? (
                    <button onClick={() => handleUpdateQty(item.id)} className="text-emerald-400 p-1 hover:bg-emerald-500/10 rounded"><Save size={16} /></button>
                  ) : (
                    <button onClick={() => { setEditingId(item.id); setEditQty(item.quantidade); }} className="text-gray-400 p-1 hover:bg-white/10 rounded"><Edit2 size={16} /></button>
                  )}
                  <button onClick={() => handleDelete(item.id)} className="text-red-400 p-1 hover:bg-red-500/10 rounded"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  {selectedKit ? 'Kit vazio.' : 'Selecione um kit acima para editar.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Simple Add Section (Mock UI for now, logic needs wiring) */}
      {selectedKit && (
        <div className="glass-panel p-4 rounded-xl border border-white/10 flex items-center gap-4 opacity-50 pointer-events-none grayscale">
          <span className="text-xs uppercase text-gray-500 font-bold">Adicionar Material (Em Breve)</span>
          {/* Requires SAP search logic which is complex for this step */}
        </div>
      )}
    </div>
  );
};

export default ManageKits;
