import { expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

export function getPurchaseUser() {
  const csvPath = path.resolve(__dirname, 'data/purchase-user.csv');
  const csvText = readFileSync(csvPath, 'utf8');
  const [headerLine, dataLine] = csvText.trim().split(/\r?\n/);
  const headers = headerLine.split(',').map((header) => header.trim());
  const values = dataLine.split(',').map((value) => value.trim());

  return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
}

export function parseProductPrice(text) {
  const match = text.match(/\$\s*(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

export function parseCartTotal(text) {
  const match = text.match(/Total\s*[:\n]?\s*\$?(\d+(?:\.\d+)?)/i) || text.match(/\b(\d+(?:\.\d+)?)\s*USD/i);
  return match ? Number(match[1]) : null;
}

export function parsePurchaseAmount(text) {
  const match = text.match(/Amount\s*:\s*(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : null;
}

export async function ensureCartIsEmpty(page) {
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

export async function addProductToCart(page, productName) {
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
