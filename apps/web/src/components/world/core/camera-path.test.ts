import { describe, expect, it } from "vitest";

import { cinematicCameraPose, type CinematicPathConfig } from "./camera-path";

const CFG: CinematicPathConfig = {
  center: [0, 1, 0],
  radius: 8,
  baseHeight: 3,
  heightAmplitude: 0.6,
  angularSpeed: 0.25,
  bobSpeed: 0.4,
  startAngle: 0,
};

describe("cinematicCameraPose", () => {
  it("starts on the orbit circle at the start angle", () => {
    const { position } = cinematicCameraPose(0, CFG);
    expect(position[0]).toBeCloseTo(8); // center.x + radius * cos(0)
    expect(position[2]).toBeCloseTo(0); // center.z + radius * sin(0)
    expect(position[1]).toBeCloseTo(3); // baseHeight + amp * sin(0)
  });

  it("always looks at the configured center", () => {
    for (const t of [0, 1, 2.5, 4, 7.3]) {
      expect(cinematicCameraPose(t, CFG).lookAt).toEqual([0, 1, 0]);
    }
  });

  it("moves materially between ~1s and ~4s (cinematic dolly is animating)", () => {
    const a = cinematicCameraPose(1, CFG).position;
    const b = cinematicCameraPose(4, CFG).position;
    const dist = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    expect(dist).toBeGreaterThan(1);
  });

  it("stays on the orbit radius around the center in the XZ plane", () => {
    for (const t of [0, 1.7, 3.2, 6.9]) {
      const { position } = cinematicCameraPose(t, CFG);
      const r = Math.hypot(
        position[0] - CFG.center[0],
        position[2] - CFG.center[2],
      );
      expect(r).toBeCloseTo(CFG.radius);
    }
  });

  it("keeps height within the bob amplitude of the base height", () => {
    for (const t of [0, 0.9, 2.2, 5.5, 9.1]) {
      const y = cinematicCameraPose(t, CFG).position[1];
      expect(y).toBeGreaterThanOrEqual(
        CFG.baseHeight - CFG.heightAmplitude - 1e-9,
      );
      expect(y).toBeLessThanOrEqual(
        CFG.baseHeight + CFG.heightAmplitude + 1e-9,
      );
    }
  });
});
