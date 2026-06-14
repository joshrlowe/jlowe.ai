import { describe, expect, it } from "vitest";

import { chapterReducer, isControllable } from "./chapter-fsm";

describe("chapterReducer", () => {
  it("runs the happy path intro → complete", () => {
    let p = chapterReducer("intro", "INTRO_DONE");
    expect(p).toBe("handoff");
    p = chapterReducer(p, "HANDOFF_DONE");
    expect(p).toBe("driving");
    p = chapterReducer(p, "EXIT_TRIGGERED");
    expect(p).toBe("completing");
    p = chapterReducer(p, "FADE_DONE");
    expect(p).toBe("complete");
  });

  it("ignores out-of-order events", () => {
    expect(chapterReducer("intro", "EXIT_TRIGGERED")).toBe("intro");
    expect(chapterReducer("driving", "INTRO_DONE")).toBe("driving");
  });

  it("RESET returns to intro from anywhere", () => {
    expect(chapterReducer("complete", "RESET")).toBe("intro");
    expect(chapterReducer("driving", "RESET")).toBe("intro");
  });

  it("only allows control while driving", () => {
    expect(isControllable("driving")).toBe(true);
    expect(isControllable("intro")).toBe(false);
    expect(isControllable("completing")).toBe(false);
  });
});
