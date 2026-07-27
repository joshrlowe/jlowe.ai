"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

/*
 * "Hyperspace exit" entrance — round 3, the Rogue One arrival grammar.
 *
 * A dependency-free raw-WebGL fragment shader (WebGL1 GLSL, one program, one
 * full-screen triangle) renders the volumetric swirling blue cloud-tunnel of
 * hyperspace TRAVEL: soft fbm value-noise cloud layers scrolled toward the
 * viewer with a slow rotational churn, a white-hot core at the vanishing
 * point, sparse radial god-rays, dark navy pockets, vignette. Discrete star
 * lines appear only as a ~300ms cold-open burst garnish (the entry-flash
 * beat), not as the main visual.
 *
 * Then the site itself is the destination. The real SSG page (#main) emerges
 * at the tunnel core as a tiny dark silhouette card and rushes toward the
 * camera on a true perspective-approach curve —
 *   scale(t) = S0 / (1 − (1−S0)·t/T)
 * i.e. constant-velocity approach, 1/scale affine in t: hyperbolic GROWTH,
 * slow emerge then an accelerating rush (the exact opposite of an ease-out) —
 * while the shader dims its core behind the card, rakes intensified god-rays
 * around the card's silhouette (the page box is passed in as a uniform), and
 * displaces the tunnel's light outward until it streams off the viewport
 * edges. The page hits scale 1.0 exactly as the light washes off; the canvas
 * fades out and everything tears down. No terminal white flash — the arrival
 * IS the destination filling the view. End state: pristine DOM (no residual
 * transform/filter/clip), CLS 0.
 *
 * Progressive enhancement is sacred: nothing renders on the server or the
 * first client render, the overlay mounts on the frame AFTER the real content
 * paints (so the page, untransformed, sets FCP/LCP), and prefers-reduced-
 * motion, repeat visits, and WebGL-unavailable browsers all get the instant
 * site. The page transform is scale/opacity-only on #main, applied strictly
 * after first paint and removed at arrival.
 *
 * The numeric tunables (flow/churn speeds, palette knots, ray sparsity, core
 * size, rake width, S0/EXIT_MS) set the *feel* and want an in-browser pass —
 * shader output can't be seen from CI. The structure — tunnel-mapped fbm
 * clouds, hyperbolic page approach, silhouette rake, outward light wash — is
 * the verified reference look and is fixed.
 */

const SESSION_KEY = "hs-entrance:played";

// ---- Timeline (ms) ----
const BURST_MS = 300; // cold-open streak garnish decays over this window
const TUNNEL_MS = 1200; // pure travel inside the cloud tunnel
const EXIT_MS = 1400; // destination approach: page scale S0 → 1
const ARRIVE_MS = 400; // canvas light fades off; chrome (header/footer) in
// Safety net: if the shader/RAF never reaches arrival, force completion.
const WATCHDOG_MS = TUNNEL_MS + EXIT_MS + ARRIVE_MS + 900;

/** The full phase timeline, exported for tests/docs. Total = 3.0s. */
export const HS_TIMELINE = {
  burstMs: BURST_MS,
  tunnelMs: TUNNEL_MS,
  exitMs: EXIT_MS,
  arriveMs: ARRIVE_MS,
  totalMs: TUNNEL_MS + EXIT_MS + ARRIVE_MS,
} as const;

// ---- Destination approach (the page IS the destination) ----
const EXIT_START_SCALE = 0.03; // S0 — the emerging silhouette card
const EXIT_FADE_IN_MS = 140; // card alpha ramp at emergence (over the core)
const TUNNEL_SPEED = 1.0; // u_speed — global flow multiplier (feel knob)

// ---- Palette (overlay backdrop; the shader owns the tunnel colors) ----
const BG = "#02030a";

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
uniform float u_exitProgress; // 0 during travel -> 1 as the page arrives
uniform vec4  u_rect;         // page box: half-extents (xy), center offset (zw)
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
  float ex = u_exitProgress;

  // Tunnel mapping: depth diverges toward the vanishing point; adding time
  // scrolls features outward = flying forward. Churn = slow global rotation
  // plus a depth-dependent twist (the swirl shear).
  float depth = 1.1 / (r + 0.12);
  float flow = depth + u_time * 2.6 * u_speed;
  float spin = turn + 0.035 * u_time + 0.028 * depth;

  // Volumetric cloud body — soft fluid layers; squaring deepens the dark
  // blue pockets between the luminous folds.
  float clouds = hs_fbm(vec2(spin * 6.0, flow), 6.0);
  clouds *= clouds;

  // God-rays: sparse angular spokes, elongated radially, drifting slowly.
  float rays = hs_fbm(vec2((turn + 0.02 * u_time) * 14.0, flow * 0.35), 14.0);
  rays = pow(smoothstep(0.42, 0.95, rays), 1.6);

  // Radial energy: a white-hot core (brightness-ramp bloom) plus a profile
  // the exit displaces outward — the tunnel light streams to, then off, the
  // screen edges as the destination takes its place.
  float shift = 2.2 * pow(ex, 1.7);
  float core = 0.05 / (r * r + 0.006);
  core *= 1.0 - 0.9 * smoothstep(0.1, 0.75, ex); // core dims behind the page
  float profile = mix(exp(-1.35 * r), 1.6 * exp(-3.0 * abs(r - shift)),
                      smoothstep(0.0, 0.65, ex));

  float lum = core;
  lum += (0.3 + 1.7 * clouds) * profile * (0.75 + rays * (0.9 + 1.1 * ex));

  // The approaching page: light rakes around its silhouette (ray-modulated,
  // so it streams rather than halos), and the occluded box is carved dark so
  // the card's edge stays clean.
  vec2 dv = abs(p - u_rect.zw) - u_rect.xy;
  float dRect = length(max(dv, 0.0)) + min(max(dv.x, dv.y), 0.0);
  float gate = smoothstep(0.02, 0.2, ex);
  lum += gate * exp(-10.0 * max(dRect, 0.0)) * (0.7 + 2.2 * rays);
  lum *= 1.0 - gate * (1.0 - smoothstep(0.0, 0.02, dRect));

  // Cold-open garnish: a brief discrete radial streak burst (the entry beat)
  // laid over the tunnel, gone within ~300ms.
  if (u_burst > 0.001) {
    float sa = hs_noise(vec2(turn * 110.0, 0.0), 110.0);
    float run = hs_noise(vec2(turn * 110.0, r * 3.0 - u_time * 10.0), 110.0);
    lum += u_burst * pow(sa, 7.0) * (0.4 + 0.6 * run) * 6.0 *
           smoothstep(0.05, 0.45, r);
  }

  // Corner vignette during travel, released as the light washes outward.
  lum *= 1.0 - 0.4 * smoothstep(1.0, 2.0, r) * (1.0 - ex);

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
  uExit: WebGLUniformLocation | null;
  uRect: WebGLUniformLocation | null;
  uBurst: WebGLUniformLocation | null;
}

/**
 * Boot the raw-WebGL pipeline: context, two shaders, one program, one
 * full-screen triangle. Returns null on ANY failure — the caller treats that
 * exactly like prefers-reduced-motion (instant site).
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
    uExit: g.getUniformLocation(prog, "u_exitProgress"),
    uRect: g.getUniformLocation(prog, "u_rect"),
    uBurst: g.getUniformLocation(prog, "u_burst"),
  };
}

export function HyperspaceEntrance() {
  const [active, setActive] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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

  // Run the sequence once the overlay + canvas are in the DOM.
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
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

    // Complete the sequence. fade=true is the normal arrival (canvas light
    // dissolves over ARRIVE_MS); fade=false is the degraded path (no WebGL,
    // lost context, missing #main) — straight to the site.
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

    // WebGL-unavailable (or degenerate DOM) fallback: instant site, exactly
    // like reduced motion. The page underneath was never transformed.
    const glr = main ? initGL(canvas) : null;
    if (!glr) {
      conclude(false);
      return cleanupShell;
    }
    const { g, vs, fs, prog, buf, uTime, uRes, uExit, uRect, uBurst } = glr;
    const mainEl = main as HTMLElement;

    // ---- Viewport + page geometry ----
    let vw = 0;
    let vh = 0;
    let minCss = 1;
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

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = window.innerWidth;
      vh = window.innerHeight;
      minCss = Math.max(1, Math.min(vw, vh));
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
      g.viewport(0, 0, canvas.width, canvas.height);
      g.uniform2f(uRes, canvas.width, canvas.height);
      measureMain();
    };
    resize();
    window.addEventListener("resize", resize);

    // Stage the destination: the page starts as the tiny silhouette card,
    // transparent until the exit phase lifts it out of the core. The origin
    // pins the point of #main that sits at the viewport centre (recomputed
    // per frame against scroll), so growth is centred on the tunnel core and
    // scale 1 needs no correction. hs-exit (globals.css) lifts #main above
    // the canvas and gives it an opaque background — layout-inert, CLS 0.
    const setPageTransform = (tExitMs: number): number => {
      const s = exitScaleAt(tExitMs);
      const ox = vw / 2 - rectLeft;
      const oy = vh / 2 - (rectTopDoc - window.scrollY);
      mainEl.style.transformOrigin = `${ox}px ${oy}px`;
      mainEl.style.transform = `scale(${s})`;
      return s;
    };
    document.documentElement.classList.add("hs-exit");
    mainEl.style.willChange = "transform, opacity";
    mainEl.style.opacity = "0";
    setPageTransform(0);

    // Skip = instant completion of the whole sequence.
    skipHandlerRef.current = () => conclude(true);
    skipRef.current?.focus({ preventScroll: true });

    const onContextLost = (e: Event) => {
      e.preventDefault();
      conclude(false);
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    // All motion derives from absolute elapsed time (never per-frame
    // integration), so the sequence is framerate-independent by construction.
    const t0 = performance.now();
    const frame = (now: number) => {
      if (done) return;
      const elapsed = now - t0;
      const tExit = elapsed - TUNNEL_MS;
      const exitP = Math.min(Math.max(tExit / EXIT_MS, 0), 1);

      let s = EXIT_START_SCALE;
      if (tExit >= 0) {
        s = setPageTransform(tExit);
        mainEl.style.opacity = String(exitAlphaAt(tExit));
      }

      // The page box in shader space (centre-origin, half-min-dim = 1 unit,
      // y up): half-extents plus the card's centre offset, tracking the same
      // transform the DOM is applying.
      const halfW = (s * rectW) / minCss;
      const halfH = (s * clipH) / minCss;
      const topVp = rectTopDoc - window.scrollY;
      const cxOff = (s * (rectLeft + rectW / 2 - vw / 2) * 2) / minCss;
      const cyOff = (-(s * (topVp + clipH / 2 - vh / 2)) * 2) / minCss;
      g.uniform4f(uRect, halfW, halfH, cxOff, cyOff);

      g.uniform1f(uTime, elapsed / 1000);
      g.uniform1f(uExit, exitP);
      const b = Math.max(0, 1 - elapsed / BURST_MS);
      g.uniform1f(uBurst, b * b);
      g.drawArrays(g.TRIANGLES, 0, 3);

      if (elapsed >= TUNNEL_MS + EXIT_MS) {
        // Arrived: the card is at scale 1; the frozen final frame's residual
        // edge light dissolves under the ARRIVE_MS opacity fade.
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
      canvas.removeEventListener("webglcontextlost", onContextLost);
      restoreMain();
      document.documentElement.classList.remove("hs-exit");
      mainEl.removeAttribute("tabindex");
      skipHandlerRef.current = () => {};
      try {
        g.deleteBuffer(buf);
        g.deleteProgram(prog);
        g.deleteShader(vs);
        g.deleteShader(fs);
        g.getExtension("WEBGL_lose_context")?.loseContext();
      } catch {
        // context already lost — nothing to free
      }
    };
  }, [active]);

  if (!active || typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* Tunnel layer. Sits UNDER the exiting page (#main is lifted to z-210
          by html.hs-exit) and fades away at arrival. */}
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-[200] transition-opacity ease-out",
          revealing ? "pointer-events-none opacity-0" : "opacity-100",
        )}
        style={{ background: BG, transitionDuration: `${ARRIVE_MS}ms` }}
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
      {/* Skip lives OUTSIDE the aria-hidden tunnel layer and above the page. */}
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
