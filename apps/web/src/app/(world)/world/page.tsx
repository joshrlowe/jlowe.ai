import { CapabilityPanel } from "@/components/world/capability-panel";

// Phase 1 swaps this panel for the dynamically-imported 3D canvas; the tier
// detection it shows is the same signal that will pick the renderer.
export default function WorldPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24">
      <p className="mb-6 text-sm font-medium text-primary">
        Velocity · pre-flight
      </p>
      <CapabilityPanel />
    </main>
  );
}
