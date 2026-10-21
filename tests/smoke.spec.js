import { test, expect } from '@playwright/test';
import {
  addProductToCart,
  ensureCartIsEmpty,
  getPurchaseUser,
  parseCartTotal,
  parsePurchaseAmount,
} from './utils';

test.describe('Demoblaze smoke tests', () => {
  test.use({ storageState: 'playwright/.auth/smoke-user.json' });

  test('authenticated user is loaded from storage state', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#nameofuser')).toBeVisible();
    await expect(page.locator('#nameofuser')).not.toHaveText('');
  });

  test('homepage loads and shows products', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/STORE/);
    await expect(page.getByText('CATEGORIES')).toBeVisible();

    const productLinks = page.locator('#tbodyid .hrefch');
    await expect(productLinks.first()).toBeVisible();
  });

  test('all categories show products', async ({ page }) => {
    await page.goto('/');

    const categories = ['Phones', 'Laptops', 'Monitors'];

    for (const category of categories) {
      await page.getByRole('link', { name: category, exact: true }).click();
      await expect(page.locator('#tbodyid .card-title').first()).toBeVisible();

      const productCount = await page.locator('#tbodyid .card-title').count();
      expect(productCount).toBeGreaterThan(0);
    }
  });

  test('contact form can send a message', async ({ page }) => {
    await page.goto('/');

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toBe('Thanks for the message!!');
      await dialog.accept();
    });

    await page.getByRole('link', { name: 'Contact', exact: true }).click();
    await expect(page.locator('#exampleModal')).toBeVisible();

    await page.locator('#recipient-email').fill('smoke.user@example.com');
    await page.locator('#recipient-name').fill('Smoke User');
    await page.locator('#message-text').fill('This is a smoke test message.');
    await page.locator('button[onclick="send()"]').click();
  });

  test('user can open a product and add it to cart', async ({ page }) => {
    await addProductToCart(page, 'Samsung galaxy s6');
    await expect(page.getByText('Products')).toBeVisible();
    await expect(page.locator('.success > td').nth(1)).toHaveText('Samsung galaxy s6');
  });

});
