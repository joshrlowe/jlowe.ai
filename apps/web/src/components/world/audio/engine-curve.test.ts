import { describe, expect, it } from "vitest";

import { engineParamsForRpm } from "./engine-curve";

describe("engineParamsForRpm", () => {
  it("idles low and revs higher across the rpm range", () => {
    const idle = engineParamsForRpm(0);
    const redline = engineParamsForRpm(1);
    expect(redline.frequency).toBeGreaterThan(idle.frequency);
    expect(redline.cutoff).toBeGreaterThan(idle.cutoff);
    expect(redline.gain).toBeGreaterThan(idle.gain);
  });

  it("is monotonic in frequency", () => {
    expect(engineParamsForRpm(0.5).frequency).toBeGreaterThan(
      engineParamsForRpm(0.2).frequency,
    );
  });

  it("clamps out-of-range rpm to the idle/redline bounds", () => {
    expect(engineParamsForRpm(-2)).toEqual(engineParamsForRpm(0));
    expect(engineParamsForRpm(5)).toEqual(engineParamsForRpm(1));
  });

  it("keeps gain within a sane mix range", () => {
    for (const r of [0, 0.25, 0.5, 0.75, 1]) {
      const { gain } = engineParamsForRpm(r);
      expect(gain).toBeGreaterThan(0);
      expect(gain).toBeLessThan(0.25);
    }
  });
});
