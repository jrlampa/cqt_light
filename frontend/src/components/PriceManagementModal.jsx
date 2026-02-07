import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, TrendingUp, History, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseExcelPrecos, validateImportPreview } from '../utils/excelPriceParser';

export const PriceManagementModal = ({ isOpen, onClose, empresaAtiva }) => {
  const [activeTab, setActiveTab] = useState('import');
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [reajustePercentual, setReajustePercentual] = useState('');
  const [historico, setHistorico] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && empresaAtiva && activeTab === 'historico') {
      loadHistorico();
    }
  }, [isOpen, empresaAtiva, activeTab]);

  const loadHistorico = async () => {
    if (!empresaAtiva) return;
    try {
      const hist = await window.api.getHistoricoPrecos(empresaAtiva.id, 50);
      setHistorico(hist || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportFile(file);

    try {
      // Parse Excel file - NOW RETURNS {success, ambiguous}
      const result = await parseExcelPrecos(file);

      // Get existing SAPs from DB
      const allMaterials = await window.api.getAllMaterials();
      const existingSaps = allMaterials.map(m => m.sap);

      // Validate and create preview for SUCCESS cases
      const preview = validateImportPreview(result.success, existingSaps);
      setImportPreview({
        ...preview,
        precosData: result.success, // Store only success for import
        ambiguous: result.ambiguous // Store ambiguous for manual resolution
      });
    } catch (error) {
      console.error('Erro ao processar Excel:', error);
      alert(`❌ Erro ao processar arquivo: ${error.message}`);
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (!empresaAtiva || !importFile || !importPreview) return;

    setImporting(true);
    try {
      const contador = await window.api.importPrecosFromArray(
        empresaAtiva.id,
        importPreview.precosData,
        'importacao'
      );

      alert(`✅ ${contador} preços importados com sucesso!`);
      setImportFile(null);
      setImportPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Erro ao importar:', error);
      alert('❌ Erro ao importar preços');
    } finally {
      setImporting(false);
    }
  };

  const handleReajuste = async () => {
    if (!empresaAtiva || !reajustePercentual) return;

    const percentual = parseFloat(reajustePercentual);
    if (isNaN(percentual)) {
      alert('Percentual inválido');
      return;
    }

    const confirmacao = confirm(
      `Aplicar reajuste de ${percentual}% em TODOS os materiais da empresa ${empresaAtiva.nome}?`
    );

    if (!confirmacao) return;

    try {
      const contador = await window.api.reajusteEmMassa(
        empresaAtiva.id,
        percentual,
        null // Todos os materiais
      );

      alert(`✅ ${contador} preços reajustados em ${percentual}%`);
      setReajustePercentual('');
    } catch (error) {
      console.error('Erro ao reajustar:', error);
      alert('❌ Erro ao aplicar reajuste');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[85]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-[800px] max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Gestão de Preços</h2>
              {empresaAtiva && (
                <p className="text-sm text-gray-600 mt-1">
                  {empresaAtiva.nome} {empresaAtiva.regional && `- ${empresaAtiva.regional}`}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('import')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'import'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:bg-white/30'
                }`}
            >
              <Upload className="w-4 h-4" />
              Importar Excel
            </button>
            <button
              onClick={() => setActiveTab('reajuste')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'reajuste'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:bg-white/30'
                }`}
            >
              <TrendingUp className="w-4 h-4" />
              Reajuste em Massa
            </button>
            <button
              onClick={() => setActiveTab('historico')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'historico'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:bg-white/30'
                }`}
            >
              <History className="w-4 h-4" />
              Histórico
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition">
                <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xlsm,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-semibold"
                >
                  Selecionar Arquivo Excel
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Formato: .xlsx, .xlsm com aba "Custo Materiais"
                </p>
              </div>

              {importPreview && (
                <>
                  <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-blue-900">✅ Detecção Automática</p>
                        <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                          <div>
                            <span className="text-gray-600">Total:</span>
                            <span className="font-bold text-gray-800 ml-2">{importPreview.totalLinhas}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Novos:</span>
                            <span className="font-bold text-green-600 ml-2">{importPreview.novos}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Atualizações:</span>
                            <span className="font-bold text-blue-600 ml-2">{importPreview.atualizacoes}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {importPreview.ambiguous && importPreview.ambiguous.length > 0 && (
                    <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-amber-900">⚠️ Casos Ambíguos ({importPreview.ambiguous.length})</p>
                          <p className="text-xs text-amber-700 mt-1">Preços encontrados mas códigos SAP não detectados automaticamente</p>

                          <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                            {importPreview.ambiguous.map((item, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-3 text-sm border border-amber-200">
                                <div className="font-semibold text-gray-800">
                                  Linha {item.lineNum}: Preço R$ {item.price.toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-600 mt-2 space-y-1">
                                  <div className="font-semibold">Contexto (linhas próximas):</div>
                                  {item.context.map((ctx, ctxIdx) => (
                                    <div key={ctxIdx} className="font-mono text-xs">
                                      L{ctx.lineNum}: {ctx.content || '(vazia)'}
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-2 flex gap-2 items-center">
                                  <input
                                    type="text"
                                    placeholder="Código SAP"
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                                  />
                                  <button className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
                                    Associar
                                  </button>
                                  <button className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400">
                                    Ignorar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'reajuste' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold">Atenção</p>
                  <p className="mt-1">O reajuste será aplicado em TODOS os materiais da empresa {empresaAtiva?.nome}.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Percentual de Reajuste
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    step="0.01"
                    value={reajustePercentual}
                    onChange={(e) => setReajustePercentual(e.target.value)}
                    placeholder="Ex: 5.5"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="flex items-center px-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 font-semibold">
                    %
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Valores positivos aumentam, negativos diminuem (ex: -3 para reduzir 3%)
                </p>
              </div>
            </div>
          )}

          {activeTab === 'historico' && (
            <div>
              {historico.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma alteração registrada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historico.slice(0, 20).map(item => (
                    <div key={item.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-gray-800">{item.sap}</span>
                          <span className="text-gray-600 ml-2">{item.descricao}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            {new Date(item.data_alteracao).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="text-red-600">R$ {(item.preco_anterior || 0).toFixed(2)}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-green-600 font-semibold">R$ {(item.preco_novo || 0).toFixed(2)}</span>
                        {item.percentual && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-semibold">
                            {item.percentual > 0 ? '+' : ''}{item.percentual}%
                          </span>
                        )}
                        <span className="ml-auto px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                          {item.tipo_alteracao}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-sm font-semibold"
          >
            Fechar
          </button>
          {activeTab === 'import' && importPreview && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 transition text-sm font-semibold disabled:opacity-50"
            >
              {importing ? 'Importando...' : 'Confirmar Importação'}
            </button>
          )}
          {activeTab === 'reajuste' && (
            <button
              onClick={handleReajuste}
              disabled={!reajustePercentual}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition text-sm font-semibold disabled:opacity-50"
            >
              Aplicar Reajuste
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
