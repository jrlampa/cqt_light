import React, { useState, useEffect } from 'react';
import MaterialTable from './MaterialTable';
import { Layers, Zap, Package, Settings } from 'lucide-react';

const Dashboard = () => {
  const [structures, setStructures] = useState([]);
  const [selectedStructure, setSelectedStructure] = useState('');
  const [kitDetails, setKitDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStructures();
  }, []);

  const loadStructures = async () => {
    if (window.api) {
      const kits = await window.api.getKits('ESTRUTURA_MT');
      setStructures(kits || []);
    }
  };

  const handleStructureChange = async (e) => {
    const code = e.target.value;
    setSelectedStructure(code);
    if (!code) {
      setKitDetails(null);
      return;
    }

    setLoading(true);
    try {
      if (window.api) {
        const details = await window.api.getKitDetails(code);
        setKitDetails(details);
      }
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-8 text-white font-sans">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
            CQT Light Manager
          </h1>
          <p className="text-gray-400 mt-2">Manage electrical kits and materials (Standard 2019)</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition backdrop-blur-md border border-white/10">
            <Settings size={18} /> Settings
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar / Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Layers className="text-cyan-400" /> Structure Selection
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Structure Type (MT)</label>
                <select
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none"
                  value={selectedStructure}
                  onChange={handleStructureChange}
                >
                  <option value="">Select a Structure...</option>
                  {structures.map(s => (
                    <option key={s.id} value={s.code}>{s.code} - {s.description}</option>
                  ))}
                </select>
              </div>
              {/* Placeholders for other dropdowns */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Conductor (MT)</label>
                <select className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-gray-500 disabled:opacity-50" disabled>
                  <option>Not implemented</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Zap className="text-yellow-400" /> Quick Actions
            </h2>
            <button className="w-full py-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 transition mb-3">
              Add New Material
            </button>
            <button className="w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition">
              Export to Excel
            </button>
          </div>
        </div>

        {/* Main Content / Table */}
        <div className="lg:col-span-3">
          {kitDetails ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white">{kitDetails.code}</h2>
                  <p className="text-gray-400">{kitDetails.description}</p>
                </div>
                <div className="bg-emerald-500/20 text-emerald-300 px-4 py-1 rounded-full text-sm font-medium border border-emerald-500/20">
                  {kitDetails.category}
                </div>
              </div>

              <MaterialTable materials={kitDetails.items} />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 p-12 border-2 border-dashed border-white/5 rounded-3xl">
              <Package size={64} className="mb-4 opacity-50" />
              <p className="text-xl">Select a structure to view its composition</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
