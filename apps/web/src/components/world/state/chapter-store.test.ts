import { beforeEach, describe, expect, it } from "vitest";

import { INITIAL_PHASE } from "./chapter-fsm";
import { chapterStore } from "./chapter-store";
import { FALLBACK_SCENE_KEY } from "./chapters";

// Captured at import, before any test mutates the singleton — the store's
// construction-time defaults.
const initialState = {
  activeChapterId: chapterStore.getState().activeChapterId,
  activeScene: chapterStore.getState().activeScene,
};

// The store is a module singleton; reset it to a known baseline per test. The
// registry is empty today, so the baseline uses synthetic chapter ids — the
// store machinery is registry-independent except where noted.
function resetStore() {
  chapterStore.setState({
    activeChapterId: "alpha",
    activeScene: "scene-alpha",
    phase: INITIAL_PHASE,
    collectedByChapter: {},
    collectedBeacons: [],
    openBeaconSlug: null,
    speedKmh: 0,
    rpm: 0,
  });
}

describe("chapterStore initial state", () => {
  it("holds on the transit scene under a neutral id when no chapter is registered", () => {
    expect(initialState.activeChapterId).toBe("");
    expect(initialState.activeScene).toBe(FALLBACK_SCENE_KEY);
  });
});

describe("chapterStore", () => {
  beforeEach(resetStore);

  it("collectBeacon writes under the active chapter and mirrors collectedBeacons", () => {
    const s = chapterStore.getState();
    s.collectBeacon("bidops");
    s.collectBeacon("rag");

    const after = chapterStore.getState();
    expect(after.collectedByChapter).toEqual({ alpha: ["bidops", "rag"] });
    expect(after.collectedBeacons).toEqual(["bidops", "rag"]);
  });

  it("collectBeacon is idempotent (no duplicates, same reference)", () => {
    chapterStore.getState().collectBeacon("bidops");
    const first = chapterStore.getState();
    first.collectBeacon("bidops");
    const second = chapterStore.getState();

    expect(second.collectedBeacons).toEqual(["bidops"]);
    // Unchanged set keeps a stable array reference (subscribers don't re-fire).
    expect(second.collectedBeacons).toBe(first.collectedBeacons);
  });

  it("setChapter resets phase, clears the open beacon, and keeps the scene for unregistered ids", () => {
    chapterStore.setState({ phase: "driving", openBeaconSlug: "bidops" });

    // "beta" is not in the (empty) live registry → the scene stays put; the FSM
    // and panel still reset. When a chapter IS registered, setChapter swaps to
    // its sceneKey (see chapters.ts).
    chapterStore.getState().setChapter("beta");

    const after = chapterStore.getState();
    expect(after.activeChapterId).toBe("beta");
    expect(after.activeScene).toBe("scene-alpha");
    expect(after.phase).toBe(INITIAL_PHASE);
    expect(after.openBeaconSlug).toBeNull();
  });

  it("setChapter re-derives collectedBeacons from the target chapter's bucket", () => {
    // Two independent buckets; the derived selector tracks the active chapter.
    chapterStore.setState({
      collectedByChapter: { alpha: ["bidops"], beta: ["x", "y"] },
      collectedBeacons: ["bidops"],
    });

    chapterStore.getState().setChapter("beta");
    expect(chapterStore.getState().collectedBeacons).toEqual(["x", "y"]);

    chapterStore.getState().setChapter("alpha");
    expect(chapterStore.getState().collectedBeacons).toEqual(["bidops"]);
  });

  it("collectBeacon keeps separate buckets per chapter", () => {
    const s = chapterStore.getState();
    s.collectBeacon("bidops"); // alpha

    // Switch to another chapter id and collect there.
    chapterStore.setState({
      activeChapterId: "beta",
      collectedBeacons: [],
    });
    chapterStore.getState().collectBeacon("velocity");

    expect(chapterStore.getState().collectedByChapter).toEqual({
      alpha: ["bidops"],
      beta: ["velocity"],
    });
  });
});
