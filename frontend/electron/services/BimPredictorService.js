/**
 * BimPredictorService
 * Heuristic engine for material categorization based on SAP descriptions.
 * Aligned with Zenith Smart Engineering Standards.
 */

class BimPredictorService {
    constructor() {
        this.patterns = [
            {
                tokens: ['POSTE', 'PTE', 'CONCRETO', 'MADEIRA', 'ACO'],
                category: 'Estrutura / Suporte',
                bim_family: 'Poles',
                confidence_multiplier: 1.2
            },
            {
                tokens: ['CABO', 'CONDUTOR', 'FIO', 'ALUMINIO', 'COBRE', 'CAA', 'CAL'],
                category: 'Condutores / Rede',
                bim_family: 'Conductors',
                confidence_multiplier: 1.1
            },
            {
                tokens: ['TRANSFORMADOR', 'TRAFO', 'POTENCIA', 'KVA'],
                category: 'Equipamentos / Transformação',
                bim_family: 'Transformers',
                confidence_multiplier: 1.5
            },
            {
                tokens: ['CHAVE', 'SECCIONALIZADORA', 'FUSIVEL', 'DISJUNTOR', 'PARA-RAIOS'],
                category: 'Proteção / Manobra',
                bim_family: 'Switchgear',
                confidence_multiplier: 1.3
            },
            {
                tokens: ['ISOLADOR', 'DISCO', 'PORCELANA', 'POLIMERICO'],
                category: 'Isolação',
                bim_family: 'Insulators',
                confidence_multiplier: 1.2
            },
            {
                tokens: ['FERRAGEM', 'MAO FRANCESA', 'PARAFUSO', 'ARRAELA', 'CINTA', 'CRUZETA'],
                category: 'Ferragens / Acessórios',
                bim_family: 'Hardware',
                confidence_multiplier: 1.0
            }
        ];

        this.voltage_markers = [
            { regex: /13[,.]?8\s?KV/i, level: 'MT' },
            { regex: /34[,.]?5\s?KV/i, level: 'MT' },
            { regex: /[0-9]{3}\s?V/i, level: 'BT' },
            { regex: /BAIXA TENS/i, level: 'BT' },
            { regex: /MEDIA TENS/i, level: 'MT' }
        ];
    }

    /**
     * Predicts the BIM category and metadata for a given SAP description.
     * @param {string} description SAP Short Text
     * @returns {Object} Prediction result with confidence score
     */
    predict(description) {
        if (!description) return this.getDefault();

        const text = description.toUpperCase();
        let bestMatch = null;
        let maxScore = 0;

        // 1. Analyze Core Category
        for (const p of this.patterns) {
            let score = 0;
            for (const token of p.tokens) {
                if (text.includes(token)) {
                    score += 10;
                }
            }

            if (score > 0) {
                score *= p.confidence_multiplier;
                if (score > maxScore) {
                    maxScore = score;
                    bestMatch = p;
                }
            }
        }

        // 2. Identify Voltage Level
        let voltage = 'N/A';
        for (const v of this.voltage_markers) {
            if (v.regex.test(text)) {
                voltage = v.level;
                break;
            }
        }

        if (!bestMatch) return this.getDefault();

        // 3. Calculate Confidence Percentage (Heuristic)
        const confidence = Math.min(Math.round((maxScore / 25) * 100), 98);

        return {
            category: bestMatch.category,
            bim_family: bestMatch.bim_family,
            confidence: `${confidence}%`,
            voltage_level: voltage,
            standard: 'ABNT/LIGHT',
            suggested_layer: `ZENITH_${bestMatch.bim_family.toUpperCase()}_${voltage}`
        };
    }

    /**
     * Estimates asset health and lifecycle based on age and material type.
     * @param {Object} asset BIM Asset data (GIS structure)
     * @param {Object} material Material catalog reference
     */
    estimateLifecycle(asset, material) {
        const vidaUtil = asset.vida_util_estimada || material?.vida_util_anos || 30;
        const dataInstalacao = new Date(asset.data_instalacao || Date.now());
        const ageYears = (new Date() - dataInstalacao) / (1000 * 60 * 60 * 24 * 365.25);

        let health = 100 - (ageYears / vidaUtil) * 100;

        // Engineering multipliers: Material-specific decay
        const desc = (material?.descricao || '').toUpperCase();
        if (desc.includes('MADEIRA')) health *= 0.85;
        if (desc.includes('CONCRETO DT')) health *= 1.05;
        if (desc.includes('POLIMERICO')) health *= 0.95;

        health = Math.max(0, Math.min(100, health));

        let status = 'healthy';
        if (health < 35) status = 'critical';
        else if (health < 70) status = 'warning';

        return {
            health: parseFloat(health.toFixed(1)),
            ageYears: parseFloat(ageYears.toFixed(1)),
            remainingLife: parseFloat(Math.max(0, vidaUtil - ageYears).toFixed(1)),
            status,
            remaning_percent: parseFloat(((vidaUtil - ageYears) / vidaUtil * 100).toFixed(1))
        };
    }

    getDefault() {
        return {
            category: 'Diversos / Consumo',
            bim_family: 'General',
            confidence: '15%',
            voltage_level: 'N/A',
            standard: 'Generic',
            suggested_layer: 'ZENITH_MISC'
        };
    }
}

module.exports = new BimPredictorService();
