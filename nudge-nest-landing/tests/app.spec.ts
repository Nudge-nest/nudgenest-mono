import { test, expect } from '@playwright/test';

test.describe('App Test', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('hero section is visible', async ({ page }) => {
        await expect(page).toHaveTitle(/Nudgenest/);
        await expect(page.getByLabel('hero-section')).toBeVisible();
        await expect(page.getByText('Turn Every Order Into a 5-Star Review.')).toBeVisible();
    });

    test('get started link is visible', async ({ page }) => {
        await expect(page).toHaveTitle(/Nudgenest/);
        await expect(page.getByRole('link', { name: /Get Started/i })).toBeVisible();
    });

    test('submit feature request link is visible', async ({ page }) => {
        await expect(page).toHaveTitle(/Nudgenest/);
        await expect(page.getByRole('link', { name: /Submit Your Feature Request/i })).toBeVisible();
    });

    test('contact link is visible', async ({ page }) => {
        await expect(page).toHaveTitle(/Nudgenest/);
        await expect(page.getByRole('link', { name: /Contact/i })).toBeVisible();
    });
});
