import { useState, useEffect, useCallback } from 'react';
import { useBudgetCalculator } from '../../hooks/useBudgetCalculator';
import { useKeyboardNav } from '../../hooks/useKeyboardNav';
import { CONDUTORES_MT, CONDUTORES_BT } from './ConductorData';

// Persistence Utilities
const loadState = () => {
    try {
        const saved = localStorage.getItem('cqt_state_v3');
        return saved ? JSON.parse(saved) : {};
    } catch (err) {
        console.error('Failed to load state', err);
        return {};
    }
};

const saveState = (state) => {
    try {
        localStorage.setItem('cqt_state_v3', JSON.stringify(state));
    } catch (err) {
        console.error('Failed to save state', err);
    }
};

export const useConfigurator = (onStateChange) => {
    const initial = loadState();

    // --- STATE ---
    const [activeTab, setActiveTab] = useState('estruturas');
    const [condutorMT, setCondutorMT] = useState(initial.condutorMT || CONDUTORES_MT[0]);
    const [condutorBT, setCondutorBT] = useState(initial.condutorBT || CONDUTORES_BT[2]);

    const [estruturas, setEstruturas] = useState(initial.estruturas || []);
    const [materiaisAvulsos, setMateriaisAvulsos] = useState(initial.materiaisAvulsos || []);
    const [consumers, setConsumers] = useState(initial.consumers || []);

    const [structureQuery, setStructureQuery] = useState('');
    const [structureResults, setStructureResults] = useState([]);
    const [showStructureDropdown, setShowStructureDropdown] = useState(false);

    const [materialQuery, setMaterialQuery] = useState('');
    const [materialResults, setMaterialResults] = useState([]);
    const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);

    const [posteQuery, setPosteQuery] = useState('');
    const [posteResults, setPosteResults] = useState([]);
    const [showPosteDropdown, setShowPosteDropdown] = useState(false);

    const [showMTDropdown, setShowMTDropdown] = useState(false);
    const [showBTDropdown, setShowBTDropdown] = useState(false);

    const [showQtyPopup, setShowQtyPopup] = useState(false);
    const [pendingItem, setPendingItem] = useState(null);
    const [pendingType, setPendingType] = useState('structure');
    const [qty, setQty] = useState(1);

    const [showBudgetHistory, setShowBudgetHistory] = useState(false);
    const [showTemplateManager, setShowTemplateManager] = useState(false);
    const [isManualKitManagerOpen, setIsManualKitManagerOpen] = useState(false);
    const [isPriceManagerOpen, setIsPriceManagerOpen] = useState(false);
    const [showKitDetails, setShowKitDetails] = useState(false);
    const [selectedKit, setSelectedKit] = useState(null);
    const [showPriceManagement, setShowPriceManagement] = useState(false);
    const [empresaAtiva, setEmpresaAtiva] = useState(null);

    const [showResolutionModal, setShowResolutionModal] = useState(false);
    const [pendingResolutionKit, setPendingResolutionKit] = useState(null);
    const [pendingResolutionMaterials, setPendingResolutionMaterials] = useState([]);

    const [sufixos, setSufixos] = useState([]);
    const [manualTemplates, setManualTemplates] = useState([]);

    const [auditResults, setAuditResults] = useState([]);
    const [isAuditing, setIsAuditing] = useState(false);
    const [showAuditReport, setShowAuditReport] = useState(false);

    const [showAssistant, setShowAssistant] = useState(true);
    const [engineeringReport, setEngineeringReport] = useState(null);

    // --- HOOKS ---
    const { custoData, setCustoData, calculateTotal } = useBudgetCalculator();

    const copySummary = useCallback(() => {
        const summary = `ORÇAMENTO CQT LIGHT\n\n` +
            `Material: R$ ${custoData.totalMaterial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
            `Mão de Obra: R$ ${custoData.totalServico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
            `TOTAL: R$ ${custoData.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
            `Materiais (${custoData.materiais.length}):\n` +
            custoData.materiais.map(m =>
                `${m.sap} - ${m.descricao} (${m.quantidade} ${m.unidade}) - R$ ${m.subtotal.toFixed(2)}`
            ).join('\n');

        navigator.clipboard.writeText(summary).then(() => {
            alert('✅ Resumo copiado para área de transferência!');
        });
    }, [custoData]);

    const actions = {
        onEscape: () => {
            setShowStructureDropdown(false);
            setShowMaterialDropdown(false);
            setShowPosteDropdown(false);
            setShowMTDropdown(false);
            setShowBTDropdown(false);
            setShowQtyPopup(false);
        },
        onCopy: copySummary,
        onCalculate: () => calculateTotal({
            estruturas,
            materiaisAvulsos,
            condutorMT,
            condutorBT,
            sufixos,
            templates: manualTemplates
        }),
        onToggleAssistant: () => setShowAssistant(prev => !prev)
    };

    const nav = useKeyboardNav(actions);

    // --- HANDLERS ---
    const searchPoste = async (query) => {
        setPosteQuery(query);
        if (!window.api || !query.trim()) { setPosteResults([]); setShowPosteDropdown(false); return; }
        const results = await window.api.searchMaterials(query);
        const poles = results.filter(m =>
            m.descricao.toUpperCase().includes('POSTE') ||
            (m.tipo || '').toUpperCase().includes('POSTE')
        );
        setPosteResults(poles);
        setShowPosteDropdown(poles.length > 0);
        nav.setPosteHighlight(0);
    };

    const searchStructure = async (query) => {
        setStructureQuery(query);
        if (!window.api || !query.trim()) { setStructureResults([]); setShowStructureDropdown(false); return; }
        const results = await window.api.searchKits(query);
        setStructureResults(results || []);
        setShowStructureDropdown((results || []).length > 0);
        nav.setStructureHighlight(0);
    };

    const searchMaterial = async (query) => {
        setMaterialQuery(query);
        if (!window.api || !query.trim()) { setMaterialResults([]); setShowMaterialDropdown(false); return; }
        const results = await window.api.searchMaterials(query);
        setMaterialResults((results || []).slice(0, 15));
        setShowMaterialDropdown((results || []).length > 0);
        nav.setMaterialHighlight(0);
    };

    const openQtyPopup = (item, type) => {
        setShowStructureDropdown(false);
        setShowMaterialDropdown(false);
        setShowPosteDropdown(false);
        setShowMTDropdown(false);
        setShowBTDropdown(false);

        if (type === 'structure') setStructureQuery('');
        if (type === 'material') setMaterialQuery('');

        setPendingItem(item);
        setPendingType(type);
        setQty(1);
        setShowQtyPopup(true);
        setTimeout(() => nav.focusQty(), 50);
    };

    const confirmAddItem = () => {
        if (!pendingItem) return;

        if (pendingType === 'structure') {
            if (pendingItem.tipo === 'manual' && pendingItem.materiais_json) {
                let materials = [];
                try {
                    materials = typeof pendingItem.materiais_json === 'string'
                        ? JSON.parse(pendingItem.materiais_json)
                        : pendingItem.materiais_json;
                } catch (e) { console.error("Error parsing materials", e); }

                const hasPartials = materials.some(m => m.isPartial || (m.codigo && m.codigo.trim().endsWith('/')));

                if (hasPartials) {
                    setPendingResolutionKit(pendingItem);
                    setPendingResolutionMaterials(materials);
                    setShowResolutionModal(true);
                    setShowQtyPopup(false);
                    return;
                }
            }

            const entry = { ...pendingItem, id: Date.now(), quantidade: qty };
            setEstruturas(prev => [entry, ...prev]);
            setStructureQuery('');
            setStructureResults([]);
            setShowStructureDropdown(false);
            nav.focusStructure();
        } else {
            const entry = { ...pendingItem, id: Date.now(), quantidade: qty };
            setMateriaisAvulsos(prev => [entry, ...prev]);
            setMaterialQuery('');
            setMaterialResults([]);
            setShowMaterialDropdown(false);
            nav.focusMaterial();
        }
        setShowQtyPopup(false);
        setPendingItem(null);
    };

    const handleResolutionConfirm = (resolvedMaterials) => {
        const entry = {
            ...pendingResolutionKit,
            id: Date.now(),
            quantidade: qty,
            materiaisResolvidos: resolvedMaterials
        };

        setEstruturas(prev => [entry, ...prev]);
        setStructureQuery('');
        setStructureResults([]);
        setShowStructureDropdown(false);
        nav.focusStructure();

        setShowResolutionModal(false);
        setPendingResolutionKit(null);
        setPendingResolutionMaterials([]);
        setPendingItem(null);
    };

    const clearAll = () => {
        if (!confirm('Limpar toda a configuração?')) return;
        setEstruturas([]);
        setMateriaisAvulsos([]);
        setCustoData({ materiais: [], totalMaterial: 0, totalServico: 0, totalGeral: 0 });
        localStorage.removeItem('cqt_state_v3');
    };

    const handleGenerateMemorial = async () => {
        if (!window.api) return;
        try {
            const [sagReport, smartBOM] = await Promise.all([
                window.api.calculateSag({ span: 35, conductor: condutorMT }),
                window.api.rationalizeBOM(materiaisAvulsos)
            ]);

            const projectData = {
                structures: estruturas,
                materials: materiaisAvulsos,
                engineeringReport,
                sagReport,
                smartBOM,
                costData: custoData
            };
            const memorial = await window.api.generateTechnicalMemorial(projectData);
            const blob = new Blob([memorial], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Memorial_Tecnico_Zenith_${Date.now()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('📝 Memorial Técnico gerado com sucesso!');
        } catch (err) {
            console.error('Failed to generate memorial', err);
            alert('❌ Erro ao gerar memorial técnico.');
        }
    };

    const runAudit = async () => {
        if (!window.api) return;
        try {
            setIsAuditing(true);
            setShowAuditReport(true);
            const projectData = { condutorMT, condutorBT, estruturas, materiaisAvulsos };
            const results = await window.api.auditProject(projectData);
            setAuditResults(results);
        } catch (err) {
            console.error('Audit failed', err);
            setAuditResults([{ severity: 'CRITICAL', code: 'INTERNAL_ERROR', message: 'Falha ao processar auditoria técnica.' }]);
        } finally {
            setIsAuditing(false);
        }
    };

    const applyEngineeringFix = () => {
        if (!engineeringReport || engineeringReport.status === 'SAFE') return;
        setMateriaisAvulsos(prev => prev.map(m => {
            if (m.descricao.toUpperCase().includes('POSTE')) {
                return { ...m, descricao: `POSTE CONCRETO DT ${100 * Math.ceil(engineeringReport.totalLoadDaN / 100) + 300} daN` };
            }
            return m;
        }));
        alert('🛠️ Correção automática aplicada: Poste atualizado para suportar a carga calculada.');
    };

    const applyOptimization = (suggestion) => {
        setMateriaisAvulsos(prev => prev.map(m =>
            m.sap === suggestion.original_sap
                ? { ...m, sap: suggestion.suggested_sap, descricao: suggestion.suggested_name }
                : m
        ));
        alert(`🚀 Otimização aplicada: ${suggestion.suggested_name}`);
    };

    // --- EFFECTS ---
    useEffect(() => {
        if (window.api) {
            window.api.getAllSufixos().then(setSufixos).catch(console.error);
            window.api.getAllTemplatesManuais().then(setManualTemplates).catch(console.error);
        }
    }, []);

    useEffect(() => {
        saveState({ condutorMT, condutorBT, estruturas, materiaisAvulsos, consumers });
        if (onStateChange) {
            onStateChange({
                poles: estruturas,
                sections: [],
                condutorMT,
                condutorBT,
                materiaisAvulsos,
                consumers
            });
        }
    }, [condutorMT, condutorBT, estruturas, materiaisAvulsos, consumers, onStateChange]);

    useEffect(() => {
        calculateTotal({ estruturas, materiaisAvulsos, condutorMT, condutorBT, sufixos, templates: manualTemplates });

        if (showAssistant && window.api && estruturas.length > 0) {
            const pole = materiaisAvulsos.find(m => m.descricao.toUpperCase().includes('POSTE')) || { esforco_nom_dan: 300 };
            window.api.calculateStress({
                pole,
                structures: estruturas,
                conductors: { mt: condutorMT, bt: condutorBT }
            }).then(setEngineeringReport).catch(console.error);
        } else {
            setEngineeringReport(null);
        }
    }, [estruturas, materiaisAvulsos, condutorMT, condutorBT, sufixos, manualTemplates, calculateTotal, showAssistant]);

    useEffect(() => {
        if (!isManualKitManagerOpen && window.api) {
            window.api.getAllTemplatesManuais().then(setManualTemplates).catch(console.error);
        }
    }, [isManualKitManagerOpen]);

    return {
        state: {
            activeTab, setActiveTab,
            condutorMT, setCondutorMT,
            condutorBT, setCondutorBT,
            estruturas, setEstruturas,
            materiaisAvulsos, setMateriaisAvulsos,
            structureQuery, setStructureQuery,
            structureResults, setStructureResults,
            showStructureDropdown, setShowStructureDropdown,
            materialQuery, setMaterialQuery,
            materialResults, setMaterialResults,
            showMaterialDropdown, setShowMaterialDropdown,
            posteQuery, setPosteQuery,
            posteResults, setPosteResults,
            showPosteDropdown, setShowPosteDropdown,
            showMTDropdown, setShowMTDropdown,
            showBTDropdown, setShowBTDropdown,
            showQtyPopup, setShowQtyPopup,
            pendingItem, setPendingItem,
            pendingType, setPendingType,
            qty, setQty,
            showBudgetHistory, setShowBudgetHistory,
            showTemplateManager, setShowTemplateManager,
            isManualKitManagerOpen, setIsManualKitManagerOpen,
            isPriceManagerOpen, setIsPriceManagerOpen,
            showKitDetails, setShowKitDetails,
            selectedKit, setSelectedKit,
            showPriceManagement, setShowPriceManagement,
            empresaAtiva, setEmpresaAtiva,
            showResolutionModal, setShowResolutionModal,
            pendingResolutionKit, setPendingResolutionKit,
            pendingResolutionMaterials, setPendingResolutionMaterials,
            auditResults, setAuditResults,
            isAuditing, setIsAuditing,
            showAuditReport, setShowAuditReport,
            showAssistant, setShowAssistant,
            engineeringReport, setEngineeringReport,
            custoData, setCustoData,
            sufixos, manualTemplates,
            consumers, setConsumers
        },
        handlers: {
            searchPoste, searchStructure, searchMaterial,
            openQtyPopup, confirmAddItem, handleResolutionConfirm,
            removeStructure: (id) => setEstruturas(prev => prev.filter(e => e.id !== id)),
            removeMaterial: (id) => setMateriaisAvulsos(prev => prev.filter(m => m.id !== id)),
            openKitDetails: (kit) => { setSelectedKit(kit); setShowKitDetails(true); },
            updateKitMateriais: (materiaisExtras, moOverride) => {
                if (!selectedKit) return;
                setEstruturas(prev => prev.map(kit => kit.id === selectedKit.id ? { ...kit, materiaisExtras, moOverride } : kit));
            },
            clearAll, handleGenerateMemorial, runAudit,
            applyEngineeringFix, applyOptimization,
            loadBudget: (data) => {
                if (!data) return;
                setCondutorMT(data.condutorMT);
                setCondutorBT(data.condutorBT);
                setEstruturas(data.estruturas || []);
                setMateriaisAvulsos(data.materiaisAvulsos || []);
                alert('✅ Orçamento carregado com sucesso!');
            },
            loadTemplate: (data) => {
                if (!data) return;
                setCondutorMT(data.condutorMT);
                setCondutorBT(data.condutorBT);
                setEstruturas(data.estruturas || []);
                setMateriaisAvulsos(data.materiaisAvulsos || []);
            }
        },
        nav
    };
};
