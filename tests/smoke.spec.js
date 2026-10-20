import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

function getPurchaseUser() {
  const csvPath = path.resolve(__dirname, 'data/purchase-user.csv');
  const csvText = readFileSync(csvPath, 'utf8');
  const [headerLine, dataLine] = csvText.trim().split(/\r?\n/);
  const headers = headerLine.split(',').map((header) => header.trim());
  const values = dataLine.split(',').map((value) => value.trim());

  return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
}

function parseProductPrice(text) {
  const match = text.match(/\$\s*(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function parseCartTotal(text) {
  const match = text.match(/Total\s*[:\n]?\s*\$?(\d+(?:\.\d+)?)/i) || text.match(/\b(\d+(?:\.\d+)?)\s*USD/i);
  return match ? Number(match[1]) : null;
}

function parsePurchaseAmount(text) {
  const match = text.match(/Amount\s*:\s*(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : null;
}

async function ensureCartIsEmpty(page) {
  await page.goto('/');
  await page.getByRole('link', { name: 'Cart', exact: true }).click();
  await page.waitForURL(/cart\.html/);

  const deleteButtons = page.locator('a[onclick*="deleteItem"]');
  const count = await deleteButtons.count();

  if (count > 0) {
    for (let i = 0; i < count; i++) {
      await deleteButtons.first().click();
      await page.waitForTimeout(200);
    }
  }

  await expect(page.locator('#tbodyid')).toBeEmpty();
}

async function addProductToCart(page, productName) {
  await page.goto('/');

  const productLink = page.locator('#tbodyid .hrefch', { hasText: productName }).first();
  await expect(productLink).toBeVisible();
  await productLink.click();
  await page.waitForURL(/prod\.html/);

  const productTitle = page.locator('h2').first();
  await expect(productTitle).toBeVisible();
  const selectedProductName = (await productTitle.textContent())?.trim();

  const productPageText = await page.locator('body').innerText();
  const productPrice = parseProductPrice(productPageText);
  expect(productPrice, `Could not parse price for ${selectedProductName}`).not.toBeNull();

  const addToCartButton = page.locator('a[onclick*="addToCart"]').first();
  await expect(addToCartButton).toBeVisible();

  const dialogPromise = page.waitForEvent('dialog');
  await addToCartButton.click();
  const dialog = await dialogPromise;
  await expect(dialog.message()).toMatch(/Product added\.?/);
  await dialog.accept();

  await page.getByRole('link', { name: 'Cart', exact: true }).click();
  await expect(page).toHaveURL(/cart\.html/);

  const productInCart = page.locator('#tbodyid .success', { hasText: selectedProductName }).first();
  await expect(productInCart).toBeVisible();
  await expect(productInCart.locator('td').nth(1)).toHaveText(selectedProductName);

  return { productName: selectedProductName, productPrice };
}

test.describe('Demoblaze smoke tests', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });
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
