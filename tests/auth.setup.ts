import { test as setup, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { LoginPage } from "@/pages/LoginPage";

/*
 * Signs in once and saves the session to .auth/user.json, which the signed-in
 * project loads as `storageState`. App-specific: add the steps your login needs
 * (2FA, captcha, tenant picker) inside this file and keep the saving part.
 */

const authFile = path.resolve(".auth/user.json");

setup("authenticate", async ({ page }) => {
  const email = process.env.APP_USER_EMAIL;
  const password = process.env.APP_USER_PASSWORD;

  setup.skip(!email || !password, "APP_USER_EMAIL / APP_USER_PASSWORD are not configured.");

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email!, password!);

  await expect(page).not.toHaveURL(/login/);

  await mkdir(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
