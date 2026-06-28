import { describe, expect, it } from "vitest";

import {
  buildHeroDriveCurve,
  carPoseAlongCurve,
  carPoseAlongCurveOffset,
  headingFromTangent,
} from "./car-rail";

describe("headingFromTangent", () => {
  it("faces +z at yaw 0", () => {
    expect(headingFromTangent(0, 1)).toBeCloseTo(0);
  });

  it("faces +x at yaw +90°", () => {
    expect(headingFromTangent(1, 0)).toBeCloseTo(Math.PI / 2);
  });

  it("faces -z at yaw ±180°", () => {
    expect(Math.abs(headingFromTangent(0, -1))).toBeCloseTo(Math.PI);
  });
});

describe("carPoseAlongCurve", () => {
  const curve = buildHeroDriveCurve();

  it("returns a finite pose anywhere on the curve", () => {
    const pose = carPoseAlongCurve(0.37, curve);
    expect(pose.position.every(Number.isFinite)).toBe(true);
    expect(Number.isFinite(pose.yaw)).toBe(true);
  });

  it("is a closed loop — t=0 and t=1 coincide", () => {
    const a = carPoseAlongCurve(0, curve);
    const b = carPoseAlongCurve(1, curve);
    expect(a.position[0]).toBeCloseTo(b.position[0], 4);
    expect(a.position[2]).toBeCloseTo(b.position[2], 4);
  });

  it("wraps out-of-range t back onto the loop", () => {
    const a = carPoseAlongCurve(0.25, curve);
    const b = carPoseAlongCurve(1.25, curve);
    const c = carPoseAlongCurve(-0.75, curve);
    expect(a.position[2]).toBeCloseTo(b.position[2], 4);
    expect(a.position[2]).toBeCloseTo(c.position[2], 4);
  });

  it("stays on the road footprint (|x| ≤ 4.5, |z| ≤ 35) all the way round", () => {
    const SAMPLES = 48;
    for (let i = 0; i < SAMPLES; i++) {
      const { position } = carPoseAlongCurve(i / SAMPLES, curve);
      expect(Math.abs(position[0])).toBeLessThanOrEqual(4.5);
      expect(Math.abs(position[2])).toBeLessThanOrEqual(35);
    }
  });

  it("drives roughly in the ground plane (y stays ~0)", () => {
    for (let i = 0; i < 12; i++) {
      const { position } = carPoseAlongCurve(i / 12, curve);
      expect(Math.abs(position[1])).toBeLessThan(0.5);
    }
  });
});

describe("carPoseAlongCurveOffset", () => {
  const curve = buildHeroDriveCurve();

  it("lateral 0 matches the racing-line pose", () => {
    for (const t of [0, 0.2, 0.55, 0.9]) {
      const a = carPoseAlongCurve(t, curve);
      const b = carPoseAlongCurveOffset(t, curve, 0);
      expect(b.position[0]).toBeCloseTo(a.position[0], 6);
      expect(b.position[2]).toBeCloseTo(a.position[2], 6);
      expect(b.yaw).toBeCloseTo(a.yaw, 6);
    }
  });

  it("offsets symmetrically about the line by |lateral|, yaw unchanged", () => {
    const base = carPoseAlongCurve(0.55, curve);
    const left = carPoseAlongCurveOffset(0.55, curve, 1.4);
    const right = carPoseAlongCurveOffset(0.55, curve, -1.4);
    // ±lateral straddle the racing line
    expect((left.position[0] + right.position[0]) / 2).toBeCloseTo(
      base.position[0],
      4,
    );
    expect((left.position[2] + right.position[2]) / 2).toBeCloseTo(
      base.position[2],
      4,
    );
    // displacement magnitude equals |lateral|
    const dx = left.position[0] - base.position[0];
    const dz = left.position[2] - base.position[2];
    expect(Math.hypot(dx, dz)).toBeCloseTo(1.4, 4);
    expect(left.yaw).toBeCloseTo(base.yaw, 6);
  });

  it("a ±1.45 lane offset stays on the road footprint all the way round", () => {
    const SAMPLES = 48;
    for (let i = 0; i < SAMPLES; i++) {
      for (const lat of [1.45, -1.45]) {
        const { position } = carPoseAlongCurveOffset(i / SAMPLES, curve, lat);
        expect(Math.abs(position[0])).toBeLessThanOrEqual(4.5);
        expect(Math.abs(position[2])).toBeLessThanOrEqual(35);
      }
    }
  });
});
