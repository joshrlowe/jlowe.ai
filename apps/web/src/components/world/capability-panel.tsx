"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CapabilityTier } from "@/lib/capabilities";
import { useCapabilityTier } from "@/lib/use-capability-tier";

const TIER_LABEL: Record<CapabilityTier, string> = {
  webgpu: "WebGPU",
  webgl: "WebGL2",
  "2d": "2D",
};

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

export function CapabilityPanel() {
  const report = useCapabilityTier();

  if (report === null) {
    return (
      <div className="w-full max-w-md space-y-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-32 w-full" />
        <p className="text-center text-sm text-muted-foreground">
          Probing rendering capabilities…
        </p>
      </div>
    );
  }

  const { tier, source, signals } = report;

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Detected tier</span>
        <Badge className="text-sm">{TIER_LABEL[tier]}</Badge>
        <span className="text-xs text-muted-foreground">via {source}</span>
      </div>

      <div className="mt-4 divide-y divide-border/60 rounded-lg border border-border/60 px-4">
        <Signal
          label="navigator.gpu"
          value={signals.webgpu ? "present" : "absent"}
        />
        <Signal
          label="WebGL2"
          value={signals.webgl2 ? "available" : "unavailable"}
        />
        <Signal
          label="Adapter confirmed"
          value={
            signals.adapterConfirmed === null
              ? "—"
              : signals.adapterConfirmed
                ? "yes"
                : "no"
          }
        />
        <Signal
          label="Reduced motion"
          value={signals.reducedMotion ? "yes" : "no"}
        />
        <Signal
          label="Device memory"
          value={
            signals.deviceMemory === null
              ? "unknown"
              : `${signals.deviceMemory} GB`
          }
        />
        <Signal label="Override" value={signals.override ?? "none"} />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        The explorable 3D world mounts here next. This panel confirms which
        renderer your device will get — and that the 2D site is always one tap
        away.
      </p>
      <Button asChild variant="outline" className="mt-4">
        <Link href="/">Back to the flat site</Link>
      </Button>
    </div>
  );
}
