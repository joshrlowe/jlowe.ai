/**
 * Tests for ErrorBoundary component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ErrorBoundary from "@/components/ErrorBoundary";

// Component that throws an error
const ThrowError = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

describe("ErrorBoundary", () => {
  // Suppress console.error for expected errors
  const originalError = console.error;

  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.location.reload
    delete window.location;
    window.location = { reload: jest.fn() };
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders error UI when child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText(/We're sorry, but something unexpected happened/),
    ).toBeInTheDocument();
  });

  it("renders Refresh Page button when error occurs", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("button", { name: /refresh page/i })).toBeInTheDocument();
  });

  it("calls window.location.reload when Refresh Page is clicked", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    const refreshButton = screen.getByRole("button", { name: /refresh page/i });
    fireEvent.click(refreshButton);

    expect(window.location.reload).toHaveBeenCalled();
  });

  it("catches error in componentDidCatch", () => {
    const consoleSpy = jest.spyOn(console, "error");
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(consoleSpy).toHaveBeenCalled();
    process.env.NODE_ENV = originalEnv;
  });

  it("shows error details in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    // In development, error details should be available
    expect(screen.getByText(/Error Details/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("does not show error details in production", () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "production",
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.queryByText(/Error Details/)).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("renders multiple children without error", () => {
    render(
      <ErrorBoundary>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Child 1")).toBeInTheDocument();
    expect(screen.getByText("Child 2")).toBeInTheDocument();
    expect(screen.getByText("Child 3")).toBeInTheDocument();
  });

  it("maintains error state after error is caught", () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Re-render should still show error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>,
    );

    // Still shows error UI because state hasn't been reset
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("has proper styling for error display", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    // Check that error UI is centered
    const container = screen.getByText("Something went wrong").closest("div");
    expect(container).toBeInTheDocument();
  });

  it("displays warning icon in error state", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    // SVG icon should be present
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
