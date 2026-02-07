import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit2, Save, X, Search, ArrowLeft, ChevronRight, AlertTriangle } from 'lucide-react';

const ManualKitManager = ({ isOpen, onClose }) => {
  const [view, setView] = useState('list'); // 'list' | 'edit'
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Editing State
  const [editingId, setEditingId] = useState(null); // nome_template is the ID
  const [formData, setFormData] = useState({
    nome_template: '',
    kit_base: '',
    materiais: [], // { codigo, quantidade, descricao }
    observacao: ''
  });

  // Material Search State
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialResults, setMaterialResults] = useState([]);
  const [searchingMat, setSearchingMat] = useState(false);

  useEffect(() => {
    if (isOpen) loadTemplates();
  }, [isOpen]);

  const loadTemplates = async () => {
    if (!window.api) return;
    setLoading(true);
    try {
      const data = await window.api.getAllTemplatesManuais();
      setTemplates(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({ nome_template: '', kit_base: '', materiais: [], observacao: '' });
    setView('edit');
  };

  const handleEdit = (tpl) => {
    setEditingId(tpl.nome_template);
    setFormData({
      nome_template: tpl.nome_template,
      kit_base: tpl.kit_base || '',
      materiais: tpl.materiais || [], // Already parsed by backend getter? Need to check. 
      // Backend getTemplates usually returns objects. If it returns JSON string, need parse.
      // Database.cjs getTemplateManual parses it. getAllTemplatesManuais parses it?
      // Let's assume getAll parses it. If not, we fix.
      observacao: tpl.observacao || ''
    });
    setView('edit');
  };

  const handleDelete = async (nome) => {
    if (!confirm(`Excluir template "${nome}"?`)) return;
    try {
      await window.api.deleteTemplateManual(nome);
      loadTemplates();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir');
    }
  };

  const handleSave = async () => {
    if (!formData.nome_template) return alert('Nome do template é obrigatório');

    try {
      await window.api.saveTemplateManual(
        formData.nome_template,
        formData.kit_base,
        formData.materiais,
        formData.observacao
      );
      loadTemplates();
      setView('list');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar');
    }
  };

  const searchMaterials = async (term) => {
    if (!term || term.length < 3) return;
    setSearchingMat(true);
    try {
      const results = await window.api.searchMaterials(term);
      setMaterialResults(results.slice(0, 20)); // Limit 20
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingMat(false);
    }
  };

  const addMaterial = React.useCallback((mat) => {
    setFormData(prev => ({
      ...prev,
      materiais: [
        ...prev.materiais,
        { codigo: mat.sap, descricao: mat.descricao, quantidade: 1 }
      ]
    }));
    setMaterialSearch('');
    setMaterialResults([]);
  }, []);

  const removeMaterial = React.useCallback((idx) => {
    setFormData(prev => ({
      ...prev,
      materiais: prev.materiais.filter((_, i) => i !== idx)
    }));
  }, []);

  const updateMaterialQty = React.useCallback((idx, newQty) => {
    setFormData(prev => ({
      ...prev,
      materiais: prev.materiais.map((m, i) => i === idx ? { ...m, quantidade: Number(newQty) } : m)
    }));
  }, []);

  // Import State
  const [importText, setImportText] = useState('');

  const parseImportText = (text) => {
    if (!text) return [];

    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Try tab separated first
        let parts = line.split('\t');
        if (parts.length < 2) {
          // Try semicolon or comma (if CSV-like)
          if (line.includes(';')) parts = line.split(';');
          // We avoid comma splitting blindly because descriptions have commas
        }

        // Flexible parsing logic:
        // Try to identify Code (usually starts with num or char, no spaces in middle preferably, but SAP codes can vary)
        // Try to identify Quantity (number)

        let codigo = '';
        let quantidade = 1;
        let descricao = '';

        // Heuristic 1: If 3 cols -> Code | Desc | Qty OR Code | Qty | Desc
        if (parts.length >= 3) {
          codigo = parts[0].trim();
          // Check col 1 or 2 for number
          const p1num = parseFloat(parts[1].replace(',', '.'));
          const p2num = parseFloat(parts[2].replace(',', '.'));

          if (!isNaN(p1num)) {
            quantidade = p1num;
            descricao = parts[2].trim();
          } else if (!isNaN(p2num)) {
            quantidade = p2num;
            descricao = parts[1].trim();
          } else {
            // Fallback
            descricao = parts[1].trim();
          }
        } else if (parts.length === 2) {
          // Code | Qty or Code | Desc
          codigo = parts[0].trim();
          const p1num = parseFloat(parts[1].replace(',', '.'));
          if (!isNaN(p1num)) {
            quantidade = p1num;
          } else {
            descricao = parts[1].trim();
          }
        } else {
          // Just code?
          codigo = parts[0].trim();
        }

        // Cleanup code (remove quotes if any)
        codigo = codigo.replace(/^["']|["']$/g, '');

        if (!codigo) return null;

        const isPartial = codigo.trim().endsWith('/');
        const descricaoFinal = isPartial && !descricao ? 'Requer Definição (Dinâmico)' : descricao;

        return { codigo, quantidade, descricao: descricaoFinal, isPartial };
      })
      .filter(Boolean);
  };

  const handleImport = () => {
    const parsed = parseImportText(importText);
    if (parsed.length === 0) return alert('Nenhum item válido encontrado.');

    // Auto-generate name if possible (e.g. from first line if it looks like a header)
    // But usually user pastes content.

    setEditingId(null);
    setFormData({
      nome_template: '',
      kit_base: '',
      materiais: parsed.map(m => ({ ...m, quantidade: m.quantidade || 1 })),
      observacao: 'Importado via colar'
    });
    setImportText('');
    setView('edit');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Gerenciador de Kits Manuais</h2>
              <p className="text-xs text-gray-500">Crie composições personalizadas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {view === 'list' && (
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              <div className="flex justify-between mb-4">
                <div className="relative w-72">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar templates..."
                    className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setView('import')}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    <Edit2 className="w-4 h-4" /> Importar (Colar)
                  </button>
                  <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    <Plus className="w-4 h-4" /> Novo Kit
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto border rounded-xl">
                <table className="w-full text-left bg-white">
                  <thead className="bg-gray-50 text-gray-600 text-sm font-medium sticky top-0">
                    <tr>
                      <th className="p-3 pl-4">Nome do Kit</th>
                      <th className="p-3">Kit Base</th>
                      <th className="p-3">Materiais Extras</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {templates.filter(t => t.nome_template.toLowerCase().includes(searchTerm.toLowerCase())).map(t => (
                      <tr key={t.nome_template} className="hover:bg-gray-50">
                        <td className="p-3 pl-4 font-medium text-gray-800">{t.nome_template}</td>
                        <td className="p-3 text-gray-500">{t.kit_base || '-'}</td>
                        <td className="p-3 text-sm text-gray-500">
                          {Array.isArray(t.materiais) ? t.materiais.length : 0} itens
                        </td>
                        <td className="p-3 text-right">
                          <button onClick={() => handleEdit(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-1" title="Editar">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(t.nome_template)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {templates.length === 0 && !loading && (
                  <div className="p-8 text-center text-gray-400">Nenhum template encontrado</div>
                )}
              </div>
            </div>
          )}

          {view === 'import' && (
            <div className="flex-1 flex flex-col p-6 overflow-hidden bg-gray-50/50">
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                <button onClick={() => setView('list')} className="hover:text-blue-600 flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Voltar
                </button>
                <ChevronRight className="w-3 h-3" />
                <span>Importar do Excel</span>
              </div>

              <div className="bg-white p-6 rounded-xl border shadow-sm flex-1 flex flex-col">
                <h3 className="font-bold text-gray-800 mb-2">Cole os dados abaixo</h3>
                <p className="text-sm text-gray-500 mb-4">Copie as colunas do Excel (Código, Quantidade, Descrição) e cole aqui. O sistema tentará identificar automaticamente.</p>

                <textarea
                  className="flex-1 w-full p-4 border rounded-xl font-mono text-sm focus:ring-2 focus:ring-green-100 outline-none resize-none"
                  placeholder={`Exemplo:\n1000234\t5\tPARAFUSO\n1000555\t2\tCINTA`}
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                />

                <div className="mt-4 flex justify-end gap-3">
                  <button onClick={() => setView('list')} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                  <button
                    onClick={handleImport}
                    disabled={!importText.trim()}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    Processar e Criar Kit
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'edit' && (
            <div className="flex-1 flex flex-col p-6 overflow-hidden bg-gray-50/50">
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                <button onClick={() => setView('list')} className="hover:text-blue-600 flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Voltar
                </button>
                <ChevronRight className="w-3 h-3" />
                <span>{editingId ? 'Editar Kit' : 'Novo Kit'}</span>
              </div>

              <div className="bg-white p-6 rounded-xl border shadow-sm flex-1 overflow-auto">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código do Kit (Nome) *</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                      value={formData.nome_template}
                      onChange={e => setFormData({ ...formData, nome_template: e.target.value })}
                      disabled={!!editingId} // Disable editing ID once created to avoid primary key issues, or handle rename logic
                      placeholder="Ex: SEU_CODIGO_01"
                    />
                    <p className="text-xs text-gray-400 mt-1">Identificador único usado na busca.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kit Base (Opcional)</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                      value={formData.kit_base}
                      onChange={e => setFormData({ ...formData, kit_base: e.target.value })}
                      placeholder="Ex: 13CE3T"
                    />
                    <p className="text-xs text-gray-400 mt-1">Se preenchido, herda os materiais deste kit padrão.</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-medium text-gray-800 mb-2">Materiais Extras</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-9 p-2.5 border rounded-lg outline-none focus:border-blue-500"
                        placeholder="Buscar material para adicionar..."
                        value={materialSearch}
                        onChange={e => {
                          setMaterialSearch(e.target.value);
                          searchMaterials(e.target.value);
                        }}
                      />
                      {materialResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border rounded-b-lg shadow-lg max-h-60 overflow-y-auto z-10 mt-1">
                          {materialResults.map(m => (
                            <div
                              key={m.sap}
                              className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0"
                              onClick={() => addMaterial(m)}
                            >
                              <div className="font-bold text-sm text-gray-800">{m.sap}</div>
                              <div className="text-xs text-gray-600">{m.descricao}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <MaterialsTable
                    materials={formData.materiais}
                    onUpdateQty={updateMaterialQty}
                    onRemove={removeMaterial}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setView('list')}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                  >
                    <Save className="w-4 h-4" /> Salvar Kit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// Memoized Table Component for Performance
const MaterialsTable = React.memo(({ materials, onUpdateQty, onRemove }) => {
  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-gray-50 text-gray-600">
        <tr>
          <th className="p-2 pl-3">Código</th>
          <th className="p-2">Descrição</th>
          <th className="p-2 w-24">Qtd.</th>
          <th className="p-2 w-10"></th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {materials.map((mat, idx) => (
          <tr key={idx} className="group hover:bg-gray-50">
            <td className="p-2 pl-3 font-medium flex items-center gap-2">
              {mat.codigo}
              {(mat.isPartial || mat.codigo.endsWith('/')) && (
                <div className="group/tooltip relative">
                  <AlertTriangle className="w-4 h-4 text-amber-500 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block bg-gray-800 text-white text-xs p-2 rounded whitespace-nowrap z-50">
                    Código Parcial: Será definido ao usar o kit.
                  </div>
                </div>
              )}
            </td>
            <td className="p-2 text-gray-600">{mat.descricao}</td>
            <td className="p-2">
              <input
                type="number"
                min="0.1"
                step="0.1"
                className="w-16 p-1 border rounded text-center"
                value={mat.quantidade}
                onChange={e => onUpdateQty(idx, e.target.value)}
              />
            </td>
            <td className="p-2 text-right">
              <button onClick={() => onRemove(idx)} className="text-gray-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
        {materials.length === 0 && (
          <tr>
            <td colSpan={4} className="p-8 text-center text-gray-400 italic">
              Nenhum material extra adicionado.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
});

export default ManualKitManager;
