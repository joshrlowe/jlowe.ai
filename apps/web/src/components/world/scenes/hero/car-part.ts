/**
 * The curated open-wheel "Racing car" GLB (an F1-style single-seater) authors
 * its whole body as one mesh split into five generically-named materials
 * (`Material.005`–`Material.009`), each a flat base colour. There are no
 * separable wheel nodes, so parts are told apart by material name (≈ colour),
 * not scene-graph location:
 *
 * | material       | source colour      | re-skinned as      |
 * | -------------- | ------------------ | ------------------ |
 * | `Material.005` | red    (129, 7, 6) | `body` (clearcoat) |
 * | `Material.006` | blue   (0, 15, 43) | `trim`  (wings)    |
 * | `Material.007` | grey   (23,23,23)  | `rim`   (metal)    |
 * | `Material.008` | black  (2, 2, 2)   | `tire`             |
 * | `Material.009` | near-black (0,1,5) | `glass` (cockpit)  |
 *
 * Kept free of three so it stays trivially unit-testable.
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

/**
 * True when `object` (or any ancestor) is one of the `wheel_*` GLB nodes. The
 * open-wheel model merges its wheels into the single body mesh, so this is
 * always false for it — but the helper is kept for the re-skin pass' call site
 * and for any future model that does separate its wheels into named nodes.
 */
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
 * physical car part. The open-wheel model is classified purely by its
 * `Material.00x` names; the `isWheel` flag is retained so a wheel-separated
 * model could still route an unknown dark material to `tire` vs `trim`.
 */
export function classifyCarPart(
  materialName: string,
  isWheel: boolean,
): CarPart {
  switch (materialName) {
    case "Material.005":
      return "body";
    case "Material.006":
      return "trim";
    case "Material.007":
      return "rim";
    case "Material.008":
      return "tire";
    case "Material.009":
      return "glass";
    default:
      return isWheel ? "tire" : "trim";
  }
}
