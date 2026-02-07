import React, { useState, useEffect } from 'react';
import { DollarSign, Save, Search, AlertCircle, CheckCircle, Package, TrendingUp } from 'lucide-react';

const PriceManager = ({ isOpen, onClose }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceCost, setServiceCost] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await window.api.getZeroPriceMaterials();
      setMaterials(data.map(m => ({ ...m, newPrice: m.preco_unitario || 0 })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (sap, value) => {
    setMaterials(prev => prev.map(m =>
      m.sap === sap ? { ...m, newPrice: parseFloat(value) || 0 } : m
    ));
  };

  const savePrice = async (mat) => {
    try {
      await window.api.updateMaterialPrice(mat.sap, mat.newPrice);
      setMessage({ type: 'success', text: `Preço de ${mat.sap} atualizado.` });
      // Remove from list if updated to > 0
      if (mat.newPrice > 0) {
        setMaterials(prev => prev.filter(m => m.sap !== mat.sap));
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao salvar preço.' });
    }
  };

  const handleUpdateAllServiceCosts = async () => {
    if (!confirm(`Definir R$ ${serviceCost} como custo de serviço para TODOS os kits?`)) return;
    setSaving(true);
    try {
      await window.api.updateAllKitsServiceCost(serviceCost);
      setMessage({ type: 'success', text: 'Custos de serviço atualizados com sucesso.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao atualizar custos.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const filtered = materials.filter(m =>
    m.sap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-gray-100">

        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Gestão de Preços</h2>
              <p className="text-blue-100 text-sm font-medium opacity-90">Corrija itens com preço zero em massa</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

          {/* Controls Panel */}
          <div className="w-full md:w-80 border-r bg-gray-50/50 p-6 space-y-8 flex flex-col overflow-y-auto">

            {/* Mass Kit Update */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-700 font-bold uppercase text-xs tracking-wider">
                <TrendingUp className="w-4 h-4" />
                Custo de Mão de Obra (Kits)
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 ring-1 ring-gray-200/50">
                <p className="text-sm text-gray-500 leading-relaxed italic">
                  Defina um valor padrão de serviço para <strong>todos</strong> os kits do sistema.
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 font-bold">R$</span>
                  <input
                    type="number"
                    className="w-full pl-10 p-2.5 border rounded-xl focus:ring-4 focus:ring-blue-100 border-gray-200 outline-none transition-all font-semibold"
                    value={serviceCost}
                    onChange={(e) => setServiceCost(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <button
                  onClick={handleUpdateAllServiceCosts}
                  disabled={saving}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-50"
                >
                  {saving ? 'Processando...' : 'Atualizar Todos'}
                </button>
              </div>
            </div>

            {/* General Stats */}
            <div className="flex-1 pt-4">
              <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-blue-800 text-sm">Resumo de Auditoria</h4>
                    <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                      Atualmente existem <strong>{materials.length}</strong> materiais com preço zerado.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Area */}
            {message && (
              <div className={`mt-auto p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="text-xs font-bold leading-tight">{message.text}</span>
              </div>
            )}
          </div>

          {/* Table Area */}
          <div className="flex-1 flex flex-col bg-white">
            <div className="p-6 border-b bg-white flex items-center gap-4 sticky top-0 z-10">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Filtrar por código SAP ou descrição..."
                  className="w-full pl-12 pr-6 py-3.5 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-300 outline-none transition-all bg-gray-50/50"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto px-6 pb-6">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white z-20 border-b">
                  <tr className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                    <th className="py-6 px-4">Material (SAP)</th>
                    <th className="py-6 px-4">Descrição</th>
                    <th className="py-6 px-4 w-40 text-center">Novo Preço</th>
                    <th className="py-6 px-4 w-28 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-gray-400 font-medium italic">Analisando o catálogo SAP...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <Package className="w-16 h-16 text-gray-200" />
                          <p className="text-gray-400 font-medium italic">Nenhum item pendente encontrado.</p>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.map(mat => (
                    <tr key={mat.sap} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="py-5 px-4">
                        <span className="font-black text-gray-800 font-mono tracking-tighter bg-gray-100 px-2 py-1 rounded-lg group-hover:bg-blue-100 transition-colors">
                          {mat.sap}
                        </span>
                      </td>
                      <td className="py-5 px-4">
                        <p className="text-sm font-semibold text-gray-600 line-clamp-2 max-w-sm truncate" title={mat.descricao}>
                          {mat.descricao}
                        </p>
                      </td>
                      <td className="py-5 px-4">
                        <div className="relative group/input">
                          <span className="absolute left-3 top-2.5 text-gray-300 text-xs font-bold group-focus-within/input:text-blue-500 transition-colors">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all font-mono font-bold text-sm bg-white shadow-sm"
                            value={mat.newPrice}
                            onChange={(e) => handlePriceChange(mat.sap, e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="py-5 px-4 text-right">
                        <button
                          onClick={() => savePrice(mat)}
                          className={`p-2.5 rounded-xl transition-all active:scale-95 shadow-md ${mat.newPrice > 0
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 hover:shadow-blue-300'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          disabled={mat.newPrice <= 0}
                          title="Salvar alterações"
                        >
                          <Save className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceManager;
