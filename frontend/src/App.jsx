import React, { useState, useEffect } from 'react';
import { Package, DollarSign, Layers, Wrench, Search } from 'lucide-react';
import Configurator from './components/Configurator';
import MaterialManager from './components/MaterialManager';
import KitEditor from './components/KitEditor';
import LaborManager from './components/LaborManager';

const tabs = [
  { id: 'configurator', label: 'Configurador', icon: Package, shortcut: '1' },
  { id: 'materials', label: 'Materiais', icon: Layers, shortcut: '2' },
  { id: 'kits', label: 'Kits', icon: Wrench, shortcut: '3' },
  { id: 'labor', label: 'Mão de Obra', icon: DollarSign, shortcut: '4' },
];

function App() {
  const [activeTab, setActiveTab] = useState('configurator');

  // Keyboard shortcuts: Ctrl+1, Ctrl+2, etc.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        const tabIndex = parseInt(e.key) - 1;
        if (tabs[tabIndex]) {
          setActiveTab(tabs[tabIndex].id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-panel px-6 py-4 flex items-center justify-between border-b border-white/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">CQT Light</h1>
            <p className="text-xs text-gray-500">Orçamentação de Redes Elétricas</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex gap-1 bg-white/30 p-1 rounded-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:bg-white/50'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className="text-xs text-gray-400 ml-1">Ctrl+{tab.shortcut}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto custom-scrollbar">
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
