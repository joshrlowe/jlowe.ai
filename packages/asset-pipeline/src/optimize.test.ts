import { describe, expect, it } from "vitest";

import { createIO } from "./io.js";
import { optimizeGlb } from "./optimize.js";
import { sampleCubeGlb } from "./sample.js";

describe("optimizeGlb", () => {
  it("Draco-compresses a static glb into a valid, decodable output", async () => {
    const input = await sampleCubeGlb();
    const result = await optimizeGlb(input);

    expect(result.geometry).toBe("draco");
    // The Draco extension is recorded in the glb JSON chunk.
    expect(new TextDecoder().decode(result.bytes)).toContain(
      "KHR_draco_mesh_compression",
    );

    // Output round-trips back to a valid single-mesh document.
    const io = await createIO();
    const doc = await io.readBinary(result.bytes);
    expect(doc.getRoot().listMeshes()).toHaveLength(1);
  });

  it("skips KTX2 gracefully when the ktx CLI is unavailable", async () => {
    const result = await optimizeGlb(await sampleCubeGlb());
    expect(["applied", "skipped-no-ktx"]).toContain(result.ktx2);
  });
});
