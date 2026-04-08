/**
 * Tests for src/lib/api/client.ts
 *
 * Uses axios-mock-adapter to intercept requests at the axios adapter level,
 * avoiding any MSW/jsdom/fetch-API complexity.
 */

import MockAdapter from "axios-mock-adapter";
import { apiClient, api } from "@/lib/api/client";

let mock: MockAdapter;

beforeAll(() => {
  mock = new MockAdapter(apiClient, { onNoMatch: "throwException" });
});

afterEach(() => mock.reset());

afterAll(() => mock.restore());

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe("api.auth", () => {
  const MOCK_USER = {
    name: "Admin User", email: "admin@woodenhouseskenya.com",
    role: "admin", expiresAt: "2099-01-01T00:00:00Z",
  };

  it("login() returns user data on success", async () => {
    mock.onPost("/api/auth/login").reply(200, MOCK_USER);

    const res = await api.auth.login({ email: "admin@woodenhouseskenya.com", password: "correct" });
    expect(res.data).toMatchObject({ email: MOCK_USER.email, role: "admin" });
  });

  it("login() throws normalized Error on 401", async () => {
    mock.onPost("/api/auth/login").reply(401, { message: "Invalid email or password." });

    await expect(
      api.auth.login({ email: "wrong@test.com", password: "bad" })
    ).rejects.toThrow("Invalid email or password.");
  });

  it("me() returns current user", async () => {
    mock.onGet("/api/auth/me").reply(200, MOCK_USER);

    const res = await api.auth.me();
    expect(res.data.name).toBe(MOCK_USER.name);
  });

  it("logout() resolves without error", async () => {
    mock.onPost("/api/auth/logout").reply(200, { message: "Logged out." });

    await expect(api.auth.logout()).resolves.not.toThrow();
  });
});

// ─── Contact ──────────────────────────────────────────────────────────────────

describe("api.contact", () => {
  it("submit() resolves with success message", async () => {
    mock.onPost("/api/contact").reply(200, {
      message: "Thank you for your message! We will get back to you within 24 hours.",
    });

    const res = await api.contact.submit({ name: "John", email: "john@test.com", newsletter: false });
    expect(res.data.message).toContain("Thank you");
  });

  it("submit() throws on 400 from backend", async () => {
    mock.onPost("/api/contact").reply(400, { message: "Valid email is required." });

    await expect(
      api.contact.submit({ name: "John", email: "not-valid", newsletter: false })
    ).rejects.toThrow("Valid email is required.");
  });
});

// ─── Newsletter ───────────────────────────────────────────────────────────────

describe("api.newsletter", () => {
  it("subscribe() returns success message for new email", async () => {
    mock.onPost("/api/newsletter/subscribe").reply(200, { message: "Successfully subscribed." });

    const res = await api.newsletter.subscribe({ email: "new@test.com" });
    expect(res.data.message).toContain("subscribed");
  });

  it("subscribe() handles already-subscribed email", async () => {
    mock.onPost("/api/newsletter/subscribe").reply(200, { message: "You are already subscribed." });

    const res = await api.newsletter.subscribe({ email: "existing@test.com" });
    expect(res.data.message).toContain("already subscribed");
  });

  it("subscribe() throws on 400 for invalid email", async () => {
    mock.onPost("/api/newsletter/subscribe").reply(400, { message: "Valid email is required." });

    await expect(api.newsletter.subscribe({ email: "not-valid" })).rejects.toThrow();
  });

  it("unsubscribe() resolves for known email", async () => {
    mock.onPost("/api/newsletter/unsubscribe").reply(200, { message: "Successfully unsubscribed." });

    const res = await api.newsletter.unsubscribe({ email: "subscriber@test.com" });
    expect(res.data.message).toContain("unsubscribed");
  });

  it("unsubscribe() throws 404 for unknown email", async () => {
    mock.onPost("/api/newsletter/unsubscribe").reply(404, { message: "Email not found." });

    await expect(api.newsletter.unsubscribe({ email: "nobody@nowhere.com" })).rejects.toThrow();
  });
});

// ─── Projects ─────────────────────────────────────────────────────────────────

describe("api.projects", () => {
  const projects = [
    { id: "p1", title: "Nairobi Bungalow", slug: "nairobi-bungalow", featured: true,  status: "published", images: "[]", createdAt: "", updatedAt: "" },
    { id: "p2", title: "Naivasha Cabin",   slug: "naivasha-cabin",   featured: false, status: "published", images: "[]", createdAt: "", updatedAt: "" },
  ];

  it("getAll() returns full list", async () => {
    mock.onGet("/api/projects").reply(200, projects);

    const res = await api.projects.getAll();
    expect(res.data.length).toBe(2);
  });

  it("getAll(true) returns only featured projects", async () => {
    mock.onGet("/api/projects", { params: { featured: true } }).reply(200, [projects[0]]);

    const res = await api.projects.getAll(true);
    expect(res.data.every(p => p.featured)).toBe(true);
  });

  it("getBySlug() returns matching project", async () => {
    mock.onGet("/api/projects/nairobi-bungalow").reply(200, projects[0]);

    const res = await api.projects.getBySlug("nairobi-bungalow");
    expect(res.data.slug).toBe("nairobi-bungalow");
  });

  it("getBySlug() throws on unknown slug", async () => {
    mock.onGet("/api/projects/does-not-exist").reply(404, { message: "Not found." });

    await expect(api.projects.getBySlug("does-not-exist")).rejects.toThrow();
  });
});

// ─── Services ────────────────────────────────────────────────────────────────

describe("api.services", () => {
  it("getAll() returns services list", async () => {
    mock.onGet("/api/services").reply(200, [
      { id: "s1", title: "Wooden House Construction", slug: "construction", sortOrder: 1, status: "published", features: "[]" },
    ]);

    const res = await api.services.getAll();
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0]).toHaveProperty("title");
  });
});

// ─── Error normalisation ──────────────────────────────────────────────────────

describe("error normalisation", () => {
  it("normalises server error message from response body", async () => {
    mock.onGet("/api/services").reply(503, { message: "Service unavailable" });

    const err = await api.services.getAll().catch(e => e);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("Service unavailable");
  });

  it("falls back to axios message when body has no message field", async () => {
    mock.onGet("/api/services").reply(500, {});

    const err = await api.services.getAll().catch(e => e);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBeDefined();
  });

  it("normalises network error to Error instance", async () => {
    mock.onGet("/api/services").networkError();

    const err = await api.services.getAll().catch(e => e);
    expect(err).toBeInstanceOf(Error);
  });
});
