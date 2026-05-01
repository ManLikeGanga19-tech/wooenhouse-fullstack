import { http, HttpResponse } from "msw";

const BASE = "http://localhost:5000";

// ─── Shared fixtures ──────────────────────────────────────────────────────────

export const MOCK_USER = {
  name:      "Admin User",
  email:     "admin@woodenhouseskenya.com",
  role:      "admin",
  expiresAt: "2099-01-01T00:00:00Z",
};

export const MOCK_CONTACTS = [
  {
    id: "c1", name: "Alice Wanjiku", email: "alice@test.com",
    phone: "+254700000001", serviceType: "wooden-house",
    location: "Nairobi", budget: "1m-2m", timeline: "3-6months",
    message: "I want a 3-bedroom house", newsletter: true,
    status: "new", priority: "medium", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
];

export const MOCK_QUOTE = {
  id: "q1", quoteNumber: "WHK-0001",
  customerName: "John Kamau", customerEmail: "john@test.com",
  basePrice: 2500000, discount: 100000, finalPrice: 2400000,
  status: "draft", validityDays: 30,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  lineItems: [],
};

// ─── Handlers ─────────────────────────────────────────────────────────────────

export const handlers = [
  // Auth
  http.post(`${BASE}/api/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    if (body.email === "admin@woodenhouseskenya.com" && body.password === "correct") {
      return HttpResponse.json(MOCK_USER);
    }
    return HttpResponse.json({ message: "Invalid email or password." }, { status: 401 });
  }),

  http.get(`${BASE}/api/auth/me`, () => {
    return HttpResponse.json(MOCK_USER);
  }),

  http.post(`${BASE}/api/auth/logout`, () => {
    return HttpResponse.json({ message: "Logged out." });
  }),

  // Contact
  http.post(`${BASE}/api/contact`, async ({ request }) => {
    const body = await request.json() as { name: string; email: string };
    if (!body.name || body.name.length < 2) {
      return HttpResponse.json({ message: "Name is required." }, { status: 400 });
    }
    if (!body.email || !body.email.includes("@")) {
      return HttpResponse.json({ message: "Valid email is required." }, { status: 400 });
    }
    return HttpResponse.json({ message: "Thank you for your message! We will get back to you within 24 hours." });
  }),

  // Newsletter
  http.post(`${BASE}/api/newsletter/subscribe`, async ({ request }) => {
    const body = await request.json() as { email: string };
    if (!body.email?.includes("@")) {
      return HttpResponse.json({ message: "Valid email is required." }, { status: 400 });
    }
    if (body.email === "existing@test.com") {
      return HttpResponse.json({ message: "You are already subscribed." });
    }
    return HttpResponse.json({ message: "Successfully subscribed." });
  }),

  http.post(`${BASE}/api/newsletter/unsubscribe`, async ({ request }) => {
    const body = await request.json() as { email: string };
    if (body.email === "nobody@nowhere.com") {
      return HttpResponse.json({ message: "Email not found." }, { status: 404 });
    }
    return HttpResponse.json({ message: "Successfully unsubscribed." });
  }),

  // Projects
  http.get(`${BASE}/api/projects`, ({ request }) => {
    const url    = new URL(request.url);
    const featured = url.searchParams.get("featured");
    const projects = [
      { id: "p1", title: "Nairobi Bungalow", slug: "nairobi-bungalow", featured: true,  status: "published", images: "[]", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "p2", title: "Naivasha Cabin",   slug: "naivasha-cabin",   featured: false, status: "published", images: "[]", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    if (featured === "true") return HttpResponse.json(projects.filter(p => p.featured));
    return HttpResponse.json(projects);
  }),

  http.get(`${BASE}/api/projects/:slug`, ({ params }) => {
    if (params.slug === "nairobi-bungalow") {
      return HttpResponse.json({ id: "p1", title: "Nairobi Bungalow", slug: "nairobi-bungalow", featured: true, status: "published", images: "[]", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    return HttpResponse.json({ message: "Not found." }, { status: 404 });
  }),

  // Services
  http.get(`${BASE}/api/services`, () => {
    return HttpResponse.json([
      { id: "s1", title: "Wooden House Construction", slug: "construction", sortOrder: 1, status: "published", features: "[]" },
      { id: "s2", title: "Custom Carpentry",          slug: "carpentry",    sortOrder: 2, status: "published", features: "[]" },
    ]);
  }),

  // Admin — contacts
  http.get(`${BASE}/api/admin/contacts`, () => {
    return HttpResponse.json({ total: 1, page: 1, pageSize: 20, items: MOCK_CONTACTS });
  }),

  http.get(`${BASE}/api/admin/contacts/:id`, ({ params }) => {
    if (params.id === "c1") return HttpResponse.json(MOCK_CONTACTS[0]);
    return HttpResponse.json({ message: "Not found." }, { status: 404 });
  }),

  http.patch(`${BASE}/api/admin/contacts/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    if (params.id === "c1") return HttpResponse.json({ ...MOCK_CONTACTS[0], ...body });
    return HttpResponse.json({ message: "Not found." }, { status: 404 });
  }),

  // Admin — quotes
  http.get(`${BASE}/api/admin/quotes`, () => {
    return HttpResponse.json({ total: 1, page: 1, pageSize: 20, items: [MOCK_QUOTE] });
  }),

  http.post(`${BASE}/api/admin/quotes`, () => {
    return HttpResponse.json(MOCK_QUOTE, { status: 201 });
  }),

  http.put(`${BASE}/api/admin/quotes/:id`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...MOCK_QUOTE, ...body });
  }),

  http.delete(`${BASE}/api/admin/quotes/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Admin — newsletter
  http.get(`${BASE}/api/admin/newsletter`, () => {
    return HttpResponse.json([
      { id: "n1", email: "subscriber@test.com", status: "active", subscribedAt: new Date().toISOString() },
    ]);
  }),

  // Admin — mailbox
  http.get(`${BASE}/api/admin/mailbox/accounts`, () => {
    return HttpResponse.json([
      { name: "Technical",   address: "technical@woodenhouseskenya.com"   },
      { name: "Sales",       address: "sales@woodenhouseskenya.com"       },
      { name: "Procurement", address: "procurement@woodenhouseskenya.com" },
      { name: "Info",        address: "info@woodenhouseskenya.com"        },
      { name: "Director",    address: "director@woodenhouseskenya.com"    },
      { name: "Accounts",    address: "accounts@woodenhouseskenya.com"    },
    ]);
  }),

  http.get(`${BASE}/api/admin/mailbox/:address/folders`, () => {
    return HttpResponse.json([
      { name: "INBOX",   displayName: "Inbox",   icon: "inbox",   totalCount: 45, unreadCount: 3 },
      { name: "Sent",    displayName: "Sent",    icon: "send",    totalCount: 12, unreadCount: 0 },
      { name: "Drafts",  displayName: "Drafts",  icon: "pencil",  totalCount: 2,  unreadCount: 0 },
      { name: "Trash",   displayName: "Trash",   icon: "trash",   totalCount: 7,  unreadCount: 0 },
      { name: "Junk",    displayName: "Junk",    icon: "alert-triangle", totalCount: 1, unreadCount: 0 },
      { name: "Archive", displayName: "Archive", icon: "archive", totalCount: 23, unreadCount: 0 },
    ]);
  }),

  http.get(`${BASE}/api/admin/mailbox/:address/:folder`, ({ request }) => {
    const url      = new URL(request.url);
    const page     = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 25);
    const emails   = [
      {
        uid: 101, subject: "Project inquiry from Nairobi", from: "client@example.com",
        fromName: "Jane Kamau", to: "info@woodenhouseskenya.com",
        date: new Date().toISOString(), isRead: false, hasAttachments: false, preview: null,
      },
      {
        uid: 100, subject: "Quote follow-up", from: "another@example.com",
        fromName: "John Mwangi", to: "info@woodenhouseskenya.com",
        date: new Date().toISOString(), isRead: true, hasAttachments: true, preview: "Please find attached...",
      },
    ];
    return HttpResponse.json({ emails, total: 2, page, pageSize });
  }),

  http.get(`${BASE}/api/admin/mailbox/:address/:folder/:uid`, ({ params }) => {
    if (params.uid === "999") {
      return HttpResponse.json({ message: "Not found." }, { status: 404 });
    }
    return HttpResponse.json({
      uid: Number(params.uid), subject: "Project inquiry from Nairobi",
      from: "client@example.com", fromName: "Jane Kamau",
      to: "info@woodenhouseskenya.com", cc: null, bcc: null,
      date: new Date().toISOString(), isRead: true,
      htmlBody: "<p>Hello, I am interested in a wooden house in Nairobi.</p>",
      textBody: "Hello, I am interested in a wooden house in Nairobi.",
      messageId: "<abc123@mail.example.com>", inReplyTo: null, references: null,
      attachments: [],
    });
  }),

  http.patch(`${BASE}/api/admin/mailbox/:address/:folder/:uid/read`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${BASE}/api/admin/mailbox/:address/:folder/:uid/move`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete(`${BASE}/api/admin/mailbox/:address/:folder/:uid`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${BASE}/api/admin/mailbox/send`, async ({ request }) => {
    const body = await request.json() as { accountAddress?: string; to?: string; subject?: string };
    if (!body.accountAddress || !body.to || !body.subject) {
      return HttpResponse.json({ message: "Required fields missing." }, { status: 400 });
    }
    return HttpResponse.json({ message: "Email sent." });
  }),

  http.post(`${BASE}/api/admin/mailbox/draft`, async ({ request }) => {
    const body = await request.json() as { accountAddress?: string };
    if (!body.accountAddress) {
      return HttpResponse.json({ message: "Required fields missing." }, { status: 400 });
    }
    return HttpResponse.json({ message: "Draft saved." });
  }),
];
