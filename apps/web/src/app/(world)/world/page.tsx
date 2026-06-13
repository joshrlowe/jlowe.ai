import { WorldRoot } from "@/components/world/world-root";

// The capability tier (src/lib/capabilities) selects the renderer inside
// WorldRoot: webgpu/webgl mount the canvas; 2d redirects to the flat site.
export default function WorldPage() {
  return (
    <div className="relative flex-1">
      <WorldRoot />
    </div>
  );
}
