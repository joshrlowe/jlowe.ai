// The chapter finite-state machine. Pure transition table — unit-tested and
// reused by the chapter store. Beacon collection is NOT a phase transition.

export type ChapterPhase =
  | "intro" // rail flyover cinematic
  | "handoff" // brief settle into the chase pose
  | "driving" // player has control
  | "completing" // exit triggered, fade running
  | "complete"; // chapter:complete emitted

export type ChapterEvent =
  | "INTRO_DONE"
  | "HANDOFF_DONE"
  | "EXIT_TRIGGERED"
  | "FADE_DONE"
  | "RESET";

export const INITIAL_PHASE: ChapterPhase = "intro";

const TRANSITIONS: Record<
  ChapterPhase,
  Partial<Record<ChapterEvent, ChapterPhase>>
> = {
  intro: { INTRO_DONE: "handoff", RESET: "intro" },
  handoff: { HANDOFF_DONE: "driving", RESET: "intro" },
  driving: { EXIT_TRIGGERED: "completing", RESET: "intro" },
  completing: { FADE_DONE: "complete", RESET: "intro" },
  complete: { RESET: "intro" },
};

/** Apply an event; returns the same phase when the event isn't valid here. */
export function chapterReducer(
  phase: ChapterPhase,
  event: ChapterEvent,
): ChapterPhase {
  return TRANSITIONS[phase][event] ?? phase;
}

/** The player drives only in `driving`. */
export function isControllable(phase: ChapterPhase): boolean {
  return phase === "driving";
}
