import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration.
 *
 * Assumes:
 *   - Frontend  runs at http://localhost:3000  (next dev / next start)
 *   - Backend   runs at http://localhost:5000  (dotnet run)
 *
 * Run with:
 *   npm run test:e2e            # headless
 *   npm run test:e2e:ui         # interactive UI
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },

  // Don't retry on CI to surface flaky tests early
  retries: process.env.CI ? 1 : 0,

  // Run tests in parallel (each worker gets its own browser context)
  fullyParallel: true,

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  use: {
    baseURL:     "http://localhost:3000",
    // Include httpOnly cookies by preserving the storageState within each test
    // (admin tests set cookies via the API first)
    extraHTTPHeaders: { Accept: "application/json" },
    screenshot: "only-on-failure",
    video:      "retain-on-failure",
    trace:      "on-first-retry",
  },

  projects: [
    {
      name:    "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name:    "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],

  // Start the Next.js dev server automatically when running E2E tests
  webServer: {
    command:            "npm run dev",
    url:                "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout:            60_000,
  },
});
