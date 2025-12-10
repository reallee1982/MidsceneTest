import { defineConfig, devices } from '@playwright/test';
import dotenv from "dotenv";
dotenv.config();

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 10 * 60 * 1000,
  testMatch: "**/*.spec.ts",
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  // reporter: 'html',
  reporter: [["list"], ["@midscene/web/playwright-reporter", { type: "merged" }]], // type 可选, 默认值为 "merged"，表示多个测试用例生成一个报告，可选值为 "separate"，表示为每个测试用例一个报告,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on',
    navigationTimeout: 45_000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'npd-dev',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'npd-test',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'npd-uat',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'gpg-dev',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'gpg-test',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'gpg-uat',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'npd-prod',
    //   use: { ...devices['Desktop Chrome'] },
    // },
    // {
    //   name: 'gpg-prod',
    //   use: { ...devices['Desktop Chrome'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
