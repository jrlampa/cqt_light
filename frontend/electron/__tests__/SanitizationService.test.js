import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/infrastructure/services/Logger', () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
}));

const SanitizationService = require('../src/infrastructure/services/SanitizationService');

describe('SanitizationService', () => {
    describe('_sanitizeString', () => {
        it('should remove HTML tags', () => {
            const input = '<script>alert("xss")</script>Hello World';
            const output = SanitizationService._sanitizeString(input);
            expect(output).toBe('alert(&quot;xss&quot;)Hello World');
        });

        it('should escape single quotes and backslashes', () => {
            const input = "admin' OR \\";
            const output = SanitizationService._sanitizeString(input);
            expect(output).toBe("admin'' OR \\\\");
        });
    });

    describe('sanitizeProjectData', () => {
        it('should sanitize full project payload recursively', () => {
            const rawData = {
                name: '<b>Project</b>',
                environment: 'URBAN',
                poles: [{ id: 'P1', sap: "POLE'1", lat: '23.5', lng: '-46.6' }],
                sections: [{ sap: 'SEC\\1', current_a: 'invalid' }]
            };

            const sanitized = SanitizationService.sanitizeProjectData(rawData);

            expect(sanitized.name).toBe('Project');
            expect(sanitized.poles[0].sap).toBe("POLE''1");
            // raw: SEC\1 -> replace \ with \\ -> string is SEC\\1
            // output representation in JS for SEC\\1 is "SEC\\\\1" if escaped in string literal or "SEC\\1" in view.
            expect(sanitized.sections[0].sap).toBe("SEC\\\\1");
        });
    });
});
