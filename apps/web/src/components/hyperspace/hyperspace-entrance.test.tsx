import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  calmStarCount,
  exitAlphaAt,
  exitScaleAt,
  HS_FRAG,
  HS_TIMELINE,
  HS_VERT,
  HyperspaceEntrance,
  streakSpeedAt,
  tunnelFadeAt,
  washAt,
} from "./hyperspace-entrance";

const SESSION_KEY = "hs-entrance:played";

function mockMedia({ reduce = false } = {}) {
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

/**
 * Minimal WebGL1 stand-in: every init call succeeds, so the component takes
 * the tunnel path instead of the GL-unavailable fallback. jsdom has no real
 * GL, and the render loop is suspended by the rAF stub anyway.
 */
function fakeWebGL(): RenderingContext {
  return {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    ARRAY_BUFFER: 5,
    STATIC_DRAW: 6,
    FLOAT: 7,
    TRIANGLES: 8,
    createShader: () => ({}),
    shaderSource: () => undefined,
    compileShader: () => undefined,
    getShaderParameter: () => true,
    deleteShader: () => undefined,
    createProgram: () => ({}),
    attachShader: () => undefined,
    linkProgram: () => undefined,
    getProgramParameter: () => true,
    useProgram: () => undefined,
    deleteProgram: () => undefined,
    createBuffer: () => ({}),
    bindBuffer: () => undefined,
    bufferData: () => undefined,
    deleteBuffer: () => undefined,
    getAttribLocation: () => 0,
    enableVertexAttribArray: () => undefined,
    vertexAttribPointer: () => undefined,
    getUniformLocation: () => ({}),
    uniform1f: () => undefined,
    uniform2f: () => undefined,
    viewport: () => undefined,
    drawArrays: () => undefined,
    getExtension: () => null,
  } as unknown as RenderingContext;
}

/**
 * Minimal 2D stand-in: the star canvas is the sequence's backbone, so the
 * component only proceeds when getContext("2d") returns something usable.
 * jsdom has no real canvas; the frame loop is suspended by the rAF stub.
 */
function fake2D(): RenderingContext {
  const gradient = { addColorStop: () => undefined };
  return {
    setTransform: () => undefined,
    clearRect: () => undefined,
    fillRect: () => undefined,
    createRadialGradient: () => gradient,
    beginPath: () => undefined,
    arc: () => undefined,
    fill: () => undefined,
    moveTo: () => undefined,
    lineTo: () => undefined,
    stroke: () => undefined,
  } as unknown as RenderingContext;
}

/** Route getContext by kind, with per-kind overrides for failure paths. */
function mockContexts({ webgl = true, twoD = true } = {}) {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(((
    kind: string,
  ) => {
    if (kind === "webgl") return webgl ? fakeWebGL() : null;
    if (kind === "2d") return twoD ? fake2D() : null;
    return null;
  }) as never);
}

/**
 * The component defers its mount by one rAF (so real content sets FCP/LCP),
 * then drives both canvases from rAF. Fire only the FIRST request
 * synchronously (the mount) and suspend the rest — tests never need frames,
 * and a synchronous loop would recurse forever.
 */
function stubRafMountOnly() {
  let fired = false;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    if (!fired) {
      fired = true;
      cb(0);
    }
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => undefined);
}

describe("HyperspaceEntrance", () => {
  let main: HTMLElement;

  beforeEach(() => {
    window.sessionStorage.clear();
    stubRafMountOnly();
    mockContexts();
    main = document.createElement("main");
    main.id = "main";
    document.body.appendChild(main);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.documentElement.classList.remove("hs-exit");
    document.getElementById("main")?.remove();
  });

  it("reveals immediately for prefers-reduced-motion — no overlay, no transform, marks played", () => {
    mockMedia({ reduce: true });
    render(<HyperspaceEntrance />);
    expect(
      screen.queryByRole("button", { name: /skip intro/i }),
    ).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBe("1");
    expect(main.style.transform).toBe("");
  });

  it("skips the sequence on repeat visits within a session", () => {
    window.sessionStorage.setItem(SESSION_KEY, "1");
    mockMedia();
    render(<HyperspaceEntrance />);
    expect(
      screen.queryByRole("button", { name: /skip intro/i }),
    ).not.toBeInTheDocument();
    expect(main.style.transform).toBe("");
  });

  it("plays on a fresh visit: focusable skip, page staged as the tiny destination card", () => {
    mockMedia();
    render(<HyperspaceEntrance />);
    const skip = screen.getByRole("button", { name: /skip intro/i });
    // Auto-focused so keyboard/AT users can dismiss immediately.
    expect(skip).toHaveFocus();
    // Still in flight: not yet marked played.
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBeNull();
    // The destination staging: #main lifted above the canvases (hs-exit) and
    // pre-scaled to the emergence size, invisible until the exit phase.
    expect(document.documentElement.classList.contains("hs-exit")).toBe(true);
    expect(main.style.transform).toBe(`scale(${exitScaleAt(0)})`);
    expect(main.style.opacity).toBe("0");
  });

  it("skip instantly completes: played, page restored pristine, focus handed to #main", () => {
    mockMedia();
    render(<HyperspaceEntrance />);
    fireEvent.click(screen.getByRole("button", { name: /skip intro/i }));
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBe("1");
    // End state is a pristine DOM: no residual transform/opacity/clip.
    expect(main.style.transform).toBe("");
    expect(main.style.opacity).toBe("");
    expect(main.style.clipPath).toBe("");
    expect(main).toHaveFocus();
  });

  it("watchdog forces completion + full teardown even if the render loop stalls", () => {
    vi.useFakeTimers();
    // Fake timers clobber the rAF stub; restore it so the overlay mounts and
    // only setTimeout is virtual.
    stubRafMountOnly();
    mockMedia();
    render(<HyperspaceEntrance />);
    expect(
      screen.getByRole("button", { name: /skip intro/i }),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(HS_TIMELINE.totalMs + 2000);
    });

    expect(window.sessionStorage.getItem(SESSION_KEY)).toBe("1");
    expect(
      screen.queryByRole("button", { name: /skip intro/i }),
    ).not.toBeInTheDocument();
    expect(document.documentElement.classList.contains("hs-exit")).toBe(false);
    expect(main.style.transform).toBe("");
    expect(main).toHaveFocus();
  });

  it("WebGL unavailable but 2D alive → the star sequence still plays (tunnel skipped)", () => {
    mockContexts({ webgl: false, twoD: true });
    mockMedia();
    render(<HyperspaceEntrance />);
    // Not the instant-site fallback: the overlay is up and playing.
    const skip = screen.getByRole("button", { name: /skip intro/i });
    expect(skip).toHaveFocus();
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBeNull();
    // The arrival still happens over the 2D starfield: page staged as usual.
    expect(document.documentElement.classList.contains("hs-exit")).toBe(true);
    expect(main.style.transform).toBe(`scale(${exitScaleAt(0)})`);
    // And skip still completes the whole sequence pristinely.
    fireEvent.click(skip);
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBe("1");
    expect(main.style.transform).toBe("");
    expect(main).toHaveFocus();
  });

  it("neither WebGL nor 2D available → instant site: no overlay lingers, page untouched", () => {
    mockContexts({ webgl: false, twoD: false });
    mockMedia();
    render(<HyperspaceEntrance />);
    expect(
      screen.queryByRole("button", { name: /skip intro/i }),
    ).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBe("1");
    expect(main.style.transform).toBe("");
    expect(document.documentElement.classList.contains("hs-exit")).toBe(false);
  });
});

describe("timeline (tunnel → decel → stars → arrival)", () => {
  it("keeps the burst a garnish, holds a real star beat, and lands the total in 4.2–4.8s", () => {
    // The cold-open streak burst is a garnish inside the tunnel phase.
    expect(HS_TIMELINE.burstMs).toBeLessThanOrEqual(400);
    expect(HS_TIMELINE.burstMs).toBeLessThan(HS_TIMELINE.tunnelMs);
    // A real beat of full-frame cloud-tunnel travel before deceleration.
    expect(HS_TIMELINE.tunnelMs).toBeGreaterThanOrEqual(1200);
    // The decel is long enough to read: wash in, streaks through, snap.
    expect(HS_TIMELINE.decelMs).toBeGreaterThanOrEqual(800);
    expect(HS_TIMELINE.decelMs).toBeLessThanOrEqual(1200);
    // The settled-stars beat is held — serenity, not a blink.
    expect(HS_TIMELINE.settleMs).toBeGreaterThanOrEqual(400);
    expect(HS_TIMELINE.settleMs).toBeLessThanOrEqual(600);
    expect(HS_TIMELINE.exitMs).toBeGreaterThanOrEqual(1200);
    expect(HS_TIMELINE.totalMs).toBe(
      HS_TIMELINE.tunnelMs +
        HS_TIMELINE.decelMs +
        HS_TIMELINE.settleMs +
        HS_TIMELINE.exitMs +
        HS_TIMELINE.arriveMs,
    );
    expect(HS_TIMELINE.totalMs).toBeGreaterThanOrEqual(4200);
    expect(HS_TIMELINE.totalMs).toBeLessThanOrEqual(4800);
  });

  it("choreographs the decel: wash fully in before the tunnel starts fading, tunnel gone before the snap", () => {
    // Wash: 0 at the top of the decel, monotonically up to 1.
    expect(washAt(-100)).toBe(0);
    expect(washAt(0)).toBe(0);
    expect(washAt(400)).toBe(1);
    let prev = washAt(0);
    for (let t = 40; t <= 400; t += 40) {
      const v = washAt(t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    // The tunnel holds solid until the wash has bloomed, then fades out.
    expect(tunnelFadeAt(0)).toBe(1);
    expect(tunnelFadeAt(400)).toBe(1);
    prev = tunnelFadeAt(400);
    for (let t = 450; t <= 750; t += 50) {
      const v = tunnelFadeAt(t);
      expect(v).toBeLessThanOrEqual(prev);
      prev = v;
    }
    // Fully out mid-phase — dark space owns the frame well before the snap.
    expect(tunnelFadeAt(750)).toBe(0);
    expect(tunnelFadeAt(HS_TIMELINE.decelMs)).toBe(0);
  });
});

describe("streak deceleration (restored round-1 math)", () => {
  it("opens at peak speed and decays with the exponential half-life signature", () => {
    // Clamped to the entry speed before the decel begins.
    expect(streakSpeedAt(-500)).toBe(streakSpeedAt(0));
    expect(streakSpeedAt(0)).toBeGreaterThan(0);
    // v = V0·2^(−k·t): 125ms is one half-life at k=8 — the ratio sits at ~1/2
    // (the (1−p²) window shaves a hair off). A tween has no such signature.
    const ratio = streakSpeedAt(150) / streakSpeedAt(25);
    expect(ratio).toBeGreaterThan(0.44);
    expect(ratio).toBeLessThan(0.53);
    // Monotone deceleration throughout.
    let prev = streakSpeedAt(0);
    for (let t = 50; t <= HS_TIMELINE.decelMs; t += 50) {
      const v = streakSpeedAt(t);
      expect(v).toBeLessThanOrEqual(prev);
      prev = v;
    }
  });

  it("snaps to exactly 0 at the end of the decel — nothing drifts after the stop", () => {
    expect(streakSpeedAt(HS_TIMELINE.decelMs)).toBe(0);
    expect(streakSpeedAt(HS_TIMELINE.decelMs + 500)).toBe(0);
    // The windowed decay has already crawled to ~nothing just before the snap.
    expect(streakSpeedAt(HS_TIMELINE.decelMs - 1)).toBeLessThan(0.001);
  });

  it("front-loads the shed: the early drop dwarfs the late crawl", () => {
    const early = streakSpeedAt(0) - streakSpeedAt(250);
    const late = streakSpeedAt(500) - streakSpeedAt(750);
    expect(early).toBeGreaterThan(late * 10);
  });
});

describe("settled starfield (restored round-2 field)", () => {
  it("scales the calm count with viewport area, clamped to the 300–600 band", () => {
    expect(calmStarCount(1920, 1080)).toBe(494); // 1920·1080 / 4200
    expect(calmStarCount(800, 600)).toBe(300); // small viewports clamp up
    expect(calmStarCount(3840, 2160)).toBe(600); // huge viewports clamp down
    for (const [w, h] of [
      [320, 568],
      [1280, 720],
      [2560, 1440],
      [5120, 2880],
    ] as const) {
      const n = calmStarCount(w, h);
      expect(n).toBeGreaterThanOrEqual(300);
      expect(n).toBeLessThanOrEqual(600);
    }
  });
});

describe("destination approach curve (the page rushes toward camera)", () => {
  it("emerges tiny, grows monotonically, and reaches exactly 1 at the end", () => {
    expect(exitScaleAt(0)).toBeCloseTo(0.03, 10);
    expect(exitScaleAt(HS_TIMELINE.exitMs)).toBeCloseTo(1, 10);
    let prev = exitScaleAt(0);
    for (let t = 50; t <= HS_TIMELINE.exitMs; t += 50) {
      const s = exitScaleAt(t);
      expect(s).toBeGreaterThan(prev);
      prev = s;
    }
    // Clamped outside the exit window on both sides.
    expect(exitScaleAt(-100)).toBeCloseTo(0.03, 10);
    expect(exitScaleAt(HS_TIMELINE.exitMs + 500)).toBe(1);
  });

  it("is true hyperbolic GROWTH (1/scale affine in t) that accelerates — not an ease-out", () => {
    // scale = S0 / (1 − (1−S0)·t/T) ⇒ 1/scale is affine in t: equal time
    // steps shed equal 1/scale steps. A linear or ease-out tween fails this.
    const inv = (t: number) => 1 / exitScaleAt(t);
    const d1 = inv(0) - inv(325);
    const d2 = inv(325) - inv(650);
    const d3 = inv(650) - inv(975);
    expect(d1).toBeCloseTo(d2, 8);
    expect(d2).toBeCloseTo(d3, 8);
    // Rushing, not easing: the second half grows vastly more than the first,
    // and growth keeps accelerating right into the arrival frame — the exact
    // opposite of round 2's front-loaded recede.
    const T = HS_TIMELINE.exitMs;
    const early = exitScaleAt(T / 2) - exitScaleAt(0);
    const late = exitScaleAt(T) - exitScaleAt(T / 2);
    expect(late).toBeGreaterThan(early * 5);
    const dMid = exitScaleAt(T / 2 + 50) - exitScaleAt(T / 2);
    const dEnd = exitScaleAt(T) - exitScaleAt(T - 50);
    expect(dEnd).toBeGreaterThan(dMid * 3);
  });

  it("fades the emerging card in over the opening of the exit, then holds solid", () => {
    expect(exitAlphaAt(0)).toBe(0);
    expect(exitAlphaAt(70)).toBeCloseTo(0.5, 5);
    expect(exitAlphaAt(140)).toBe(1);
    expect(exitAlphaAt(HS_TIMELINE.exitMs)).toBe(1);
  });
});

describe("tunnel shader (dependency-free raw WebGL)", () => {
  it("declares the driving uniforms and stays WebGL1-compatible GLSL", () => {
    for (const u of [
      "u_time",
      "u_resolution",
      "u_speed",
      "u_wash",
      "u_burst",
    ]) {
      expect(HS_FRAG).toContain(u);
    }
    // The round-3 exit machinery is gone: the approach happens over the 2D
    // starfield, so the shader no longer takes the page box or exit progress.
    expect(HS_FRAG).not.toContain("u_rect");
    expect(HS_FRAG).not.toContain("u_exitProgress");
    // ES 1.00 dialect: no version directive, explicit precision, and the
    // classic attribute/gl_FragColor forms (WebGL1 everywhere).
    expect(HS_FRAG).not.toContain("#version");
    expect(HS_FRAG).toContain("precision");
    expect(HS_FRAG).toContain("gl_FragColor");
    expect(HS_VERT).toContain("attribute vec2 a_pos");
  });
});
