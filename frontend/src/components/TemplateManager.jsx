import React, { useState, useEffect } from 'react';
import { LayoutTemplate, Plus, Check, Trash2, X, AlertCircle } from 'lucide-react';

const TemplateManager = ({
  isOpen,
  onClose,
  onApply,
  currentData
}) => {
  const [templates, setTemplates] = useState([]);
  const [mode, setMode] = useState('list'); // 'list' or 'create'
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setMode('list');
      setError(null);
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    if (!window.api) return;
    setLoading(true);
    try {
      const data = await window.api.getTemplates();
      setTemplates(data || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newTemplateName.trim() || !currentData) return;

    try {
      await window.api.saveTemplate({
        nome: newTemplateName,
        descricao: newTemplateDesc,
        dados: currentData
      });
      setNewTemplateName('');
      setNewTemplateDesc('');
      loadTemplates();
      setMode('list');
    } catch (err) {
      setError(err.message || 'Erro ao salvar template');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      await window.api.deleteTemplate(id);
      loadTemplates();
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const handleApply = async (templateId) => {
    try {
      setLoading(true);
      const fullTemplate = await window.api.getTemplate(templateId);
      if (fullTemplate && fullTemplate.dados) {
        onApply(fullTemplate.dados);
        onClose();
        alert(`✅ Template "${fullTemplate.nome}" aplicado com sucesso!`);
      }
    } catch (err) {
      setError('Falha ao carregar detalhes do template');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70]" onClick={onClose}>
      <div className="bg-white rounded-2xl w-[700px] max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <LayoutTemplate className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Gerenciador de Templates</h2>
              <p className="text-xs text-gray-500">Padronize seus projetos com modelos prontos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto bg-gray-50/50">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {mode === 'list' ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">Meus Modelos</h3>
                <button
                  onClick={() => setMode('create')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium shadow-sm hover:shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Salvar Atual como Template
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                  <LayoutTemplate className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-600">Nenhum template encontrado</h4>
                  <p className="text-gray-400 mt-1">Crie seu primeiro modelo a partir da configuração atual.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {templates.map(tpl => (
                    <div
                      key={tpl.id}
                      className="group relative bg-white p-5 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-gray-800 text-lg group-hover:text-purple-700 transition">{tpl.nome}</h4>
                          {tpl.is_default && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] uppercase font-bold tracking-wider rounded">Padrão</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2">{tpl.descricao || 'Sem descrição'}</p>
                      </div>

                      <div className="mt-5 flex gap-2">
                        <button
                          onClick={() => handleApply(tpl.id)}
                          className="flex-1 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-600 hover:text-white transition font-medium text-sm flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Aplicar
                        </button>
                        {!tpl.is_default && (
                          <button
                            onClick={(e) => handleDelete(tpl.id, e)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-lg mx-auto bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-500" />
                Novo Template
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Modelo</label>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Ex: Rede Compacta Padrão Light"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                  <textarea
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    placeholder="Descreva as características deste modelo..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition resize-none"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">
                    O template salvará: condutores selecionados, estruturas adicionadas e materiais avulsos atuais.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setMode('list')}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!newTemplateName.trim()}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium shadow-md shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Salvar Template
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;
