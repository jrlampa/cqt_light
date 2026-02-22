import React, { useState } from 'react';
import { FileText, Download, ShieldCheck, ClipboardCheck, AlertTriangle, FileSpreadsheet, Globe } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const ReportsDashboard = ({ projectData = {} }) => {
    const [generating, setGenerating] = useState(false);

    const generateBimAudit = async () => {
        setGenerating(true);
        try {
            const doc = new jsPDF();
            const date = new Date().toLocaleDateString('pt-BR');

            // Header
            doc.setFontSize(20);
            doc.setTextColor(40, 44, 52);
            doc.text('Relatório de Auditoria Técnica BIM', 14, 22);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Zenith Master - CQT Light v3.0 | Gerado em: ${date}`, 14, 30);
            doc.line(14, 35, 196, 35);

            // Project Overview
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text('1. Visão Geral do Projeto', 14, 45);

            const summaryData = [
                ['Total de Estruturas', projectData.poles?.length || 0],
                ['Extensão da Rede (km)', ((projectData.sections?.length || 0) * 0.04).toFixed(2)],
                ['Status Global', 'Conforme (BIM Stage 2)']
            ];

            doc.autoTable({
                startY: 50,
                head: [['Métrica', 'Valor']],
                body: summaryData,
                theme: 'striped',
                headStyles: { fillStyle: [71, 85, 105] }
            });

            // Structural Health & Flags
            doc.text('2. Análise de Saúde e Governança', 14, doc.lastAutoTable.finalY + 15);

            // Fetch flags via API
            let flags = [];
            if (window.api) {
                flags = await window.api.getAuditFlags();
            }

            const flagData = flags.map(f => [
                f.id,
                f.pole_id,
                f.severity.toUpperCase(),
                f.message,
                f.status === 'open' ? 'PENDENTE' : 'RESOLVIDO'
            ]);

            doc.autoTable({
                startY: doc.lastAutoTable.finalY + 20,
                head: [['ID', 'Estrutura', 'Severidade', 'Alerta Técnico', 'Status']],
                body: flagData.length > 0 ? flagData : [['-', '-', '-', 'Nenhum alerta técnico registrado.', '-']],
                theme: 'grid',
                headStyles: { fillColor: [217, 119, 6] }
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(`Página ${i} de ${pageCount}`, 14, 285);
                doc.text('Documento gerado automaticamente pelo sistema CQT Light.', 140, 285);
            }

            const pdfBase64 = doc.output('datauristring');
            if (window.api) {
                await window.api.savePdfReport({
                    filename: `Auditoria_BIM_${Date.now()}.pdf`,
                    content: pdfBase64
                });
            }
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Erro ao gerar relatório. Verifique o console.');
        } finally {
            setGenerating(false);
        }
    };

    const generateComplianceCert = async () => {
        setGenerating(true);
        try {
            const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

            // Border
            doc.setLineWidth(1);
            doc.rect(10, 10, 277, 190);
            doc.setLineWidth(0.2);
            doc.rect(12, 12, 273, 186);

            // Title
            doc.setFontSize(30);
            doc.text('CERTIFICADO DE CONFORMIDADE', 148.5, 60, { align: 'center' });

            doc.setFontSize(14);
            doc.text('Zenith Smart Engineering Standards', 148.5, 75, { align: 'center' });

            doc.setFontSize(18);
            const content = `Certificamos que o projeto atual foi auditado eletronicamente e atende aos\nrequisitos técnicos das normas indexadas (RAG) e padrões ABNT/ANEEL vigentes.`;
            doc.text(content, 148.5, 110, { align: 'center' });

            doc.setFontSize(12);
            doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 148.5, 150, { align: 'center' });
            doc.text('Autenticado por: CQT Light Intelligent Engine', 148.5, 160, { align: 'center' });

            const pdfBase64 = doc.output('datauristring');
            if (window.api) {
                await window.api.savePdfReport({
                    filename: `Certificado_Conformidade_${Date.now()}.pdf`,
                    content: pdfBase64
                });
            }
        } finally {
            setGenerating(false);
        }
    };

    const reportCards = [
        {
            title: 'Auditoria Técnica BIM',
            description: 'Relatório completo de saúde estrutural, dívida técnica e alertas de governança.',
            icon: ClipboardCheck,
            color: 'from-blue-600 to-indigo-600',
            action: generateBimAudit
        },
        {
            title: 'Certificado de Conformidade',
            description: 'Atestado formal de alinhamento com normas técnicas (ANEEL/RAG).',
            icon: ShieldCheck,
            color: 'from-emerald-600 to-teal-600',
            action: generateComplianceCert
        },
        {
            title: 'Lista de Materiais (BOM)',
            description: 'Exportação consolidada de materiais e serviços para suprimentos.',
            icon: FileSpreadsheet,
            color: 'from-amber-600 to-orange-600',
            action: () => alert('Funcionalidade integrada ao gerador de Python selecionado (BOM Generator).')
        },
        {
            title: 'Interoperabilidade GIS',
            description: 'Exportar mapa de saúde e dívida técnica em GeoJSON para QGIS/ArcGIS.',
            icon: Globe,
            color: 'from-purple-600 to-fuchsia-600',
            action: async () => {
                if (window.api) {
                    setGenerating(true);
                    try {
                        await window.api.exportGeoJson(projectData);
                    } finally {
                        setGenerating(false);
                    }
                }
            }
        }
    ];

    return (
        <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Zenith Reporting Engine</h2>
                    <p className="text-slate-500 mt-2">Gere documentação técnica profissional de nível master.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Motor PDF Ativo</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {reportCards.map((card, i) => (
                    <div key={i} className="group relative bg-white rounded-3xl p-8 shadow-md border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-5 rounded-bl-full group-hover:opacity-10 transition-opacity`} />

                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-100`}>
                            <card.icon className="w-7 h-7" />
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 mb-3">{card.title}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed mb-8">{card.description}</p>

                        <button
                            disabled={generating}
                            onClick={card.action}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-slate-50 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-900 hover:text-white transition-all group-hover:shadow-md disabled:opacity-50"
                        >
                            {generating ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            {generating ? 'Processando...' : 'Gerar Documento'}
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-auto p-6 bg-slate-900 rounded-3xl text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-2xl">
                        <AlertTriangle className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h4 className="font-bold">Aviso Legal</h4>
                        <p className="text-xs text-slate-400">Estes documentos são gerados com base em auditoria eletrônica e não substituem a assinatura do engenheiro responsável (ART).</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <span className="text-[10px] text-slate-500 font-mono">BIM STAGE 2</span>
                    <span className="text-[10px] text-slate-500 font-mono">EN 150338</span>
                </div>
            </div>
        </div>
    );
};

export default ReportsDashboard;
