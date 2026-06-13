import { Document } from "@gltf-transform/core";

// Unit cube — original geometry, zero IP risk (per the no-copyright rule).
// prettier-ignore
const POSITIONS = new Float32Array([
  -1,-1,-1,  1,-1,-1,  1, 1,-1, -1, 1,-1, // back
  -1,-1, 1,  1,-1, 1,  1, 1, 1, -1, 1, 1, // front
]);
// prettier-ignore
const INDICES = new Uint16Array([
  0,1,2, 0,2,3,  4,6,5, 4,7,6,  4,5,1, 4,1,0,
  7,3,2, 7,2,6,  4,0,3, 4,3,7,  1,5,6, 1,6,2,
]);

/**
 * Build a minimal original glb (a cube) in memory — used to prove the
 * optimization pipeline end-to-end without committing a binary asset.
 */
export async function sampleCubeGlb(): Promise<Uint8Array> {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const position = doc
    .createAccessor()
    .setType("VEC3")
    .setArray(POSITIONS)
    .setBuffer(buffer);
  const indices = doc
    .createAccessor()
    .setType("SCALAR")
    .setArray(INDICES)
    .setBuffer(buffer);
  const material = doc
    .createMaterial("cube")
    .setBaseColorFactor([0.91, 0.36, 0.02, 1]);
  const prim = doc
    .createPrimitive()
    .setAttribute("POSITION", position)
    .setIndices(indices)
    .setMaterial(material);
  const mesh = doc.createMesh("cube").addPrimitive(prim);
  const node = doc.createNode("cube").setMesh(mesh);
  doc.createScene().addChild(node);

  const { createIO } = await import("./io.js");
  const io = await createIO();
  return io.writeBinary(doc);
}
