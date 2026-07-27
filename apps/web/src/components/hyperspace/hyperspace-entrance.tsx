"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

/*
 * "Hyperspace exit" entrance — round 6: a TWIN of the owner's six film
 * reference frames. The owner's note on round 5: "hyperspace is too swirly."
 * The cyclone is dead — differential rotation, spiral advection and the
 * whole-frame roll are GONE. The motion language is now turbulent radial
 * BILLOWING: clouds boil in place (the noise evolves along a third axis)
 * while everything rushes radially outward; the only angular motion left is
 * a tiny incoherent noise jitter.
 *
 * The film beats, in reference order:
 *
 *  A. TUNNEL (ref-0, ref-2) — billowing turbulent blue clouds fill the
 *     ENTIRE frame around a white-hot core: big boiling lumps (dark pockets
 *     are local turbulence, not an edge falloff) smeared into soft RADIAL
 *     wisps like radial motion blur. Palette is the film's saturated cobalt:
 *     deep #0a1e6e -> cobalt #2a63ff -> pale #bcd9ff -> white core, bright
 *     to the corners (floored radial profile + whisper vignette).
 *  B. CORE BLOOM (ref-1) — u_bloom swells the core into a huge white orb
 *     flooding the centre (~55-60% of frame height) while the whole frame's
 *     luminance ramps toward white-blue and the cloud structure melts into
 *     soft rays.
 *  C. STARLINE BURST (ref-4 then ref-3) — the bloom collapses fast (the GL
 *     canvas fades out over ~240ms) and the frame snaps to THOUSANDS of very
 *     fine (~1 device px) crisp lines radiating from the centre on the 2D
 *     canvas: saturated-cobalt slivers through the dying white (ref-4), then
 *     pale blue-white on near-black with a DARK vanishing point — no glowing
 *     core, a spawn hole keeps the centre void (ref-3). Lines contract via
 *     the exponential-decel snap (v = V0·2^(−k·t), windowed to exactly 0)
 *     into star points. No additive bloom, no halo — density IS the light.
 *  D. CALM STARFIELD (ref-5) — black, fine dim stars, a held beat; then
 *     arrival: the real SSG page (#main) emerges as a tiny silhouette card
 *     and rushes toward the camera on the constant-velocity approach curve
 *     scale(t) = S0 / (1 − (1−S0)·t/T) (1/scale affine in t — hyperbolic
 *     growth), glow rim via CSS (globals.css html.hs-exit #main). End state:
 *     pristine DOM (no residual transform/filter/clip), CLS 0.
 *
 * Two stacked canvases share one RAF timeline: a dependency-free raw-WebGL
 * fragment shader (WebGL1 GLSL, one program, one full-screen triangle) owns
 * beats A-B; the 2D canvas owns C-D (no GL required).
 *
 * Progressive enhancement is sacred: nothing renders on the server or the
 * first client render; the overlay mounts on the frame AFTER the real
 * content paints (so the page, untransformed, sets FCP/LCP); prefers-
 * reduced-motion and repeat visits get the instant site. If WebGL is
 * unavailable — or its context is lost mid-flight — the tunnel AND bloom
 * are skipped and the sequence still runs burst -> stars -> arrival entirely
 * on the 2D canvas; only when BOTH canvases are unusable does it fall back
 * to the instant site.
 *
 * The numeric tunables set the *feel* and want an in-browser pass — canvas
 * output can't be seen from CI. The structure — billowing no-swirl tunnel,
 * orb bloom, fine-line dark-centre burst, settled field, hyperbolic page
 * approach — is the film-twin reference look and is fixed.
 */

const SESSION_KEY = "hs-entrance:played";

// ---- Timeline (ms) ----
const GARNISH_MS = 300; // cold-open streak garnish inside the tunnel beat
const TUNNEL_MS = 2000; // A. full-frame billowing travel (ref-0/ref-2)
const BLOOM_MS = 600; // B. core swells into the flooding white orb (ref-1)
const BURST_MS = 800; // C. fine-line starline burst, contracting (ref-4/3)
const SETTLE_MS = 500; // D. calm starfield — stars perceivable, held beat
const EXIT_MS = 1300; // destination approach: page scale S0 → 1
const ARRIVE_MS = 400; // overlay (stars) fades off over the landed page
// Safety net: if the canvas/RAF never reaches arrival, force completion.
const WATCHDOG_MS =
  TUNNEL_MS + BLOOM_MS + BURST_MS + SETTLE_MS + EXIT_MS + ARRIVE_MS + 900;

/** The full phase timeline, exported for tests/docs. Total = 5.6s. */
export const HS_TIMELINE = {
  garnishMs: GARNISH_MS,
  tunnelMs: TUNNEL_MS,
  bloomMs: BLOOM_MS,
  burstMs: BURST_MS,
  settleMs: SETTLE_MS,
  exitMs: EXIT_MS,
  arriveMs: ARRIVE_MS,
  totalMs: TUNNEL_MS + BLOOM_MS + BURST_MS + SETTLE_MS + EXIT_MS + ARRIVE_MS,
} as const;

// ---- Bloom choreography (ms into the bloom phase) ----
const BLOOM_RAMP_MS = 450; // orb radius + scene luminance 0 → 1 (then holds)

// ---- Burst choreography (ms into the burst phase) ----
const GL_COLLAPSE_MS = 240; // the flooded bloom canvas snaps out fast (ref-4)
const LINE_FADE_IN_MS = 120; // the line field is up almost instantly
// Warp→calm crossfade bracketing the snap (t = BURST_MS): the spent line
// points fade out while the settled field fades in — no pop, and nothing is
// drifting any more (speed snapped to 0) while either fade runs.
const WARP_FADE_OUT_START_MS = BURST_MS - 150;
const WARP_FADE_OUT_END_MS = BURST_MS + 120;
const CALM_FADE_IN_START_MS = BURST_MS - 120;
const CALM_FADE_IN_END_MS = BURST_MS + 280;

// ---- Starline burst field (ref-4/ref-3: thousands of fine crisp lines) ----
/**
 * The burst contract, exported for tests: the film frames show 2000+ very
 * fine (~1 device px) layered-length lines radiating from a DARK vanishing
 * point — `centerHoleFieldR` keeps spawns out of a small central void so no
 * line head glows at the centre (ref-3). `areaPerLinePx2` scales count with
 * viewport area inside the [minLines, maxLines] band; coarse pointers derate
 * by `coarseFactor` (equivalent visual density on small screens, less
 * per-frame work). `stretchS` is the exposure window (s): tail = head at
 * z + v·stretch·jitter, so line length ∝ speed × radial distance, layered by
 * the per-line exposure jitter.
 */
export const HS_BURST = {
  minLines: 2000,
  maxLines: 3200,
  areaPerLinePx2: 520,
  coarseFactor: 0.65,
  lineWidthDevicePx: 1,
  centerHoleFieldR: 0.06,
  stretchS: 0.05,
  exposureMin: 0.55,
  exposureMax: 1.45,
} as const;
const BURST_BUCKETS = 5; // lines batch into 5 color buckets → 5 strokes/frame
const DOT_FLOOR_PX = 0.75; // min stroke length: the star point at the snap
const Z_NEAR = 0.06; // recycle plane — lines past this fly off and respawn
const Z_FAR = 1.15; // spawn depth
const FOCAL = 0.85; // projection scale as a fraction of min(viewport)
const V0 = 5.5; // entry forward speed (z-units/s) — already at full length
const DECAY_K = 5.5; // exponential decel constant: v = V0 · 2^(−k·t)
const MAX_STREAK_FRAC = 0.9; // clamp a single line to this fraction of maxDim
// Line color slides from saturated cobalt (reads as blue slivers THROUGH the
// collapsing white bloom — ref-4) to pale blue-white (luminous on near-black
// once the GL canvas is out — ref-3). Buckets whiten toward the pale end for
// the layered white-through-blue mix of the frames.
const BURST_SAT_RGB = [42, 99, 255] as const; // #2a63ff
const BURST_PALE_RGB = [188, 217, 255] as const; // #bcd9ff

// ---- Settled starfield (unchanged round-2 field) ----
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
 * Line-field forward speed (z-units/s) at t ms into the burst phase — the
 * exponential-decel snap law: peak V0 at entry, v = V0·2^(−k·t) windowed by
 * (1 − p²) so the final frames snap cleanly to exactly 0 — the lines
 * contract into star points and nothing drifts after the stop (ref-3 → -5).
 */
export function streakSpeedAt(tBurstMs: number): number {
  if (tBurstMs <= 0) return V0;
  const p = tBurstMs / BURST_MS;
  if (p >= 1) return 0;
  const v = V0 * Math.pow(2, -DECAY_K * (tBurstMs / 1000)) * (1 - p * p);
  return v > 0 ? v : 0;
}

/**
 * Bloom uniform over the bloom phase: smoothsteps 0 → 1 across the opening
 * ramp, then HOLDS 1 (the orb stays flooded while the burst collapse fades
 * the canvas out). Drives BOTH the core orb radius and the scene-wide
 * luminance ramp in the shader — ref-1's flooded centre.
 */
export function bloomAt(tBloomMs: number): number {
  const c = ramp01(tBloomMs, 0, BLOOM_RAMP_MS);
  return c * c * (3 - 2 * c);
}

/**
 * GL canvas opacity: solid 1 through tunnel AND bloom (t <= 0 is "before the
 * burst"), then the flooded frame COLLAPSES fast — smoothstep to 0 over the
 * opening of the burst, revealing the fine-line field over dark (ref-4's
 * white beat becoming ref-3's dark-centre beat).
 */
export function tunnelFadeAt(tBurstMs: number): number {
  const c = ramp01(tBurstMs, 0, GL_COLLAPSE_MS);
  return 1 - c * c * (3 - 2 * c);
}

/** Burst line count for a viewport: area-scaled, clamped to the film band. */
export function burstLineCount(
  wPx: number,
  hPx: number,
  coarse = false,
): number {
  const n = Math.round((wPx * hPx) / HS_BURST.areaPerLinePx2);
  const clamped = Math.max(HS_BURST.minLines, Math.min(HS_BURST.maxLines, n));
  return coarse ? Math.round(clamped * HS_BURST.coarseFactor) : clamped;
}

/**
 * Spawn a burst-line field position OUTSIDE the central void — the dark
 * vanishing point of ref-3. Rejection-samples the unit square until the
 * point clears `centerHoleFieldR`, so no line head ever sits on the centre.
 */
export function burstSpawnXY(rand: () => number = Math.random): {
  x: number;
  y: number;
} {
  const r2min = HS_BURST.centerHoleFieldR * HS_BURST.centerHoleFieldR;
  let x = 0;
  let y = 0;
  do {
    x = rand() * 2 - 1;
    y = rand() * 2 - 1;
  } while (x * x + y * y < r2min);
  return { x, y };
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
uniform float u_bloom;        // core bloom: 0 in travel -> 1 = flooding orb
uniform float u_burst;        // cold-open streak garnish, 1 -> 0 over ~300ms

// Lattice hash — small constants keep sin() well-conditioned on mediump
// GPUs. The scalar s selects the BOIL plane so the field can evolve in time.
float hs_hash(vec2 p, float s) {
  return fract(sin(p.x * 51.53 + p.y * 103.71 + s * 37.19) * 9761.417);
}

// Value noise on a lattice whose x axis wraps at px cells, so sampling
// around the full angle never seams at +/-PI; y (radial depth) is unbounded.
// The third axis w is the boil phase: each corner interpolates between two
// hash planes, so features CHURN IN PLACE instead of only translating —
// turbulence, not rotation.
float hs_noise(vec2 p, float px, float w) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 u = f * f * (3.0 - 2.0 * f);
  float iw = floor(w);
  float fw = w - iw;
  fw = fw * fw * (3.0 - 2.0 * fw);
  float x0 = mod(i.x, px);
  float x1 = mod(i.x + 1.0, px);
  float a = mix(hs_hash(vec2(x0, i.y), iw), hs_hash(vec2(x0, i.y), iw + 1.0), fw);
  float b = mix(hs_hash(vec2(x1, i.y), iw), hs_hash(vec2(x1, i.y), iw + 1.0), fw);
  float c = mix(hs_hash(vec2(x0, i.y + 1.0), iw), hs_hash(vec2(x0, i.y + 1.0), iw + 1.0), fw);
  float d = mix(hs_hash(vec2(x1, i.y + 1.0), iw), hs_hash(vec2(x1, i.y + 1.0), iw + 1.0), fw);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// 3-octave boiling fbm on the wrapping lattice, renormalized to [0,1]. The
// octaves boil at staggered rates/offsets so their sum decorrelates over
// time — the clouds visibly churn rather than sliding as one sheet.
float hs_fbm(vec2 p, float px, float w) {
  float v = 0.5 * hs_noise(p, px, w);
  v += 0.25 * hs_noise(p * 2.0 + vec2(13.7, 9.3), px * 2.0, w * 1.7 + 5.2);
  v += 0.125 * hs_noise(p * 4.0 + vec2(29.1, 3.7), px * 4.0, w * 2.6 + 9.1);
  return v * 1.142857;
}

void main() {
  float minDim = min(u_resolution.x, u_resolution.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / (0.5 * minDim);
  float r = length(p);
  // Angle in [0,1) turns — FIXED (round 6): no differential rotation, no
  // spiral advection, no global roll. The film clouds do not orbit.
  float turn = atan(p.y, p.x) * 0.1591549 + 0.5;

  // Tunnel mapping: depth diverges toward the vanishing point; adding time
  // scrolls features outward = flying forward. The divergence is SOFT
  // (1.5/(r+0.30)) so the depth range isn't hoarded by the core — mid and
  // outer radii keep a live radial gradient and stream.
  float depth = 1.5 / (r + 0.30);
  float flow = depth + u_time * 3.4 * u_speed;

  // Boil clock + light domain warp. The only motion languages are the radial
  // rush (flow) and in-place churn (boil); the warp jitters the sampling
  // incoherently — including the tiniest angular jitter (~4deg, noise-driven,
  // both directions) — never a coherent angular advection.
  float boil = u_time * 1.1;
  float warp = hs_noise(vec2(turn * 3.0, flow * 0.35), 3.0, boil * 0.8) - 0.5;
  float ang = turn + warp * 0.012;
  float flowW = flow + warp * 0.55;

  // Cloud BODY — big turbulent lumps, radially ELONGATED (angular frequency
  // well above radial frequency) so the boiling masses smear into soft
  // radial wisps, like radial motion blur. Squaring deepens the dark
  // turbulence pockets between the folds — local features of the medium,
  // not an edge falloff (ref-0's dark lumps sit mid-frame).
  float clouds = hs_fbm(vec2(ang * 5.0, flowW * 0.55), 5.0, boil);
  clouds *= clouds;

  // Radial WISPS — the long soft streaks: high angular frequency on a very
  // slow radial lattice = strongly radially-smeared filaments rushing
  // outward. Straight radial spokes, no shear, no curve.
  float wisps = hs_fbm(vec2(ang * 14.0, flow * 0.16), 14.0, boil * 0.7);
  wisps = pow(smoothstep(0.35, 0.9, wisps), 1.4);

  // White-hot core — a focal point INSIDE the full-frame medium during
  // travel; u_bloom grows it into the huge orb flooding the centre (ref-1:
  // orb ~55-60% of frame height, soft shoulder).
  float core = 0.05 / (r * r + 0.006);
  float orbR = 0.10 + 0.48 * u_bloom;
  float orb = smoothstep(orbR, orbR * 0.3, r);

  // FLOORED radial profile: the corners keep >= ~55% of the centre's cloud
  // luminance, so the whole viewport reads as luminous churning medium —
  // bright blue TO THE CORNERS with only local dark pockets.
  float profile = 0.55 + 0.45 * exp(-0.9 * r);

  // Bloom melts the cloud structure into soft light (ref-1: the lumps
  // dissolve as the frame washes toward white-blue).
  float melt = 1.0 - 0.5 * u_bloom;
  float lum = core;
  lum += (0.42 + 1.9 * clouds * melt) * profile * (0.75 + 1.4 * wisps);

  // Cold-open garnish: a brief discrete radial streak burst (the entry beat)
  // laid over the tunnel, gone within ~300ms.
  if (u_burst > 0.001) {
    float sa = hs_noise(vec2(turn * 110.0, 0.0), 110.0, 0.0);
    float run = hs_noise(vec2(turn * 110.0, r * 3.0 - u_time * 10.0), 110.0, 0.0);
    lum += u_burst * pow(sa, 7.0) * (0.4 + 0.6 * run) * 6.0 *
           smoothstep(0.05, 0.45, r);
  }

  // Vignette stays a whisper — the frames are bright to the corners.
  lum *= 1.0 - 0.12 * smoothstep(1.2, 2.2, r);

  // Core bloom: the orb floods the centre while the scene-wide luminance
  // ramps toward white-blue (one uniform drives both — ref-1).
  lum = lum * (1.0 + 1.2 * u_bloom)
      + u_bloom * (3.2 * orb + 1.1 * exp(-1.5 * r) + 0.35);

  // Palette — the film's saturated cobalt ramp: near-black blue pockets ->
  // deep #0a1e6e -> cobalt #2a63ff -> pale #bcd9ff -> white-hot core.
  vec3 col = vec3(0.010, 0.024, 0.10);
  col = mix(col, vec3(0.039, 0.118, 0.431), smoothstep(0.0, 0.28, lum));
  col = mix(col, vec3(0.165, 0.388, 1.0), smoothstep(0.22, 0.62, lum));
  col = mix(col, vec3(0.737, 0.851, 1.0), smoothstep(0.55, 1.05, lum));
  col = mix(col, vec3(1.0), smoothstep(0.95, 1.75, lum));
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
  uBloom: WebGLUniformLocation | null;
  uBurst: WebGLUniformLocation | null;
}

interface BurstStar {
  x: number; // normalized field coords in [-1, 1], outside the centre hole
  y: number;
  z: number; // depth in (Z_NEAR, Z_FAR]
  e: number; // exposure jitter — layered line lengths (ref-3's mixed runs)
}

function makeBurstStar(): BurstStar {
  const { x, y } = burstSpawnXY();
  return {
    x,
    y,
    z: Z_NEAR + Math.random() * (Z_FAR - Z_NEAR),
    e:
      HS_BURST.exposureMin +
      Math.random() * (HS_BURST.exposureMax - HS_BURST.exposureMin),
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
 * the tunnel+bloom beats and opens at the burst on the 2D canvas alone.
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
    uBloom: g.getUniformLocation(prog, "u_bloom"),
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

    // The 2D star canvas is the backbone (burst → stars → arrival need no
    // GL). Without it — or without #main to arrive at — fall back to the
    // instant site.
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

    // WebGL-unavailable: skip the GL beats (tunnel + bloom) — start the
    // clock at the burst phase so the fine-line field opens the sequence,
    // over dark space.
    const GL_PHASES_MS = TUNNEL_MS + BLOOM_MS;
    const glr = initGL(glCanvas);
    let tunnelOff = !glr;
    let timeOffset = glr ? 0 : GL_PHASES_MS;
    if (!glr) glCanvas.style.opacity = "0";

    // ---- Viewport + page geometry ----
    let vw = 0;
    let vh = 0;
    let cx = 0;
    let cy = 0;
    let minCss = 1;
    let maxCss = 1;
    let dpr = 1;
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
    let burstBuckets: BurstStar[][] = [];
    let calm: CalmStar[] = [];
    let calmSeeded = false;
    let calmT0 = 0; // elapsed-time anchor for the settled field's drift

    // Lines pre-batch into color buckets — one beginPath+stroke per bucket
    // per frame (5 strokes for ~3000 lines), the canvas2D-friendly pattern.
    const seedBurstField = () => {
      const count = burstLineCount(vw, vh, coarse);
      // Bucket bi takes every BURST_BUCKETS-th line — a round-robin split.
      burstBuckets = Array.from({ length: BURST_BUCKETS }, (_, bi) =>
        Array.from(
          {
            length: Math.floor(
              (count + BURST_BUCKETS - 1 - bi) / BURST_BUCKETS,
            ),
          },
          makeBurstStar,
        ),
      );
    };

    // Calm density differs from the burst field's — reseeded (not reused) so
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
      dpr = Math.min(window.devicePixelRatio || 1, 2);
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
    seedBurstField();
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
    // (dt is used only to advance the line depths, capped for tab-out jumps.)
    const t0 = performance.now();
    let last = t0;
    const LAND_MS = TUNNEL_MS + BLOOM_MS + BURST_MS + SETTLE_MS + EXIT_MS;

    const onContextLost = (e: Event) => {
      e.preventDefault();
      // Degrade, don't bail: drop the GL beats and, if we're still inside
      // them, jump the clock to the burst phase — the star canvas needs no GL.
      tunnelOff = true;
      glCanvas.style.opacity = "0";
      const elapsed = performance.now() - t0 + timeOffset;
      if (elapsed < GL_PHASES_MS) timeOffset += GL_PHASES_MS - elapsed;
    };
    glCanvas.addEventListener("webglcontextlost", onContextLost);

    const drawBurst = (fieldA: number, speed: number, cover: number) => {
      // Crisp fine lines — deliberately NO additive compositing, no radial
      // glow, no per-line halo (ref-3/ref-4: thousands of ~1-device-px
      // strokes; the density IS the light). While the collapsing bloom still
      // covers (cover > 0) the lines draw saturated cobalt and read as blue
      // slivers through the white (ref-4); once the GL canvas is out they
      // slide to pale blue-white on near-black (ref-3), the buckets fanning
      // toward white for the layered mix.
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = fieldA;
      ctx.lineCap = "round";
      ctx.lineWidth = HS_BURST.lineWidthDevicePx / dpr; // ≈1 device px
      const k = 1 - cover;
      const br = BURST_SAT_RGB[0] + (BURST_PALE_RGB[0] - BURST_SAT_RGB[0]) * k;
      const bg = BURST_SAT_RGB[1] + (BURST_PALE_RGB[1] - BURST_SAT_RGB[1]) * k;
      const bb = BURST_SAT_RGB[2] + (BURST_PALE_RGB[2] - BURST_SAT_RGB[2]) * k;
      const scale = FOCAL * minCss;
      const stretchZ = speed * HS_BURST.stretchS;
      const maxLen = MAX_STREAK_FRAC * maxCss;

      for (const [bi, bucket] of burstBuckets.entries()) {
        const whiten = (bi / (BURST_BUCKETS - 1)) * 0.55 * k;
        const cr = Math.round(br + (255 - br) * whiten);
        const cg = Math.round(bg + (255 - bg) * whiten);
        const cb = Math.round(bb + (255 - bb) * whiten);
        const alpha = 0.38 + 0.14 * bi;
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`;
        ctx.beginPath();
        for (const s of bucket) {
          // Perspective projection from a single vanishing point (viewport
          // centre) — line length grows with speed AND radial distance (edge
          // lines run longest), layered further by the exposure jitter.
          const proj = scale / s.z;
          const sx = cx + s.x * proj;
          const sy = cy + s.y * proj;
          // Cheap cull: drop lines whose head is well off-screen.
          if (
            sx < -maxCss ||
            sx > vw + maxCss ||
            sy < -maxCss ||
            sy > vh + maxCss
          ) {
            continue;
          }
          // Line tail = where the point was `stretchZ·e` deeper.
          const projPrev = scale / (s.z + stretchZ * s.e);
          let px = cx + s.x * projPrev;
          let py = cy + s.y * projPrev;
          let dx = sx - px;
          let dy = sy - py;
          const len = Math.hypot(dx, dy);
          if (len > maxLen) {
            const clampK = maxLen / len;
            px = sx - dx * clampK;
            py = sy - dy * clampK;
          } else if (len < DOT_FLOOR_PX) {
            // At the snap the stroke must survive as a star point — zero-
            // length subpaths render inconsistently across engines, so floor
            // the tail a hair out along the radial direction.
            dx = sx - cx;
            dy = sy - cy;
            const rl = Math.hypot(dx, dy) || 1;
            px = sx - (dx / rl) * DOT_FLOOR_PX;
            py = sy - (dy / rl) * DOT_FLOOR_PX;
          }
          ctx.moveTo(px, py);
          ctx.lineTo(sx, sy);
        }
        // One stroke per color bucket — 5 draw calls for the whole field.
        ctx.stroke();
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
      const tBloom = elapsed - TUNNEL_MS;
      const tBurst = elapsed - GL_PHASES_MS;
      const tExit = elapsed - (GL_PHASES_MS + BURST_MS + SETTLE_MS);

      // ---- GL beats: tunnel travel + core bloom; collapses at the burst ----
      if (glr && !tunnelOff) {
        const fade = tunnelFadeAt(tBurst);
        if (fade > 0) {
          const g = glr.g;
          g.uniform1f(glr.uTime, elapsed / 1000);
          g.uniform1f(glr.uBloom, bloomAt(tBloom));
          const b = Math.max(0, 1 - elapsed / GARNISH_MS);
          g.uniform1f(glr.uBurst, b * b);
          g.drawArrays(g.TRIANGLES, 0, 3);
          glCanvas.style.opacity = String(fade);
        } else {
          tunnelOff = true; // bloom collapsed — dark space owns the frame now
          glCanvas.style.opacity = "0";
        }
      }

      // ---- 2D star canvas: fine-line burst → snap → settled field ----
      ctx.clearRect(0, 0, vw, vh);
      if (tBurst >= 0) {
        const speed = streakSpeedAt(tBurst);
        const warpA =
          (1 - ramp01(tBurst, WARP_FADE_OUT_START_MS, WARP_FADE_OUT_END_MS)) *
          ramp01(tBurst, 0, LINE_FADE_IN_MS);
        if (warpA > 0) {
          if (speed > 0) {
            const dz = speed * dt;
            for (const bucket of burstBuckets) {
              for (const s of bucket) {
                s.z -= dz;
                if (s.z <= Z_NEAR) {
                  const xy = burstSpawnXY();
                  s.x = xy.x;
                  s.y = xy.y;
                  s.z = Z_FAR;
                  s.e =
                    HS_BURST.exposureMin +
                    Math.random() *
                      (HS_BURST.exposureMax - HS_BURST.exposureMin);
                }
              }
            }
          }
          const cover = tunnelOff ? 0 : tunnelFadeAt(tBurst);
          drawBurst(warpA, speed, cover);
        }
        const calmA = ramp01(
          tBurst,
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
