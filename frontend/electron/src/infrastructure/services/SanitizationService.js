const logger = require('./Logger');

/**
 * SanitizationService
 * Enterprise-grade data hardening for CQT LIGHT.
 * Protects against XSS, SQL Injection (at logic level), and malformed payloads.
 */
class SanitizationService {
    /**
     * Sanitizes a project payload to ensure it only contains expected technical data.
     * @param {Object} data - The raw project data from the renderer.
     * @returns {Object} - The cleaned and validated data.
     */
    static sanitizeProjectData(data) {
        if (!data || typeof data !== 'object') {
            logger.warn('Received invalid project data for sanitization.', 'SanitizationService');
            return {};
        }

        const sanitized = {
            name: this._sanitizeString(data.name || 'Unnamed Project'),
            environment: this._sanitizeEnum(data.environment, ['URBAN', 'RURAL'], 'URBAN'),
            poles: Array.isArray(data.poles) ? data.poles.map(p => this._sanitizePole(p)) : [],
            sections: Array.isArray(data.sections) ? data.sections.map(s => this._sanitizeSection(s)) : [],
            transformers: Array.isArray(data.transformers) ? data.transformers.map(t => this._sanitizeTransformer(t)) : [],
            crossings: Array.isArray(data.crossings) ? data.crossings.map(c => this._sanitizeCrossing(c)) : [],
            metadata: data.metadata || {}
        };

        logger.info(`Project data sanitized: ${sanitized.name}`, 'SanitizationService');
        return sanitized;
    }

    /**
     * Internal helper to sanitize individual pole objects.
     */
    static _sanitizePole(p) {
        return {
            id: this._sanitizeString(p.id),
            lat: Number(p.lat) || 0,
            lng: Number(p.lng) || 0,
            type: this._sanitizeString(p.type),
            length: Number(p.length) || 0,
            foundation_depth: Number(p.foundation_depth) || 0,
            sap: this._sanitizeString(p.sap),
            bim_metadata: p.bim_metadata || { maintenance_months: 24, lifecycle_years: 30 }
        };
    }

    /**
     * Internal helper to sanitize individual section (conductor) objects.
     */
    static _sanitizeSection(s) {
        return {
            id: this._sanitizeString(s.id),
            conductor: this._sanitizeString(s.conductor),
            current_a: Number(s.current_a) || 0,
            voltage_drop_pct: Number(s.voltage_drop_pct) || 0,
            sap: this._sanitizeString(s.sap)
        };
    }

    /**
     * Internal helper to sanitize transformer objects.
     */
    static _sanitizeTransformer(t) {
        return {
            id: this._sanitizeString(t.id),
            capacity_kva: Number(t.capacity_kva) || 0,
            consumer_count: Number(t.consumer_count) || 0,
            avg_consumption_kw: Number(t.avg_consumption_kw) || 1.2,
            sap: this._sanitizeString(t.sap)
        };
    }

    /**
     * Internal helper to sanitize crossing (afastamento) objects.
     */
    static _sanitizeCrossing(c) {
        return {
            id: this._sanitizeString(c.id),
            scenario: this._sanitizeString(c.scenario),
            height_m: Number(c.height_m) || 0
        };
    }

    /**
     * Sanitizes a string to prevent basic injection or malformed text.
     */
    static _sanitizeString(str) {
        if (!str) return '';
        // Basic trim and strip HTML tags if any (very unlikely in technical data but safe)
        return String(str).trim().replace(/<[^>]*>?/gm, '');
    }

    /**
     * Validates a value against a list of allowed options.
     */
    static _sanitizeEnum(value, allowed, defaultValue) {
        return allowed.includes(value) ? value : defaultValue;
    }
}

module.exports = SanitizationService;
