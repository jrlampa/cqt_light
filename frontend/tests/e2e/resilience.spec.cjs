const { test, expect } = require('@playwright/test');

test.describe('CQT Light Resilience Suite', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5174');
        await page.waitForSelector('h1:has-text("CQT Light")', { timeout: 30000 });
    });

    test('Chaos Testing: UI resilience to IPC failures', async ({ page }) => {
        await page.evaluate(() => {
            if (window.api) {
                const originalSearch = window.api.searchKits;
                window.api.searchKits = async (query) => {
                    if (Math.random() > 0.5) throw new Error('Chaos: IPC Failure');
                    return originalSearch(query);
                };
            }
        });

        const searchInput = page.locator('input[placeholder="Digite o código da estrutura..."]');
        await searchInput.fill('K1');
        await searchInput.press('Enter');
        await expect(page.locator('h1:has-text("CQT Light")')).toBeVisible();
    });

    test('Fuzzy & Monte Carlo: Random Configuration Stress', async ({ page }) => {
        const kits = ['K1', 'K2', 'K3', 'C1', 'C2'];

        for (let i = 0; i < 5; i++) {
            const randomKit = kits[Math.floor(Math.random() * kits.length)];
            const searchInput = page.locator('input[placeholder="Digite o código da estrutura..."]');
            await searchInput.clear();
            await searchInput.fill(randomKit);
            await page.waitForTimeout(400);
            await searchInput.press('Enter');

            const qtyInput = page.locator('input[type="number"]');
            if (await qtyInput.isVisible({ timeout: 800 })) {
                await qtyInput.fill((Math.floor(Math.random() * 5) + 1).toString());
                await qtyInput.press('Enter');
            }
            await page.waitForTimeout(200);
        }
        await expect(page.locator('div:has-text("TOTAL GERAL")')).toBeVisible({ timeout: 15000 });
    });

    test('Dumb User / Monkey Test: Rapid incoherent interactions', async ({ page }) => {
        for (let i = 0; i < 15; i++) {
            const buttons = page.locator('button');
            const count = await buttons.count();
            if (count > 0) {
                const idx = Math.floor(Math.random() * count);
                try {
                    await buttons.nth(idx).click({ timeout: 500 });
                } catch (e) { }
            }
            await page.keyboard.press('Escape');
            await page.waitForTimeout(100);
        }
        await expect(page.locator('h1')).toContainText('CQT Light');
    });
});
