/**
 * Tests for NewsletterSubscription component
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import NewsletterSubscription from "@/components/Articles/NewsletterSubscription";

// Mock fetch
global.fetch = jest.fn();

describe("NewsletterSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockReset();
  });

  it("renders the component", () => {
    render(<NewsletterSubscription />);
    expect(screen.getByText("Stay Updated")).toBeInTheDocument();
  });

  it("renders email input", () => {
    render(<NewsletterSubscription />);
    expect(screen.getByPlaceholderText("Enter your email")).toBeInTheDocument();
  });

  it("renders subscribe button", () => {
    render(<NewsletterSubscription />);
    expect(screen.getByRole("button", { name: /subscribe/i })).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(<NewsletterSubscription />);
    expect(
      screen.getByText(/Subscribe to get the latest articles/),
    ).toBeInTheDocument();
  });

  it("updates email input value", () => {
    render(<NewsletterSubscription />);
    const input = screen.getByPlaceholderText("Enter your email");
    fireEvent.change(input, { target: { value: "test@example.com" } });
    expect(input.value).toBe("test@example.com");
  });

  it("shows loading state when submitting", async () => {
    global.fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<NewsletterSubscription />);

    const input = screen.getByPlaceholderText("Enter your email");
    const button = screen.getByRole("button", { name: /subscribe/i });

    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Subscribing...")).toBeInTheDocument();
    });
  });

  it("disables input and button while loading", async () => {
    global.fetch.mockImplementation(() => new Promise(() => {}));
    render(<NewsletterSubscription />);

    const input = screen.getByPlaceholderText("Enter your email");
    const button = screen.getByRole("button", { name: /subscribe/i });

    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(input).toBeDisabled();
      expect(button).toBeDisabled();
    });
  });

  it("shows success message on successful subscription", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<NewsletterSubscription />);

    const input = screen.getByPlaceholderText("Enter your email");
    const button = screen.getByRole("button", { name: /subscribe/i });

    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Thank you for subscribing!")).toBeInTheDocument();
    });
  });

  it("clears email after successful subscription", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<NewsletterSubscription />);

    const input = screen.getByPlaceholderText("Enter your email");
    const button = screen.getByRole("button", { name: /subscribe/i });

    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  it("shows error message from API response", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: "Email already subscribed" }),
    });

    render(<NewsletterSubscription />);

    const input = screen.getByPlaceholderText("Enter your email");
    const button = screen.getByRole("button", { name: /subscribe/i });

    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Email already subscribed")).toBeInTheDocument();
    });
  });

  it("shows default error message when no message in response", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });

    render(<NewsletterSubscription />);

    const input = screen.getByPlaceholderText("Enter your email");
    const button = screen.getByRole("button", { name: /subscribe/i });

    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText("Something went wrong. Please try again."),
      ).toBeInTheDocument();
    });
  });

  it("shows error message on network failure", async () => {
    global.fetch.mockRejectedValue(new Error("Network error"));

    render(<NewsletterSubscription />);

    const input = screen.getByPlaceholderText("Enter your email");
    const button = screen.getByRole("button", { name: /subscribe/i });

    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to subscribe. Please try again later."),
      ).toBeInTheDocument();
    });
  });

  it("does not submit when email is empty", async () => {
    render(<NewsletterSubscription />);

    const button = screen.getByRole("button", { name: /subscribe/i });
    fireEvent.click(button);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("calls fetch with correct parameters", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<NewsletterSubscription />);

    const input = screen.getByPlaceholderText("Enter your email");
    const button = screen.getByRole("button", { name: /subscribe/i });

    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com" }),
      });
    });
  });

  it("has proper section styling", () => {
    const { container } = render(<NewsletterSubscription />);
    const section = container.querySelector("section");
    expect(section).toBeInTheDocument();
  });
});

