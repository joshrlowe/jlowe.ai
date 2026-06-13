import { describe, expect, it } from "vitest";

import type { KeyboardState, TouchState } from "./input-sources";
import { reduceInputs } from "./reduce-inputs";

const NO_KB: KeyboardState = {
  forward: false,
  back: false,
  left: false,
  right: false,
  handbrake: false,
  recover: false,
};
const NO_TOUCH: TouchState = { steer: 0, throttle: 0, active: false };

describe("reduceInputs", () => {
  it("is idle when nothing is active", () => {
    expect(reduceInputs(NO_KB, null, NO_TOUCH)).toMatchObject({
      throttle: 0,
      steer: 0,
      source: "idle",
    });
  });

  it("maps keyboard forward + right", () => {
    expect(
      reduceInputs({ ...NO_KB, forward: true, right: true }, null, NO_TOUCH),
    ).toMatchObject({ throttle: 1, steer: 1, source: "keyboard" });
  });

  it("lets an active gamepad override keyboard", () => {
    const r = reduceInputs(
      { ...NO_KB, forward: true },
      {
        throttle: 0.5,
        brake: 0,
        steer: -0.8,
        handbrake: false,
        recover: false,
      },
      NO_TOUCH,
    );
    expect(r).toMatchObject({ throttle: 0.5, steer: -0.8, source: "gamepad" });
  });

  it("lets an active touch override gamepad", () => {
    const r = reduceInputs(
      NO_KB,
      { throttle: 0.5, brake: 0, steer: 0, handbrake: false, recover: false },
      { steer: 0.6, throttle: 0.9, active: true },
    );
    expect(r).toMatchObject({ throttle: 0.9, steer: 0.6, source: "touch" });
  });

  it("ORs recover across sources", () => {
    expect(
      reduceInputs({ ...NO_KB, recover: true }, null, NO_TOUCH).recover,
    ).toBe(true);
    expect(
      reduceInputs(
        NO_KB,
        { throttle: 0, brake: 0, steer: 0, handbrake: false, recover: true },
        NO_TOUCH,
      ).recover,
    ).toBe(true);
  });

  it("clamps opposing steer to zero", () => {
    expect(
      reduceInputs({ ...NO_KB, left: true, right: true }, null, NO_TOUCH).steer,
    ).toBe(0);
  });
});
