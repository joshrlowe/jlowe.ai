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
  it("maps the red bodywork material to the clearcoat body", () => {
    expect(classifyCarPart("Material.005", false)).toBe("body");
  });

  it("maps the blue accent material to dark metallic trim", () => {
    expect(classifyCarPart("Material.006", false)).toBe("trim");
  });

  it("maps the grey material to a metallic rim", () => {
    expect(classifyCarPart("Material.007", false)).toBe("rim");
  });

  it("maps the black material to the tire", () => {
    expect(classifyCarPart("Material.008", false)).toBe("tire");
  });

  it("maps the dark cockpit material to glass", () => {
    expect(classifyCarPart("Material.009", false)).toBe("glass");
  });

  it("falls back to tire on a wheel and trim elsewhere for unknown names", () => {
    expect(classifyCarPart("Mystery", true)).toBe("tire");
    expect(classifyCarPart("Mystery", false)).toBe("trim");
    expect(classifyCarPart("", false)).toBe("trim");
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
