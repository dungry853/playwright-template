import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

const isCI = process.env.CI === "true";
const baseURL = process.env.BASE_URL;

if (!baseURL) {
  throw new Error("BASE_URL is required. Please configure your .env file.");
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  /* Keep report screenshots: only the artifact folder is wiped between runs. */
  outputDir: "test-results/artifacts",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!isCI,
  /* Retry on CI only */
  retries: isCI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: isCI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    /* SLOW_MO=<ms> throttles every action so a human can follow along. */
    launchOptions: { slowMo: Number(process.env.SLOW_MO ?? 0) },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      /* Signs in once and writes .auth/user.json. Skips when APP_USER_* is unset. */
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      /* auth.setup.ts runs in its own project. The demo spec is not part of the suite. */
      testIgnore: [/auth\.setup\.ts/, /example\.spec\.ts/],
      use: { ...devices["Desktop Chrome"] },
      /* Signed-in specs: uncomment these two lines. The setup project must run first. */
      // storageState: ".auth/user.json",
      // dependencies: ["setup"],
    },

    /* Test against other engines. Enable when the app supports them. */
    // {
    //   name: "firefox",
    //   testIgnore: /auth\.setup\.ts/,
    //   use: { ...devices["Desktop Firefox"] },
    // },
    // {
    //   name: "webkit",
    //   testIgnore: /auth\.setup\.ts/,
    //   use: { ...devices["Desktop Safari"] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !isCI,
  // },
});
