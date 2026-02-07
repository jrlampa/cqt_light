import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Check, ArrowRight } from 'lucide-react';

export const KitResolutionModal = ({ isOpen, onClose, kit, materials, onConfirm }) => {
  const [resolutions, setResolutions] = useState({}); // { 'E-10/': 'E-10/1000', ... }
  const [optionsMap, setOptionsMap] = useState({}); // { 'E-10/': [options...] }
  const [loading, setLoading] = useState(false);

  // Filter only partial materials
  const partialMaterials = materials.filter(m => m.codigo.trim().endsWith('/') || m.isPartial);

  useEffect(() => {
    if (isOpen && partialMaterials.length > 0) {
      loadOptions();
      // Reset resolutions
      setResolutions({});
    }
  }, [isOpen, materials]);

  const loadOptions = async () => {
    setLoading(true);
    const newOptionsMap = {};

    try {
      if (window.api) {
        for (const mat of partialMaterials) {
          // Fetch suffixes for this prefix (e.g. 'E-10/')
          // We assume getSufixosByPrefixo returns [{ sufixo: '1000', codigo_completo: 'E-10/1000' }]
          // Or we use getAllSufixos and filter? backend likely has getSufixosByPrefixo from Phase 8.
          // Let's assume getAllSufixos exists and filter client side if specific API missing?
          // Phase 8 task said "Implement backend CRUD for suffixes".
          // Let's safe bet: fetch all suffixes and filter, or assume getAllSufixos is cached in parent.
          // Ideally parent passes suffixes, but we can fetch here.

          // Better: use window.api.getAllSufixos() to avoid N calls if API doesn't support batch
          const allSufixos = await window.api.getAllSufixos();

          // Filter match
          const matches = allSufixos.filter(s => s.prefixo === mat.codigo);

          // Enhance matches: create display label
          newOptionsMap[mat.codigo] = matches.map(s => ({
            value: s.codigo_completo || (s.prefixo + s.sufixo),
            label: `${s.codigo_completo} (${s.tipo_contexto} ${s.valor_contexto})`
          }));
        }
      }
    } catch (err) {
      console.error("Error loading resolution options", err);
    } finally {
      setOptionsMap(newOptionsMap);
      setLoading(false);
    }
  };

  const handleSelect = (code, value) => {
    setResolutions(prev => ({ ...prev, [code]: value }));
  };

  const handleConfirm = () => {
    // Rebuild materials list with resolved codes
    const resolvedList = materials.map(m => {
      if (m.codigo.trim().endsWith('/') || m.isPartial) {
        return {
          ...m,
          codigo: resolutions[m.codigo] || m.codigo, // Replace with resolved
          isPartial: false // No longer partial
        };
      }
      return m;
    });

    onConfirm(resolvedList);
  };

  const isComplete = partialMaterials.every(m => resolutions[m.codigo]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Definição de Materiais</h2>
              <p className="text-sm text-gray-600">Este kit contém itens que precisam ser especificados.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-amber-100 rounded-full text-gray-500 hover:text-gray-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando opções...</div>
          ) : (
            <div className="space-y-6">
              {partialMaterials.map((mat, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono font-bold text-lg text-gray-800">{mat.codigo}</span>
                    <span className="text-sm text-gray-500">{mat.descricao}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-sm text-gray-600 flex items-center">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Selecione o material específico:
                    </div>
                    <div>
                      <select
                        className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                        value={resolutions[mat.codigo] || ''}
                        onChange={(e) => handleSelect(mat.codigo, e.target.value)}
                      >
                        <option value="">-- Selecione --</option>
                        {(optionsMap[mat.codigo] || []).map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isComplete}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            Confirmar e Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};
