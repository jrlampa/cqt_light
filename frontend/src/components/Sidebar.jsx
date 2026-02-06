import React from 'react';
import { LayoutDashboard, FileText, Settings, Database, Activity } from 'lucide-react';

const Sidebar = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'configurator', label: 'Orçamentação (Poste)', icon: LayoutDashboard },
    { id: 'manage-costs', label: 'Custos Modulares', icon: FileText },
    { id: 'manage-kits', label: 'Composições (Kits)', icon: Database },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-64 min-h-screen bg-glass-bg border-r border-white/10 flex flex-col backdrop-blur-md">
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <Activity className="text-cyan-400" size={28} />
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-500">
          SisOrçamento
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
                ${isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }
              `}
            >
              <Icon size={20} className={isActive ? 'text-cyan-400' : 'text-gray-500 group-hover:text-gray-300'} />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(6,182,212,0.8)]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5">
          <p className="text-xs text-gray-400 mb-1">Contrato Ativo</p>
          <p className="text-sm font-semibold text-white">CTR-2026/001</p>
          <p className="text-xs text-cyan-500/80">Light Serviços</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
