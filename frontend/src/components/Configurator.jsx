import React, { useState, useEffect } from 'react';
import { Calculator, Package, CheckCircle, AlertCircle } from 'lucide-react';
import MaterialTable from './MaterialTable';

const Configurator = () => {
  // Dropdown States
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState('');

  // Structure Selections
  const [structures, setStructures] = useState([]); // Available options (codes)
  const [selections, setSelections] = useState({
    poste: '',
    condutor_mt: '',
    condutor_bt: '',
    estrutura_mt1: '',
    estrutura_mt2: '',
    estrutura_bt: ''
  });

  // Results
  const [materials, setMaterials] = useState([]);
  const [costs, setCosts] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    if (!window.api) return;

    try {
      const cts = await window.api.getContracts();
      setContracts(cts || []);

      const kitCodes = await window.api.getAllKitCodes();
      setStructures(kitCodes || []);

      // Default select first contract if avail
      if (cts && cts.length > 0) {
        setSelectedContract(cts[0].id);
      }
    } catch (error) {
      console.error("Failed to load init data", error);
    }
  };

  // Trigger calculation when selections change
  useEffect(() => {
    calculateBudget();
  }, [selections, selectedContract]);

  const handleSelectionChange = (field, value) => {
    setSelections(prev => ({ ...prev, [field]: value }));
  };

  const calculateBudget = async () => {
    if (!window.api) return;

    // Gather valid selected kit codes
    const kitCodes = Object.values(selections).filter(Boolean);
    if (kitCodes.length === 0) {
      setMaterials([]);
      setCosts([]);
      setTotalCost(0);
      return;
    }

    setLoading(true);
    try {
      // 1. Get Aggregated Materials
      const aggMats = await window.api.getAggregatedComposition(kitCodes);
      setMaterials(aggMats);

      // 2. Get Service Costs for these kits (Mock mapping: Service Code == Kit Code)
      if (selectedContract) {
        // Fetch all costs for contract
        // In a real app, we'd query specifically for the relevant codes, 
        // but getting all context costs and filtering in JS is fine for < 1000 items
        const contractCosts = await window.api.getCostsByContract(selectedContract);

        // Filter costs that match our selected kit codes
        const relevantCosts = contractCosts.filter(c => kitCodes.includes(c.codigo_servico));

        setCosts(relevantCosts);

        const sum = relevantCosts.reduce((acc, curr) => acc + curr.preco_bruto, 0);
        setTotalCost(sum);
      }
    } catch (error) {
      console.error("Calculation error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <header>
        <h2 className="text-3xl font-bold text-white mb-2">Configurador de Poste</h2>
        <p className="text-gray-400">Selecione os componentes para gerar a composição e orçamento.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 1. Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" /> Parâmetros
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Contrato / Regional</label>
                <select
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  value={selectedContract}
                  onChange={(e) => setSelectedContract(e.target.value)}
                >
                  <option value="">Selecione um contrato...</option>
                  {contracts.map(c => (
                    <option key={c.id} value={c.id}>{c.numero_contrato} - {c.regional}</option>
                  ))}
                </select>
              </div>

              <Dropdown label="Tipo de Poste" value={selections.poste} options={structures} onChange={v => handleSelectionChange('poste', v)} />
              <Dropdown label="Estrutura MT 1" value={selections.estrutura_mt1} options={structures} onChange={v => handleSelectionChange('estrutura_mt1', v)} />
            </div>
          </div>
        </div>

        {/* 2. Results & Budget */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cost Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
              <p className="text-sm text-emerald-400 mb-1 font-medium">CUSTO TOTAL (SERVIÇOS)</p>
              <div className="text-4xl font-bold text-white">
                {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-gray-400 mt-2">Baseado no contrato selecionado</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-sm text-cyan-400 mb-1 font-medium">MATERIAIS AGREGADOS</p>
              <div className="text-4xl font-bold text-white">
                {materials.length} <span className="text-lg text-gray-400 font-normal">itens</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Agrupados por código SAP</p>
            </div>
          </div>

          {/* Materials Table */}
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur-md">
            <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-semibold text-white">Lista de Materiais Consolidada</h3>
              <button className="text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-3 py-1 rounded-md transition">Exportar Excel</button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-400">Calculando...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-black/20 text-xs uppercase text-gray-400">
                    <tr>
                      <th className="px-6 py-3">Código SAP</th>
                      <th className="px-6 py-3">Descrição</th>
                      <th className="px-6 py-3">Unid.</th>
                      <th className="px-6 py-3 text-right">Qtd. Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {materials.map((m, idx) => (
                      <tr key={idx} className="hover:bg-white/5">
                        <td className="px-6 py-3 font-mono text-cyan-300">{m.codigo_sap}</td>
                        <td className="px-6 py-3">{m.descricao}</td>
                        <td className="px-6 py-3">{m.unidade}</td>
                        <td className="px-6 py-3 text-right font-medium text-white">{m.total_quantidade}</td>
                      </tr>
                    ))}
                    {materials.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                          Nenhum material selecionado. Configure a estrutura ao lado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Sub-component
const Dropdown = ({ label, value, options, onChange }) => (
  <div>
    <label className="block text-sm text-gray-400 mb-1">{label}</label>
    <select
      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">(Vazio)</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const SettingsIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
);

export default Configurator;
