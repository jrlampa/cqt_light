import React from 'react';
import { Calculator, FileText, Download, ChevronDown } from 'lucide-react';
import { exportBudgetToExcel } from '../utils/excelExporter';

export const SummaryFooter = ({
  custoData,
  condutorMT,
  condutorBT,
  copySummary,
  showBudgetHistory,
  setShowBudgetHistory,
  estruturas // Needed for export
}) => {
  if (!custoData) return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[950px] z-40 animate-in slide-in-from-bottom-6 duration-700 delay-300">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 p-2 flex gap-1">
        {/* Conductors Summary */}
        <div className="flex-1 px-4 py-3 border-r border-gray-100 flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            <span className="text-xs uppercase font-bold text-gray-400">Rede MT</span>
          </div>
          <p className="font-semibold text-gray-700 text-sm truncate" title={condutorMT?.label || 'Padrão'}>
            {condutorMT?.label || '35mm² Nu (Padrão)'}
          </p>
        </div>

        <div className="flex-1 px-4 py-3 border-r border-gray-100 flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-xs uppercase font-bold text-gray-400">Rede BT</span>
          </div>
          <p className="font-semibold text-gray-700 text-sm truncate" title={condutorBT?.label || 'Padrão'}>
            {condutorBT?.label || 'Multiplex 70mm² (Padrão)'}
          </p>
        </div>

        {/* Total & Actions */}
        <div className="flex-1 flex flex-col justify-center px-4 relative group min-w-0">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-blue-500 px-4 py-1 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-1 whitespace-nowrap">
            <Calculator className="w-3 h-3" /> TOTAL GERAL
          </div>
          <p className="text-2xl font-bold text-center bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            R$ {(custoData.totalGeral || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex justify-center gap-3 text-xs mt-1 opacity-60 group-hover:opacity-100 transition">
            <span className="whitespace-nowrap">Mat: R$ {(custoData.totalMaterial || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
            <span className="whitespace-nowrap">M.O.: R$ {(custoData.totalServico || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col justify-center gap-2 px-4 py-2">
          <div className="flex gap-2">
            <button
              onClick={copySummary}
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-xs font-semibold flex items-center gap-2 whitespace-nowrap"
              title="Copiar Resumo (Ctrl+P)"
            >
              <FileText className="w-4 h-4" /> Copiar
            </button>
            <button
              onClick={() => exportBudgetToExcel(custoData, estruturas, 'Orcamento_CQT')}
              className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition text-xs font-semibold flex items-center gap-2 shadow-sm whitespace-nowrap"
              title="Baixar Excel"
            >
              <Download className="w-4 h-4" /> Excel
            </button>
          </div>
          <p className="text-[9px] text-center text-gray-400">
            <kbd className="px-1 bg-gray-100 rounded border border-gray-200">Ctrl+P</kbd> copiar
          </p>
        </div>
      </div>
    </div>
  );
};
