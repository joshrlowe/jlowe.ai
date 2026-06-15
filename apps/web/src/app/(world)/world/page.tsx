import { WorldRoot } from "@/components/world/world-root";

// The capability tier (src/lib/capabilities) selects the renderer inside
// WorldRoot: webgpu/webgl mount the canvas; 2d redirects to the flat site.
export default function WorldPage() {
  // `h-dvh` (a definite height), not `flex-1`: the R3F canvas fills its parent
  // via `height: 100%`, which can't resolve against a flex-grown (`height:auto`)
  // ancestor — that collapsed the canvas to its 300×150 default and rendered the
  // scene into a corner. A definite viewport height lets the 100% chain resolve.
  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <WorldRoot />
    </div>
  );
}
