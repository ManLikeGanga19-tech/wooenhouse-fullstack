/**
 * Tests for the Contact page form.
 *
 * We mock `@/lib/api/client` so no network calls happen, and mock `sonner`
 * because the component uses toast notifications (not inline DOM text) for
 * success/error feedback.
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ fill: _fill, priority: _priority, ...props }: Record<string, unknown>) =>
    React.createElement("img", props as React.ImgHTMLAttributes<HTMLImageElement>),
}));

jest.mock("aos", () => ({ init: jest.fn(), refresh: jest.fn() }));

// Mock Sonner — component calls toast.success / toast.error
const mockToastSuccess = jest.fn();
const mockToastError   = jest.fn();
jest.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error:   (...args: unknown[]) => mockToastError(...args),
  },
  Toaster: () => null,
}));

const mockSubmit = jest.fn();
jest.mock("@/lib/api/client", () => ({
  api: {
    contact: {
      submit: (...args: unknown[]) => mockSubmit(...args),
    },
  },
}));

// ─── Import component AFTER mocks ────────────────────────────────────────────
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

beforeEach(() => {
  mockSubmit.mockReset();
  mockToastSuccess.mockReset();
  mockToastError.mockReset();
});

describe("ContactPage", () => {
  it("renders the contact form", () => {
    render(<ContactPage />);
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
  });

  it("calls toast.success after valid submission", async () => {
    mockSubmit.mockResolvedValue({ data: { message: "Thank you!" } });

    const user = userEvent.setup();
    render(<ContactPage />);

    await fillAndSubmit(user);

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(
        expect.stringMatching(/message sent successfully/i)
      );
    });
  });

  it("hides the form after successful submission", async () => {
    mockSubmit.mockResolvedValue({ data: { message: "OK" } });

    const user = userEvent.setup();
    render(<ContactPage />);

    await fillAndSubmit(user);

    // After success, submitted=true unmounts the form
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /send message/i })).not.toBeInTheDocument();
    });
  });

  it("calls toast.error when the API returns an error", async () => {
    mockSubmit.mockRejectedValue(new Error("Too many requests, please try again later."));

    const user = userEvent.setup();
    render(<ContactPage />);

    await fillAndSubmit(user);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringMatching(/failed to send message/i),
        expect.objectContaining({
          description: expect.stringMatching(/too many requests/i),
        })
      );
    });
  });

  it("disables submit button while submitting", async () => {
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

    // Button must be disabled immediately while the API call is in-flight
    expect(button).toBeDisabled();

    // After resolve, the form unmounts (submitted=true hides it)
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /send message/i })).not.toBeInTheDocument();
    });
  });

  it("calls toast.error with fallback message when error has no message", async () => {
    mockSubmit.mockRejectedValue("unexpected string error");

    const user = userEvent.setup();
    render(<ContactPage />);

    await fillAndSubmit(user);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringMatching(/failed to send message/i),
        expect.objectContaining({
          description: expect.stringMatching(/something went wrong/i),
        })
      );
    });
  });
});
