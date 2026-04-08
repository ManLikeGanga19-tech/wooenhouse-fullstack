/**
 * Tests for src/lib/store/authStore.ts
 *
 * Uses axios-mock-adapter to intercept HTTP calls at the adapter level.
 * No MSW, no fetch polyfills needed.
 */

import { act, renderHook } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/authStore";

let mock: MockAdapter;

const MOCK_USER = {
  name: "Admin User", email: "admin@woodenhouseskenya.com",
  role: "admin", expiresAt: "2099-01-01T00:00:00Z",
};

beforeAll(() => {
  mock = new MockAdapter(apiClient, { onNoMatch: "throwException" });
});

afterEach(() => {
  mock.reset();
  // Reset store state between tests
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
});

afterAll(() => mock.restore());

// ─── Initial state ────────────────────────────────────────────────────────────

describe("initial state", () => {
  it("starts unauthenticated", () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: true });
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});

// ─── login() ─────────────────────────────────────────────────────────────────

describe("login()", () => {
  it("sets user and isAuthenticated on success", async () => {
    mock.onPost("/api/auth/login").reply(200, MOCK_USER);

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      const outcome = await result.current.login("admin@woodenhouseskenya.com", "correct");
      expect(outcome.success).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe(MOCK_USER.email);
  });

  it("returns error message on wrong password", async () => {
    mock.onPost("/api/auth/login").reply(401, { message: "Invalid email or password." });

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      const outcome = await result.current.login("bad@test.com", "wrong");
      expect(outcome.success).toBe(false);
      expect(outcome.error).toBeDefined();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("returns error when network request fails", async () => {
    mock.onPost("/api/auth/login").networkError();

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      const outcome = await result.current.login("any@test.com", "any");
      expect(outcome.success).toBe(false);
      expect(outcome.error).toBeDefined();
    });
  });
});

// ─── logout() ────────────────────────────────────────────────────────────────

describe("logout()", () => {
  it("clears user and isAuthenticated", async () => {
    mock.onPost("/api/auth/logout").reply(200, { message: "Logged out." });
    useAuthStore.setState({ user: MOCK_USER, isAuthenticated: true, isLoading: false });

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("still clears local state even when logout request fails", async () => {
    mock.onPost("/api/auth/logout").networkError();
    useAuthStore.setState({ user: MOCK_USER, isAuthenticated: true, isLoading: false });

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
  });
});

// ─── checkSession() ───────────────────────────────────────────────────────────

describe("checkSession()", () => {
  it("sets user from active session cookie", async () => {
    mock.onGet("/api/auth/me").reply(200, MOCK_USER);

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.checkSession();
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.name).toBe(MOCK_USER.name);
    expect(result.current.isLoading).toBe(false);
  });

  it("leaves user null when session is invalid (401)", async () => {
    mock.onGet("/api/auth/me").reply(401, { message: "Unauthorized" });

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.checkSession();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("always sets isLoading to false after completion, even on network error", async () => {
    mock.onGet("/api/auth/me").networkError();
    useAuthStore.setState({ isLoading: true });

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.checkSession();
    });

    expect(result.current.isLoading).toBe(false);
  });
});
