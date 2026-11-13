import { type Page, type TestInfo } from "@playwright/test";

/*
 * Screenshot helper shared by the screen specs. Every case leaves one file so
 * the report can link a real image, and failures get an extra `-FAIL-` file so
 * a broken screen is still documented.
 */

export async function shot(page: Page, screen: string, name: string) {
  await page.screenshot({
    path: `test-results/screenshots/${screen}/${name}.png`,
    fullPage: true,
  });
}

/** Call from `test.afterEach` to capture the screen as it failed. */
export async function shotOnFailure(page: Page, screen: string, testInfo: TestInfo) {
  if (testInfo.status === testInfo.expectedStatus) {
    return;
  }

  const slug = testInfo.title
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  await page
    .screenshot({
      path: `test-results/screenshots/${screen}/${screen}-FAIL-${slug}.png`,
      fullPage: true,
    })
    .catch(() => undefined);
}
