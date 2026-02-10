import { useState, useCallback } from 'react';

export function useBudgetCalculator() {
  const [custoData, setCustoData] = useState({
    materiais: [],
    totalMaterial: 0,
    totalServico: 0,
    totalGeral: 0
  });
  const [calcTime, setCalcTime] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateTotal = useCallback(async ({ estruturas = [], materiaisAvulsos = [], condutorMT, condutorBT, sufixos = [], templates = [] }) => {
    if (!window.api) return;
    setIsCalculating(true);
    const start = performance.now();

    try {
      // Maps for consolidation
      const kitsMap = new Map();
      const consolidatedMaterials = new Map();
      const postes = [];

      // Helper to consolidate materials
      const addMaterialToMap = (sap, qty, price, desc, origin) => {
        if (!sap) return;
        if (consolidatedMaterials.has(sap)) {
          const existing = consolidatedMaterials.get(sap);
          existing.quantidade += qty;
          existing.subtotal = existing.quantidade * (existing.preco_unitario || 0);
          if (origin && !existing.origens.includes(origin)) {
            existing.origens.push(origin);
          }
        } else {
          consolidatedMaterials.set(sap, {
            sap,
            descricao: desc,
            quantidade: qty,
            preco_unitario: price || 0,
            subtotal: qty * (price || 0),
            unidade: 'UN', // Default, will be updated if info exists
            origens: [origin]
          });
        }
      };

      // Pre-process suffixes for O(1) lookup
      const suffixMap = new Map();
      sufixos.forEach(s => {
        const key = `${s.prefixo}|${s.tipo_contexto}|${s.valor_contexto}`;
        suffixMap.set(key, s.codigo_completo || (s.prefixo + s.sufixo));
      });

      // 0. Identify active Pole for context (take the first one found)
      let activePosteCode = null;
      for (const m of materiaisAvulsos) {
        if (m.descricao?.toUpperCase().includes('POSTE') || m.sap?.endsWith('B')) {
          activePosteCode = m.sap;
          break;
        }
      }

      // 1. Prepare list of kits from structures
      const kitList = [];
      const templateExtras = [];
      const templateMap = new Map(templates.map(t => [t.nome_template, t]));

      estruturas.forEach(e => {
        const count = e.quantidade || 1;
        const code = e.codigo_kit;
        const manualTpl = templateMap.get(code);

        if (manualTpl) {
          if (manualTpl.kit_base) {
            const base = manualTpl.kit_base;
            for (let i = 0; i < count; i++) kitList.push(base);
          }

          let extras = e.materiaisResolvidos || [];
          if (!extras.length && manualTpl.materiais_json) {
            try {
              extras = typeof manualTpl.materiais_json === 'string'
                ? JSON.parse(manualTpl.materiais_json)
                : manualTpl.materiais_json;
            } catch { }
          }

          extras.forEach(item => {
            templateExtras.push({
              ...item,
              quantidade: (item.quantidade || 1) * count,
              origem: `Template ${code}`
            });
          });
        } else {
          for (let i = 0; i < count; i++) kitList.push(code);
        }
      });

      // 2. PARALLEL DATA FETCHING
      const extraCodes = new Set(templateExtras.map(e => e.codigo || e.sap).filter(Boolean));

      const [kitResults, extraPricesResult] = await Promise.all([
        kitList.length > 0 ? window.api.getCustoTotal(kitList) : Promise.resolve({ materiais: [], totalMaterial: 0, totalServico: 0 }),
        extraCodes.size > 0 ? window.api.getMaterialsPrices(Array.from(extraCodes)) : Promise.resolve([])
      ]);

      const kitData = kitResults || { materiais: [], totalMaterial: 0, totalServico: 0 };
      const priceMap = new Map();
      extraPricesResult.forEach(p => priceMap.set(p.sap, p));

      // 3. Process Standard Kit Materials
      if (kitData.materiais) {
        kitData.materiais.forEach(m => {
          addMaterialToMap(m.sap, m.quantidade, m.preco_unitario, m.descricao, 'Kits');
        });
      }

      // 4. Process Template Extras
      templateExtras.forEach(item => {
        const sap = item.codigo || item.sap;
        const info = priceMap.get(sap);
        const price = info?.preco_unitario || item.preco_unitario || 0;
        const desc = info?.descricao || item.descricao || sap;
        addMaterialToMap(sap, item.quantidade, price, desc, item.origem);
      });

      // 5. Process Loose Materials
      materiaisAvulsos.forEach(mat => {
        const qty = mat.quantidade || 1;
        const price = mat.preco_unitario || 0;
        const isPoste = mat.descricao?.toUpperCase().includes('POSTE') || mat.sap?.endsWith('B');

        if (isPoste) {
          postes.push({
            ...mat,
            quantidade: qty,
            subtotal: qty * price,
            origens: ['Avulso']
          });
        } else {
          addMaterialToMap(mat.sap, qty, price, mat.descricao, 'Avulso');
        }
      });

      // 6. Final Assembly
      const allMaterials = [
        ...postes,
        ...Array.from(consolidatedMaterials.values())
      ];

      const totalMaterial = allMaterials.reduce((sum, m) => sum + (m.subtotal || 0), 0);
      const totalServico = kitData.totalServico || 0;

      const calcTimeMs = performance.now() - start;
      setCalcTime(calcTimeMs);

      const newCustoData = {
        materiais: allMaterials,
        totalMaterial,
        totalServico,
        totalGeral: totalMaterial + totalServico
      };

      setCustoData(newCustoData);
      return newCustoData;

    } catch (error) {
      console.error("Calculation failed:", error);
    } finally {
      setIsCalculating(false);
    }
  }, [setCalcTime, setCustoData]);

  return {
    custoData,
    setCustoData, // Exposed for manual updates if needed (e.g. clear)
    calcTime,
    calculateTotal,
    isCalculating
  };
}
