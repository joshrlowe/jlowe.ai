import { describe, expect, it } from "vitest";

import {
  buildHeroDriveCurve,
  carPoseAlongCurve,
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
