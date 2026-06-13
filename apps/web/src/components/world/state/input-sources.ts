// Raw per-source input, polled each frame by the InputBridge and combined by
// the pure reduceInputs(). Each source is a module singleton (the perf-stats
// idiom) so reads happen off React's render path.

export interface KeyboardState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  handbrake: boolean;
  recover: boolean;
}

export interface GamepadState {
  throttle: number;
  brake: number;
  steer: number;
  handbrake: boolean;
  recover: boolean;
}

export interface TouchState {
  steer: number;
  throttle: number;
  active: boolean;
}

const KEY_MAP: Record<string, keyof KeyboardState> = {
  ArrowUp: "forward",
  KeyW: "forward",
  ArrowDown: "back",
  KeyS: "back",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  Space: "handbrake",
  KeyR: "recover",
};

const keyboard: KeyboardState = {
  forward: false,
  back: false,
  left: false,
  right: false,
  handbrake: false,
  recover: false,
};

/** Install window key listeners; returns an uninstaller. */
export function installKeyboard(): () => void {
  const onDown = (e: KeyboardEvent) => {
    const key = KEY_MAP[e.code];
    if (key) keyboard[key] = true;
  };
  const onUp = (e: KeyboardEvent) => {
    const key = KEY_MAP[e.code];
    if (key) keyboard[key] = false;
  };
  window.addEventListener("keydown", onDown);
  window.addEventListener("keyup", onUp);
  return () => {
    window.removeEventListener("keydown", onDown);
    window.removeEventListener("keyup", onUp);
  };
}

export function readKeyboard(): KeyboardState {
  return { ...keyboard };
}

const touch: TouchState = { steer: 0, throttle: 0, active: false };

export function setTouch(patch: Partial<TouchState>): void {
  Object.assign(touch, patch);
}

export function readTouch(): TouchState {
  return { ...touch };
}

function deadzone(value: number, threshold = 0.12): number {
  return Math.abs(value) < threshold ? 0 : value;
}

/** First connected gamepad, mapped to our normalized scheme (or null). */
export function readGamepad(): GamepadState | null {
  if (typeof navigator === "undefined" || !navigator.getGamepads) return null;
  const pad = navigator.getGamepads()[0];
  if (!pad) return null;
  return {
    steer: deadzone(pad.axes[0] ?? 0),
    throttle: pad.buttons[7]?.value ?? 0, // RT
    brake: pad.buttons[6]?.value ?? 0, // LT
    handbrake: pad.buttons[0]?.pressed ?? false, // A
    recover: pad.buttons[3]?.pressed ?? false, // Y
  };
}
