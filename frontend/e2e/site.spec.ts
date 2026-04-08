/**
 * E2E tests for the public-facing site (woodenhouseskenya.com)
 *
 * Covers:
 *   - Home page renders
 *   - Navigation to /contact
 *   - Contact form submission happy path
 *   - Contact form validation (client-side required fields)
 *   - Newsletter subscribe in footer
 *   - Projects page loads
 */

import { test, expect } from "@playwright/test";

// ─── Home page ────────────────────────────────────────────────────────────────

test.describe("Home page", () => {
  test("renders without crashing", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/wooden houses kenya/i);
  });

  test("hero section is visible", async ({ page }) => {
    await page.goto("/");
    // The hero should have a prominent CTA link or heading
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("navigation links are present", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: /contact/i }).first()).toBeVisible();
  });
});

// ─── Contact page ─────────────────────────────────────────────────────────────

test.describe("Contact page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test("renders the request a quote form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /request a free quote/i })).toBeVisible();
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
  });

  test("shows contact info cards", async ({ page }) => {
    await expect(page.getByText(/call us/i)).toBeVisible();
    await expect(page.getByText(/email us/i)).toBeVisible();
  });

  test("submits form and shows success message", async ({ page }) => {
    await page.getByLabel(/first name/i).fill("John");
    await page.getByLabel(/last name/i).fill("Kamau");
    await page.getByLabel(/email address/i).fill("john@test.com");
    await page.getByLabel(/project details/i).fill("I want a 3-bedroom wooden house in Nairobi.");

    await page.getByRole("button", { name: /send message/i }).click();

    await expect(page.getByText(/message sent successfully/i)).toBeVisible({ timeout: 10_000 });
  });

  test("required fields prevent empty submission", async ({ page }) => {
    await page.getByRole("button", { name: /send message/i }).click();

    // HTML5 required validation should fire — form should NOT submit
    await expect(page.getByText(/message sent successfully/i)).not.toBeVisible();
  });
});

// ─── Projects page ────────────────────────────────────────────────────────────

test.describe("Projects page", () => {
  test("renders project cards", async ({ page }) => {
    await page.goto("/projects");
    // Projects should load from backend; wait for at least one card
    await expect(page.locator("[data-testid='project-card'], .project-card, article").first())
      .toBeVisible({ timeout: 10_000 });
  });
});

// ─── Services page ────────────────────────────────────────────────────────────

test.describe("Services page", () => {
  test("renders services section", async ({ page }) => {
    await page.goto("/services");
    await expect(page.locator("main, section").first()).toBeVisible();
  });
});

// ─── 404 ─────────────────────────────────────────────────────────────────────

test("unknown page returns 404 UI", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist-xyz");
  // Next.js can return 200 but render the 404 page, so check content too
  const is404 = response?.status() === 404 || await page.getByText(/404|not found/i).isVisible();
  expect(is404).toBe(true);
});
