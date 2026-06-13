"use client";

import { createContext, useContext, useMemo } from "react";

import type { CapabilityTier } from "@/lib/capabilities";

import { qualityForTier, type QualitySettings } from "./quality";

const QualityContext = createContext<QualitySettings | null>(null);

export function QualityProvider({
  tier,
  children,
}: {
  tier: CapabilityTier;
  children: React.ReactNode;
}) {
  const value = useMemo(() => qualityForTier(tier), [tier]);
  return (
    <QualityContext.Provider value={value}>{children}</QualityContext.Provider>
  );
}

export function useQuality(): QualitySettings {
  const ctx = useContext(QualityContext);
  if (ctx === null) {
    throw new Error("useQuality must be used within a QualityProvider");
  }
  return ctx;
}
