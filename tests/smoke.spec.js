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
    await expect(productLinks).toHaveCount(9); //ei tätä
  });

  test('user can open a product and add it to cart', async ({ page }) => {
    await addProductToCart(page, 'Samsung galaxy s6');
    await expect(page.getByText('Products')).toBeVisible();
  });

});
