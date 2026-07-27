import type { CameraMode } from "../core/camera-rig";
import type { ChapterPhase } from "./chapter-fsm";

/** Intro flies the rails; everything else chases the player rig. */
export function cameraModeForPhase(phase: ChapterPhase): CameraMode {
  return phase === "intro" ? "rails" : "chase";
}
