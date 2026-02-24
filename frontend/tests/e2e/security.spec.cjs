const { test, expect } = require('@playwright/test');

test.describe('CQT Light Security - Injection Protection', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5174');
    });

    test('should sanitize XSS payload in search inputs', async ({ page }) => {
        // Using "Buscar poste..." as a vector
        const searchInput = page.locator('input[placeholder="Buscar poste..."]');
        if (await searchInput.isVisible()) {
            const xssPayload = '<script>alert("xss")</script><b>Hacked</b>';
            await searchInput.fill(xssPayload);
            await searchInput.press('Enter');

            const value = await searchInput.inputValue();
            // Should be encoded/stripped
            expect(value).not.toContain('<script>');
        }
    });

    test('should sanitize SQLi payload in search inputs', async ({ page }) => {
        const searchInput = page.locator('input[placeholder="Buscar poste..."]');
        if (await searchInput.isVisible()) {
            const sqliPayload = "P1' OR '1'='1";
            await searchInput.fill(sqliPayload);
            await searchInput.press('Enter');

            const value = await searchInput.inputValue();
            // Sanitizer escapes ' as ''
            expect(value).toContain("P1'' OR ''1''=''1");
        }
    });

    test('should maintain strict CSP headers', async ({ page }) => {
        const response = await page.goto('http://localhost:5174');
        const headers = response.headers();
        expect(headers['content-security-policy']).toBeDefined();
        expect(headers['content-security-policy']).toContain("default-src 'self'");
    });
});
