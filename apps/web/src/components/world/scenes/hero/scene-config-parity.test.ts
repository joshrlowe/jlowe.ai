import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { NIGHT_HARBOUR } from "../../core/env-gradient";
import { HERO_DRIVE_POINTS } from "./car-rail";
import { RACE_CARS } from "./race-grid";
import { HERO_TUNING } from "./tuning";

/**
 * The Blender cinematic pipeline (tools/cinematic) reads scene-config.json so
 * the pre-rendered video and the real-time hero are the SAME scene. This test
 * pins the parity-covered fields of that JSON to the TS constants — drift goes
 * red in CI. (The set/* dimensions mirror module-private constants and are
 * kept in sync by hand; see the JSON's _provenance note.)
 */
const CONFIG_PATH = resolve(
  __dirname,
  "../../../../../../../tools/cinematic/scene-config.json",
);

interface SceneConfig {
  railPoints: [number, number, number][];
  raceCars: { role: string; tOffset: number; bodyColor: string }[];
  tuning: Record<string, number>;
  palettes: {
    nightHarbour: { nadir: number[]; horizon: number[]; zenith: number[] };
  };
}

const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as SceneConfig;

describe("scene-config.json parity with the three.js hero", () => {
  it("rail control points match car-rail.ts", () => {
    expect(config.railPoints).toEqual(HERO_DRIVE_POINTS.map((p) => [...p]));
  });

  it("race grid matches race-grid.ts", () => {
    expect(config.raceCars).toEqual(RACE_CARS.map((c) => ({ ...c })));
  });

  it("tuning matches HERO_TUNING exactly (same keys, same values)", () => {
    expect(config.tuning).toEqual({ ...HERO_TUNING });
  });

  it("night sky palette matches NIGHT_HARBOUR", () => {
    expect(config.palettes.nightHarbour).toEqual({
      nadir: [...NIGHT_HARBOUR.nadir],
      horizon: [...NIGHT_HARBOUR.horizon],
      zenith: [...NIGHT_HARBOUR.zenith],
    });
  });
});
