import { render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TypingTagline } from "./typing-tagline";

function mockReducedMotion(reduce: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: reduce && query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

describe("TypingTagline", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders the first phrase as static text for SSR/SEO", () => {
    mockReducedMotion(false);
    render(<TypingTagline phrases={["intelligent AI systems", "next"]} />);
    expect(screen.getByText("intelligent AI systems")).toBeInTheDocument();
  });

  it("does not animate when prefers-reduced-motion matches", () => {
    vi.useFakeTimers();
    mockReducedMotion(true);
    render(<TypingTagline phrases={["alpha", "beta"]} />);
    // Advance well past the hold + erase timings; text must stay put.
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByText("alpha")).toBeInTheDocument();
  });
});
