import { describe, expect, it } from "vitest";

import { BEACONS } from "./beacons";
import {
  CHAPTERS,
  chapterById,
  chapterForSceneKey,
  type ChapterMeta,
} from "./chapters";

describe("chapter registry", () => {
  it("registers Chapter 1 'Ignition' unchanged", () => {
    // Regression guard: Chapter 1's displayed identity + content must not drift.
    const ignition = chapterById("ignition");
    expect(ignition).toMatchObject<Partial<ChapterMeta>>({
      id: "ignition",
      sceneKey: "circuit",
      title: "Ignition",
      index: 1,
      next: undefined,
    });
    expect(ignition?.beacons).toBe(BEACONS);
    expect(ignition?.beacons).toHaveLength(5);
  });

  it("looks chapters up by id", () => {
    expect(chapterById("ignition")?.id).toBe("ignition");
    expect(chapterById("nope")).toBeUndefined();
  });

  it("maps a scene key back to its chapter (non-chapter scenes return undefined)", () => {
    expect(chapterForSceneKey("circuit")?.id).toBe("ignition");
    expect(chapterForSceneKey("fixture")).toBeUndefined();
    expect(chapterForSceneKey("proving-ground")).toBeUndefined();
  });

  it("has unique ids and scene keys", () => {
    const ids = CHAPTERS.map((c) => c.id);
    const sceneKeys = CHAPTERS.map((c) => c.sceneKey);
    expect(new Set(ids).size).toBe(CHAPTERS.length);
    expect(new Set(sceneKeys).size).toBe(CHAPTERS.length);
  });

  it("every `next` points at a registered chapter", () => {
    for (const c of CHAPTERS) {
      if (c.next !== undefined) {
        expect(chapterById(c.next), `dangling next "${c.next}"`).toBeDefined();
      }
    }
  });
});
