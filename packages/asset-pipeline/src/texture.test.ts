import { describe, expect, it } from "vitest";

import { isTextureFile, textureColorSpace } from "./texture.js";

describe("isTextureFile", () => {
  it("accepts jpg/jpeg/png regardless of case", () => {
    for (const f of ["a.jpg", "a.JPG", "a.jpeg", "a.png", "a.PNG"]) {
      expect(isTextureFile(f)).toBe(true);
    }
  });

  it("rejects non-image and extension-less files", () => {
    for (const f of ["a.glb", "a.hdr", "a.ktx2", "README", "a.jpg.txt"]) {
      expect(isTextureFile(f)).toBe(false);
    }
  });
});

describe("textureColorSpace", () => {
  it("treats colour/albedo maps as sRGB", () => {
    expect(textureColorSpace("asphalt_color.jpg")).toBe("srgb");
    expect(textureColorSpace("rock_albedo.png")).toBe("srgb");
  });

  it("treats normal/roughness/metalness/ao maps as linear data", () => {
    expect(textureColorSpace("asphalt_normal.jpg")).toBe("linear");
    expect(textureColorSpace("rock_roughness.jpg")).toBe("linear");
    expect(textureColorSpace("metal_metalness.png")).toBe("linear");
    expect(textureColorSpace("surface_ao.png")).toBe("linear");
  });

  it("defaults an unlabelled map to sRGB colour", () => {
    expect(textureColorSpace("mystery.jpg")).toBe("srgb");
  });
});
