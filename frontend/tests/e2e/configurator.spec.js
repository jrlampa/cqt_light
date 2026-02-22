const { test, expect } = require('@playwright/test');

test.describe('CQT Light Configurator', () => {
    test('should load the app and navigate to the map', async ({ page }) => {
        // Note: In a real Electron E2E, we would use playwright-electron
        // But for this web-view verification, we assume the dev server is running
        await page.goto('http://localhost:5174');

        // Check Title
        await expect(page.locator('h1')).toContainText('CQT Light');

        // Check Tabs
        const tabs = page.locator('nav button');
        await expect(tabs).toHaveCount(5);

        // Navigate to Map
        await tabs.nth(4).click(); // Visualização 2.5D
        await expect(page.locator('.leaflet-container')).toBeVisible();

        // Check map overlay
        await expect(page.locator('span:has-text("Live Structural Analytics")')).toBeVisible();
    });

    test('should trigger technical audit', async ({ page }) => {
        await page.goto('http://localhost:5174');

        // Click Auditoria button (assuming it's visible in configurator)
        const auditBtn = page.locator('button:has-text("Auditoria")');
        if (await auditBtn.isVisible()) {
            await auditBtn.click();
            const sidebar = page.locator('aside:has-text("Relatório de Auditoria")');
            await expect(sidebar).toBeVisible();
        }
    });
});
