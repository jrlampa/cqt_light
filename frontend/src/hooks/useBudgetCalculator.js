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

  const calculateTotal = useCallback(async ({ estruturas, materiaisAvulsos }) => {
    if (!window.api) return;
    setIsCalculating(true);
    const start = performance.now();

    try {
      // 1. Prepare list of kits from structures
      const kitList = [];
      estruturas.forEach(e => {
        const count = e.quantidade || 1;
        for (let i = 0; i < count; i++) kitList.push(e.codigo_kit);
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

      // 4. Process Structures/Kits as line items
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

      // 5. Consolidate Materials (Kit contents + Loose materials)
      const consolidatedMaterials = new Map();

      // Add kit materials
      kitData.materiais.forEach(mat => {
        const key = mat.sap;
        if (consolidatedMaterials.has(key)) {
          const existing = consolidatedMaterials.get(key);
          existing.quantidade += mat.quantidade || 0;
          existing.subtotal += mat.subtotal || 0;
        } else {
          consolidatedMaterials.set(key, {
            ...mat,
            categoria: 'MATERIAL'
          });
        }
      });

      // Add loose materials (excluding postes)
      let looseTotal = 0;
      materiaisAvulsos.forEach(mat => {
        if (!mat.descricao?.toUpperCase().includes('POSTE')) {
          const key = mat.sap;
          const qty = mat.quantidade || 1;
          const price = mat.preco_unitario || 0;
          const subtotal = qty * price;
          looseTotal += subtotal;

          if (consolidatedMaterials.has(key)) {
            const existing = consolidatedMaterials.get(key);
            existing.quantidade += qty;
            existing.subtotal += subtotal;
          } else {
            consolidatedMaterials.set(key, {
              sap: mat.sap,
              descricao: mat.descricao,
              unidade: mat.unidade,
              preco_unitario: price,
              quantidade: qty,
              subtotal: subtotal,
              categoria: 'MATERIAL'
            });
          }
        }
      });

      // 6. Final Assembly
      const allMaterials = [
        ...postes,
        ...Array.from(kitsMap.values()),
        ...Array.from(consolidatedMaterials.values())
      ];

      const totalPostes = postes.reduce((sum, p) => sum + p.subtotal, 0);
      const totalKits = Array.from(kitsMap.values()).reduce((sum, k) => sum + k.subtotal, 0);

      const totalMaterial = kitData.totalMaterial + looseTotal + totalPostes + totalKits;
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
  }, []);

  return {
    custoData,
    setCustoData, // Exposed for manual updates if needed (e.g. clear)
    calcTime,
    calculateTotal,
    isCalculating
  };
}
