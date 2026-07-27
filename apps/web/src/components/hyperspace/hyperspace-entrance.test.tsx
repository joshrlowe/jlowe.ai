import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  bloomAt,
  burstLineCount,
  burstSpawnXY,
  calmStarCount,
  exitAlphaAt,
  exitScaleAt,
  HS_BURST,
  HS_FRAG,
  HS_TIMELINE,
  HS_VERT,
  HyperspaceEntrance,
  streakSpeedAt,
  tunnelFadeAt,
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
  return {
    setTransform: () => undefined,
    clearRect: () => undefined,
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

  it("WebGL unavailable but 2D alive → burst → stars → arrival still plays (tunnel+bloom skipped)", () => {
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

describe("timeline (tunnel → bloom → burst → stars → arrival)", () => {
  it("holds the film beats in their bands and lands the total in 5.4–6.5s", () => {
    // The cold-open streak garnish stays a garnish inside the tunnel beat.
    expect(HS_TIMELINE.garnishMs).toBeLessThanOrEqual(400);
    expect(HS_TIMELINE.garnishMs).toBeLessThan(HS_TIMELINE.tunnelMs);
    // A. Tunnel travel — billowing, no swirl (ref-0/ref-2).
    expect(HS_TIMELINE.tunnelMs).toBeGreaterThanOrEqual(1600);
    expect(HS_TIMELINE.tunnelMs).toBeLessThanOrEqual(2000);
    // B. Core bloom — the orb floods the centre (ref-1).
    expect(HS_TIMELINE.bloomMs).toBeGreaterThanOrEqual(500);
    expect(HS_TIMELINE.bloomMs).toBeLessThanOrEqual(700);
    // C. Starline burst — fine lines contracting on a dark centre (ref-4/3).
    expect(HS_TIMELINE.burstMs).toBeGreaterThanOrEqual(700);
    expect(HS_TIMELINE.burstMs).toBeLessThanOrEqual(900);
    // D. The settled-stars beat is held — serenity, not a blink (ref-5).
    expect(HS_TIMELINE.settleMs).toBeGreaterThanOrEqual(400);
    expect(HS_TIMELINE.settleMs).toBeLessThanOrEqual(600);
    expect(HS_TIMELINE.exitMs).toBeGreaterThanOrEqual(1200);
    expect(HS_TIMELINE.totalMs).toBe(
      HS_TIMELINE.tunnelMs +
        HS_TIMELINE.bloomMs +
        HS_TIMELINE.burstMs +
        HS_TIMELINE.settleMs +
        HS_TIMELINE.exitMs +
        HS_TIMELINE.arriveMs,
    );
    expect(HS_TIMELINE.totalMs).toBeGreaterThanOrEqual(5400);
    expect(HS_TIMELINE.totalMs).toBeLessThanOrEqual(6500);
  });

  it("round-6 phase boundaries: bloom at 2000, burst at 2600, stars at 3400, approach at 3900, land at 5200, fade to 5600", () => {
    const bloomStart = HS_TIMELINE.tunnelMs;
    const burstStart = bloomStart + HS_TIMELINE.bloomMs;
    const settleStart = burstStart + HS_TIMELINE.burstMs;
    const exitStart = settleStart + HS_TIMELINE.settleMs;
    const landAt = exitStart + HS_TIMELINE.exitMs;
    expect(bloomStart).toBe(2000);
    expect(burstStart).toBe(2600);
    expect(settleStart).toBe(3400);
    expect(exitStart).toBe(3900);
    expect(landAt).toBe(5200);
    expect(HS_TIMELINE.totalMs).toBe(5600);
  });

  it("bloom choreography: the orb swells monotonically to full, then HOLDS while the burst collapses the canvas", () => {
    // 0 before and at the top of the bloom phase.
    expect(bloomAt(-100)).toBe(0);
    expect(bloomAt(0)).toBe(0);
    // Smoothstep swell: monotone up, full before the phase ends.
    let prev = bloomAt(0);
    for (let t = 30; t <= 450; t += 30) {
      const v = bloomAt(t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    expect(bloomAt(450)).toBe(1);
    expect(bloomAt(HS_TIMELINE.bloomMs)).toBe(1);
    // Holds flooded while the GL canvas fades out during the burst opening.
    expect(bloomAt(HS_TIMELINE.bloomMs + 500)).toBe(1);
  });

  it("collapse choreography: the flooded canvas holds through tunnel+bloom, then snaps out fast at the burst", () => {
    // Solid 1 through the whole tunnel AND bloom (t <= 0 = before the burst).
    expect(tunnelFadeAt(-HS_TIMELINE.bloomMs)).toBe(1);
    expect(tunnelFadeAt(-1)).toBe(1);
    expect(tunnelFadeAt(0)).toBe(1);
    // Fast monotone collapse over the burst opening (ref-4 → ref-3).
    let prev = tunnelFadeAt(0);
    for (let t = 40; t <= 240; t += 40) {
      const v = tunnelFadeAt(t);
      expect(v).toBeLessThanOrEqual(prev);
      prev = v;
    }
    expect(tunnelFadeAt(240)).toBe(0);
    // Dark space owns the frame for the rest of the burst — the centre is
    // dark long before the snap.
    expect(tunnelFadeAt(HS_TIMELINE.burstMs)).toBe(0);
  });
});

describe("starline burst (ref-4/ref-3: thousands of fine lines, dark centre)", () => {
  it("scales the line count with viewport area inside the 2000–3200 film band", () => {
    expect(burstLineCount(1440, 900)).toBe(2492); // 1440·900 / 520
    expect(burstLineCount(1280, 720)).toBe(2000); // small viewports clamp up
    expect(burstLineCount(1920, 1080)).toBe(3200); // large viewports clamp down
    expect(burstLineCount(3840, 2160)).toBe(3200);
    for (const [w, h] of [
      [320, 568],
      [1280, 720],
      [2560, 1440],
      [5120, 2880],
    ] as const) {
      const n = burstLineCount(w, h);
      expect(n).toBeGreaterThanOrEqual(HS_BURST.minLines);
      expect(n).toBeLessThanOrEqual(HS_BURST.maxLines);
    }
  });

  it("derates coarse pointers for per-frame work at equivalent visual density", () => {
    expect(burstLineCount(390, 844, true)).toBe(
      Math.round(HS_BURST.minLines * HS_BURST.coarseFactor),
    );
    expect(burstLineCount(1920, 1080, true)).toBe(
      Math.round(HS_BURST.maxLines * HS_BURST.coarseFactor),
    );
  });

  it("draws THIN crisp lines: ~1 device px, with layered lengths via exposure jitter", () => {
    // The film lines are ~1px at device resolution — the draw path divides
    // by DPR so this is exactly 1 device px at any DPR.
    expect(HS_BURST.lineWidthDevicePx).toBe(1);
    // Layered lengths: a real spread of exposure multipliers.
    expect(HS_BURST.exposureMin).toBeLessThan(1);
    expect(HS_BURST.exposureMax).toBeGreaterThan(1);
    expect(HS_BURST.stretchS).toBeGreaterThan(0);
  });

  it("keeps the vanishing point DARK: spawns reject the central hole (ref-3's dead-black centre)", () => {
    expect(HS_BURST.centerHoleFieldR).toBeGreaterThan(0);
    const r2min = HS_BURST.centerHoleFieldR * HS_BURST.centerHoleFieldR;
    // A rigged RNG that first proposes the exact centre: it must be rejected
    // and re-rolled, never returned.
    const rolls = [0.5, 0.5, 0.9, 0.5]; // (0,0) — inside the hole — then (0.8,0)
    let i = 0;
    const rigged = () => rolls[i++ % rolls.length] ?? 0.9;
    const p = burstSpawnXY(rigged);
    expect(p.x * p.x + p.y * p.y).toBeGreaterThanOrEqual(r2min);
    expect(p.x).toBeCloseTo(0.8, 10);
    // And the real RNG never lands inside the hole either.
    for (let n = 0; n < 500; n++) {
      const q = burstSpawnXY();
      expect(q.x * q.x + q.y * q.y).toBeGreaterThanOrEqual(r2min);
      expect(Math.abs(q.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(q.y)).toBeLessThanOrEqual(1);
    }
  });
});

describe("line contraction (exponential-decel snap)", () => {
  it("opens at peak speed and decays with the exponential half-life signature", () => {
    // Clamped to the entry speed before the burst begins.
    expect(streakSpeedAt(-500)).toBe(streakSpeedAt(0));
    expect(streakSpeedAt(0)).toBeGreaterThan(0);
    // v = V0·2^(−k·t): 182ms is one half-life at k=5.5 — the ratio sits at
    // ~1/2 (the (1−p²) window shaves a hair off). A tween has no such
    // signature.
    const ratio = streakSpeedAt(207) / streakSpeedAt(25);
    expect(ratio).toBeGreaterThan(0.44);
    expect(ratio).toBeLessThan(0.5);
    // Monotone contraction throughout.
    let prev = streakSpeedAt(0);
    for (let t = 50; t <= HS_TIMELINE.burstMs; t += 50) {
      const v = streakSpeedAt(t);
      expect(v).toBeLessThanOrEqual(prev);
      prev = v;
    }
  });

  it("snaps to exactly 0 at the end of the burst — the lines become star points and nothing drifts", () => {
    expect(streakSpeedAt(HS_TIMELINE.burstMs)).toBe(0);
    expect(streakSpeedAt(HS_TIMELINE.burstMs + 500)).toBe(0);
    // The windowed decay has already crawled to ~nothing just before the
    // snap.
    expect(streakSpeedAt(HS_TIMELINE.burstMs - 1)).toBeLessThan(0.01);
  });

  it("front-loads the shed: the early contraction dwarfs the late crawl", () => {
    const early = streakSpeedAt(0) - streakSpeedAt(250);
    const late = streakSpeedAt(500) - streakSpeedAt(750);
    expect(early).toBeGreaterThan(late * 6);
  });
});

describe("settled starfield (ref-5: black, fine dim stars)", () => {
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
      "u_bloom",
      "u_burst",
    ]) {
      expect(HS_FRAG).toContain(u);
    }
    // The round-5 wash uniform is gone — the exit is bloom + collapse now.
    expect(HS_FRAG).not.toContain("u_wash");
    // ES 1.00 dialect: no version directive, explicit precision, and the
    // classic attribute/gl_FragColor forms (WebGL1 everywhere).
    expect(HS_FRAG).not.toContain("#version");
    expect(HS_FRAG).toContain("precision");
    expect(HS_FRAG).toContain("gl_FragColor");
    expect(HS_VERT).toContain("attribute vec2 a_pos");
  });

  it("round 6: the cyclone is DEAD — no differential rotation, no spiral advection, no roll", () => {
    // The owner's note: "hyperspace is too swirly." Every rotation-language
    // knob from round 5 must be gone from the shader.
    for (const dead of [
      "HS_OMEGA0",
      "HS_OMEGA1",
      "HS_K_SPIRAL",
      "HS_ROLL",
      "swirl",
      "spin",
    ]) {
      expect(HS_FRAG).not.toContain(dead);
    }
  });

  it("round 6: the motion language is turbulent radial billowing — boiling noise, radial elongation, bloom orb", () => {
    // The noise takes a third BOIL axis so clouds churn in place instead of
    // rotating (turbulence, not a cyclone).
    expect(HS_FRAG).toContain("float hs_noise(vec2 p, float px, float w)");
    expect(HS_FRAG).toContain("boil");
    // Radial elongation: the wisp field samples many angular repeats against
    // a very slow radial lattice — lumps smear into soft radial streaks.
    expect(HS_FRAG).toContain("vec2(ang * 14.0, flow * 0.16)");
    // The bloom uniform drives a growing core orb (ref-1's flooding centre).
    expect(HS_FRAG).toContain("orbR");
    // The film's saturated cobalt ramp: deep #0a1e6e, cobalt #2a63ff, pale
    // #bcd9ff.
    expect(HS_FRAG).toContain("vec3(0.039, 0.118, 0.431)");
    expect(HS_FRAG).toContain("vec3(0.165, 0.388, 1.0)");
    expect(HS_FRAG).toContain("vec3(0.737, 0.851, 1.0)");
  });
});
