import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  const username = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const password = 'Test123!';

  await page.goto('/');
  await page.getByRole('link', { name: 'Sign up', exact: true }).click();

  await expect(page.locator('#signInModal')).toBeVisible();
  await page.locator('#sign-username').fill(username);
  await page.locator('#sign-password').fill(password);

  const dialogPromise = page.waitForEvent('dialog');
  await page.locator('button[onclick="register()"]').click();

  const dialog = await dialogPromise;
  await expect(dialog.message()).toMatch(/Sign up successful|This user already exist/i);
  await dialog.accept();

  await page.getByRole('link', { name: 'Log in', exact: true }).click();

  await expect(page.locator('#logInModal')).toBeVisible();
  await page.locator('#loginusername').fill(username);
  await page.locator('#loginpassword').fill(password);

  const [request] = await Promise.all([
    page.waitForRequest((req) =>
      req.url().includes('https://api.demoblaze.com/login') && req.method() === 'POST'
    ),
    page.locator('button[onclick="logIn()"]').click(),
  ]);

  const response = await request.response();
  expect(response).not.toBeNull();
  expect(response && response.status()).toBe(200);
  await expect(page.locator('#nameofuser')).toContainText(username);

  await page.context().storageState({ path: authFile });
});
