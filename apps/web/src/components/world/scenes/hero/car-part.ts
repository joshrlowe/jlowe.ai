/**
 * The curated sports-car GLB authors its surfaces as six named materials
 * (`White`, `Windows`, `Grey`, `Headlights`, `TailLights`, `Black`) split
 * across the `chassis` + `wheel_*` nodes. This pure module maps each source
 * material to the physical car part we re-skin it as. Kept free of three so it
 * stays trivially unit-testable.
 */
export type CarPart =
  | "body"
  | "rim"
  | "tire"
  | "glass"
  | "headlight"
  | "taillight"
  | "trim";

interface NamedNode {
  name?: string;
  parent: NamedNode | null;
}

const WHEEL_NODE_PREFIX = "wheel";

/** True when `object` (or any ancestor) is one of the `wheel_*` GLB nodes. */
export function isWheelDescendant(object: NamedNode | null): boolean {
  for (let node = object; node !== null; node = node.parent) {
    if (node.name?.toLowerCase().startsWith(WHEEL_NODE_PREFIX)) {
      return true;
    }
  }
  return false;
}

/**
 * Map a source material name (+ whether it lives under a wheel node) to a
 * physical car part. `Grey` is metal on both the chassis trim and the wheel
 * rim; `Black` is the tire on a wheel but dark trim on the body.
 */
export function classifyCarPart(materialName: string, isWheel: boolean): CarPart {
  switch (materialName) {
    case "White":
      return "body";
    case "Windows":
      return "glass";
    case "Headlights":
      return "headlight";
    case "TailLights":
      return "taillight";
    case "Grey":
      return "rim";
    case "Black":
      return isWheel ? "tire" : "trim";
    default:
      return "trim";
  }
}
