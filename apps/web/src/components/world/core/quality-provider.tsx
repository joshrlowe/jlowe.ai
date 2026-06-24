"use client";

import { createContext, useContext, useMemo } from "react";

import type { CapabilityTier } from "@/lib/capabilities";

import { qualityFor, type QualitySettings } from "./quality";

interface QualityContextValue {
  settings: QualitySettings;
  /** The orthogonal ultra axis (see `lib/ultra.ts`). */
  isUltra: boolean;
  /**
   * Ultra the visitor EXPLICITLY opted into (`?quality=ultra`), as opposed to
   * the strong-GPU auto-heuristic. The heaviest, still-being-tuned effects (the
   * cinematic post-FX stack, the per-frame cube reflection, the planar wet
   * reflector) gate on this — so the auto-ultra default stays the proven,
   * in-budget floor (a reliable first impression for capable visitors) and the
   * heavy chain is a deliberate opt-in we reintroduce one effect at a time.
   */
  explicitUltra: boolean;
}

const QualityContext = createContext<QualityContextValue | null>(null);

export function QualityProvider({
  tier,
  isUltra,
  explicitUltra,
  children,
}: {
  tier: CapabilityTier;
  isUltra: boolean;
  explicitUltra: boolean;
  children: React.ReactNode;
}) {
  const value = useMemo<QualityContextValue>(
    () => ({ settings: qualityFor(tier, isUltra), isUltra, explicitUltra }),
    [tier, isUltra, explicitUltra],
  );
  return (
    <QualityContext.Provider value={value}>{children}</QualityContext.Provider>
  );
}

function useQualityContext(): QualityContextValue {
  const ctx = useContext(QualityContext);
  if (ctx === null) {
    throw new Error("useQuality must be used within a QualityProvider");
  }
  return ctx;
}

export function useQuality(): QualitySettings {
  return useQualityContext().settings;
}

export function useIsUltra(): boolean {
  return useQualityContext().isUltra;
}

/** See {@link QualityContextValue.explicitUltra}. */
export function useExplicitUltra(): boolean {
  return useQualityContext().explicitUltra;
}
