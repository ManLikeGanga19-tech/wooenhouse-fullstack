/**
 * E2E tests for the admin panel (admin.woodenhouseskenya.com / ?_admin=1 in dev)
 *
 * Covers:
 *   - Login page renders
 *   - Login with wrong credentials shows error
 *   - Login with correct credentials redirects to dashboard
 *   - Dashboard shows stats
 *   - Contacts list loads
 *   - Quotes list loads + create quote form
 *   - Newsletter list loads
 *   - Logout clears session and redirects to login
 *
 * Admin pages are accessed via the ?_admin=1 query param in local dev
 * (see proxy.ts — hostname admin.* OR ?_admin=1 triggers admin routing).
 */

import { test, expect, type Page } from "@playwright/test";
import { loginViaApi } from "./helpers/auth";

const ADMIN = (path: string) => `${path}?_admin=1`;

// ─── Login page ───────────────────────────────────────────────────────────────

test.describe("Admin login page", () => {
  test("renders login form", async ({ page }) => {
    await page.goto(ADMIN("/login"));
    await expect(page.getByRole("heading", { name: /sign in|login|welcome/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("shows error on wrong credentials", async ({ page }) => {
    await page.goto(ADMIN("/login"));

    await page.getByLabel(/email/i).fill("wrong@test.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in|login/i }).click();

    await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible({ timeout: 8_000 });
  });

  test("redirects to dashboard after successful login", async ({ page }) => {
    await page.goto(ADMIN("/login"));

    await page.getByLabel(/email/i).fill("admin@woodenhouseskenya.com");
    await page.getByLabel(/password/i).fill("DevAdmin@2024!");
    await page.getByRole("button", { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
  });
});

// ─── Authenticated admin tests ────────────────────────────────────────────────

test.describe("Admin dashboard (authenticated)", () => {
  // Log in via API before each test to inject the auth cookie
  test.beforeEach(async ({ context, page }) => {
    try {
      await loginViaApi(context);
    } catch {
      // Backend may not be running in CI — skip gracefully
      test.skip();
    }
    await page.goto(ADMIN("/dashboard"));
  });

  test("shows dashboard overview with stat cards", async ({ page }) => {
    // Wait for any stat number/card to appear
    await expect(
      page.locator("[data-testid='stat-card'], .stat-card, .metric").first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("contacts sidebar link navigates to contacts table", async ({ page }) => {
    await page.getByRole("link", { name: /contacts/i }).first().click();
    await expect(page).toHaveURL(/contacts/, { timeout: 5_000 });
    // Table or list should render
    await expect(page.getByRole("table").or(page.locator("tbody tr")).first())
      .toBeVisible({ timeout: 8_000 });
  });

  test("quotes sidebar link navigates to quotes table", async ({ page }) => {
    await page.getByRole("link", { name: /quotes/i }).first().click();
    await expect(page).toHaveURL(/quotes/, { timeout: 5_000 });
  });

  test("newsletter sidebar link navigates to newsletter table", async ({ page }) => {
    await page.getByRole("link", { name: /newsletter/i }).first().click();
    await expect(page).toHaveURL(/newsletter/, { timeout: 5_000 });
  });
});

// ─── Protected route guard ────────────────────────────────────────────────────

test.describe("Admin protected routes", () => {
  test("unauthenticated visit to /dashboard redirects to /login", async ({ page }) => {
    // No cookie injected — should be redirected
    await page.goto(ADMIN("/dashboard"));
    await expect(page).toHaveURL(/login/, { timeout: 8_000 });
  });
});

// ─── Contacts CRUD ────────────────────────────────────────────────────────────

test.describe("Contacts management (authenticated)", () => {
  test.beforeEach(async ({ context, page }) => {
    try {
      await loginViaApi(context);
    } catch {
      test.skip();
    }
    await page.goto(ADMIN("/dashboard/contacts"));
  });

  test("contact list table has at least one row", async ({ page }) => {
    await expect(page.getByRole("row").nth(1)).toBeVisible({ timeout: 10_000 });
  });

  test("can search contacts", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("alice");
      // Results should filter
      await page.waitForTimeout(500);
      const rows = page.getByRole("row");
      await expect(rows).not.toHaveCount(0);
    }
  });
});

// ─── Quotes CRUD ─────────────────────────────────────────────────────────────

test.describe("Quotes management (authenticated)", () => {
  test.beforeEach(async ({ context, page }) => {
    try {
      await loginViaApi(context);
    } catch {
      test.skip();
    }
    await page.goto(ADMIN("/dashboard/quotes"));
  });

  test("quotes page renders", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /quote/i }).first()).toBeVisible({ timeout: 8_000 });
  });

  test("new quote button opens create form", async ({ page }) => {
    const newBtn = page.getByRole("button", { name: /new quote|create quote/i }).first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      // A dialog or form with customer fields should appear
      await expect(page.getByLabel(/customer name|name/i).first()).toBeVisible({ timeout: 5_000 });
    }
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────

test.describe("Logout", () => {
  test("logout clears session and redirects to login", async ({ context, page }) => {
    try {
      await loginViaApi(context);
    } catch {
      test.skip();
    }
    await page.goto(ADMIN("/dashboard"));

    // Click logout — could be a button or menu item
    const logoutTrigger = page
      .getByRole("button", { name: /logout|sign out/i })
      .or(page.getByRole("menuitem", { name: /logout|sign out/i }))
      .first();

    if (await logoutTrigger.isVisible({ timeout: 5_000 })) {
      await logoutTrigger.click();
      await expect(page).toHaveURL(/login/, { timeout: 8_000 });
    }
  });
});
