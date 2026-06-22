import { describe, expect, it } from "vitest";

import { classifyCarPart, isWheelDescendant } from "./car-part";

interface FakeNode {
  name?: string;
  parent: FakeNode | null;
}

function node(
  name: string | undefined,
  parent: FakeNode | null = null,
): FakeNode {
  return { name, parent };
}

describe("classifyCarPart", () => {
  it("maps the body paint material to the clearcoat body", () => {
    expect(classifyCarPart("White", false)).toBe("body");
  });

  it("treats Grey as a metallic part (rim/trim) regardless of location", () => {
    expect(classifyCarPart("Grey", true)).toBe("rim");
    expect(classifyCarPart("Grey", false)).toBe("rim");
  });

  it("splits Black into a tire on a wheel and dark trim on the body", () => {
    expect(classifyCarPart("Black", true)).toBe("tire");
    expect(classifyCarPart("Black", false)).toBe("trim");
  });

  it("maps the glass + light materials to their parts", () => {
    expect(classifyCarPart("Windows", false)).toBe("glass");
    expect(classifyCarPart("Headlights", false)).toBe("headlight");
    expect(classifyCarPart("TailLights", false)).toBe("taillight");
  });

  it("falls back to trim for unknown material names", () => {
    expect(classifyCarPart("Mystery", false)).toBe("trim");
    expect(classifyCarPart("", true)).toBe("trim");
  });
});

describe("isWheelDescendant", () => {
  it("detects a mesh whose direct node is a wheel", () => {
    expect(isWheelDescendant(node("wheel_FL"))).toBe(true);
    expect(isWheelDescendant(node("wheel_RR"))).toBe(true);
  });

  it("detects a wheel ancestor several levels up", () => {
    const wheel = node("wheel_FR");
    const child = node("wheel_FR_1", wheel);
    const grandchild = node(undefined, child);
    expect(isWheelDescendant(grandchild)).toBe(true);
  });

  it("returns false for the chassis and its descendants", () => {
    const chassis = node("chassis");
    const panel = node("chassis_2", chassis);
    expect(isWheelDescendant(chassis)).toBe(false);
    expect(isWheelDescendant(panel)).toBe(false);
  });

  it("returns false for a null object", () => {
    expect(isWheelDescendant(null)).toBe(false);
  });
});
