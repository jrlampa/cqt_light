/**
 * transformerCalculations.js
 * Utilitários de cálculo elétrico para transformadores BT.
 *
 * Referências normativas:
 *  - ANEEL PRODIST Módulo 8 (Qualidade da Energia Elétrica) — seção 8.1
 *  - ABNT NBR 14039:2005 (Instalações Elétricas de Média Tensão)
 *  - Guia CEMIG DS-EL-01-1
 */

/** Potências nominais padronizadas ABNT (kVA) */
export const POTENCIAS_PADRAO = [15, 30, 45, 75, 112.5, 150, 225, 300, 500, 750, 1000];

/** Tensões primárias comuns no Brasil (V) */
export const TENSOES_PRIMARIAS = [13800, 23000, 34500];

/** Tensões secundárias padrão (V) */
export const TENSOES_SECUNDARIAS = [220, 380];

/** Fator de potência padrão residencial/comercial (PRODIST Módulo 8) */
export const FP_DEFAULT = 0.92;

/** Limites de carregamento — referência ABNT NBR 14039 */
export const LOADING_THRESHOLDS = {
    CRITICO: 90,   // > 90% → substituição urgente
    ALERTA: 70,    // 70–90% → planejar substituição
    ADEQUADO: 45,  // 45–70% → operação normal
    // < 45% → transformador superdimensionado
};

/**
 * Calcula a demanda total em kVA.
 * @param {number} ucs - Número de Unidades Consumidoras
 * @param {number} demandaPorUC - Demanda por UC em VA
 * @param {number} fatorDemanda - Fator de demanda (0–1)
 * @returns {number} Demanda total em kVA
 */
export function calcularDemandaTotal(ucs, demandaPorUC, fatorDemanda) {
    return (ucs * demandaPorUC * fatorDemanda) / 1000;
}

/**
 * Sugere a potência nominal mínima do transformador com margem de 20%
 * conforme ABNT NBR 14039:2005 seção 4.2.1 (reserva mínima de capacidade).
 * @param {number} demandaKVA - Demanda total calculada em kVA
 * @returns {number} Potência padronizada sugerida em kVA
 */
export function sugerirTransformador(demandaKVA) {
    // Margem de 20% exigida pela NBR 14039 para garantir capacidade de pico
    const potencia = POTENCIAS_PADRAO.find(p => p >= demandaKVA * 1.2);
    return potencia ?? POTENCIAS_PADRAO[POTENCIAS_PADRAO.length - 1];
}

/**
 * Calcula a corrente nominal trifásica.
 * @param {number} kva - Potência em kVA
 * @param {number} tensaoV - Tensão de linha em V
 * @returns {number} Corrente em A
 */
export function calcularCorrenteNominal(kva, tensaoV) {
    return (kva * 1000) / (Math.sqrt(3) * tensaoV);
}

/**
 * Calcula a queda de tensão percentual na rede BT (método CEMIG).
 * Fórmula: ΔV% = (√3 × I × L × (R·cosφ + X·senφ)) / V_nom × 100
 * Limite: 7,5% (ANEEL PRODIST Módulo 8, seção 8.1, tabela 8.1).
 * @param {number} corrente - Corrente em A
 * @param {number} resistencia - Resistência do cabo em Ω/km
 * @param {number} reatancia - Reatância do cabo em Ω/km
 * @param {number} comprimento - Comprimento da rede em metros
 * @param {number} tensao - Tensão nominal da rede em V
 * @returns {number} Queda de tensão percentual
 */
export function calcularQuedaTensao(corrente, resistencia, reatancia, comprimento, tensao) {
    const cos_phi = FP_DEFAULT;
    const sin_phi = Math.sqrt(1 - cos_phi ** 2);
    const deltaV = Math.sqrt(3) * corrente * (comprimento / 1000) * (resistencia * cos_phi + reatancia * sin_phi);
    return (deltaV / tensao) * 100;
}

/**
 * Classifica o nível de carregamento do transformador.
 * @param {number} demandaKVA - Demanda total em kVA
 * @param {number} potenciaNominal - Potência instalada do trafo em kVA
 * @returns {{ pct: number, status: string, color: string, bg: string }}
 */
export function nivelCarregamento(demandaKVA, potenciaNominal) {
    const pct = (demandaKVA / potenciaNominal) * 100;
    if (pct > LOADING_THRESHOLDS.CRITICO) {
        return { pct, status: 'CRÍTICO', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
    }
    if (pct > LOADING_THRESHOLDS.ALERTA) {
        return { pct, status: 'ALERTA', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
    }
    if (pct > LOADING_THRESHOLDS.ADEQUADO) {
        return { pct, status: 'ADEQUADO', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
    }
    return { pct, status: 'SUBDIMENSIONADO', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' };
}
