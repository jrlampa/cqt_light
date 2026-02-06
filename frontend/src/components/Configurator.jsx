import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Package, Search, X, Plus, Trash2, Calculator, DollarSign, Layers } from 'lucide-react';

const Configurator = () => {
  // Selected kits
  const [selectedKits, setSelectedKits] = useState([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  // Aggregated data
  const [materials, setMaterials] = useState([]);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({ materials: 0, kits: 0, labor: 0 });

  // Loading state
  const [loading, setLoading] = useState(false);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  // Recalculate when kits change
  useEffect(() => {
    if (selectedKits.length > 0) {
      calculateAggregation();
    } else {
      setMaterials([]);
      setServices([]);
    }
  }, [selectedKits]);

  const loadStats = async () => {
    if (!window.api) return;
    const data = await window.api.getStats();
    setStats(data);
  };

  const searchKits = async (query) => {
    if (!window.api || !query.trim()) {
      setSearchResults([]);
      return;
    }
    const results = await window.api.searchKits(query);
    // Filter out already selected kits
    const filtered = results.filter(k => !selectedKits.find(s => s.codigo_kit === k.codigo_kit));
    setSearchResults(filtered);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(true);
    searchKits(value);
  };

  const handleSelectKit = (kit) => {
    setSelectedKits(prev => [...prev, kit]);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    searchRef.current?.focus();
  };

  const handleRemoveKit = (codigoKit) => {
    setSelectedKits(prev => prev.filter(k => k.codigo_kit !== codigoKit));
  };

  const handleClearAll = () => {
    setSelectedKits([]);
    setMaterials([]);
    setServices([]);
  };

  const calculateAggregation = async () => {
    if (!window.api) return;
    setLoading(true);

    const kitCodes = selectedKits.map(k => k.codigo_kit);

    // Get aggregated materials
    const mats = await window.api.getAggregatedMaterials(kitCodes);
    setMaterials(mats || []);

    // Get aggregated services
    const svcs = await window.api.getAggregatedServices(kitCodes);
    setServices(svcs || []);

    setLoading(false);
  };

  // Keyboard handler for search
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
    } else if (e.key === 'Enter' && searchResults.length > 0) {
      handleSelectKit(searchResults[0]);
    }
  };

  // Calculate totals
  const totalMaterials = materials.reduce((sum, m) => sum + (m.subtotal || 0), 0);
  const totalServices = services.reduce((sum, s) => sum + (s.preco_bruto || 0), 0);
  const grandTotal = totalMaterials + totalServices;

  return (
    <div className="space-y-6 pb-32">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Layers className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">Materiais</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.materials?.toLocaleString()}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <Package className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">Kits</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.kits?.toLocaleString()}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">Mão de Obra</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.labor?.toLocaleString()}</p>
        </div>
      </div>

      {/* Kit Search */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-800">Configurador de Orçamento</h2>
        </div>

        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar kits... (ex: 13N1, SI3)"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            {selectedKits.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition flex items-center gap-2 font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Limpar
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-64 overflow-y-auto">
              {searchResults.map((kit, idx) => (
                <button
                  key={kit.codigo_kit}
                  onClick={() => handleSelectKit(kit)}
                  className={`w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3 ${idx === 0 ? 'bg-blue-50' : ''
                    }`}
                >
                  <span className="font-mono font-bold text-blue-600">{kit.codigo_kit}</span>
                  <span className="text-gray-600 truncate">{kit.descricao_kit}</span>
                  <Plus className="w-4 h-4 text-gray-400 ml-auto" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Kits */}
        {selectedKits.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {selectedKits.map(kit => (
              <div
                key={kit.codigo_kit}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
              >
                <span className="font-mono">{kit.codigo_kit}</span>
                <button
                  onClick={() => handleRemoveKit(kit.codigo_kit)}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {selectedKits.length > 0 && (
        <>
          {/* Materials Section */}
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-500" />
                Materiais ({materials.length})
              </h3>
              <span className="text-sm text-gray-500">
                Subtotal: <span className="font-bold text-emerald-600">R$ {totalMaterials.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">SAP</th>
                    <th className="px-4 py-3 text-left">Descrição</th>
                    <th className="px-4 py-3 text-center">Un</th>
                    <th className="px-4 py-3 text-right">Qtd</th>
                    <th className="px-4 py-3 text-right">Unit (R$)</th>
                    <th className="px-4 py-3 text-right">Subtotal (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {materials.slice(0, 50).map((mat, idx) => (
                    <tr key={mat.sap || idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-blue-600">{mat.sap}</td>
                      <td className="px-4 py-2 text-gray-700 truncate max-w-xs">{mat.descricao}</td>
                      <td className="px-4 py-2 text-center text-gray-500">{mat.unidade}</td>
                      <td className="px-4 py-2 text-right font-medium">{mat.total_quantidade?.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{mat.preco_unitario?.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-bold text-gray-800">{mat.subtotal?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {materials.length > 50 && (
                <div className="px-4 py-2 bg-gray-50 text-center text-sm text-gray-500">
                  Mostrando 50 de {materials.length} materiais
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="section-divider"></div>

          {/* Services Section */}
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-500" />
                Mão de Obra ({services.length})
              </h3>
              <span className="text-sm text-gray-500">
                Subtotal: <span className="font-bold text-purple-600">R$ {totalServices.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </span>
            </div>

            {services.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Código</th>
                      <th className="px-4 py-3 text-left">Descrição</th>
                      <th className="px-4 py-3 text-center">Un</th>
                      <th className="px-4 py-3 text-right">Preço (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {services.map((svc, idx) => (
                      <tr key={svc.codigo_mo || idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-purple-600">{svc.codigo_mo}</td>
                        <td className="px-4 py-2 text-gray-700">{svc.descricao}</td>
                        <td className="px-4 py-2 text-center text-gray-500">{svc.unidade}</td>
                        <td className="px-4 py-2 text-right font-bold text-gray-800">{svc.preco_bruto?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Nenhum serviço de mão de obra vinculado a estes kits.</p>
                <p className="text-sm mt-1">Importe dados de Custo Modular na aba "Mão de Obra".</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Fixed Footer */}
      {selectedKits.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 glass-panel border-t border-white/40 px-8 py-4 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs text-gray-500 uppercase">Kits Selecionados</span>
                <p className="text-lg font-bold text-gray-800">{selectedKits.length}</p>
              </div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div>
                <span className="text-xs text-gray-500 uppercase">Materiais</span>
                <p className="text-lg font-bold text-emerald-600">R$ {totalMaterials.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div>
                <span className="text-xs text-gray-500 uppercase">Mão de Obra</span>
                <p className="text-lg font-bold text-purple-600">R$ {totalServices.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 uppercase">Total Geral</span>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedKits.length === 0 && (
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-600 mb-2">Selecione Kits para Começar</h3>
          <p className="text-gray-400">Use a busca acima para adicionar estruturas ao orçamento.</p>
          <p className="text-sm text-gray-400 mt-2">Pressione <kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd> para selecionar o primeiro resultado.</p>
        </div>
      )}
    </div>
  );
};

export default Configurator;
