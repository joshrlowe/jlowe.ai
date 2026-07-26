"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

/*
 * "Drop out of hyperspace" entrance — a dependency-free canvas-2D overlay that
 * plays once per session when you land on the home page, then cross-fades to
 * reveal the (always-present, SSG) site behind it.
 *
 * Progressive enhancement is sacred: this renders nothing on the server and on
 * the first client render, so no-JS visitors and the SSG HTML are untouched.
 * The overlay is mounted from an effect (i.e. AFTER the first paint, so the
 * real content sets FCP/LCP) and portalled onto <body> so the reveal can subtly
 * scale #main behind it. prefers-reduced-motion and repeat visits skip straight
 * to the site.
 *
 * The numeric tunables below set the *feel* and want a quick in-browser pass —
 * canvas output can't be seen from CI. The structure and the realism model
 * (radial vanishing point, streak length ∝ speed × radial distance, exponential
 * decel with a snap, additive bloom, chromatic split at peak only, flash-driven
 * reveal) are fixed.
 */

const SESSION_KEY = "hs-entrance:played";

// ---- Timeline (ms). Total ≈ HOLD + DECEL + FLASH_ATTACK + REVEAL ≈ 2.2s. ----
const PEAK_HOLD_MS = 700; // 1–2. cold-open AT peak warp, then hold
const DECEL_MS = 850; // 3. exponential deceleration → snap to ~0
const FLASH_ATTACK_MS = 120; // 4. white→blue bloom attack at the stop
const REVEAL_MS = 520; // 5. overlay cross-fade + content settle (flash release)
// Safety net: if the canvas/RAF never reaches the reveal, force it.
const WATCHDOG_MS = PEAK_HOLD_MS + DECEL_MS + FLASH_ATTACK_MS + REVEAL_MS + 900;

// ---- Starfield ----
const STAR_MIN = 450;
const STAR_MAX = 950;
const Z_NEAR = 0.06; // recycle plane — stars past this fly off and respawn
const Z_FAR = 1.15; // spawn depth
const FOCAL = 0.85; // projection scale as a fraction of min(viewport)
const V0 = 6.2; // peak forward speed (z-units/s)
const DECAY_K = 8; // exponential decel constant: v = V0 · 2^(−k·t)
const STRETCH = 0.032; // streak "exposure" (s): zPrev = z + v·STRETCH
const MAX_STREAK_FRAC = 0.9; // clamp a single streak to this fraction of maxDim
const ABERRATION_PX = 3.2; // chromatic split at peak, decays with speed → 0

// ---- Palette ----
const BG = "#02030a";
const GLOW_RGB = "109,179,255"; // #6db3ff — blue tunnel glow

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
      // Instant reveal: the site is already painted underneath. Mark played so
      // the rest of the session is consistent.
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // ignore
      }
      return;
    }
    // Mount on the next frame — i.e. after the real content has painted, so it
    // (not the overlay) sets FCP/LCP. Deferring also keeps the client-only
    // state change out of the effect body.
    const id = requestAnimationFrame(() => setActive(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Run the warp once the overlay + canvas are in the DOM.
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf = 0;
    let revealTimer: ReturnType<typeof setTimeout> | undefined;
    let revealed = false;

    const finishReveal = () => {
      document.documentElement.classList.remove("hs-reveal");
      document.getElementById("main")?.removeAttribute("tabindex");
      setActive(false);
    };

    const beginReveal = () => {
      if (revealed) return;
      revealed = true;
      cancelAnimationFrame(raf);
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // ignore
      }
      // Subtle content settle behind the fading overlay (keyframes in
      // globals.css); the container's own opacity transition does the fade.
      document.documentElement.classList.add("hs-reveal");
      setRevealing(true);
      // Return focus to the page content — never trap it on the overlay.
      const main = document.getElementById("main");
      if (main) {
        main.setAttribute("tabindex", "-1");
        main.focus({ preventScroll: true });
      }
      revealTimer = setTimeout(finishReveal, REVEAL_MS);
    };

    // Arm the safety net immediately. A late fire is a no-op (the `revealed`
    // guard); cleanup clears it on unmount.
    const watchdog = setTimeout(beginReveal, WATCHDOG_MS);

    const ctx = canvas.getContext("2d");

    let w = 0;
    let h = 0;
    let cx = 0;
    let cy = 0;
    let minDim = 0;
    let maxDim = 0;

    // Skip = instantly complete: a full-strength flash, then the reveal.
    skipHandlerRef.current = () => {
      if (revealed) return;
      if (ctx) {
        const r = maxDim * 0.82;
        const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        fg.addColorStop(0, "rgba(255,255,255,0.95)");
        fg.addColorStop(0.35, "rgba(223,239,255,0.6)");
        fg.addColorStop(1, "rgba(223,239,255,0)");
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = fg;
        ctx.fillRect(0, 0, w, h);
      }
      beginReveal();
    };

    // Focus the skip control so keyboard/AT users can dismiss immediately.
    skipRef.current?.focus({ preventScroll: true });

    if (!ctx) {
      // No 2D context (jsdom / ancient browser): skip button + watchdog only.
      return () => {
        if (watchdog) clearTimeout(watchdog);
        if (revealTimer) clearTimeout(revealTimer);
        skipHandlerRef.current = () => {};
      };
    }

    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      cx = w / 2;
      cy = h / 2;
      minDim = Math.min(w, h);
      maxDim = Math.max(w, h);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Star count scales with viewport area, throttled on touch devices.
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    let count = Math.round((w * h) / 1600);
    count = Math.max(STAR_MIN, Math.min(STAR_MAX, count));
    if (coarse) count = Math.round(count * 0.6);
    const stars: Star[] = Array.from({ length: count }, makeStar);

    const t0 = performance.now();
    let last = t0;
    const warpEnd = PEAK_HOLD_MS + DECEL_MS;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); // clamp tab-out jumps
      last = now;
      const elapsed = now - t0;

      // Speed envelope: cold-open at peak, hold, then exponential decel to ~0.
      let speed: number;
      if (elapsed < PEAK_HOLD_MS) {
        speed = V0;
      } else if (elapsed < warpEnd) {
        const tDec = (elapsed - PEAK_HOLD_MS) / 1000;
        const p = (elapsed - PEAK_HOLD_MS) / DECEL_MS;
        // 0.5^(k·t) decay (fast, then a long crawl), windowed so the final
        // frames snap cleanly to exactly 0 — nothing drifts after the stop.
        speed = V0 * Math.pow(2, -DECAY_K * tDec) * (1 - p * p);
        if (speed < 0) speed = 0;
      } else {
        speed = 0;
      }
      const speedFrac = speed / V0;
      const aberr = ABERRATION_PX * speedFrac;

      // Advance depth (only while moving); recycle stars past the near plane.
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

      // --- Draw ---
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      // Faint blue tunnel glow, strongest at peak.
      if (speedFrac > 0.01) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxDim * 0.6);
        g.addColorStop(0, `rgba(${GLOW_RGB},${0.16 * speedFrac})`);
        g.addColorStop(1, "rgba(2,3,10,0)");
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      const scale = FOCAL * minDim;
      const stretchZ = speed * STRETCH;

      for (const s of stars) {
        // Perspective projection from a single vanishing point (screen centre).
        const proj = scale / s.z;
        const sx = cx + s.x * proj;
        const sy = cy + s.y * proj;
        // Cheap cull: drop streaks whose head is well off-screen.
        if (
          sx < -maxDim ||
          sx > w + maxDim ||
          sy < -maxDim ||
          sy > h + maxDim
        ) {
          continue;
        }
        // Streak tail = where the star was `stretchZ` deeper. Length therefore
        // grows with speed AND with radial distance (edge stars streak most,
        // near-centre stars stay points) — the projection makes this fall out.
        const zPrev = s.z + stretchZ;
        const projPrev = scale / zPrev;
        let px = cx + s.x * projPrev;
        let py = cy + s.y * projPrev;

        let dx = sx - px;
        let dy = sy - py;
        let len = Math.hypot(dx, dy);
        const maxLen = MAX_STREAK_FRAC * maxDim;
        if (len > maxLen) {
          const k = maxLen / len;
          px = sx - dx * k;
          py = sy - dy * k;
          dx = sx - px;
          dy = sy - py;
          len = maxLen;
        }

        const alpha = Math.min(1, 0.2 + 0.8 * s.b);
        const width = 0.8 + s.b;

        // Chromatic aberration — peak only, split along the radial direction,
        // additively recombining to a white core with red/blue fringes.
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

        // Main blue-white streak.
        ctx.strokeStyle = `rgba(150,200,255,${alpha})`;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();

        // White-hot core at the head — this is the discrete point at rest.
        ctx.fillStyle = `rgba(255,255,255,${Math.min(1, 0.5 + 0.5 * s.b)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, width * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Drop-out flash at the stop drives the reveal (never a hard cut).
      if (elapsed >= warpEnd) {
        const fi = Math.min((elapsed - warpEnd) / FLASH_ATTACK_MS, 1);
        const e = fi * fi;
        const r = maxDim * (0.12 + 0.7 * e);
        const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        fg.addColorStop(0, `rgba(255,255,255,${0.95 * e})`);
        fg.addColorStop(0.35, `rgba(223,239,255,${0.6 * e})`);
        fg.addColorStop(1, "rgba(223,239,255,0)");
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = fg;
        ctx.fillRect(0, 0, w, h);

        if (fi >= 1) {
          beginReveal(); // hold this bright frame; CSS fades it to the site.
          return;
        }
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      if (watchdog) clearTimeout(watchdog);
      if (revealTimer) clearTimeout(revealTimer);
      window.removeEventListener("resize", resize);
      document.documentElement.classList.remove("hs-reveal");
      skipHandlerRef.current = () => {};
    };
  }, [active]);

  if (!active || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[200] transition-opacity duration-500 ease-out",
        revealing ? "pointer-events-none opacity-0" : "opacity-100",
      )}
      style={{ background: BG }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block h-full w-full"
      />
      <button
        ref={skipRef}
        type="button"
        aria-label="Skip intro animation"
        onClick={() => skipHandlerRef.current()}
        className="absolute top-4 right-4 z-[201] inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        Skip
        <kbd
          aria-hidden="true"
          className="rounded border border-white/30 px-1 text-xs leading-none"
        >
          ⏎
        </kbd>
      </button>
    </div>,
    document.body,
  );
}
