const { test, expect } = require('@playwright/test');

test.describe('CQT Light Configurator', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5174');
        // Wait for title with higher resilience
        await page.waitForSelector('header h1', { timeout: 30000 });
    });

    test('should load the app and navigate to the map', async ({ page }) => {
        await expect(page.locator('header h1')).toContainText('CQT Light');

        // Navigate to Map
        const mapTab = page.locator('button:has-text("Visualização 2.5D")');
        await mapTab.click();
        await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 15000 });

        // Check map overlay
        await expect(page.locator('span:has-text("Live Structural Analytics")')).toBeVisible();
    });

    test('should complete a full engineering flow', async ({ page }) => {
        // 1. Add a new structure via search input
        const searchInput = page.locator('input[placeholder="Digite o código da estrutura..."]');
        await searchInput.fill('K1');

        // Wait for dropdown results to appear
        await page.waitForSelector('button:has-text("K1")', { timeout: 10000 });
        await searchInput.press('Enter');

        // Wait for it to appear in the list
        await expect(page.locator('div:has-text("K1")').first()).toBeVisible({ timeout: 10000 });

        // 2. Verify Budget Summary
        await expect(page.locator('text=TOTAL GERAL')).toBeVisible({ timeout: 10000 });

        // 3. Trigger technical audit
        const auditBtn = page.locator('button:has-text("Auditar Projeto")');
        await auditBtn.click();
        await expect(page.locator('h2:has-text("Relatório de Auditoria")')).toBeVisible({ timeout: 15000 });
    });
});
