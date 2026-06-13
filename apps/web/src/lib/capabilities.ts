/**
 * Capability tiering for progressive enhancement: WebGPU → WebGL2 → 2D.
 *
 * `detectCapabilityTier` is a pure function — every browser input is injected
 * via `DetectionEnv`, so it is fully unit-testable and SSR-safe. The renderer
 * selection in the (world) route consumes the resolved tier.
 */

export type CapabilityTier = "webgpu" | "webgl" | "2d";

export type TierSource =
  | "override" // ?mode= query param
  | "reduced-motion" // prefers-reduced-motion forces 2d
  | "memory-degraded" // deviceMemory < 4 dropped a tier
  | "detected" // straight feature detection
  | "ssr-default"; // server/prerender, no browser APIs

export interface CapabilitySignals {
  override: CapabilityTier | null;
  reducedMotion: boolean;
  webgpu: boolean; // navigator.gpu present
  webgl2: boolean; // a webgl2 context could be created
  deviceMemory: number | null;
  adapterConfirmed: boolean | null; // null until refine() runs an adapter check
}

export interface CapabilityReport {
  tier: CapabilityTier;
  source: TierSource;
  signals: CapabilitySignals;
}

interface MinimalNavigator {
  gpu?: unknown;
  deviceMemory?: number;
}

interface MinimalMediaQueryList {
  matches: boolean;
}

interface GpuLike {
  requestAdapter: () => Promise<unknown>;
}

/** Every browser dependency, injectable for tests. */
export interface DetectionEnv {
  search: string;
  navigator: MinimalNavigator | undefined;
  matchMedia: ((query: string) => MinimalMediaQueryList) | undefined;
  createCanvas: () => Pick<HTMLCanvasElement, "getContext">;
}

const VALID_TIERS: readonly CapabilityTier[] = ["webgpu", "webgl", "2d"];

function parseOverride(search: string): CapabilityTier | null {
  const mode = new URLSearchParams(search).get("mode");
  return mode !== null && (VALID_TIERS as readonly string[]).includes(mode)
    ? (mode as CapabilityTier)
    : null;
}

function probeWebgl2(createCanvas: DetectionEnv["createCanvas"]): boolean {
  try {
    return createCanvas().getContext("webgl2") !== null;
  } catch {
    return false;
  }
}

function degradeOneTier(tier: CapabilityTier): CapabilityTier {
  return tier === "webgpu" ? "webgl" : "2d";
}

/** Real browser env, or null during SSR/prerender. */
function defaultEnv(): DetectionEnv | null {
  if (typeof window === "undefined") return null;
  return {
    search: window.location.search,
    navigator: window.navigator as unknown as MinimalNavigator,
    matchMedia:
      typeof window.matchMedia === "function"
        ? window.matchMedia.bind(window)
        : undefined,
    createCanvas: () => document.createElement("canvas"),
  };
}

function resolveEnv(partial: Partial<DetectionEnv> | undefined): DetectionEnv {
  const base = defaultEnv();
  return {
    search: partial?.search ?? base?.search ?? "",
    navigator: partial?.navigator ?? base?.navigator,
    matchMedia: partial?.matchMedia ?? base?.matchMedia,
    createCanvas:
      partial?.createCanvas ??
      base?.createCanvas ??
      (() => {
        throw new Error("no canvas in this environment");
      }),
  };
}

function ssrDefault(): CapabilityReport {
  return {
    tier: "2d",
    source: "ssr-default",
    signals: {
      override: null,
      reducedMotion: false,
      webgpu: false,
      webgl2: false,
      deviceMemory: null,
      adapterConfirmed: null,
    },
  };
}

/**
 * Synchronous, SSR-safe tier detection. Priority: ?mode= override →
 * prefers-reduced-motion → feature detection → deviceMemory degrade.
 */
export function detectCapabilityTier(
  partial?: Partial<DetectionEnv>,
): CapabilityReport {
  if (defaultEnv() === null && partial === undefined) return ssrDefault();

  const env = resolveEnv(partial);
  const override = parseOverride(env.search);
  const reducedMotion =
    env.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const webgpu = env.navigator?.gpu != null;
  const webgl2 = probeWebgl2(env.createCanvas);
  const deviceMemory =
    typeof env.navigator?.deviceMemory === "number"
      ? env.navigator.deviceMemory
      : null;

  const signals: CapabilitySignals = {
    override,
    reducedMotion,
    webgpu,
    webgl2,
    deviceMemory,
    adapterConfirmed: null,
  };

  if (override !== null) return { tier: override, source: "override", signals };
  if (reducedMotion) return { tier: "2d", source: "reduced-motion", signals };

  let tier: CapabilityTier = webgpu ? "webgpu" : webgl2 ? "webgl" : "2d";
  let source: TierSource = "detected";

  if (deviceMemory !== null && deviceMemory < 4 && tier !== "2d") {
    tier = degradeOneTier(tier);
    source = "memory-degraded";
  }

  return { tier, source, signals };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

function downgradeToWebgl(report: CapabilityReport): CapabilityReport {
  return {
    tier: "webgl",
    source:
      report.source === "memory-degraded" ? "memory-degraded" : "detected",
    signals: { ...report.signals, adapterConfirmed: false },
  };
}

/**
 * Asynchronously confirm a real WebGPU adapter exists (navigator.gpu can be
 * present without a usable adapter). Only acts on a detected `webgpu` tier;
 * a null/slow adapter downgrades to `webgl`. Overrides are left untouched.
 */
export async function refineCapabilityTier(
  report: CapabilityReport,
  partial?: Partial<DetectionEnv>,
): Promise<CapabilityReport> {
  if (report.source === "override" || report.tier !== "webgpu") return report;

  const env = resolveEnv(partial);
  const gpu = env.navigator?.gpu as GpuLike | undefined;
  if (gpu == null || typeof gpu.requestAdapter !== "function") {
    return downgradeToWebgl(report);
  }

  try {
    const adapter = await withTimeout(gpu.requestAdapter(), 1000);
    if (adapter == null) return downgradeToWebgl(report);
    return {
      ...report,
      signals: { ...report.signals, adapterConfirmed: true },
    };
  } catch {
    return downgradeToWebgl(report);
  }
}
