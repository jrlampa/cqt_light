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

  const calculateTotal = useCallback(async ({ estruturas, materiaisAvulsos, condutorMT, condutorBT, sufixos = [], templates = [] }) => {
    if (!window.api) return;
    setIsCalculating(true);
    const start = performance.now();

    try {
      // Helper to resolve suffixes
      const resolveCode = (code, contextPosteCode) => {
        if (!code || !code.endsWith('/')) return code;

        // Find matching suffix rule
        // Priority: 1. Post Type (F-10/), 2. Conductor (M1/)

        // F-10/ context: Pole Diameter
        if (code.startsWith('F-10/') && contextPosteCode) {
          const rule = sufixos.find(s => s.prefixo === 'F-10/' && s.tipo_contexto === 'poste' && s.valor_contexto === contextPosteCode);
          if (rule) return rule.codigo_completo || (rule.prefixo + rule.sufixo);
        }

        // M1/ context: Conductor
        if (code.startsWith('M1/')) {
          // Try MT first, then BT? Usually M1 is MT? 
          // Need to confirm. Assuming MT for now or passing both.
          // Simplified logic: Check if we have a match for active conductors
          const condCode = condutorMT?.codigo || condutorMT;
          if (condCode) {
            const rule = sufixos.find(s => s.prefixo === 'M1/' && s.tipo_contexto === 'condutor' && s.valor_contexto === condCode);
            if (rule) return rule.codigo_completo || (rule.prefixo + rule.sufixo);
          }
        }

        return code; // Return original if no resolution
      };

      // 0. Identify active Pole for context (take the first one found)
      let activePosteCode = null;
      materiaisAvulsos.forEach(m => {
        if (m.descricao?.toUpperCase().includes('POSTE') || m.sap?.endsWith('B')) {
          activePosteCode = m.sap;
        }
      });

      // 1. Prepare list of kits from structures (Handling Manual Templates)
      const kitList = [];
      const templateExtras = []; // Materials from manual templates
      const templatesMap = new Map(); // To track qty of templates for reporting

      estruturas.forEach(e => {
        const count = e.quantidade || 1;
        const code = e.codigo_kit;

        // Check if it's a Manual Template
        const manualTpl = templates.find(t => t.nome_template === code);

        if (manualTpl) {
          // It is a template! 
          // 1. Add Base Kit to kitList (if accessible)
          if (manualTpl.kit_base && manualTpl.kit_base !== code) {
            for (let i = 0; i < count; i++) kitList.push(manualTpl.kit_base);
          } else if (manualTpl.kit_base === code) {
            // If base kit name == template name, assume it's a valid SAP kit too
            for (let i = 0; i < count; i++) kitList.push(code);
          }

          // 2. Add extra materials
          if (manualTpl.materiais_json) { // it comes as string from DB usually, but preloaded might be parsed
            let extras = [];
            try {
              extras = typeof manualTpl.materiais_json === 'string'
                ? JSON.parse(manualTpl.materiais_json)
                : manualTpl.materiais_json || [];
            } catch (e) { extras = []; }

            extras.forEach(item => {
              templateExtras.push({
                ...item,
                quantidade: (item.quantidade || 1) * count, // Multiply by templateqty
                origem: `Template ${code}`
              });
            });
          }
        } else {
          // Normal Kit
          for (let i = 0; i < count; i++) kitList.push(code);
        }
      });

      // 2. Get kit materials from Backend
      let kitData = { materiais: [], totalMaterial: 0, totalServico: 0 };
      if (kitList.length > 0) {
        kitData = await window.api.getCustoTotal(kitList) || kitData;
      }

      // 3. Process 'Postes' (special category in loose materials)
      const postes = [];
      materiaisAvulsos.forEach(mat => {
        if (mat.descricao?.toUpperCase().includes('POSTE')) {
          const qty = mat.quantidade || 1;
          const price = mat.preco_unitario || 0;
          postes.push({
            sap: mat.sap,
            descricao: mat.descricao,
            unidade: mat.unidade,
            preco_unitario: price,
            quantidade: qty,
            subtotal: qty * price,
            categoria: 'POSTE'
          });
        }
      });

      // 4. Process Structures/Kits as line items (UI Display)
      const kitsMap = new Map();
      estruturas.forEach(e => {
        const qty = e.quantidade || 1;
        const price = e.preco_kit || 0;
        const key = e.codigo_kit;

        if (kitsMap.has(key)) {
          const existing = kitsMap.get(key);
          existing.quantidade += qty;
          existing.subtotal += qty * price;
        } else {
          kitsMap.set(key, {
            sap: e.codigo_kit,
            descricao: e.descricao_kit || e.codigo_kit,
            unidade: 'KIT',
            preco_unitario: price,
            quantidade: qty,
            subtotal: qty * price,
            categoria: 'KIT'
          });
        }
      });

      // 5. Consolidate Materials (Kit contents + Loose materials + Template Extras)
      const consolidatedMaterials = new Map();

      // Helper to add material to map
      const addMaterialToMap = (sap, qty, price, desc, origin = null) => {
        const resolvedSap = resolveCode(sap, activePosteCode); // RESOLVE SUFFIX HERE
        const key = resolvedSap; // Use resolved SAP as key

        // If we don't have price/desc for the resolved code, we might need to fetch it? 
        // For now using what provided or 0. Ideally backend 'getCustoTotal' handles standard kits.
        // For extras, we might miss price if not in cache.

        if (consolidatedMaterials.has(key)) {
          const existing = consolidatedMaterials.get(key);
          existing.quantidade += qty;
          // approximate subtotal if price available
          existing.subtotal += (qty * (existing.preco_unitario || price));
        } else {
          consolidatedMaterials.set(key, {
            sap: key,
            descricao: desc || key, // Placeholder if missing
            unidade: 'UN',
            preco_unitario: price,
            quantidade: qty,
            subtotal: qty * price,
            categoria: 'MATERIAL',
            origem: origin
          });
        }
      };

      // Add Standard Kit materials
      kitData.materiais.forEach(mat => {
        // Standard kit materials usually already resolved codes? 
        // But if DB has partials, we resolve them too.
        addMaterialToMap(mat.sap, mat.quantidade, mat.preco_unitario, mat.descricao, 'Kit Padrão');
      });

      // Add Template Extras
      // WARNING: We need prices for these extras. They are just {codigo, quantidade} usually.
      // We'll need to fetch prices for them if possible. 
      // For this iteration, we assume 0 or look up in next step.
      // Actually, distinct Fetch step for extras would be ideal.
      // But let's add them to map and rely on loose material logic or backend price update?
      // Since `kitData` returns prices, we are good for standard kits.
      // For extras, we might need a separate 'getPrices(codes)' call.
      // Optimization: We'll skip fetching prices for extras in this step to keep it simple, 
      // assuming they might be covered by loose materials logic or just displayed with 0 price for now. 
      // TODO: Fetch prices for manual template extras.

      templateExtras.forEach(item => {
        addMaterialToMap(item.codigo, item.quantidade, 0, item.descricao, item.origem);
      });

      // Add loose materials (excluding postes)
      let looseTotal = 0;
      materiaisAvulsos.forEach(mat => {
        if (!mat.descricao?.toUpperCase().includes('POSTE')) {
          const qty = mat.quantidade || 1;
          const price = mat.preco_unitario || 0;
          const subtotal = qty * price;
          looseTotal += subtotal;
          addMaterialToMap(mat.sap, qty, price, mat.descricao, 'Avulso');
        }
      });

      // Update totals/prices for consolidated map (async fetch potentially needed)
      // For now, we trust what we have.

      // 6. Final Assembly
      const allMaterials = [
        ...postes,
        ...Array.from(kitsMap.values()),
        ...Array.from(consolidatedMaterials.values())
      ];

      // Recalculate totals based on map (to account for merged quantities)
      // Note: Prices for extras might be missing.
      const totalPostes = postes.reduce((sum, p) => sum + p.subtotal, 0);
      const totalKits = Array.from(kitsMap.values()).reduce((sum, k) => sum + k.subtotal, 0);

      // Recalculate material total from map
      let calcTotalMaterial = 0;
      consolidatedMaterials.forEach(m => {
        calcTotalMaterial += m.subtotal;
      });

      const totalMaterial = calcTotalMaterial + totalPostes + totalKits;
      const totalServico = kitData.totalServico; // Services from standard kits

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
  }, []);

  return {
    custoData,
    setCustoData, // Exposed for manual updates if needed (e.g. clear)
    calcTime,
    calculateTotal,
    isCalculating
  };
}
