import { afterEach, describe, expect, it, vi } from "vitest";

import {
  detectCapabilityTier,
  refineCapabilityTier,
  type DetectionEnv,
} from "./capabilities";

function canvas(webgl2: boolean): DetectionEnv["createCanvas"] {
  return () =>
    ({
      getContext: (id: string) => (id === "webgl2" && webgl2 ? {} : null),
    }) as unknown as Pick<HTMLCanvasElement, "getContext">;
}

const throwingCanvas: DetectionEnv["createCanvas"] = () =>
  ({
    getContext: () => {
      throw new Error("context creation failed");
    },
  }) as unknown as Pick<HTMLCanvasElement, "getContext">;

function mm(reduce: boolean): DetectionEnv["matchMedia"] {
  return (query: string) => ({
    matches: reduce && query.includes("reduced-motion"),
  });
}

/** A capable WebGPU+WebGL2 desktop with ample memory. */
function fullEnv(overrides: Partial<DetectionEnv> = {}): Partial<DetectionEnv> {
  return {
    search: "",
    navigator: { gpu: {}, deviceMemory: 8 },
    matchMedia: mm(false),
    createCanvas: canvas(true),
    ...overrides,
  };
}

describe("detectCapabilityTier", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each(["2d", "webgl", "webgpu"] as const)(
    "honors ?mode=%s override",
    (mode) => {
      const report = detectCapabilityTier(fullEnv({ search: `?mode=${mode}` }));
      expect(report.tier).toBe(mode);
      expect(report.source).toBe("override");
    },
  );

  it("override beats reduced-motion", () => {
    const report = detectCapabilityTier(
      fullEnv({ search: "?mode=webgpu", matchMedia: mm(true) }),
    );
    expect(report.tier).toBe("webgpu");
  });

  it("override beats memory degradation", () => {
    const report = detectCapabilityTier(
      fullEnv({
        search: "?mode=webgpu",
        navigator: { gpu: {}, deviceMemory: 2 },
      }),
    );
    expect(report.tier).toBe("webgpu");
  });

  it("ignores an invalid override", () => {
    const report = detectCapabilityTier(fullEnv({ search: "?mode=ultra" }));
    expect(report.signals.override).toBeNull();
    expect(report.tier).toBe("webgpu");
  });

  it("reduced motion forces 2d", () => {
    const report = detectCapabilityTier(fullEnv({ matchMedia: mm(true) }));
    expect(report).toMatchObject({ tier: "2d", source: "reduced-motion" });
  });

  it("detects webgpu when navigator.gpu is present", () => {
    const report = detectCapabilityTier(fullEnv());
    expect(report).toMatchObject({ tier: "webgpu", source: "detected" });
  });

  it("falls back to webgl when only webgl2 is available", () => {
    const report = detectCapabilityTier(
      fullEnv({ navigator: { deviceMemory: 8 }, createCanvas: canvas(true) }),
    );
    expect(report).toMatchObject({ tier: "webgl", source: "detected" });
  });

  it("falls back to 2d when neither is available", () => {
    const report = detectCapabilityTier(
      fullEnv({ navigator: { deviceMemory: 8 }, createCanvas: canvas(false) }),
    );
    expect(report.tier).toBe("2d");
  });

  it("degrades webgpu→webgl on low device memory", () => {
    const report = detectCapabilityTier(
      fullEnv({ navigator: { gpu: {}, deviceMemory: 2 } }),
    );
    expect(report).toMatchObject({ tier: "webgl", source: "memory-degraded" });
  });

  it("degrades webgl→2d on low device memory", () => {
    const report = detectCapabilityTier(
      fullEnv({ navigator: { deviceMemory: 2 }, createCanvas: canvas(true) }),
    );
    expect(report).toMatchObject({ tier: "2d", source: "memory-degraded" });
  });

  it("does not degrade below 2d", () => {
    const report = detectCapabilityTier(
      fullEnv({ navigator: { deviceMemory: 2 }, createCanvas: canvas(false) }),
    );
    expect(report).toMatchObject({ tier: "2d", source: "detected" });
  });

  it("ignores undefined deviceMemory", () => {
    const report = detectCapabilityTier(fullEnv({ navigator: { gpu: {} } }));
    expect(report.tier).toBe("webgpu");
    expect(report.signals.deviceMemory).toBeNull();
  });

  it("tolerates a missing matchMedia", () => {
    const report = detectCapabilityTier(
      fullEnv({ matchMedia: undefined, navigator: { gpu: {} } }),
    );
    expect(report.signals.reducedMotion).toBe(false);
    expect(report.tier).toBe("webgpu");
  });

  it("treats a throwing canvas as no webgl2", () => {
    const report = detectCapabilityTier(
      fullEnv({ navigator: { deviceMemory: 8 }, createCanvas: throwingCanvas }),
    );
    expect(report.signals.webgl2).toBe(false);
    expect(report.tier).toBe("2d");
  });

  it("returns the SSR default when no browser env exists", () => {
    vi.stubGlobal("window", undefined);
    const report = detectCapabilityTier();
    expect(report).toMatchObject({ tier: "2d", source: "ssr-default" });
  });
});

describe("refineCapabilityTier", () => {
  const webgpuReport = () => detectCapabilityTier(fullEnv());

  it("confirms a real adapter", async () => {
    const refined = await refineCapabilityTier(webgpuReport(), {
      navigator: { gpu: { requestAdapter: () => Promise.resolve({}) } },
    });
    expect(refined.tier).toBe("webgpu");
    expect(refined.signals.adapterConfirmed).toBe(true);
  });

  it("downgrades when no adapter is returned", async () => {
    const refined = await refineCapabilityTier(webgpuReport(), {
      navigator: { gpu: { requestAdapter: () => Promise.resolve(null) } },
    });
    expect(refined.tier).toBe("webgl");
    expect(refined.signals.adapterConfirmed).toBe(false);
  });

  it("downgrades when requestAdapter rejects", async () => {
    const refined = await refineCapabilityTier(webgpuReport(), {
      navigator: {
        gpu: { requestAdapter: () => Promise.reject(new Error("no gpu")) },
      },
    });
    expect(refined.tier).toBe("webgl");
  });

  it("downgrades when gpu lacks requestAdapter", async () => {
    const refined = await refineCapabilityTier(webgpuReport(), {
      navigator: { gpu: {} },
    });
    expect(refined.tier).toBe("webgl");
  });

  it("leaves overrides untouched", async () => {
    const overridden = detectCapabilityTier(
      fullEnv({ search: "?mode=webgpu" }),
    );
    const refined = await refineCapabilityTier(overridden, {
      navigator: { gpu: { requestAdapter: () => Promise.resolve(null) } },
    });
    expect(refined).toBe(overridden);
  });

  it("ignores non-webgpu tiers", async () => {
    const webglReport = detectCapabilityTier(
      fullEnv({ navigator: { deviceMemory: 8 }, createCanvas: canvas(true) }),
    );
    const refined = await refineCapabilityTier(webglReport);
    expect(refined).toBe(webglReport);
  });
});
