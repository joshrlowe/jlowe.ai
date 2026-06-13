import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

export type InputSource = "keyboard" | "gamepad" | "touch" | "idle";

export interface InputState {
  throttle: number; // 0..1
  brake: number; // 0..1 (also reverse when stopped, handled by the vehicle)
  steer: number; // -1 (left) .. 1 (right)
  handbrake: boolean;
  recover: boolean; // "recover car" — edge-detected by the consumer
  source: InputSource;
}

const INITIAL: InputState = {
  throttle: 0,
  brake: 0,
  steer: 0,
  handbrake: false,
  recover: false,
  source: "idle",
};

/**
 * Vanilla store: the in-canvas InputBridge writes it once per frame via
 * setState (no React subscription); consumers read `inputStore.getState()`
 * inside useFrame. The HUD subscribes reactively via `useInput`.
 */
export const inputStore = createStore<InputState>()(() => INITIAL);

export function writeInput(next: InputState): void {
  inputStore.setState(next);
}

export function useInput<T>(selector: (state: InputState) => T): T {
  return useStore(inputStore, selector);
}
