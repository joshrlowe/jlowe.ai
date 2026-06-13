import { describe, expect, it } from "vitest";

import { rendererInitForTier } from "./renderer";

describe("rendererInitForTier", () => {
  it("uses the WebGPU backend for the webgpu tier", () => {
    expect(rendererInitForTier("webgpu")).toEqual({ forceWebGL: false });
  });

  it("forces the WebGL2 backend for the webgl tier", () => {
    expect(rendererInitForTier("webgl")).toEqual({ forceWebGL: true });
  });

  it("returns null for the 2d tier (no canvas)", () => {
    expect(rendererInitForTier("2d")).toBeNull();
  });
});
