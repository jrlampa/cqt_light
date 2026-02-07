import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, X, Clock, FileText, Check } from 'lucide-react';

const BudgetHistory = ({
  isOpen,
  onClose,
  onLoad,
  currentData
}) => {
  const [budgets, setBudgets] = useState([]);
  const [mode, setMode] = useState('list'); // 'list' or 'save'
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBudgets();
      setMode('list');
    }
  }, [isOpen]);

  const loadBudgets = async () => {
    if (!window.api) return;
    setLoading(true);
    try {
      const data = await window.api.getOrcamentos();
      setBudgets(data || []);
    } catch (error) {
      console.error('Failed to load budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newName.trim() || !currentData) return;

    try {
      await window.api.saveOrcamento({
        nome: newName,
        total: currentData.totalGeral,
        dados: currentData
      });
      setNewName('');
      loadBudgets();
      setMode('list');
    } catch (error) {
      console.error('Failed to save budget:', error);
      alert('Erro ao salvar orçamento');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este orçamento?')) return;

    try {
      await window.api.deleteOrcamento(id);
      loadBudgets();
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  };

  const handleLoad = async (budget) => {
    try {
      const fullBudget = await window.api.getOrcamento(budget.id);
      if (fullBudget && fullBudget.dados) {
        onLoad(fullBudget.dados);
        onClose();
      }
    } catch (error) {
      console.error('Failed to load budget details:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-white rounded-2xl w-[600px] max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {mode === 'save' ? <Save className="w-5 h-5 text-emerald-500" /> : <FolderOpen className="w-5 h-5 text-blue-500" />}
            {mode === 'save' ? 'Salvar Orçamento' : 'Histórico de Orçamentos'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {mode === 'list' ? (
            <div className="space-y-4">
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setMode('save')}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-medium"
                >
                  <Save className="w-4 h-4" />
                  Salvar Atual
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : budgets.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhum orçamento salvo ainda.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {budgets.map(budget => (
                    <div
                      key={budget.id}
                      onClick={() => handleLoad(budget)}
                      className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-300 hover:shadow-md transition cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{budget.nome}</h3>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(budget.data_criacao).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-emerald-600">
                          R$ {budget.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <button
                          onClick={(e) => handleDelete(budget.id, e)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Orçamento</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Obra Rua das Flores - Versão 1"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />

              <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-600 mb-3">Resumo do Estado Atual:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total:</span>
                    <span className="font-bold text-emerald-600">R$ {currentData.totalGeral?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Materiais:</span>
                    <span>{currentData.materiais?.length || 0} itens</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setMode('list')}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!newName.trim()}
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetHistory;
