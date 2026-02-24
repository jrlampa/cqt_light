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
            lat: this._sanitizeNumber(p.lat),
            lng: this._sanitizeNumber(p.lng),
            type: this._sanitizeString(p.type),
            length: this._sanitizeNumber(p.length),
            foundation_depth: this._sanitizeNumber(p.foundation_depth),
            sap: this._sanitizeString(p.sap),
            bim_metadata: p.bim_metadata ? {
                maintenance_months: this._sanitizeNumber(p.bim_metadata.maintenance_months, 24),
                lifecycle_years: this._sanitizeNumber(p.bim_metadata.lifecycle_years, 30)
            } : { maintenance_months: 24, lifecycle_years: 30 }
        };
    }

    /**
     * Internal helper to sanitize individual section (conductor) objects.
     */
    static _sanitizeSection(s) {
        return {
            id: this._sanitizeString(s.id),
            conductor: this._sanitizeString(s.conductor),
            current_a: this._sanitizeNumber(s.current_a),
            voltage_drop_pct: this._sanitizeNumber(s.voltage_drop_pct),
            sap: this._sanitizeString(s.sap)
        };
    }

    /**
     * Internal helper to sanitize transformer objects.
     */
    static _sanitizeTransformer(t) {
        return {
            id: this._sanitizeString(t.id),
            capacity_kva: this._sanitizeNumber(t.capacity_kva),
            consumer_count: this._sanitizeNumber(t.consumer_count),
            avg_consumption_kw: this._sanitizeNumber(t.avg_consumption_kw, 1.2),
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
            height_m: this._sanitizeNumber(c.height_m)
        };
    }

    /**
     * Sanitizes a string to prevent basic injection or malformed text.
     * Includes XSS encoding and SQL escape (logic level).
     */
    static _sanitizeString(str) {
        if (!str) return '';

        // 1. Convert to string and trim
        let sanitized = String(str).trim();

        // 2. Remove HTML tags (XSS Protection)
        sanitized = sanitized.replace(/<[^>]*>?/gm, '');

        // 3. Escape single quotes and backslashes (SQL Injection Mitigation at logic level)
        // Note: Real parameterized queries in repositories are the primary defense.
        sanitized = sanitized.replace(/'/g, "''").replace(/\\/g, "\\\\");

        // 4. Basic XSS encoding for safety
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            '/': '&#x2F;'
        };
        sanitized = sanitized.replace(/[&<>"\/]/g, (m) => map[m]);

        return sanitized;
    }

    /**
     * Validates and cleans a number.
     */
    static _sanitizeNumber(val, fallback = 0) {
        const num = Number(val);
        return isNaN(num) ? fallback : num;
    }

    /**
     * Validates a value against a list of allowed options.
     */
    static _sanitizeEnum(value, allowed, defaultValue) {
        return allowed.includes(value) ? value : defaultValue;
    }
}

module.exports = SanitizationService;
