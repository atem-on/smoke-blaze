import { test as setup, expect, chromium, firefox, webkit } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const authDir = 'playwright/.auth';
const smokeAuthFile = `${authDir}/smoke-user.json`;

function getPurchaseAuthFile(browserName) {
  return `${authDir}/purchase-user-${browserName}.json`;
}

async function createAndLoginUser(page, username, password) {
  await page.goto('/');
  await expect(page.locator('#nameofuser')).toBeHidden();
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
}

setup('authenticate', async () => {
  mkdirSync(authDir, { recursive: true });

  const timestamp = Date.now();
  const smokeUser = {
    username: `smoke_user_${timestamp}_${Math.random().toString(36).slice(2, 8)}`,
    password: 'Test123!',
  };

  const smokeBrowser = await chromium.launch();
  const smokeContext = await smokeBrowser.newContext();
  const smokePage = await smokeContext.newPage();
  await createAndLoginUser(smokePage, smokeUser.username, smokeUser.password);
  await smokeContext.storageState({ path: smokeAuthFile });
  await smokeContext.close();
  await smokeBrowser.close();

  const browserLaunchers = {
    chromium,
    firefox,
    webkit,
  };

  for (const browserName of Object.keys(browserLaunchers)) {
    const browser = await browserLaunchers[browserName].launch();
    const purchaseUser = {
      username: `purchase_user_${timestamp}_${browserName}_${Math.random().toString(36).slice(2, 8)}`,
      password: 'Test123!',
    };

    const purchaseContext = await browser.newContext();
    const purchasePage = await purchaseContext.newPage();
    await createAndLoginUser(purchasePage, purchaseUser.username, purchaseUser.password);
    await purchaseContext.storageState({ path: getPurchaseAuthFile(browserName) });
    await purchaseContext.close();
    await browser.close();
  }
});
