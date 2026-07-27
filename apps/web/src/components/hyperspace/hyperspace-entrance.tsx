"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

/*
 * "Hyperspace exit" entrance — round 4: full-frame travel, then a true
 * deceleration into perceivable stars (the Rogue One arrival grammar).
 *
 * Two stacked canvases share one RAF timeline:
 *
 *  - A dependency-free raw-WebGL fragment shader (WebGL1 GLSL, one program,
 *    one full-screen triangle) renders hyperspace TRAVEL as a churning
 *    luminous cloud-tunnel that fills the ENTIRE viewport — floored radial
 *    brightness profile, big fbm sheets that sweep across the corners,
 *    corner-to-corner god-rays, a whisper of vignette — with the white-hot
 *    core as a focal point INSIDE the medium, not a spotlight in darkness.
 *  - A 2D canvas (no GL required) renders the star phases restored from
 *    rounds 1–2: the exponential streak-decel field (streak length ∝ speed ×
 *    radial distance via true perspective projection; v = V0·2^(−k·t) with a
 *    windowed snap to exactly 0) and the calm settled deep-space field
 *    (~300–600 points, whisper drift). No wordmark — the beat is serenity.
 *
 * Sequence: tunnel travel → decelerate (the shader ramps a blue-white radial
 * WASH while the discrete streak field fades in through it already long and
 * fast; the tunnel canvas then fades fully out mid-phase, revealing dark
 * space as the streaks exponentially shorten into points) → a held beat of
 * calm starfield — we have dropped to sublight and can perceive stars again
 * → arrival: the real SSG page (#main) emerges over the starfield as a tiny
 * silhouette card and rushes toward the camera on the constant-velocity
 * approach curve scale(t) = S0 / (1 − (1−S0)·t/T) (1/scale affine in t —
 * hyperbolic GROWTH, slow emerge then an accelerating rush), glow rim via
 * CSS (globals.css html.hs-exit #main), stars behind it until the overlay
 * fades at landing. End state: pristine DOM (no residual transform/filter/
 * clip), CLS 0.
 *
 * Progressive enhancement is sacred: nothing renders on the server or the
 * first client render; the overlay mounts on the frame AFTER the real
 * content paints (so the page, untransformed, sets FCP/LCP); prefers-
 * reduced-motion and repeat visits get the instant site. If WebGL is
 * unavailable — or its context is lost mid-flight — the tunnel phase is
 * skipped and the sequence still runs streaks → stars → arrival entirely on
 * the 2D canvas; only when BOTH canvases are unusable does it fall back to
 * the instant site.
 *
 * The numeric tunables set the *feel* and want an in-browser pass — canvas
 * output can't be seen from CI. The structure — full-frame tunnel, wash-out
 * decel, exponential streak snap, settled field, hyperbolic page approach —
 * is the verified reference look and is fixed.
 */

const SESSION_KEY = "hs-entrance:played";

// ---- Timeline (ms) ----
const BURST_MS = 300; // cold-open streak garnish decays over this window
const TUNNEL_MS = 1400; // 1. full-frame travel inside the cloud tunnel
const DECEL_MS = 1000; // 2. wash + streak field decelerating to a snap
const SETTLE_MS = 500; // 3. calm starfield — stars perceivable, held beat
const EXIT_MS = 1300; // 4. destination approach: page scale S0 → 1
const ARRIVE_MS = 400; // overlay (stars) fades off over the landed page
// Safety net: if the canvas/RAF never reaches arrival, force completion.
const WATCHDOG_MS =
  TUNNEL_MS + DECEL_MS + SETTLE_MS + EXIT_MS + ARRIVE_MS + 900;

/** The full phase timeline, exported for tests/docs. Total = 4.6s. */
export const HS_TIMELINE = {
  burstMs: BURST_MS,
  tunnelMs: TUNNEL_MS,
  decelMs: DECEL_MS,
  settleMs: SETTLE_MS,
  exitMs: EXIT_MS,
  arriveMs: ARRIVE_MS,
  totalMs: TUNNEL_MS + DECEL_MS + SETTLE_MS + EXIT_MS + ARRIVE_MS,
} as const;

// ---- Decel choreography (ms into the decel phase) ----
const WASH_RAMP_MS = 350; // shader wash 0 → 1: the blue-white white-out
const TUNNEL_FADE_START_MS = 400; // tunnel canvas opacity 1 → 0 begins …
const TUNNEL_FADE_END_MS = 750; // … and is fully out mid-phase
const STREAK_FADE_IN_MS = 250; // streak field emerges through the wash
// Warp→calm crossfade bracketing the snap (t = DECEL_MS): the spent streak
// points fade out while the settled field fades in — no pop, and nothing is
// drifting any more (speed snapped to 0) while either fade runs.
const WARP_FADE_OUT_START_MS = DECEL_MS - 150;
const WARP_FADE_OUT_END_MS = DECEL_MS + 120;
const CALM_FADE_IN_START_MS = DECEL_MS - 120;
const CALM_FADE_IN_END_MS = DECEL_MS + 280;

// ---- Streak field (restored round-1 values) ----
const STAR_MIN = 450;
const STAR_MAX = 950;
const Z_NEAR = 0.06; // recycle plane — stars past this fly off and respawn
const Z_FAR = 1.15; // spawn depth
const FOCAL = 0.85; // projection scale as a fraction of min(viewport)
const V0 = 6.2; // entry forward speed (z-units/s) — already at full streak
const DECAY_K = 8; // exponential decel constant: v = V0 · 2^(−k·t)
const STRETCH = 0.032; // streak "exposure" (s): zPrev = z + v·STRETCH
const MAX_STREAK_FRAC = 0.9; // clamp a single streak to this fraction of maxDim
const ABERRATION_PX = 3.2; // chromatic split at speed, decays with speed → 0
// Streak color slides from a saturated mid-blue (reads as darker slivers
// THROUGH the near-white wash while the tunnel canvas still covers) to the
// round-1 pale blue-white (reads luminous over dark space once it's gone).
const STREAK_SAT_RGB = [88, 132, 240] as const;
const STREAK_PALE_RGB = [150, 200, 255] as const;
const GLOW_RGB = "109,179,255"; // #6db3ff — residual forward-glow at speed

// ---- Settled starfield (restored round-2 values) ----
const SETTLE_DENSITY_PX2 = 4200; // one star per this many px², clamped below
const SETTLE_STAR_MIN = 300;
const SETTLE_STAR_MAX = 600;
const SETTLE_DRIFT_X = -0.7; // px/s — a whisper of drift; serenity is the point
const SETTLE_DRIFT_Y = 0.4;

// ---- Destination approach (the page IS the destination) ----
const EXIT_START_SCALE = 0.03; // S0 — the emerging silhouette card
const EXIT_FADE_IN_MS = 140; // card alpha ramp at emergence (over the stars)
const TUNNEL_SPEED = 1.0; // u_speed — global flow multiplier (feel knob)

// ---- Palette (overlay backdrop; the shader owns the tunnel colors) ----
const BG = "#02030a";

/** Linear ramp of t from 0 at `a` to 1 at `b`, clamped. */
function ramp01(t: number, a: number, b: number): number {
  return Math.min(Math.max((t - a) / (b - a), 0), 1);
}

/**
 * Streak-field forward speed (z-units/s) at t ms into the decel phase — the
 * restored round-1 law: peak V0 at entry, exponential decay v = V0·2^(−k·t)
 * windowed by (1 − p²) so the final frames snap cleanly to exactly 0 —
 * nothing drifts after the stop.
 */
export function streakSpeedAt(tDecelMs: number): number {
  if (tDecelMs <= 0) return V0;
  const p = tDecelMs / DECEL_MS;
  if (p >= 1) return 0;
  const v = V0 * Math.pow(2, -DECAY_K * (tDecelMs / 1000)) * (1 - p * p);
  return v > 0 ? v : 0;
}

/** Shader wash uniform over the decel: 0 → 1 across the opening ramp. */
export function washAt(tDecelMs: number): number {
  return ramp01(tDecelMs, 0, WASH_RAMP_MS);
}

/**
 * Tunnel canvas opacity over the decel: holds 1 until the wash has fully
 * bloomed, then smoothsteps to 0 — fully out mid-phase, well before the
 * snap, so the streaks shorten over dark space exactly as in the reference.
 */
export function tunnelFadeAt(tDecelMs: number): number {
  const c = ramp01(tDecelMs, TUNNEL_FADE_START_MS, TUNNEL_FADE_END_MS);
  return 1 - c * c * (3 - 2 * c);
}

/** Settled-field star count for a viewport: area-scaled, clamped calm band. */
export function calmStarCount(wPx: number, hPx: number): number {
  const n = Math.round((wPx * hPx) / SETTLE_DENSITY_PX2);
  return Math.max(SETTLE_STAR_MIN, Math.min(SETTLE_STAR_MAX, n));
}

/**
 * Page scale during the exit: a constant-velocity perspective approach.
 * scale = S0 / (1 − (1−S0)·p) with p = t/EXIT_MS clamped to [0,1], so
 * 1/scale is affine in t (the physical z(t) = z0 − v·t signature). Hyperbolic
 * GROWTH: it emerges slowly, then rushes — deliberately NOT a tween, and the
 * exact inverse of round 2's recede. scale(0) = S0, scale(EXIT_MS) = 1.
 */
export function exitScaleAt(tExitMs: number): number {
  const p = Math.min(Math.max(tExitMs / EXIT_MS, 0), 1);
  if (p >= 1) return 1; // land the arrival exactly (no float residue)
  return EXIT_START_SCALE / (1 - (1 - EXIT_START_SCALE) * p);
}

/** Card opacity over the exit: ramps 0 → 1 across the first ~140ms, then 1. */
export function exitAlphaAt(tExitMs: number): number {
  return Math.min(Math.max(tExitMs / EXIT_FADE_IN_MS, 0), 1);
}

/* ---------------------------------------------------------------------------
 * Shaders. WebGL1-compatible GLSL (ES 1.00): no version directive, attribute/
 * varying keywords, gl_FragColor output. The noise is hash-based value noise
 * written for this file (constants and construction our own; nothing copied).
 * Exported so tests can smoke-check the uniform contract + GLSL dialect.
 * ------------------------------------------------------------------------ */

export const HS_VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

export const HS_FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform float u_time;         // seconds since sequence start
uniform vec2  u_resolution;   // drawing-buffer size (px)
uniform float u_speed;        // tunnel flow multiplier (1.0 = authored feel)
uniform float u_wash;         // decel white-out: 0 in travel -> 1 at peak
uniform float u_burst;        // cold-open streak garnish, 1 -> 0 over ~300ms

// Lattice hash — small constants keep sin() well-conditioned on mediump GPUs.
float hs_hash(vec2 p) {
  return fract(sin(p.x * 51.53 + p.y * 103.71) * 9761.417);
}

// Value noise whose x lattice wraps at px cells, so sampling around the full
// angle never seams at +/-PI. y (radial depth) is unbounded.
float hs_noise(vec2 p, float px) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 w = f * f * (3.0 - 2.0 * f);
  float x0 = mod(i.x, px);
  float x1 = mod(i.x + 1.0, px);
  float a = hs_hash(vec2(x0, i.y));
  float b = hs_hash(vec2(x1, i.y));
  float c = hs_hash(vec2(x0, i.y + 1.0));
  float d = hs_hash(vec2(x1, i.y + 1.0));
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);
}

// 3-octave fbm on the wrapping lattice, renormalized to [0,1].
float hs_fbm(vec2 p, float px) {
  float v = 0.5 * hs_noise(p, px);
  v += 0.25 * hs_noise(p * 2.0 + vec2(13.7, 9.3), px * 2.0);
  v += 0.125 * hs_noise(p * 4.0 + vec2(29.1, 3.7), px * 4.0);
  return v * 1.142857;
}

void main() {
  float minDim = min(u_resolution.x, u_resolution.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / (0.5 * minDim);
  float r = length(p);
  float turn = atan(p.y, p.x) * 0.1591549 + 0.5; // angle in [0,1) turns

  // Tunnel mapping: depth diverges toward the vanishing point; adding time
  // scrolls features outward = flying forward. The divergence is deliberately
  // SOFT (1.5/(r+0.30), was 1.1/(r+0.12)) so the depth range isn't hoarded by
  // the core — mid and outer radii keep a live radial gradient and stream.
  // Churn = slow global rotation plus a depth-dependent twist (swirl shear).
  float depth = 1.5 / (r + 0.30);
  float flow = depth + u_time * 3.4 * u_speed;
  float spin = turn + 0.04 * u_time + 0.05 * depth;

  // Volumetric cloud body — 4 angular repeats (was 6) on a slower radial
  // lattice: the structures are big luminous sheets that sweep across the
  // corners. Squaring deepens the dark navy pockets between the folds —
  // local features of the medium, not an edge falloff.
  float clouds = hs_fbm(vec2(spin * 4.0, flow * 0.8), 4.0);
  clouds *= clouds;

  // God-rays: sparse angular spokes, elongated radially, drifting slowly —
  // they run corner-to-corner (no mid-radius attenuation anywhere below).
  float rays = hs_fbm(vec2((turn + 0.02 * u_time) * 12.0, flow * 0.3), 12.0);
  rays = pow(smoothstep(0.38, 0.92, rays), 1.5);

  // White-hot core (brightness-ramp bloom) — a focal point INSIDE the
  // full-frame medium, not a spotlight in darkness.
  float core = 0.05 / (r * r + 0.006);

  // FLOORED radial profile: the corners keep >= ~55% of the centre's cloud
  // luminance (round 3's exp(-1.35 r) left ~26% at r=1 and ~7% at r=2), so
  // the whole viewport reads as luminous churning medium.
  float profile = 0.55 + 0.45 * exp(-0.9 * r);

  float lum = core;
  lum += (0.35 + 1.85 * clouds) * profile * (0.7 + 1.5 * rays);

  // Cold-open garnish: a brief discrete radial streak burst (the entry beat)
  // laid over the tunnel, gone within ~300ms.
  if (u_burst > 0.001) {
    float sa = hs_noise(vec2(turn * 110.0, 0.0), 110.0);
    float run = hs_noise(vec2(turn * 110.0, r * 3.0 - u_time * 10.0), 110.0);
    lum += u_burst * pow(sa, 7.0) * (0.4 + 0.6 * run) * 6.0 *
           smoothstep(0.05, 0.45, r);
  }

  // Vignette reduced to a whisper (was 0.4 over r in 1..2).
  lum *= 1.0 - 0.12 * smoothstep(1.2, 2.2, r);

  // Decel wash: the whole frame brightens toward blue-white with a radial
  // bias — the near-white veil the streak field (2D canvas above) reads
  // through as darker slivers before dark space is revealed beneath it.
  lum = lum * (1.0 + 1.6 * u_wash) + u_wash * (2.2 * exp(-0.7 * r) + 0.4);

  // Palette: near-black navy -> #0a2a66 deep -> #2e6fd8 mid -> #bfe0ff
  // bright -> white-hot core.
  vec3 col = vec3(0.008, 0.016, 0.055);
  col = mix(col, vec3(0.039, 0.165, 0.400), smoothstep(0.0, 0.3, lum));
  col = mix(col, vec3(0.180, 0.435, 0.847), smoothstep(0.25, 0.6, lum));
  col = mix(col, vec3(0.749, 0.878, 1.0), smoothstep(0.5, 1.0, lum));
  col = mix(col, vec3(1.0), smoothstep(0.9, 1.7, lum));
  gl_FragColor = vec4(col, 1.0);
}
`;

interface GlHandles {
  g: WebGLRenderingContext;
  vs: WebGLShader;
  fs: WebGLShader;
  prog: WebGLProgram;
  buf: WebGLBuffer;
  uTime: WebGLUniformLocation | null;
  uRes: WebGLUniformLocation | null;
  uWash: WebGLUniformLocation | null;
  uBurst: WebGLUniformLocation | null;
}

interface Star {
  x: number; // normalized field coords in [-1, 1]
  y: number;
  z: number; // depth in (Z_NEAR, Z_FAR]
  b: number; // brightness 0.35–1
}

function makeStar(): Star {
  return {
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
    z: Z_NEAR + Math.random() * (Z_FAR - Z_NEAR),
    b: 0.35 + Math.random() * 0.65,
  };
}

interface CalmStar {
  x: number; // screen px
  y: number;
  r: number; // point radius (px)
  a: number; // alpha — subtle per-star brightness variation
}

/** Positive modulo, for the settled field's slow drift wrap. */
function wrap(v: number, max: number): number {
  return ((v % max) + max) % max;
}

/**
 * Boot the raw-WebGL pipeline: context, two shaders, one program, one
 * full-screen triangle. Returns null on ANY failure — the caller then skips
 * the tunnel phase and runs the star sequence on the 2D canvas alone.
 */
function initGL(canvas: HTMLCanvasElement): GlHandles | null {
  let g: WebGLRenderingContext | null = null;
  try {
    g = canvas.getContext("webgl", {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
    });
  } catch {
    return null;
  }
  if (!g) return null;

  const compile = (type: number, src: string): WebGLShader | null => {
    const sh = g.createShader(type);
    if (!sh) return null;
    g.shaderSource(sh, src);
    g.compileShader(sh);
    if (!g.getShaderParameter(sh, g.COMPILE_STATUS)) {
      g.deleteShader(sh);
      return null;
    }
    return sh;
  };

  const vs = compile(g.VERTEX_SHADER, HS_VERT);
  const fs = compile(g.FRAGMENT_SHADER, HS_FRAG);
  if (!vs || !fs) return null;

  const prog = g.createProgram();
  const buf = g.createBuffer();
  if (!prog || !buf) return null;
  g.attachShader(prog, vs);
  g.attachShader(prog, fs);
  g.linkProgram(prog);
  if (!g.getProgramParameter(prog, g.LINK_STATUS)) return null;
  g.useProgram(prog);

  g.bindBuffer(g.ARRAY_BUFFER, buf);
  g.bufferData(
    g.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    g.STATIC_DRAW,
  );
  const aPos = g.getAttribLocation(prog, "a_pos");
  if (aPos < 0) return null;
  g.enableVertexAttribArray(aPos);
  g.vertexAttribPointer(aPos, 2, g.FLOAT, false, 0, 0);

  g.uniform1f(g.getUniformLocation(prog, "u_speed"), TUNNEL_SPEED);
  return {
    g,
    vs,
    fs,
    prog,
    buf,
    uTime: g.getUniformLocation(prog, "u_time"),
    uRes: g.getUniformLocation(prog, "u_resolution"),
    uWash: g.getUniformLocation(prog, "u_wash"),
    uBurst: g.getUniformLocation(prog, "u_burst"),
  };
}

export function HyperspaceEntrance() {
  const [active, setActive] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const starCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const skipRef = useRef<HTMLButtonElement | null>(null);
  const skipHandlerRef = useRef<() => void>(() => {});

  // Decide once, after the first paint: skip for reduced-motion / repeat
  // visits, otherwise mount the overlay and play.
  useEffect(() => {
    let played = false;
    try {
      played = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // sessionStorage can throw (privacy mode) — treat as "not played".
    }
    if (played) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Instant site: the page is already painted underneath, untransformed.
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // ignore
      }
      return;
    }
    // Mount on the next frame — i.e. after the real content has painted, so it
    // (not the overlay, and never a transformed page) sets FCP/LCP.
    const id = requestAnimationFrame(() => setActive(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Run the sequence once the overlay + canvases are in the DOM.
  useEffect(() => {
    if (!active) return;
    const glCanvas = glCanvasRef.current;
    const starCanvas = starCanvasRef.current;
    if (!glCanvas || !starCanvas) return;
    const main = document.getElementById("main");

    let done = false;
    let raf = 0;
    let finishTimer: ReturnType<typeof setTimeout> | undefined;

    const markPlayed = () => {
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // ignore
      }
    };

    // Clear every inline style we own on #main. scale(1) is the identity, so
    // removal at arrival is pixel-invisible — and the DOM ends pristine.
    const restoreMain = () => {
      if (!main) return;
      main.style.removeProperty("transform");
      main.style.removeProperty("transform-origin");
      main.style.removeProperty("opacity");
      main.style.removeProperty("clip-path");
      main.style.removeProperty("will-change");
    };

    const finish = () => {
      document.documentElement.classList.remove("hs-exit");
      main?.removeAttribute("tabindex");
      setActive(false);
    };

    // Complete the sequence. fade=true is the normal arrival (overlay + star
    // canvas dissolve over ARRIVE_MS); fade=false is the fully degraded path
    // (no usable canvas, missing #main) — straight to the site.
    const conclude = (fade: boolean) => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      markPlayed();
      restoreMain();
      if (!fade) {
        finish();
        return;
      }
      setRevealing(true);
      // Hand focus to the page content — never trap it on the overlay.
      if (main) {
        main.setAttribute("tabindex", "-1");
        main.focus({ preventScroll: true });
      }
      finishTimer = setTimeout(finish, ARRIVE_MS + 80);
    };

    // Arm the safety net immediately; every path below is idempotent.
    const watchdog = setTimeout(() => conclude(true), WATCHDOG_MS);

    const cleanupShell = () => {
      clearTimeout(watchdog);
      if (finishTimer) clearTimeout(finishTimer);
      skipHandlerRef.current = () => {};
    };

    // The 2D star canvas is the backbone (phases 2–4 need no GL). Without it
    // — or without #main to arrive at — fall back to the instant site.
    let ctx: CanvasRenderingContext2D | null = null;
    if (main) {
      try {
        ctx = starCanvas.getContext("2d");
      } catch {
        ctx = null;
      }
    }
    if (!main || !ctx) {
      conclude(false);
      return cleanupShell;
    }
    const mainEl = main;

    // WebGL-unavailable: skip the tunnel phase — start the clock at the decel
    // phase so the streak field opens the sequence, over dark space.
    const glr = initGL(glCanvas);
    let tunnelOff = !glr;
    let timeOffset = glr ? 0 : TUNNEL_MS;
    if (!glr) glCanvas.style.opacity = "0";

    // ---- Viewport + page geometry ----
    let vw = 0;
    let vh = 0;
    let cx = 0;
    let cy = 0;
    let minCss = 1;
    let maxCss = 1;
    let rectW = 0;
    let rectLeft = 0;
    let rectTopDoc = 0;
    let clipH = 1;

    // Measure #main's layout box with the transform lifted (no paint happens
    // mid-task, so this is flash-free). jsdom/degenerate rects fall back to
    // sane numbers so the math stays finite.
    const measureMain = () => {
      const prev = mainEl.style.transform;
      mainEl.style.transform = "none";
      const rect = mainEl.getBoundingClientRect();
      mainEl.style.transform = prev;
      rectW = rect.width || Math.min(vw, 1024);
      rectLeft = rect.width ? rect.left : (vw - rectW) / 2;
      const top = rect.height ? rect.top : 72;
      rectTopDoc = top + window.scrollY;
      clipH = Math.max(vh - top, 1);
      // Clip the card to its first viewport so the miniature reads as "the
      // screen you are arriving at", not a page-tall sliver. The clip edge
      // lands exactly on the viewport bottom at scale 1, so removing it at
      // arrival is invisible.
      const overflow = Math.max(0, rect.height - clipH);
      mainEl.style.clipPath =
        overflow > 0 ? `inset(0px 0px ${overflow}px 0px)` : "";
    };

    // ---- 2D field state ----
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    let stars: Star[] = [];
    let calm: CalmStar[] = [];
    let calmSeeded = false;
    let calmT0 = 0; // elapsed-time anchor for the settled field's drift

    const seedWarpField = () => {
      let count = Math.round((vw * vh) / 1600);
      count = Math.max(STAR_MIN, Math.min(STAR_MAX, count));
      if (coarse) count = Math.round(count * 0.6);
      stars = Array.from({ length: count }, makeStar);
    };

    // Calm density differs from the warp field's — reseeded (not reused) so
    // the field reads pleasantly at rest instead of center-clustered.
    const seedCalmField = () => {
      calm = Array.from({ length: calmStarCount(vw, vh) }, () => {
        const b = Math.random();
        return {
          x: Math.random() * vw,
          y: Math.random() * vh,
          r: 0.45 + 0.95 * b,
          a: 0.28 + 0.72 * b,
        };
      });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = window.innerWidth;
      vh = window.innerHeight;
      cx = vw / 2;
      cy = vh / 2;
      minCss = Math.max(1, Math.min(vw, vh));
      maxCss = Math.max(vw, vh, 1);
      glCanvas.width = Math.round(vw * dpr);
      glCanvas.height = Math.round(vh * dpr);
      if (glr) {
        glr.g.viewport(0, 0, glCanvas.width, glCanvas.height);
        glr.g.uniform2f(glr.uRes, glCanvas.width, glCanvas.height);
      }
      starCanvas.width = Math.round(vw * dpr);
      starCanvas.height = Math.round(vh * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (calmSeeded) seedCalmField(); // re-scatter to the new viewport
      measureMain();
    };
    resize();
    seedWarpField();
    window.addEventListener("resize", resize);

    // Stage the destination: the page starts as the tiny silhouette card,
    // transparent until the exit phase lifts it out of the starfield. The
    // origin pins the point of #main that sits at the viewport centre
    // (recomputed per frame against scroll), so growth is centred on the
    // field's vanishing point and scale 1 needs no correction. hs-exit
    // (globals.css) lifts #main above the canvases, gives it an opaque
    // background and the CSS glow rim — layout-inert, CLS 0.
    const setPageTransform = (tExitMs: number) => {
      const s = exitScaleAt(tExitMs);
      const ox = vw / 2 - rectLeft;
      const oy = vh / 2 - (rectTopDoc - window.scrollY);
      mainEl.style.transformOrigin = `${ox}px ${oy}px`;
      mainEl.style.transform = `scale(${s})`;
    };
    document.documentElement.classList.add("hs-exit");
    mainEl.style.willChange = "transform, opacity";
    mainEl.style.opacity = "0";
    setPageTransform(0);

    // Skip = instant completion of the whole sequence.
    skipHandlerRef.current = () => conclude(true);
    skipRef.current?.focus({ preventScroll: true });

    // All motion derives from absolute elapsed time (never per-frame
    // integration), so the sequence is framerate-independent by construction.
    // (dt is used only to advance the star depths, capped for tab-out jumps.)
    const t0 = performance.now();
    let last = t0;
    const LAND_MS = TUNNEL_MS + DECEL_MS + SETTLE_MS + EXIT_MS;

    const onContextLost = (e: Event) => {
      e.preventDefault();
      // Degrade, don't bail: drop the tunnel and, if we're still inside it,
      // jump the clock to the decel phase — the star canvas needs no GL.
      tunnelOff = true;
      glCanvas.style.opacity = "0";
      const elapsed = performance.now() - t0 + timeOffset;
      if (elapsed < TUNNEL_MS) timeOffset += TUNNEL_MS - elapsed;
    };
    glCanvas.addEventListener("webglcontextlost", onContextLost);

    const drawStreaks = (fieldA: number, speed: number, cover: number) => {
      const speedFrac = speed / V0;
      const aberr = ABERRATION_PX * speedFrac;
      ctx.globalAlpha = fieldA;

      // Faint forward-glow while there is real speed — imperceptible under
      // the wash, a gentle center bloom when the field opens over dark.
      if (speedFrac > 0.01) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxCss * 0.6);
        g.addColorStop(0, `rgba(${GLOW_RGB},${0.16 * speedFrac})`);
        g.addColorStop(1, "rgba(2,3,10,0)");
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, vw, vh);
      }

      // source-over (not additive): the streaks must read THROUGH the bright
      // wash as darker slivers, then luminous over dark space — the color
      // slide (saturated ↔ pale) does that with a single draw path.
      ctx.globalCompositeOperation = "source-over";
      ctx.lineCap = "round";
      const k = 1 - cover;
      const sr = Math.round(
        STREAK_SAT_RGB[0] + (STREAK_PALE_RGB[0] - STREAK_SAT_RGB[0]) * k,
      );
      const sg = Math.round(
        STREAK_SAT_RGB[1] + (STREAK_PALE_RGB[1] - STREAK_SAT_RGB[1]) * k,
      );
      const sb = Math.round(
        STREAK_SAT_RGB[2] + (STREAK_PALE_RGB[2] - STREAK_SAT_RGB[2]) * k,
      );

      const scale = FOCAL * minCss;
      const stretchZ = speed * STRETCH;

      for (const s of stars) {
        // Perspective projection from a single vanishing point (viewport
        // centre) — the same projection that makes streak length grow with
        // speed AND radial distance (edge stars streak most).
        const proj = scale / s.z;
        const sx = cx + s.x * proj;
        const sy = cy + s.y * proj;
        // Cheap cull: drop streaks whose head is well off-screen.
        if (
          sx < -maxCss ||
          sx > vw + maxCss ||
          sy < -maxCss ||
          sy > vh + maxCss
        ) {
          continue;
        }
        // Streak tail = where the star was `stretchZ` deeper.
        const zPrev = s.z + stretchZ;
        const projPrev = scale / zPrev;
        let px = cx + s.x * projPrev;
        let py = cy + s.y * projPrev;

        let dx = sx - px;
        let dy = sy - py;
        let len = Math.hypot(dx, dy);
        const maxLen = MAX_STREAK_FRAC * maxCss;
        if (len > maxLen) {
          const clampK = maxLen / len;
          px = sx - dx * clampK;
          py = sy - dy * clampK;
          dx = sx - px;
          dy = sy - py;
          len = maxLen;
        }

        const alpha = Math.min(1, 0.2 + 0.8 * s.b);
        const width = 0.8 + s.b;

        // Chromatic aberration — at speed only, split along the radial
        // direction, recombining to a neutral core with red/blue fringes.
        if (aberr > 0.4 && len > 0.001) {
          const nx = dx / len;
          const ny = dy / len;
          ctx.lineWidth = width;
          ctx.strokeStyle = `rgba(255,64,64,${alpha * 0.5})`;
          ctx.beginPath();
          ctx.moveTo(px + nx * aberr, py + ny * aberr);
          ctx.lineTo(sx + nx * aberr, sy + ny * aberr);
          ctx.stroke();
          ctx.strokeStyle = `rgba(64,140,255,${alpha * 0.5})`;
          ctx.beginPath();
          ctx.moveTo(px - nx * aberr, py - ny * aberr);
          ctx.lineTo(sx - nx * aberr, sy - ny * aberr);
          ctx.stroke();
        }

        // Main streak.
        ctx.strokeStyle = `rgba(${sr},${sg},${sb},${alpha})`;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();

        // Bright head — this is the discrete point the streak collapses to.
        ctx.fillStyle = `rgba(255,255,255,${Math.min(1, 0.5 + 0.5 * s.b)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, width * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const drawCalm = (fieldA: number, tCalmMs: number) => {
      // Calm deep-space field: fine white points, subtle per-star brightness,
      // at most a whisper of drift — sublight; we can perceive stars again.
      ctx.globalCompositeOperation = "source-over";
      const ox = (SETTLE_DRIFT_X * tCalmMs) / 1000;
      const oy = (SETTLE_DRIFT_Y * tCalmMs) / 1000;
      for (const s of calm) {
        ctx.fillStyle = `rgba(238,242,255,${s.a * fieldA})`;
        ctx.beginPath();
        ctx.arc(wrap(s.x + ox, vw), wrap(s.y + oy, vh), s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const frame = (now: number) => {
      if (done) return;
      const dt = Math.min((now - last) / 1000, 0.05); // clamp tab-out jumps
      last = now;
      const elapsed = now - t0 + timeOffset;
      const tDecel = elapsed - TUNNEL_MS;
      const tExit = elapsed - (TUNNEL_MS + DECEL_MS + SETTLE_MS);

      // ---- GL tunnel: travel + wash; fully out mid-decel ----
      if (glr && !tunnelOff) {
        const fade = tunnelFadeAt(tDecel);
        if (fade > 0) {
          const g = glr.g;
          g.uniform1f(glr.uTime, elapsed / 1000);
          g.uniform1f(glr.uWash, washAt(tDecel));
          const b = Math.max(0, 1 - elapsed / BURST_MS);
          g.uniform1f(glr.uBurst, b * b);
          g.drawArrays(g.TRIANGLES, 0, 3);
          glCanvas.style.opacity = String(fade);
        } else {
          tunnelOff = true; // tunnel spent — dark space owns the frame now
          glCanvas.style.opacity = "0";
        }
      }

      // ---- 2D star canvas: streaks → snap → settled field ----
      ctx.clearRect(0, 0, vw, vh);
      if (tDecel >= 0) {
        const speed = streakSpeedAt(tDecel);
        const warpA =
          (1 - ramp01(tDecel, WARP_FADE_OUT_START_MS, WARP_FADE_OUT_END_MS)) *
          ramp01(tDecel, 0, STREAK_FADE_IN_MS);
        if (warpA > 0) {
          if (speed > 0) {
            const dz = speed * dt;
            for (const s of stars) {
              s.z -= dz;
              if (s.z <= Z_NEAR) {
                s.x = Math.random() * 2 - 1;
                s.y = Math.random() * 2 - 1;
                s.z = Z_FAR;
                s.b = 0.35 + Math.random() * 0.65;
              }
            }
          }
          const cover = tunnelOff ? 0 : tunnelFadeAt(tDecel);
          drawStreaks(warpA, speed, cover);
        }
        const calmA = ramp01(
          tDecel,
          CALM_FADE_IN_START_MS,
          CALM_FADE_IN_END_MS,
        );
        if (calmA > 0) {
          if (!calmSeeded) {
            calmSeeded = true;
            calmT0 = elapsed;
            seedCalmField();
          }
          drawCalm(calmA, elapsed - calmT0);
        }
      }

      // ---- Destination approach: the page grows over the starfield ----
      if (tExit >= 0) {
        setPageTransform(tExit);
        mainEl.style.opacity = String(exitAlphaAt(tExit));
      }

      if (elapsed >= LAND_MS) {
        // Arrived: the card is at scale 1; the starfield's final frame
        // dissolves under the ARRIVE_MS opacity fade.
        conclude(true);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      done = true;
      cancelAnimationFrame(raf);
      clearTimeout(watchdog);
      if (finishTimer) clearTimeout(finishTimer);
      window.removeEventListener("resize", resize);
      glCanvas.removeEventListener("webglcontextlost", onContextLost);
      restoreMain();
      document.documentElement.classList.remove("hs-exit");
      mainEl.removeAttribute("tabindex");
      skipHandlerRef.current = () => {};
      if (glr) {
        try {
          glr.g.deleteBuffer(glr.buf);
          glr.g.deleteProgram(glr.prog);
          glr.g.deleteShader(glr.vs);
          glr.g.deleteShader(glr.fs);
          glr.g.getExtension("WEBGL_lose_context")?.loseContext();
        } catch {
          // context already lost — nothing to free
        }
      }
    };
  }, [active]);

  if (!active || typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* Space layers: GL tunnel under the 2D star canvas, both UNDER the
          exiting page (#main is lifted to z-210 by html.hs-exit); the whole
          overlay fades away at arrival. */}
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-[200] transition-opacity ease-out",
          revealing ? "pointer-events-none opacity-0" : "opacity-100",
        )}
        style={{ background: BG, transitionDuration: `${ARRIVE_MS}ms` }}
      >
        <canvas ref={glCanvasRef} className="absolute inset-0 h-full w-full" />
        <canvas
          ref={starCanvasRef}
          className="absolute inset-0 h-full w-full"
        />
      </div>
      {/* Skip lives OUTSIDE the aria-hidden space layer and above the page. */}
      <button
        ref={skipRef}
        type="button"
        aria-label="Skip intro animation"
        onClick={() => skipHandlerRef.current()}
        className={cn(
          "fixed top-4 right-4 z-[220] inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm transition-opacity ease-out hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
          revealing && "pointer-events-none opacity-0",
        )}
        style={{ transitionDuration: `${ARRIVE_MS}ms` }}
      >
        Skip
        <kbd
          aria-hidden="true"
          className="rounded border border-white/30 px-1 text-xs leading-none"
        >
          ⏎
        </kbd>
      </button>
    </>,
    document.body,
  );
}
