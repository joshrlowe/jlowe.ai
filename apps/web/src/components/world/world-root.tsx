"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useCapabilityTier } from "@/lib/use-capability-tier";
import { useQualityParam } from "@/lib/use-quality-param";
import { queueTwoDNotice } from "@/lib/two-d-notice";
import { selectIsUltra } from "@/lib/ultra";

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
  const notified = useRef(false);

  useEffect(() => {
    if (report?.tier !== "2d" || notified.current) return;
    notified.current = true;
    // Queue the 2D notice; the (lazy) Toaster emits it once subscribed so it
    // survives this redirect on a cold load. See lib/two-d-notice.
    queueTwoDNotice();
    router.replace("/");
  }, [report?.tier, router]);

  if (report === null || report.tier === "2d") return <CanvasLoading />;

  const isUltra = selectIsUltra({
    tier: report.tier,
    override: qualityOverride,
    adapterConfirmed: report.signals.adapterConfirmed,
    deviceMemory: report.signals.deviceMemory,
  });
  return <WorldExperience tier={report.tier} isUltra={isUltra} />;
}
