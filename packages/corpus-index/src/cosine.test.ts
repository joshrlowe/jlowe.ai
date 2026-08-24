import { describe, expect, it } from "vitest";

import { cosine } from "./cosine.js";

describe("cosine", () => {
  it("is 1 for identical vectors", () => {
    expect(cosine([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
    expect(cosine([3, 4], [3, 4])).toBeCloseTo(1);
  });

  it("is 0 for orthogonal vectors", () => {
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("is -1 for opposite vectors", () => {
    expect(cosine([1, 0], [-1, 0])).toBeCloseTo(-1);
  });

  it("returns 0 for a zero vector, empty input, or a length mismatch", () => {
    expect(cosine([0, 0], [1, 0])).toBe(0);
    expect(cosine([], [1])).toBe(0);
    expect(cosine([1, 0], [1, 0, 0])).toBe(0);
  });
});
