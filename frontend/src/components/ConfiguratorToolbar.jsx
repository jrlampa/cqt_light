import React from 'react';
import {
  Calculator, FolderOpen, LayoutTemplate, Trash2, Save,
  FileText, Download, DollarSign, Package,
} from 'lucide-react';

/**
 * ConfiguratorToolbar — Barra de ferramentas do configurador.
 * Responsabilidade: botões de ação (limpar, salvar kit, exportar Excel, etc.)
 * e links para modais de gerenciamento.
 */
export function ConfiguratorToolbar({
  totalKits,
  totalMats,
  showExport,
  onClear,
  onExportExcel,
  onOpenHistory,
  onOpenTemplates,
  onOpenManualKits,
  onOpenPriceManager,
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* Título + ícones de modal */}
      <div className="flex items-center gap-2 flex-wrap">
        <Calculator className="w-4 h-4 text-blue-500" />
        <h2 className="font-bold text-gray-800 text-sm">Configurador</h2>

        <button
          onClick={onOpenHistory}
          className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition ml-1"
          title="Histórico de Orçamentos"
        >
          <FolderOpen className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenTemplates}
          className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-purple-600 transition ml-1"
          title="Gerenciar Templates"
        >
          <LayoutTemplate className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenManualKits}
          className="px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          title="Gerenciar Kits Manuais"
        >
          <Package className="w-3.5 h-3.5" /> Kits
        </button>

        <button
          onClick={onOpenPriceManager}
          className="px-3 py-1.5 border border-blue-200 bg-blue-50 rounded-xl hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          title="Gestão de Preços"
        >
          <DollarSign className="w-3.5 h-3.5" /> Preços
        </button>
      </div>

      {/* Botões de ação */}
      <div className="flex gap-2">
        <button
          onClick={onClear}
          disabled={totalKits === 0 && totalMats === 0}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <Trash2 className="w-3 h-3" /> Limpar
        </button>

        <button
          disabled={totalKits === 0 && totalMats === 0}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          onClick={() => alert('Salvar como Kit — Em breve!')}
        >
          <Save className="w-3 h-3" /> Kit
        </button>

        <button
          disabled={totalKits === 0 && totalMats === 0}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          onClick={() => alert('Relatório PDF — Em breve!')}
        >
          <FileText className="w-3 h-3" /> Relatório
        </button>
      </div>

      {/* Exportar Excel (condicional) */}
      {showExport && (
        <button
          onClick={onExportExcel}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 transition"
        >
          <Download className="w-3 h-3" /> Exportar Excel
        </button>
      )}
    </div>
  );
}
