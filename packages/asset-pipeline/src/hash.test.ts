import { describe, expect, it } from "vitest";

import { contentHash, hashedName } from "./hash.js";

describe("content hashing", () => {
  it("is deterministic for identical bytes", () => {
    expect(contentHash(new Uint8Array([1, 2, 3]))).toBe(
      contentHash(new Uint8Array([1, 2, 3])),
    );
  });

  it("differs when content differs", () => {
    expect(contentHash(new Uint8Array([1]))).not.toBe(
      contentHash(new Uint8Array([2])),
    );
  });

  it("builds a hashed filename preserving stem + extension", () => {
    expect(hashedName("vehicle.glb", new Uint8Array([1, 2, 3]))).toMatch(
      /^vehicle\.[0-9a-f]{16}\.glb$/,
    );
  });
});
