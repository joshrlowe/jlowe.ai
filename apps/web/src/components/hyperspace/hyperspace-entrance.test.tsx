import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HyperspaceEntrance } from "./hyperspace-entrance";

function mockMedia({ reduce = false, coarse = false } = {}) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches:
          (reduce && query.includes("prefers-reduced-motion")) ||
          (coarse && query.includes("coarse")),
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

const SESSION_KEY = "hs-entrance:played";

describe("HyperspaceEntrance", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    // The component mounts the overlay on the next animation frame; run it
    // synchronously so the portal is present right after render.
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    // jsdom has no 2D canvas; make the null-context path explicit and quiet.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.documentElement.classList.remove("hs-reveal");
  });

  it("reveals immediately for prefers-reduced-motion — no overlay, marks played", () => {
    mockMedia({ reduce: true });
    render(<HyperspaceEntrance />);
    expect(
      screen.queryByRole("button", { name: /skip intro/i }),
    ).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBe("1");
  });

  it("skips the warp on repeat visits within a session", () => {
    window.sessionStorage.setItem(SESSION_KEY, "1");
    mockMedia({ reduce: false });
    render(<HyperspaceEntrance />);
    expect(
      screen.queryByRole("button", { name: /skip intro/i }),
    ).not.toBeInTheDocument();
  });

  it("plays on a fresh visit and renders a focusable skip control", () => {
    mockMedia({ reduce: false });
    render(<HyperspaceEntrance />);
    const skip = screen.getByRole("button", { name: /skip intro/i });
    expect(skip).toBeInTheDocument();
    // Auto-focused so keyboard/AT users can dismiss immediately.
    expect(skip).toHaveFocus();
    // Warp still in progress: not yet marked played.
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("completes the entrance when the skip control is activated", () => {
    mockMedia({ reduce: false });
    render(<HyperspaceEntrance />);
    const skip = screen.getByRole("button", { name: /skip intro/i });
    fireEvent.click(skip);
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBe("1");
  });
});
