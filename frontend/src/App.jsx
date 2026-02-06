import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Configurator from './components/Configurator';
import Dashboard from './components/Dashboard';
import ManageCosts from './components/ManageCosts';
import ManageKits from './components/ManageKits';

function App() {
  const [activeTab, setActiveTab] = useState('configurator');

  const renderContent = () => {
    switch (activeTab) {
      case 'configurator':
        return <Configurator />;
      case 'manage-costs':
        return <ManageCosts />;
      case 'manage-kits':
        return <ManageKits />;
      case 'settings':
        return <div className="p-10 text-white"><h2>Configurações</h2></div>;
      default:
        return <Configurator />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050a14] font-sans text-gray-200">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#050a14] via-[#0f172a] to-[#050a14]">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
