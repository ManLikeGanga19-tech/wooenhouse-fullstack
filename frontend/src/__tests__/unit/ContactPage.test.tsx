/**
 * Tests for the Contact page form.
 *
 * We mock the entire `@/lib/api/client` module so the component under test
 * never touches axios or the network.  This keeps the tests fast and focused
 * on the UI behaviour (success/error banners, form reset, loading state).
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─── Module mocks ─────────────────────────────────────────────────────────────

// Mock next/image — strip Next.js-only props (fill, priority) before passing to <img>
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ fill: _fill, priority: _priority, ...props }: Record<string, unknown>) =>
    React.createElement("img", props as React.ImgHTMLAttributes<HTMLImageElement>),
}));

// Mock AOS — browser animation library not available in jsdom
jest.mock("aos", () => ({ init: jest.fn(), refresh: jest.fn() }));

// Mock the API module — we control responses per-test
const mockSubmit = jest.fn();
jest.mock("@/lib/api/client", () => ({
  api: {
    contact: {
      submit: (...args: unknown[]) => mockSubmit(...args),
    },
  },
}));

// ─── Import component AFTER mocks are set up ──────────────────────────────────
import ContactPage from "@/app/(site)/contact/page";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/first name/i),      "John");
  await user.type(screen.getByLabelText(/last name/i),       "Kamau");
  await user.type(screen.getByLabelText(/email address/i),   "john@test.com");
  await user.type(screen.getByLabelText(/project details/i), "I want a wooden house.");
  await user.click(screen.getByRole("button", { name: /send message/i }));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => mockSubmit.mockReset());

describe("ContactPage", () => {
  it("renders the contact form", () => {
    render(<ContactPage />);
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
  });

  it("shows success banner after valid submission", async () => {
    mockSubmit.mockResolvedValue({ data: { message: "Thank you!" } });

    const user = userEvent.setup();
    render(<ContactPage />);

    await fillAndSubmit(user);

    await waitFor(() => {
      expect(screen.getByText(/message sent successfully/i)).toBeInTheDocument();
    });
  });

  it("resets form fields after successful submission", async () => {
    mockSubmit.mockResolvedValue({ data: { message: "OK" } });

    const user = userEvent.setup();
    render(<ContactPage />);

    await fillAndSubmit(user);

    await waitFor(() => {
      expect(screen.getByText(/message sent successfully/i)).toBeInTheDocument();
    });

    expect((screen.getByLabelText(/first name/i) as HTMLInputElement).value).toBe("");
  });

  it("shows error banner when the API returns an error", async () => {
    mockSubmit.mockRejectedValue(new Error("Too many requests, please try again later."));

    const user = userEvent.setup();
    render(<ContactPage />);

    await fillAndSubmit(user);

    await waitFor(() => {
      expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
      expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
    });
  });

  it("disables submit button while submitting", async () => {
    // Delay resolution so we can observe the loading state
    mockSubmit.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ data: { message: "OK" } }), 100))
    );

    const user = userEvent.setup();
    render(<ContactPage />);

    await user.type(screen.getByLabelText(/first name/i),      "John");
    await user.type(screen.getByLabelText(/last name/i),       "Kamau");
    await user.type(screen.getByLabelText(/email address/i),   "john@test.com");
    await user.type(screen.getByLabelText(/project details/i), "Test");

    const button = screen.getByRole("button", { name: /send message/i });
    await user.click(button);

    expect(button).toBeDisabled();

    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it("shows fallback error message when error has no message", async () => {
    mockSubmit.mockRejectedValue("unexpected string error");

    const user = userEvent.setup();
    render(<ContactPage />);

    await fillAndSubmit(user);

    await waitFor(() => {
      expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});
