import axios, { AxiosError, type AxiosInstance } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

/**
 * Shared axios instance for all API calls.
 * - Sends cookies (withCredentials) so the httpOnly JWT cookie is included
 * - Normalizes errors into a consistent shape
 * - Handles 401s globally (clears session, redirects to login)
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL:         API_URL,
  withCredentials: true, // required for httpOnly cookie auth
  timeout:         15_000,
  headers: {
    "Content-Type": "application/json",
    Accept:          "application/json",
  },
});

// ─── Request interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// ─── Response interceptor ────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    // Session expired or not authenticated
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Only redirect if we're on an admin page
      if (window.location.pathname.startsWith("/dashboard")) {
        window.location.href = "/login";
      }
    }

    // Normalize error message
    const message =
      error.response?.data?.message ??
      error.message ??
      "An unexpected error occurred.";

    return Promise.reject(new Error(message));
  }
);

// ─── Typed API helpers ────────────────────────────────────────────────────────

export const api = {
  // Auth
  auth: {
    login:          (data: { email: string; password: string }) =>
      apiClient.post<AuthUser>("/api/auth/login", data),
    me:             () => apiClient.get<AuthUser>("/api/auth/me"),
    logout:         () => apiClient.post("/api/auth/logout"),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      apiClient.post<{ message: string }>("/api/auth/change-password", data),
  },

  // Public
  contact: {
    submit: (data: ContactFormData) =>
      apiClient.post<{ message: string }>("/api/contact", data),
  },

  newsletter: {
    subscribe:   (data: { email: string; name?: string; source?: string; hp?: string; loadedAt?: number; recaptchaToken?: string }) =>
      apiClient.post<{ message: string }>("/api/newsletter/subscribe", data),
    unsubscribe: (data: { email: string }) =>
      apiClient.post<{ message: string }>("/api/newsletter/unsubscribe", data),
  },

  projects: {
    getAll:    (featured?: boolean) =>
      apiClient.get<Project[]>("/api/projects", { params: { featured } }),
    getBySlug: (slug: string) =>
      apiClient.get<Project>(`/api/projects/${slug}`),
  },

  quotes: {
    getByToken: (token: string) =>
      apiClient.get<PublicQuote>(`/api/quotes/public/${token}`),
  },

  services: {
    getAll: () => apiClient.get<Service[]>("/api/services"),
  },

  // Admin (protected — requires auth cookie)
  admin: {
    contacts: {
      getAll:   (params?: AdminContactsParams) =>
        apiClient.get<PaginatedResponse<Contact>>("/api/admin/contacts", { params }),
      getById:  (id: string) =>
        apiClient.get<Contact>(`/api/admin/contacts/${id}`),
      update:   (id: string, data: Partial<Contact>) =>
        apiClient.patch<Contact>(`/api/admin/contacts/${id}`, data),
      delete:   (id: string) =>
        apiClient.delete(`/api/admin/contacts/${id}`),
    },

    quotes: {
      getAll:         (params?: AdminQuotesParams) =>
        apiClient.get<PaginatedResponse<Quote>>("/api/admin/quotes", { params }),
      getById:        (id: string) =>
        apiClient.get<Quote>(`/api/admin/quotes/${id}`),
      create:         (data: Partial<Quote>) =>
        apiClient.post<Quote>("/api/admin/quotes", data),
      update:         (id: string, data: Partial<Quote>) =>
        apiClient.put<Quote>(`/api/admin/quotes/${id}`, data),
      send:           (id: string) =>
        apiClient.post<{ message: string }>(`/api/admin/quotes/${id}/send`),
      delete:         (id: string) =>
        apiClient.delete(`/api/admin/quotes/${id}`),
    },

    newsletter: {
      getAll:    (params?: { status?: string; showSpam?: boolean }) =>
        apiClient.get<NewsletterSubscriber[]>("/api/admin/newsletter", { params }),
      markSpam:  (id: string, isSpam: boolean) =>
        apiClient.patch<NewsletterSubscriber>(`/api/admin/newsletter/${id}`, { isSpam }),
      delete:    (id: string) =>
        apiClient.delete(`/api/admin/newsletter/${id}`),
    },

    projects: {
      getAll:  () =>
        apiClient.get<Project[]>("/api/admin/projects"),
      create:  (data: Partial<Project>) =>
        apiClient.post<Project>("/api/admin/projects", data),
      update:  (id: string, data: Partial<Project>) =>
        apiClient.put<Project>(`/api/admin/projects/${id}`, data),
      delete:  (id: string) =>
        apiClient.delete(`/api/admin/projects/${id}`),
    },

    services: {
      getAll:  () =>
        apiClient.get<Service[]>("/api/admin/services"),
      create:  (data: Partial<Service>) =>
        apiClient.post<Service>("/api/admin/services", data),
      update:  (id: string, data: Partial<Service>) =>
        apiClient.put<Service>(`/api/admin/services/${id}`, data),
      delete:  (id: string) =>
        apiClient.delete(`/api/admin/services/${id}`),
    },

    upload: {
      image: (file: File) => {
        const fd = new FormData();
        fd.append("file", file);
        return apiClient.post<{ url: string }>("/api/admin/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      },
    },

    blog: {
      getAll:   () =>
        apiClient.get<BlogPost[]>("/api/admin/blog"),
      getById:  (id: string) =>
        apiClient.get<BlogPost>(`/api/admin/blog/${id}`),
      create:   (data: Partial<BlogPost>) =>
        apiClient.post<BlogPost>("/api/admin/blog", data),
      update:   (id: string, data: Partial<BlogPost>) =>
        apiClient.put<BlogPost>(`/api/admin/blog/${id}`, data),
      delete:   (id: string) =>
        apiClient.delete(`/api/admin/blog/${id}`),
    },
  },

  // Public blog
  blog: {
    getAll:    (params?: { category?: string; featured?: boolean; page?: number; limit?: number }) =>
      apiClient.get<BlogListResponse>("/api/blog", { params }),
    getBySlug: (slug: string) =>
      apiClient.get<BlogPost>(`/api/blog/${slug}`),
  },
};

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface AuthUser {
  name:      string;
  email:     string;
  role:      string;
  expiresAt: string;
}

export interface ContactFormData {
  name:           string;
  email:          string;
  phone?:         string;
  serviceType?:   string;
  location?:      string;
  budget?:        string;
  timeline?:      string;
  message?:       string;
  newsletter:     boolean;
  // Spam detection fields (evaluated server-side, never stored)
  hp?:            string;
  loadedAt?:      number;
  recaptchaToken?: string;
}

export interface Contact {
  id:           string;
  name:         string;
  email:        string;
  phone?:       string;
  serviceType?: string;
  location?:    string;
  budget?:      string;
  timeline?:    string;
  message?:     string;
  newsletter:   boolean;
  status:       string;
  priority:     string;
  notes?:       string;
  isSpam:       boolean;
  spamReason?:  string;
  createdAt:    string;
  updatedAt:    string;
  contactedAt?: string;
  quotes?:      Quote[];
}

export interface Quote {
  id:               string;
  quoteNumber:      string;
  contactId?:       string;
  customerName:     string;
  customerEmail:    string;
  customerPhone?:   string;
  houseType?:        string;
  houseSize?:        string;
  location?:         string;
  placeOfSupply?:    string;
  countryOfSupply?:  string;
  lineItems:         QuoteLineItem[];
  basePrice:        number;
  discount:         number;
  finalPrice:       number;
  paymentTerms?:    string;
  deliveryTimeline?: string;
  validityDays:     number;
  status:           string;
  notes?:           string;
  createdAt:        string;
  updatedAt:        string;
  sentAt?:          string;
  viewedAt?:        string;
  acceptedAt?:      string;
}

export interface QuoteLineItem {
  id:          string;
  description: string;
  quantity:    number;
  unitPrice:   number;
  total:       number;
}

export interface NewsletterSubscriber {
  id:              string;
  email:           string;
  name?:           string;
  status:          string;
  source?:         string;
  isSpam:          boolean;
  spamReason?:     string;
  subscribedAt:    string;
  unsubscribedAt?: string;
}

export interface Project {
  id:          string;
  title:       string;
  slug:        string;
  description?: string;
  location?:   string;
  category?:   string;
  coverImage?: string;
  images:      string; // JSON string
  featured:    boolean;
  status:      string;
  completedAt?: string;
  createdAt:   string;
  updatedAt:   string;
}

export interface PublicQuote {
  quoteNumber:      string;
  customerName:     string;
  customerEmail:    string;
  customerPhone?:   string;
  houseType?:       string;
  houseSize?:       string;
  location?:        string;
  placeOfSupply?:   string;
  countryOfSupply?: string;
  lineItems:        { description: string; quantity: number; unitPrice: number; total: number }[];
  basePrice:        number;
  discount:         number;
  finalPrice:       number;
  paymentTerms?:    string;
  deliveryTimeline?: string;
  validityDays:     number;
  status:           string;
  createdAt:        string;
}

export interface Service {
  id:          string;
  title:       string;
  slug:        string;
  description?: string;
  icon?:       string;
  imageUrl?:   string;
  features:    string; // JSON string
  sortOrder:   number;
  status:      string;
}

export interface PaginatedResponse<T> {
  total:    number;
  page:     number;
  pageSize: number;
  items:    T[];
}

export interface AdminContactsParams {
  status?:   string;
  priority?: string;
  search?:   string;
  showSpam?: boolean;
  page?:     number;
  pageSize?: number;
}

export interface AdminQuotesParams {
  status?:   string;
  page?:     number;
  pageSize?: number;
}

export interface BlogPost {
  id:              string;
  title:           string;
  slug:            string;
  excerpt:         string;
  content?:        string;
  coverImage?:     string;
  category:        string;
  author:          string;
  tags?:           string; // JSON array string
  readTimeMinutes: number;
  featured:        boolean;
  status:          string;
  publishedAt?:    string;
  createdAt:       string;
  updatedAt:       string;
}

export interface BlogListResponse {
  total: number;
  page:  number;
  limit: number;
  posts: Omit<BlogPost, "content">[];
}
