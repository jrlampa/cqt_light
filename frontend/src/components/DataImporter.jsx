import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function DataImporter() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setResult(null);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            // Validate structure roughly
            if (!jsonData.length) throw new Error('O arquivo está vazio.');

            // Map columns (Flexible matching)
            const mappedData = jsonData.map(row => {
                // Try to find SAP/Code column
                const sap = row['SAP'] || row['sap'] || row['Codigo'] || row['Código'] || row[' MATERIAL ']; // Trim needed?
                // Try to find Price column
                const price = row['Preco_Unitario'] || row['Preco'] || row['Preço'] || row['Valor'] || row[' PRICE '];

                return {
                    sap: sap ? String(sap).trim() : null,
                    preco_unitario: price ? parseFloat(String(price).replace(',', '.')) : undefined
                };
            }).filter(item => item.sap && !isNaN(item.preco_unitario));

            if (mappedData.length === 0) {
                throw new Error('Não foi possível identificar as colunas "SAP" e "Preco" no arquivo.');
            }

            // Send to backend
            if (window.api) {
                const count = await window.api.importPrecosFromArray(
                    1, // Default Empresa ID 1 for now, hardcoded as 'Standard'
                    mappedData,
                    'importacao_excel'
                );
                setResult({ success: true, count });
            }

        } catch (err) {
            console.error(err);
            setResult({ success: false, message: err.message });
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden">
                <div className="p-8 text-center border-b border-gray-100 bg-gradient-to-b from-indigo-50/50 to-white">
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <Upload className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Importação de Dados</h2>
                    <p className="text-gray-500 mt-2 max-w-md mx-auto">
                        Atualize o banco de dados enviando planilhas Excel ou CSV. O sistema detectará automaticamente as colunas SAP e Preço.
                    </p>
                </div>

                <div className="p-8">
                    <div className="flex flex-col items-center justify-center w-full">
                        <label
                            htmlFor="dropzone-file"
                            className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300
                ${loading
                                    ? 'bg-gray-50 border-gray-300 cursor-not-allowed'
                                    : 'bg-white border-indigo-200 hover:bg-indigo-50/50 hover:border-indigo-400 hover:shadow-md'
                                }
              `}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                {loading ? (
                                    <>
                                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
                                        <p className="text-sm text-gray-500">Processando arquivo...</p>
                                    </>
                                ) : (
                                    <>
                                        <FileSpreadsheet className="w-10 h-10 text-indigo-400 mb-3" />
                                        <p className="mb-2 text-sm text-gray-600">
                                            <span className="font-semibold text-indigo-600">Clique para enviar</span> ou arraste o arquivo aqui
                                        </p>
                                        <p className="text-xs text-gray-400">XLSX, XLS ou CSV</p>
                                    </>
                                )}
                            </div>
                            <input
                                id="dropzone-file"
                                type="file"
                                className="hidden"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileUpload}
                                disabled={loading}
                                ref={fileInputRef}
                            />
                        </label>
                    </div>

                    {result && (
                        <div className={`mt-6 p-4 rounded-lg flex items-start gap-3 animate-in fade-in zoom-in-95 ${result.success ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'
                            }`}>
                            {result.success ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                            ) : (
                                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                            )}
                            <div>
                                <h4 className={`font-semibold ${result.success ? 'text-emerald-900' : 'text-red-900'}`}>
                                    {result.success ? 'Importação Concluída' : 'Erro na Importação'}
                                </h4>
                                <p className={`text-sm mt-1 ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
                                    {result.success
                                        ? `Sucesso! Total de ${result.count} preços atualizados no banco de dados.`
                                        : result.message
                                    }
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
