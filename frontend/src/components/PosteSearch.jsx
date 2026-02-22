import React from 'react';
import { Search } from 'lucide-react';

/**
 * PosteSearch — Busca e seleção de postes para adicionar aos materiais avulsos.
 * Responsabilidade: campo de busca de postes + dropdown de resultados.
 */
export function PosteSearch({
  posteQuery,
  posteResults,
  showPosteDropdown,
  posteHighlight,
  posteInputRef,
  onSearch,
  onSelect,
  onKeyDown,
}) {
  return (
    <div className="relative">
      <label className="text-xs text-gray-500 uppercase font-bold">
        Poste (adiciona aos materiais)
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={posteInputRef}
          type="text"
          value={posteQuery}
          onChange={(e) => onSearch(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Buscar poste..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition"
        />
      </div>
      {showPosteDropdown && posteResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border max-h-32 overflow-y-auto">
          {posteResults.map((mat, idx) => (
            <button
              key={mat.sap}
              onMouseDown={(e) => { e.preventDefault(); onSelect(mat); }}
              className={`w-full text-left px-2 py-1.5 text-xs flex gap-2 ${idx === posteHighlight ? 'bg-green-100' : 'hover:bg-gray-50'}`}
            >
              <span className="font-mono font-bold text-green-600">{mat.sap}</span>
              <span className="text-gray-500 truncate text-[10px]">{mat.descricao}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
