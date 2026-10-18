const { test, expect } = require('@playwright/test');

test.describe('Demoblaze smoke tests', () => {
  test('homepage loads and shows products', async ({ page }) => {
    await page.goto('https://www.demoblaze.com/');

    await expect(page).toHaveTitle(/STORE/);
    await expect(page.getByText('CATEGORIES')).toBeVisible();

    const productLinks = page.locator('#tbodyid .hrefch');
    await expect(productLinks.first()).toBeVisible();
    await expect(productLinks).toHaveCount(9);
  });

  test('user can open a product and add it to cart', async ({ page }) => {
    await page.goto('https://www.demoblaze.com/');

    const productLink = page.locator('#tbodyid .hrefch').first();
    await expect(productLink).toBeVisible();
    await productLink.click();
    await page.waitForURL(/prod\.html/);

    const productTitle = page.locator('h2').first();
    await expect(productTitle).toBeVisible();

    const addToCartButton = page.locator('a[onclick*="addToCart"]').first();
    await expect(addToCartButton).toBeVisible();

    page.once('dialog', async (dialog) => {
      await expect(dialog.message()).toBe('Product added');
      await dialog.accept();
    });

    await addToCartButton.click();

    await page.getByRole('link', { name: 'Cart', exact: true }).click();
    await expect(page).toHaveURL(/cart\.html/);
    await expect(page.getByText('Products')).toBeVisible();
  });
});
