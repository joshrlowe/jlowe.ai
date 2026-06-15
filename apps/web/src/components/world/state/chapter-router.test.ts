import { afterEach, describe, expect, it, vi } from "vitest";

import { chapterStore } from "./chapter-store";
import {
  advanceOnComplete,
  nextChapterFor,
  resolveNextChapter,
} from "./chapter-router";
import { type ChapterMeta } from "./chapters";
import * as chapters from "./chapters";

const registry: readonly ChapterMeta[] = [
  { id: "a", sceneKey: "sa", title: "A", index: 1, beacons: [], next: "b" },
  {
    id: "b",
    sceneKey: "sb",
    title: "B",
    index: 2,
    beacons: [],
    next: undefined,
  },
];

describe("resolveNextChapter (pure advance rule)", () => {
  it("advances to `next` when defined", () => {
    expect(resolveNextChapter(registry, "a")).toBe("b");
  });

  it("returns undefined for the final chapter", () => {
    expect(resolveNextChapter(registry, "b")).toBeUndefined();
  });

  it("returns undefined for an unknown id", () => {
    expect(resolveNextChapter(registry, "ghost")).toBeUndefined();
  });
});

describe("nextChapterFor (live registry)", () => {
  it("Chapter 1 is the final chapter today (no advance)", () => {
    expect(nextChapterFor("ignition")).toBeUndefined();
  });

  it("returns undefined for an unknown id", () => {
    expect(nextChapterFor("ghost")).toBeUndefined();
  });
});

describe("advanceOnComplete", () => {
  afterEach(() => vi.restoreAllMocks());

  it("does not switch chapters when the completed chapter has no `next`", () => {
    const setChapter = vi.spyOn(chapterStore.getState(), "setChapter");
    advanceOnComplete("ignition"); // ignition.next === undefined
    expect(setChapter).not.toHaveBeenCalled();
  });

  it("calls setChapter(next) when a `next` resolves", () => {
    vi.spyOn(chapters, "chapterById").mockReturnValue({
      id: "a",
      sceneKey: "sa",
      title: "A",
      index: 1,
      beacons: [],
      next: "b",
    });
    const setChapter = vi
      .spyOn(chapterStore.getState(), "setChapter")
      .mockImplementation(() => undefined);

    advanceOnComplete("a");
    expect(setChapter).toHaveBeenCalledWith("b");
  });
});
