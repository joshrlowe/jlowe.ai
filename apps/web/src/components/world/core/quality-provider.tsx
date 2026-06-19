"use client";

import { createContext, useContext, useMemo } from "react";

import type { CapabilityTier } from "@/lib/capabilities";

import { qualityFor, type QualitySettings } from "./quality";

interface QualityContextValue {
  settings: QualitySettings;
  /** The orthogonal ultra axis (see `lib/ultra.ts`). */
  isUltra: boolean;
}

const QualityContext = createContext<QualityContextValue | null>(null);

export function QualityProvider({
  tier,
  isUltra,
  children,
}: {
  tier: CapabilityTier;
  isUltra: boolean;
  children: React.ReactNode;
}) {
  const value = useMemo<QualityContextValue>(
    () => ({ settings: qualityFor(tier, isUltra), isUltra }),
    [tier, isUltra],
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
