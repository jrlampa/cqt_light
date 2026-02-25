/**
 * StructureService
 * Domain service for structural validation and BOM (Bill of Materials) intelligence.
 * Maps standard structures (N1, N2, B1, etc.) to their mandatory components.
 */
class StructureService {
    /**
     * Standard Structure Definitions (Simplified for CQT)
     * Maps structure prefixes to required material keywords or SAP categories.
     */
    static STRUCTURE_RULES = {
        'N1': {
            description: 'Rede de Passagem Monofásica/Bifásica Horizontal',
            required: ['ISOLADOR', 'PINO', 'ARMAÇÃO'],
            optional: ['PARA-RAIO'],
            baseMaterials: [
                { sap: 'ISOL-PORC-15KV', quantity: 2, description: 'Isolador de Porcelana 15kV' },
                { sap: 'PINO-TOPO-15KV', quantity: 2, description: 'Pino de Topo' },
                { sap: 'K-ARMACAO-SECUNDARIA', quantity: 1, description: 'Kit Armação Secundária' }
            ]
        },
        'N2': {
            description: 'Rede de Ângulo/Derivação Horizontal',
            required: ['ISOLADOR', 'PINO', 'ARMAÇÃO', 'ALÇA', 'ESTRIBO'],
            optional: ['PARA-RAIO'],
            baseMaterials: [
                { sap: 'ISOL-PORC-15KV', quantity: 4, description: 'Isolador de Porcelana 15kV' },
                { sap: 'ALCA-PREFORMADA', quantity: 4, description: 'Alça Preformada' },
                { sap: 'PINO-BR-15KV', quantity: 2, description: 'Pino para Braço' },
                { sap: 'K-ARMACAO-SECUNDARIA', quantity: 1, description: 'Kit Armação Secundária' }
            ]
        },
        'B1': {
            description: 'Rede em Braço de Suspensão',
            required: ['BRAÇO', 'ISOLADOR', 'ABRAÇADEIRA'],
            optional: [],
            baseMaterials: [
                { sap: 'BRACO-L-2M', quantity: 1, description: 'Braço Tipo L 2.0m' },
                { sap: 'ISOL-PORC-15KV', quantity: 1, description: 'Isolador de Porcelana 15kV' },
                { sap: 'ABRACADEIRA-POSTE', quantity: 2, description: 'Abraçadeira para Poste' }
            ]
        },
        'T': {
            description: 'Poste de Transformação',
            required: ['TRANSFORMADOR', 'PARA-RAIO', 'CHAVE FUSÍVEL', 'ATERRAMENTO', 'SUPORTE'],
            optional: ['DRENAGEM'],
            baseMaterials: [
                { sap: 'PR-10KV-POLIMERICO', quantity: 3, description: 'Para-raios Polimérico 10kV' },
                { sap: 'CH-FUSIVEL-15KV', quantity: 3, description: 'Chave Fusível 15kV' },
                { sap: 'KIT-ATERRAMENTO-BASICO', quantity: 1, description: 'Kit de Aterramento' }
            ]
        },
        'AT': {
            description: 'Kit de Aterramento',
            required: ['HASTE', 'CABO NU', 'CONECTOR'],
            optional: [],
            baseMaterials: [
                { sap: 'HASTE-COPERWELD-2.4', quantity: 3, description: 'Haste de Aterramento' },
                { sap: 'CABO-NU-25MM', quantity: 6, description: 'Cabo de Cobre Nu 25mm' },
                { sap: 'CONECTOR-HASTE', quantity: 3, description: 'Conector para Haste' }
            ]
        },
        'S': {
            description: 'Estrutura de Seccionamento / Chave',
            required: ['CHAVE', 'ISOLADOR', 'ABRAÇADEIRA'],
            optional: ['PARA-RAIO'],
            baseMaterials: [
                { sap: 'CH-FUSIVEL-15KV', quantity: 3, description: 'Chave Fusível 15kV' },
                { sap: 'ISOL-PORC-15KV', quantity: 3, description: 'Isolador de Porcelana 15kV' }
            ]
        }
    };

    /**
     * Returns the base material composition for a structure type.
     * @param {string} structureType 
     */
    static getComposition(structureType) {
        const type = this.resolveStructureType(structureType);
        return this.STRUCTURE_RULES[type]?.baseMaterials || [];
    }

    /**
     * Verifies if a structure has all its mandatory components in the materials list.
     * @param {string} structureType - The code/type of the structure (e.g., 'N1', 'T').
     * @param {Array} materials - List of materials currently assigned to that pole/project.
     * @returns {Object} - Result with status and missing components.
     */
    static verifyIntegrity(structureType, materials) {
        // Resolve type from SAP or code (e.g., "13N1" -> "N1")
        const type = this.resolveStructureType(structureType);
        const rule = this.STRUCTURE_RULES[type];

        if (!rule) {
            return { isValid: true, missing: [], message: 'Estrutura não catalogada para auditoria automática.' };
        }

        const missing = rule.required.filter(req => {
            return !materials.some(m =>
                (m.descricao || "").toUpperCase().includes(req) ||
                (m.sap || "").toUpperCase().includes(req)
            );
        });

        return {
            isValid: missing.length === 0,
            missing,
            description: rule.description,
            message: missing.length > 0
                ? `Estrutura ${type} incompleta. Faltam: ${missing.join(', ')}.`
                : `Estrutura ${type} em conformidade técnica.`
        };
    }

    /**
     * Extracts the base structure type from a string.
     * @param {string} rawType - e.g., "13N2", "T-30", "B1-PADRAO"
     */
    static resolveStructureType(rawType) {
        if (!rawType) return null;
        const upper = rawType.toUpperCase();

        // Search for matches in keys
        for (const key of Object.keys(this.STRUCTURE_RULES)) {
            if (upper.includes(key)) return key;
        }

        return null;
    }

    /**
     * Generates a suggested list of SAPs to fix an incomplete structure.
     * @param {string} type - Structure type.
     * @param {string} missingComponent - Keyword that is missing.
     */
    static suggestCorrection(type, missingComponent) {
        const suggestions = {
            'N1': { 'ISOLADOR': 'ISOL-PORC-15KV', 'PINO': 'PINO-TOPO-15KV' },
            'T': {
                'PARA-RAIO': 'PR-10KV-POLIMERICO',
                'CHAVE FUSÍVEL': 'CH-FUSIVEL-15KV',
                'ATERRAMENTO': 'KIT-ATERRAMENTO-BASICO'
            }
        };

        const resolvedType = this.resolveStructureType(type);
        return suggestions[resolvedType]?.[missingComponent] || `K-GENERICO-${missingComponent}`;
    }
}

module.exports = StructureService;
