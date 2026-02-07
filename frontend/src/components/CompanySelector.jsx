import React, { useState, useEffect } from 'react';
import { Building2, ChevronDown } from 'lucide-react';

export const CompanySelector = ({ onCompanyChange }) => {
  const [empresas, setEmpresas] = useState([]);
  const [empresaAtiva, setEmpresaAtiva] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmpresas();
  }, []);

  const loadEmpresas = async () => {
    try {
      const allEmpresas = await window.api.getAllEmpresas();
      setEmpresas(allEmpresas);

      // Carregar empresa ativa
      const ativa = await window.api.getEmpresaAtiva();
      if (ativa) {
        setEmpresaAtiva(ativa);
      } else if (allEmpresas.length > 0) {
        // Se não tem empresa ativa, selecionar a primeira
        await window.api.setEmpresaAtiva(allEmpresas[0].id);
        setEmpresaAtiva(allEmpresas[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmpresaChange = async (e) => {
    const empresaId = parseInt(e.target.value);
    const empresa = empresas.find(emp => emp.id === empresaId);

    if (empresa) {
      await window.api.setEmpresaAtiva(empresaId);
      setEmpresaAtiva(empresa);

      // Notificar componente pai (para recalcular preços)
      if (onCompanyChange) {
        onCompanyChange(empresa);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
        <Building2 className="w-4 h-4 text-gray-400 animate-pulse" />
        <span className="text-xs text-gray-400">Carregando...</span>
      </div>
    );
  }

  if (empresas.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
        <Building2 className="w-4 h-4 text-amber-600" />
        <span className="text-xs text-amber-700 font-semibold">Nenhuma empresa cadastrada</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-2">
      <Building2 className="w-4 h-4 text-gray-600" />
      <select
        value={empresaAtiva?.id || ''}
        onChange={handleEmpresaChange}
        className="pl-2 pr-8 py-1.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer appearance-none"
        style={{ minWidth: '200px' }}
      >
        {empresas.map(emp => (
          <option key={emp.id} value={emp.id}>
            {emp.nome} {emp.regional ? `- ${emp.regional}` : ''}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
};
