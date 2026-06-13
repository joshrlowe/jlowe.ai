import type { InputState } from "./input-store";
import type { GamepadState, KeyboardState, TouchState } from "./input-sources";

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/**
 * Combine the three input sources into one normalized InputState. Precedence
 * (last active wins): keyboard < gamepad < touch — so an active touch/gamepad
 * overrides stale keyboard. `recover` is OR'd across sources. Pure + tested.
 */
export function reduceInputs(
  kb: KeyboardState,
  pad: GamepadState | null,
  touch: TouchState,
): InputState {
  let throttle = 0;
  let brake = 0;
  let steer = 0;
  let handbrake = false;
  let source: InputState["source"] = "idle";

  const kbActive = kb.forward || kb.back || kb.left || kb.right || kb.handbrake;
  if (kbActive) {
    throttle = kb.forward ? 1 : 0;
    brake = kb.back ? 1 : 0;
    steer = (kb.right ? 1 : 0) - (kb.left ? 1 : 0);
    handbrake = kb.handbrake;
    source = "keyboard";
  }

  const padActive =
    pad !== null &&
    (pad.throttle > 0.05 ||
      pad.brake > 0.05 ||
      Math.abs(pad.steer) > 0.1 ||
      pad.handbrake);
  if (pad !== null && padActive) {
    throttle = pad.throttle;
    brake = pad.brake;
    steer = pad.steer;
    handbrake = pad.handbrake;
    source = "gamepad";
  }

  const touchActive =
    touch.active && (touch.throttle > 0.05 || Math.abs(touch.steer) > 0.1);
  if (touchActive) {
    throttle = touch.throttle;
    brake = 0;
    steer = touch.steer;
    source = "touch";
  }

  return {
    throttle: clamp(throttle, 0, 1),
    brake: clamp(brake, 0, 1),
    steer: clamp(steer, -1, 1),
    handbrake,
    recover: kb.recover || (pad?.recover ?? false),
    source,
  };
}
