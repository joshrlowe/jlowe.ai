import { describe, expect, it } from "vitest";

import {
  CHAPTERS,
  chapterById,
  chapterForSceneKey,
  FALLBACK_SCENE_KEY,
} from "./chapters";

describe("chapter registry", () => {
  it("is empty while the world is between chapters", () => {
    // Chapter 1 ("Ignition") retired with the driving world (jlowe-world repo);
    // Chapter 2 ("Escape Velocity") has not registered yet.
    expect(CHAPTERS).toHaveLength(0);
    expect(chapterById("ignition")).toBeUndefined();
  });

  it("names the transit hold as the no-chapter fallback scene", () => {
    // world-canvas + the store both mount this key when CHAPTERS is empty; it
    // must stay a registered non-chapter scene.
    expect(FALLBACK_SCENE_KEY).toBe("transit");
    expect(chapterForSceneKey(FALLBACK_SCENE_KEY)).toBeUndefined();
  });

  it("looks chapters up by id (unknown ids → undefined)", () => {
    expect(chapterById("nope")).toBeUndefined();
  });

  it("maps non-chapter scene keys to undefined", () => {
    expect(chapterForSceneKey("fixture")).toBeUndefined();
    expect(chapterForSceneKey("circuit")).toBeUndefined();
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
