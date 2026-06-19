"use client";

import type { Route } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { useCapabilityTier } from "@/lib/use-capability-tier";
import { useQualityParam } from "@/lib/use-quality-param";
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
    toast("This device runs the 2D experience", {
      description: "Your browser or settings don't support the 3D world.",
      action: {
        label: "Try 3D anyway",
        // typedRoutes can't type a query string; the path itself is valid.
        onClick: () => router.replace("/world/?mode=webgl" as Route),
      },
    });
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
