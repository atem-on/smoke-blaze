import { test, expect } from '@playwright/test';
import {
  addProductToCart,
  ensureCartIsEmpty,
  getPurchaseUser,
  parseCartTotal,
  parsePurchaseAmount,
} from './utils';

function getPurchaseStorageState(browserName) {
  return `playwright/.auth/purchase-user-${browserName}.json`;
}

test.describe('Demoblaze purchase flow', () => {
  test.use({
    storageState: async ({ browserName }, use) => {
      await use(getPurchaseStorageState(browserName));
    },
  });

  test('user can add a product to cart and complete purchase', async ({ page }) => {
    const productName = 'Samsung galaxy s6';
    const purchaseUser = getPurchaseUser();

    await ensureCartIsEmpty(page);
    const { productPrice } = await addProductToCart(page, productName);

    await expect(page.locator('#tbodyid')).toContainText(productName);

    await page.getByRole('button', { name: 'Place Order' }).click();
    await expect(page.locator('#orderModal')).toBeVisible();

    const orderModalText = await page.locator('#orderModal').innerText();
    const orderTotal = parseCartTotal(orderModalText);
    expect(orderTotal).toBe(productPrice);

    await page.locator('#name').fill(purchaseUser.name);
    await page.locator('#country').fill(purchaseUser.country);
    await page.locator('#city').fill(purchaseUser.city);
    await page.locator('#card').fill(purchaseUser.card);
    await page.locator('#month').fill(purchaseUser.month);
    await page.locator('#year').fill(purchaseUser.year);

    await page.locator('button[onclick="purchaseOrder()"]').click();

    const confirmationText = await page.locator('body').innerText();
    await expect(page.getByText('Thank you for your purchase!')).toBeVisible({ timeout: 10000 });
    const purchaseAmount = parsePurchaseAmount(confirmationText);
    expect(purchaseAmount).toBe(orderTotal);
    expect(confirmationText).toContain(`Name: ${purchaseUser.name}`);
    expect(confirmationText).toContain(`Card Number: ${purchaseUser.card}`);
  });
});
