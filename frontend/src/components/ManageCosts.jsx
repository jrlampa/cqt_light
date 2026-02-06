import React, { useState, useEffect } from 'react';
import { Save, Search, Edit2 } from 'lucide-react';

const ManageCosts = () => {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState('');
  const [costs, setCosts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const loadContracts = async () => {
    if (!window.api) return;
    const cts = await window.api.getContracts();
    setContracts(cts || []);
  };

  const loadCosts = async (contractId) => {
    if (!window.api) return;
    const data = await window.api.getCostsByContract(contractId);
    setCosts(data || []);
  };

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    if (selectedContract) loadCosts(selectedContract);
  }, [selectedContract]);

  const startEdit = (cost) => {
    setEditingId(cost.id);
    setEditValue(cost.preco_bruto);
  };

  const saveEdit = async (id) => {
    if (!window.api) return;
    await window.api.updateServiceCost(id, parseFloat(editValue));
    setEditingId(null);
    loadCosts(selectedContract); // Refresh
  };

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <header className="flex justify-between items-end border-b border-white/10 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Gestão de Custos Modulares</h2>
          <p className="text-gray-400">Edite os preços base para cada contrato.</p>
        </div>

        <div className="w-72">
          <label className="block text-xs text-cyan-400 mb-1 font-semibold uppercase">Contrato Ativo</label>
          <select
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
            value={selectedContract}
            onChange={(e) => setSelectedContract(e.target.value)}
          >
            <option value="">Selecione...</option>
            {contracts.map(c => (
              <option key={c.id} value={c.id}>{c.numero_contrato} - {c.regional}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur-md">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-black/20 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-6 py-4">Cód. Serviço</th>
              <th className="px-6 py-4">Descrição</th>
              <th className="px-6 py-4">Unidade</th>
              <th className="px-6 py-4 text-right">Preço Bruto (R$)</th>
              <th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {costs.map((cost) => (
              <tr key={cost.id} className="hover:bg-white/5 transition">
                <td className="px-6 py-4 font-mono text-cyan-300">{cost.codigo_servico}</td>
                <td className="px-6 py-4">{cost.descricao_servico}</td>
                <td className="px-6 py-4 text-gray-400">{cost.unidade}</td>
                <td className="px-6 py-4 text-right font-medium text-white">
                  {editingId === cost.id ? (
                    <input
                      type="number"
                      step="0.01"
                      autoFocus
                      className="w-24 bg-black/50 border border-cyan-500/50 rounded px-2 py-1 text-right focus:outline-none"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(cost.id)}
                    />
                  ) : (
                    cost.preco_bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {editingId === cost.id ? (
                    <button
                      onClick={() => saveEdit(cost.id)}
                      className="text-emerald-400 hover:text-emerald-300 p-1"
                    >
                      <Save size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(cost)}
                      className="text-gray-400 hover:text-white p-1"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {costs.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  {selectedContract ? 'Nenhum custo cadastrado para este contrato.' : 'Selecione um contrato acima.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageCosts;
