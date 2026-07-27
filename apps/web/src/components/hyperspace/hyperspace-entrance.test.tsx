import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  HS_TIMELINE,
  HyperspaceEntrance,
  logoAlphaAt,
  logoScaleAt,
} from "./hyperspace-entrance";

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

const syncRaf = (cb: FrameRequestCallback) => {
  cb(0);
  return 1;
};

describe("HyperspaceEntrance", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    // The component mounts the overlay on the next animation frame; run it
    // synchronously so the portal is present right after render.
    vi.stubGlobal("requestAnimationFrame", syncRaf);
    vi.stubGlobal("cancelAnimationFrame", () => {});
    // jsdom has no 2D canvas; make the null-context path explicit and quiet.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.documentElement.classList.remove("hs-reveal");
    document.getElementById("main")?.remove();
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

  it("skip completes the whole sequence (wordmark included) at any point", () => {
    mockMedia({ reduce: false });
    render(<HyperspaceEntrance />);
    const skip = screen.getByRole("button", { name: /skip intro/i });
    fireEvent.click(skip);
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBe("1");
    // The reveal (site settle) is in flight the moment skip is pressed.
    expect(document.documentElement.classList.contains("hs-reveal")).toBe(true);
  });

  it("watchdog completes and fully tears down even without a canvas context", () => {
    vi.useFakeTimers();
    // Fake timers clobber the rAF stub from beforeEach; restore a synchronous
    // one so the overlay mounts immediately and only setTimeout is virtual.
    vi.stubGlobal("requestAnimationFrame", syncRaf);
    const main = document.createElement("main");
    main.id = "main";
    document.body.appendChild(main);

    mockMedia({ reduce: false });
    render(<HyperspaceEntrance />);
    expect(
      screen.getByRole("button", { name: /skip intro/i }),
    ).toBeInTheDocument();

    // Past watchdog (total + slack) + the reveal window.
    act(() => {
      vi.advanceTimersByTime(HS_TIMELINE.totalMs + 2000);
    });

    expect(window.sessionStorage.getItem(SESSION_KEY)).toBe("1");
    // Overlay unmounted, reveal class cleared, focus handed to #main.
    expect(
      screen.queryByRole("button", { name: /skip intro/i }),
    ).not.toBeInTheDocument();
    expect(document.documentElement.classList.contains("hs-reveal")).toBe(
      false,
    );
    expect(main).toHaveFocus();
  });
});

describe("timeline (phases 1–6)", () => {
  it("keeps round 1's warp phases and lands the total in the 4.3–4.7s window", () => {
    // Phases 1–3 must not regress — these are round 1's exact values.
    expect(HS_TIMELINE.peakHoldMs).toBe(700);
    expect(HS_TIMELINE.decelMs).toBe(850);
    expect(HS_TIMELINE.flashAttackMs).toBe(120);
    // The wordmark recede is the 2.0–2.2s arrival beat; the flash release and
    // starfield settle play out underneath its opening.
    expect(HS_TIMELINE.logoMs).toBeGreaterThanOrEqual(2000);
    expect(HS_TIMELINE.logoMs).toBeLessThanOrEqual(2200);
    expect(HS_TIMELINE.flashReleaseMs).toBeLessThan(HS_TIMELINE.logoMs);
    expect(HS_TIMELINE.totalMs).toBe(
      HS_TIMELINE.peakHoldMs +
        HS_TIMELINE.decelMs +
        HS_TIMELINE.flashAttackMs +
        HS_TIMELINE.logoMs +
        HS_TIMELINE.revealMs,
    );
    expect(HS_TIMELINE.totalMs).toBeGreaterThanOrEqual(4300);
    expect(HS_TIMELINE.totalMs).toBeLessThanOrEqual(4700);
  });
});

describe("wordmark recede (phase 5)", () => {
  it("starts at scale 1 and shrinks monotonically over the recede", () => {
    expect(logoScaleAt(0)).toBeCloseTo(1, 10);
    let prev = logoScaleAt(0);
    for (let t = 100; t <= HS_TIMELINE.logoMs; t += 100) {
      const s = logoScaleAt(t);
      expect(s).toBeLessThan(prev);
      prev = s;
    }
    // It ends small — a fraction of its starting size before the fade hides it.
    expect(logoScaleAt(HS_TIMELINE.logoMs)).toBeLessThan(0.12);
  });

  it("is a true hyperbolic z-recede (1/scale affine in t), not a tween", () => {
    // scale = FOCAL / (Z0 + VZ·t) ⇒ 1/scale is affine in t. Equal time steps
    // give equal 1/scale steps — a linear or ease-out scale tween fails this.
    const inv = (t: number) => 1 / logoScaleAt(t);
    const d1 = inv(500) - inv(0);
    const d2 = inv(1000) - inv(500);
    const d3 = inv(1500) - inv(1000);
    expect(d1).toBeCloseTo(d2, 8);
    expect(d2).toBeCloseTo(d3, 8);
    // Front-loaded shrink: the first half sheds far more apparent size than
    // the second — the "flying away fast, then slowing" signature.
    const T = HS_TIMELINE.logoMs;
    const early = logoScaleAt(0) - logoScaleAt(T / 2);
    const late = logoScaleAt(T / 2) - logoScaleAt(T);
    expect(early).toBeGreaterThan(late * 5);
  });

  it("holds full opacity for 70% of the recede, then fades to 0", () => {
    expect(logoAlphaAt(0)).toBe(1);
    expect(logoAlphaAt(0.7)).toBe(1);
    expect(logoAlphaAt(0.85)).toBeCloseTo(0.5, 5);
    expect(logoAlphaAt(1)).toBe(0);
    expect(logoAlphaAt(1.2)).toBe(0); // clamped past the end
  });
});
