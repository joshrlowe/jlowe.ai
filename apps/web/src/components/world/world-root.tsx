"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useCapabilityTier } from "@/lib/use-capability-tier";
import { useQualityParam } from "@/lib/use-quality-param";
import { queueTwoDNotice } from "@/lib/two-d-notice";
import { selectIsUltra } from "@/lib/ultra";

import { WorldErrorBoundary } from "./world-error-boundary";

function CanvasLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Skeleton className="size-40 rounded-full" />
    </div>
  );
}

// Dynamically imported so three/fiber/drei never enter the initial chunk —
// loaded only once a 3D tier is confirmed.
const WorldExperience = dynamic(
  () => import("./world-experience").then((m) => m.WorldExperience),
  { ssr: false, loading: () => <CanvasLoading /> },
);

export function WorldRoot() {
  const report = useCapabilityTier();
  const qualityOverride = useQualityParam();
  const router = useRouter();
  const bailed = useRef(false);
  // One progressive step down from a confirmed-but-broken WebGPU backend: remount
  // the canvas forcing WebGL2. The remount keys a fresh <Canvas>, so the new
  // renderer never collides with the dead GPU context of the failed one.
  const [forcedTier, setForcedTier] = useState<"webgl" | null>(null);

  const bailTo2D = useCallback(() => {
    if (bailed.current) return;
    bailed.current = true;
    // Queue the 2D notice; the (lazy) Toaster emits it once subscribed so it
    // survives this redirect on a cold load. See lib/two-d-notice.
    queueTwoDNotice();
    router.replace("/");
  }, [router]);

  useEffect(() => {
    if (report?.tier === "2d") bailTo2D();
  }, [report?.tier, bailTo2D]);

  if (report === null || report.tier === "2d") return <CanvasLoading />;

  const effectiveTier = forcedTier ?? report.tier;
  const isUltra = selectIsUltra({
    tier: effectiveTier,
    override: qualityOverride,
    adapterConfirmed: report.signals.adapterConfirmed,
    deviceMemory: report.signals.deviceMemory,
  });

  // A fatal canvas error — a rejected/timed-out renderer init, or any throw in
  // the 3D subtree — degrades one step at a time instead of white-screening:
  // WebGPU → WebGL2 once, then all the way to the flat 2D site.
  const handleFatal = () => {
    if (effectiveTier === "webgpu") setForcedTier("webgl");
    else bailTo2D();
  };

  return (
    <WorldErrorBoundary
      resetKey={effectiveTier}
      onError={handleFatal}
      fallback={<CanvasLoading />}
    >
      <WorldExperience
        key={effectiveTier}
        tier={effectiveTier}
        isUltra={isUltra}
        onRendererError={handleFatal}
      />
    </WorldErrorBoundary>
  );
}
