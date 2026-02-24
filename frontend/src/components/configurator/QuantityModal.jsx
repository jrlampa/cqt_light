import React from 'react';

export const QuantityModal = ({ isOpen, item, type, qty, setQty, onConfirm, onCancel, nav }) => {
    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={onCancel}>
            <div className="bg-white rounded-2xl p-6 shadow-2xl w-80 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg mb-2">Quantidade</h3>
                <p className="text-sm text-gray-600 mb-4">
                    <span className={`font-mono font-bold ${type === 'structure' ? 'text-orange-600' : 'text-blue-600'}`}>
                        {type === 'structure' ? item.codigo_kit : item.sap}
                    </span>
                    <br />
                    <span className="text-xs text-gray-500">
                        {type === 'structure' ? item.descricao_kit : item.descricao}
                    </span>
                </p>
                <input
                    ref={nav.qtyInputRef}
                    type="number"
                    min="1"
                    step="0.01"
                    value={qty}
                    onChange={(e) => setQty(Math.max(0.01, parseFloat(e.target.value) || 1))}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); onConfirm(); }
                        if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
                    }}
                    className="w-full px-4 py-3 text-2xl text-center font-bold border-2 border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none"
                    autoFocus
                />
                <div className="flex gap-2 mt-4">
                    <button onClick={onCancel} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Cancelar</button>
                    <button onClick={onConfirm} className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold">Adicionar</button>
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">Enter para confirmar</p>
            </div>
        </div>
    );
};
