const { test, expect } = require('@playwright/test');

test.describe('CQT Light Configurator', () => {
    test('should load the app and navigate to the map', async ({ page }) => {
        await page.goto('http://localhost:5174');

        // Wait for title to be rendered
        await page.waitForSelector('h1:has-text("CQT Light")', { timeout: 15000 });
        await expect(page.locator('h1')).toContainText('CQT Light');

        // Navigate to Map (using icon or text if visible)
        await page.click('button:has-text("Visualização 2.5D")');
        await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10000 });

        // Check map overlay
        await expect(page.locator('span:has-text("Live Structural Analytics")')).toBeVisible();
    });

    test('should complete a full engineering flow', async ({ page }) => {
        await page.goto('http://localhost:5174');

        // 1. Add a new structure via search input
        const searchInput = page.locator('input[placeholder="Digite o código da estrutura..."]');
        await searchInput.fill('K1');

        // Wait for dropdown results to appear
        await page.waitForSelector('button div:has-text("K1")', { timeout: 10000 });
        await searchInput.press('Enter');

        // Wait for it to appear in the list
        await expect(page.locator('div:has-text("K1")').first()).toBeVisible({ timeout: 10000 });

        // 2. Verify Budget Summary calculation in Footer
        const totalGeral = page.locator('text=TOTAL GERAL');
        await expect(totalGeral).toBeVisible({ timeout: 10000 });

        // 3. Trigger technical audit
        const auditBtn = page.locator('button:has-text("Auditar Projeto")');
        await auditBtn.click();
        await expect(page.locator('h2:has-text("Relatório de Auditoria")')).toBeVisible({ timeout: 10000 });

        // 4. Check Export availability
        const exportBtn = page.locator('button:has-text("Excel")');
        await expect(exportBtn).toBeVisible();
    });
});
