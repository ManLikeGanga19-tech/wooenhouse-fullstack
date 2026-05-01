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

// ─── Mailbox ─────────────────────────────────────────────────────────────────

describe("api.admin.mailbox", () => {
  const ACCOUNTS = [
    { name: "Technical", address: "technical@woodenhouseskenya.com" },
    { name: "Sales",     address: "sales@woodenhouseskenya.com"     },
  ];

  const FOLDERS = [
    { name: "INBOX",  displayName: "Inbox",  icon: "inbox", totalCount: 10, unreadCount: 2 },
    { name: "Sent",   displayName: "Sent",   icon: "send",  totalCount: 5,  unreadCount: 0 },
    { name: "Drafts", displayName: "Drafts", icon: "pencil",totalCount: 1,  unreadCount: 0 },
  ];

  const EMAIL_SUMMARY = {
    uid: 101, subject: "Project inquiry", from: "client@example.com",
    fromName: "Jane Kamau", to: "info@woodenhouseskenya.com",
    date: "2026-01-01T10:00:00Z", isRead: false, hasAttachments: false, preview: null,
  };

  const EMAIL_DETAIL = {
    uid: 101, subject: "Project inquiry", from: "client@example.com",
    fromName: "Jane Kamau", to: "info@woodenhouseskenya.com",
    cc: null, bcc: null, date: "2026-01-01T10:00:00Z", isRead: true,
    htmlBody: "<p>Hello</p>", textBody: "Hello", messageId: "<x@mail>",
    inReplyTo: null, references: null, attachments: [],
  };

  it("getAccounts() returns all accounts", async () => {
    mock.onGet("/api/admin/mailbox/accounts").reply(200, ACCOUNTS);

    const res = await api.admin.mailbox.getAccounts();
    expect(res.data).toHaveLength(2);
    expect(res.data[0].address).toBe("technical@woodenhouseskenya.com");
  });

  it("getFolders() returns folder list for address", async () => {
    const encoded = encodeURIComponent("info@woodenhouseskenya.com");
    mock.onGet(`/api/admin/mailbox/${encoded}/folders`).reply(200, FOLDERS);

    const res = await api.admin.mailbox.getFolders("info@woodenhouseskenya.com");
    expect(res.data).toHaveLength(3);
    expect(res.data[0].name).toBe("INBOX");
    expect(res.data[0].unreadCount).toBe(2);
  });

  it("getEmails() returns paginated list", async () => {
    const encoded = encodeURIComponent("info@woodenhouseskenya.com");
    mock
      .onGet(`/api/admin/mailbox/${encoded}/${encodeURIComponent("INBOX")}`)
      .reply(200, { emails: [EMAIL_SUMMARY], total: 1, page: 1, pageSize: 25 });

    const res = await api.admin.mailbox.getEmails("info@woodenhouseskenya.com", "INBOX");
    expect(res.data.emails).toHaveLength(1);
    expect(res.data.total).toBe(1);
    expect(res.data.emails[0].isRead).toBe(false);
  });

  it("getEmails() passes search param", async () => {
    const encoded = encodeURIComponent("info@woodenhouseskenya.com");
    mock
      .onGet(`/api/admin/mailbox/${encoded}/${encodeURIComponent("INBOX")}`, {
        params: { page: 1, pageSize: 10, search: "inquiry" },
      })
      .reply(200, { emails: [EMAIL_SUMMARY], total: 1, page: 1, pageSize: 10 });

    const res = await api.admin.mailbox.getEmails(
      "info@woodenhouseskenya.com", "INBOX",
      { page: 1, pageSize: 10, search: "inquiry" }
    );
    expect(res.data.emails[0].subject).toContain("inquiry");
  });

  it("getEmail() returns full detail", async () => {
    const encoded = encodeURIComponent("info@woodenhouseskenya.com");
    mock.onGet(`/api/admin/mailbox/${encoded}/${encodeURIComponent("INBOX")}/101`).reply(200, EMAIL_DETAIL);

    const res = await api.admin.mailbox.getEmail("info@woodenhouseskenya.com", "INBOX", 101);
    expect(res.data.uid).toBe(101);
    expect(res.data.htmlBody).toBe("<p>Hello</p>");
    expect(res.data.attachments).toHaveLength(0);
  });

  it("getEmail() throws on 404", async () => {
    const encoded = encodeURIComponent("info@woodenhouseskenya.com");
    mock.onGet(`/api/admin/mailbox/${encoded}/${encodeURIComponent("INBOX")}/999`).reply(404, { message: "Not found." });

    await expect(
      api.admin.mailbox.getEmail("info@woodenhouseskenya.com", "INBOX", 999)
    ).rejects.toThrow("Not found.");
  });

  it("markRead() sends PATCH with isRead flag", async () => {
    const encoded = encodeURIComponent("info@woodenhouseskenya.com");
    mock.onPatch(`/api/admin/mailbox/${encoded}/${encodeURIComponent("INBOX")}/101/read`).reply(204);

    await expect(
      api.admin.mailbox.markRead("info@woodenhouseskenya.com", "INBOX", 101, true)
    ).resolves.not.toThrow();
  });

  it("moveEmail() sends POST with targetFolder", async () => {
    const encoded = encodeURIComponent("info@woodenhouseskenya.com");
    mock.onPost(`/api/admin/mailbox/${encoded}/${encodeURIComponent("INBOX")}/101/move`).reply(204);

    await expect(
      api.admin.mailbox.moveEmail("info@woodenhouseskenya.com", "INBOX", 101, "Archive")
    ).resolves.not.toThrow();
  });

  it("deleteEmail() sends DELETE", async () => {
    const encoded = encodeURIComponent("info@woodenhouseskenya.com");
    mock.onDelete(`/api/admin/mailbox/${encoded}/${encodeURIComponent("INBOX")}/101`).reply(204);

    await expect(
      api.admin.mailbox.deleteEmail("info@woodenhouseskenya.com", "INBOX", 101)
    ).resolves.not.toThrow();
  });

  it("sendEmail() resolves with message", async () => {
    mock.onPost("/api/admin/mailbox/send").reply(200, { message: "Email sent." });

    const res = await api.admin.mailbox.sendEmail({
      accountAddress: "info@woodenhouseskenya.com",
      to:             "client@example.com",
      subject:        "Re: Project",
      textBody:       "Thanks for reaching out.",
    });
    expect(res.data.message).toBe("Email sent.");
  });

  it("sendEmail() throws on 400 when required fields missing", async () => {
    mock.onPost("/api/admin/mailbox/send").reply(400, { message: "Required fields missing." });

    await expect(
      api.admin.mailbox.sendEmail({} as never)
    ).rejects.toThrow("Required fields missing.");
  });

  it("saveDraft() resolves with message", async () => {
    mock.onPost("/api/admin/mailbox/draft").reply(200, { message: "Draft saved." });

    const res = await api.admin.mailbox.saveDraft({
      accountAddress: "info@woodenhouseskenya.com",
      to:             "(draft)",
      subject:        "(no subject)",
    });
    expect(res.data.message).toBe("Draft saved.");
  });

  it("getAttachmentUrl() returns a constructed URL string", () => {
    const url = api.admin.mailbox.getAttachmentUrl(
      "info@woodenhouseskenya.com", "INBOX", 101, "invoice.pdf"
    );
    expect(url).toContain("/api/admin/mailbox/");
    expect(url).toContain("invoice.pdf");
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
