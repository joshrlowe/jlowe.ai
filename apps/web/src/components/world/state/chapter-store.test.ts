import { beforeEach, describe, expect, it } from "vitest";

import { INITIAL_PHASE } from "./chapter-fsm";
import { chapterStore } from "./chapter-store";

// The store is a module singleton; reset it to a known baseline per test.
function resetStore() {
  chapterStore.setState({
    activeChapterId: "ignition",
    activeScene: "circuit",
    phase: INITIAL_PHASE,
    collectedByChapter: {},
    collectedBeacons: [],
    openBeaconSlug: null,
    speedKmh: 0,
    rpm: 0,
  });
}

describe("chapterStore", () => {
  beforeEach(resetStore);

  it("collectBeacon writes under the active chapter and mirrors collectedBeacons", () => {
    const s = chapterStore.getState();
    s.collectBeacon("bidops");
    s.collectBeacon("rag");

    const after = chapterStore.getState();
    expect(after.collectedByChapter).toEqual({ ignition: ["bidops", "rag"] });
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

  it("setChapter resets phase to INITIAL_PHASE, sets the scene, and clears the open beacon", () => {
    chapterStore.setState({ phase: "driving", openBeaconSlug: "bidops" });

    chapterStore.getState().setChapter("ignition");

    const after = chapterStore.getState();
    expect(after.activeChapterId).toBe("ignition");
    expect(after.activeScene).toBe("circuit");
    expect(after.phase).toBe(INITIAL_PHASE);
    expect(after.openBeaconSlug).toBeNull();
  });

  it("setChapter re-derives collectedBeacons from the target chapter's bucket", () => {
    // Two independent buckets; the derived selector tracks the active chapter.
    chapterStore.setState({
      collectedByChapter: { ignition: ["bidops"], "chapter-two": ["x", "y"] },
      collectedBeacons: ["bidops"],
    });

    chapterStore.getState().setChapter("chapter-two");
    expect(chapterStore.getState().collectedBeacons).toEqual(["x", "y"]);

    chapterStore.getState().setChapter("ignition");
    expect(chapterStore.getState().collectedBeacons).toEqual(["bidops"]);
  });

  it("collectBeacon keeps separate buckets per chapter", () => {
    const s = chapterStore.getState();
    s.collectBeacon("bidops"); // ignition

    // Switch to another chapter id and collect there.
    chapterStore.setState({
      activeChapterId: "chapter-two",
      collectedBeacons: [],
    });
    chapterStore.getState().collectBeacon("velocity");

    expect(chapterStore.getState().collectedByChapter).toEqual({
      ignition: ["bidops"],
      "chapter-two": ["velocity"],
    });
  });
});
