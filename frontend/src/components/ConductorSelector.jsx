import React from 'react';
import { Zap } from 'lucide-react';
import { CONDUTORES_MT, CONDUTORES_BT } from '../constants/conductors';

/**
 * ConductorSelector — Seletor de condutores MT e BT.
 * Responsabilidade: renderizar e controlar dropdowns de condutores MT e BT.
 */
export function ConductorSelector({
  condutorMT,
  condutorBT,
  showMTDropdown,
  showBTDropdown,
  setCondutorMT,
  setCondutorBT,
  setShowMTDropdown,
  setShowBTDropdown,
  mtHighlight,
  btHighlight,
  setMtHighlight,
  setBtHighlight,
  handleMTNav,
  handleBTNav,
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {/* Condutor MT */}
      <div className="relative">
        <label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1">
          <Zap className="w-3 h-3 text-orange-500" /> MT
        </label>
        <button
          onClick={() => { setMtHighlight(0); setShowMTDropdown(!showMTDropdown); }}
          onKeyDown={handleMTNav}
          className="w-full text-left px-2 py-1.5 bg-orange-50 border border-orange-100 rounded-lg text-xs font-medium text-orange-700 truncate focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          {condutorMT.label}
        </button>
        {showMTDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border max-h-40 overflow-y-auto">
            <div className="p-1 space-y-0.5">
              <div className="text-[9px] text-gray-400 px-2 py-1 font-bold bg-gray-50">CONVENCIONAL</div>
              {CONDUTORES_MT.filter(c => c.tipo === 'Convencional').map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => { setCondutorMT(c); setShowMTDropdown(false); }}
                  className={`w-full text-left px-2 py-1.5 text-xs text-gray-700 rounded block ${idx === mtHighlight ? 'bg-orange-100' : 'hover:bg-orange-50'}`}
                >
                  {c.label}
                </button>
              ))}
              <div className="text-[9px] text-gray-400 px-2 py-1 font-bold bg-gray-50 mt-1">COMPACTA</div>
              {CONDUTORES_MT.filter(c => c.tipo === 'Compacta').map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setCondutorMT(c); setShowMTDropdown(false); }}
                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-orange-50 text-gray-700 rounded block"
                >
                  {c.label}
                </button>
              ))}
              {CONDUTORES_MT.filter(c => c.tipo === 'Isolada').length > 0 && (
                <>
                  <div className="text-[9px] text-gray-400 px-2 py-1 font-bold bg-gray-50 mt-1">ISOLADA</div>
                  {CONDUTORES_MT.filter(c => c.tipo === 'Isolada').map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setCondutorMT(c); setShowMTDropdown(false); }}
                      className="w-full text-left px-2 py-1.5 text-xs hover:bg-orange-50 text-gray-700 rounded block"
                    >
                      {c.label}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Condutor BT */}
      <div className="relative">
        <label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1">
          <Zap className="w-3 h-3 text-blue-500" /> BT
        </label>
        <button
          onClick={() => { setBtHighlight(0); setShowBTDropdown(!showBTDropdown); }}
          onKeyDown={handleBTNav}
          className="w-full text-left px-2 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs font-medium text-blue-700 truncate focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {condutorBT.label}
        </button>
        {showBTDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border max-h-40 overflow-y-auto">
            <div className="p-1 space-y-0.5">
              <div className="text-[9px] text-gray-400 px-2 py-1 font-bold bg-gray-50">MULTIPLEXADA</div>
              {CONDUTORES_BT.filter(c => c.tipo === 'Multiplexada').map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => { setCondutorBT(c); setShowBTDropdown(false); }}
                  className={`w-full text-left px-2 py-1.5 text-xs text-gray-700 rounded block ${idx === btHighlight ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                >
                  {c.label}
                </button>
              ))}
              <div className="text-[9px] text-gray-400 px-2 py-1 font-bold bg-gray-50 mt-1">REDE NUA</div>
              {CONDUTORES_BT.filter(c => c.tipo === 'Nua').map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setCondutorBT(c); setShowBTDropdown(false); }}
                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-50 text-gray-700 rounded block"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
