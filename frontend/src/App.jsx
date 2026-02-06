import React, { useState, useEffect } from 'react';
import { Calculator, Layers, Package, DollarSign, Keyboard } from 'lucide-react';
import Configurator from './components/Configurator';
import MaterialManager from './components/MaterialManager';
import KitEditor from './components/KitEditor';
import LaborManager from './components/LaborManager';

function App() {
  const [activeTab, setActiveTab] = useState('configurator');
  const [stats, setStats] = useState({ materials: 0, kits: 0, servicos: 0 });

  useEffect(() => {
    loadStats();

    // Global keyboard shortcuts
    const handleKeyDown = (e) => {
      if (e.ctrlKey) {
        switch (e.key) {
          case '1': e.preventDefault(); setActiveTab('configurator'); break;
          case '2': e.preventDefault(); setActiveTab('materials'); break;
          case '3': e.preventDefault(); setActiveTab('kits'); break;
          case '4': e.preventDefault(); setActiveTab('labor'); break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadStats = async () => {
    if (!window.api) return;
    const data = await window.api.getStats();
    setStats(data || { materials: 0, kits: 0, servicos: 0 });
  };

  const tabs = [
    { id: 'configurator', label: 'Configurador', icon: Calculator, shortcut: '1' },
    { id: 'materials', label: 'Materiais', icon: Layers, shortcut: '2' },
    { id: 'kits', label: 'Kits', icon: Package, shortcut: '3' },
    { id: 'labor', label: 'Mão de Obra', icon: DollarSign, shortcut: '4' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'configurator': return <Configurator />;
      case 'materials': return <MaterialManager />;
      case 'kits': return <KitEditor />;
      case 'labor': return <LaborManager />;
      default: return <Configurator />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 bg-white/60 backdrop-blur-md border-b border-white/40 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            CQT Light
          </h1>
          <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-100 rounded-full">v3.0</span>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                  ? 'bg-white shadow-md text-blue-600'
                  : 'text-gray-600 hover:bg-white/50'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <kbd className="hidden md:inline text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded ml-1">
                Ctrl+{tab.shortcut}
              </kbd>
            </button>
          ))}
        </nav>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {stats.materials.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            {stats.kits.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {stats.servicos.toLocaleString()}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 h-[calc(100vh-4rem)]">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
