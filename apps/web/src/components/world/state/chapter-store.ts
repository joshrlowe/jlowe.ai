import { useStore } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import {
  type ChapterEvent,
  type ChapterPhase,
  chapterReducer,
  INITIAL_PHASE,
} from "./chapter-fsm";

export interface ChapterState {
  activeScene: string;
  phase: ChapterPhase;
  collectedBeacons: string[];
  openBeaconSlug: string | null;
  speedKmh: number;
  rpm: number; // normalized 0..1, drives the tach + engine audio
  dispatch: (event: ChapterEvent) => void;
  setTelemetry: (t: { speedKmh: number; rpm: number }) => void;
  collectBeacon: (slug: string) => void;
  openBeacon: (slug: string | null) => void;
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

/**
 * Vanilla store: the FSM phase + per-frame telemetry are read via getState() in
 * the render loop; the HUD subscribes via useChapter. Only `collectedBeacons`
 * persists (never the phase/camera/telemetry — a half-run cinematic must not
 * resurrect on reload).
 */
export const chapterStore = createStore<ChapterState>()(
  persist(
    (set, get) => ({
      activeScene: "circuit",
      phase: INITIAL_PHASE,
      collectedBeacons: [],
      openBeaconSlug: null,
      speedKmh: 0,
      rpm: 0,
      dispatch: (event) => set({ phase: chapterReducer(get().phase, event) }),
      setTelemetry: (t) => set({ speedKmh: t.speedKmh, rpm: t.rpm }),
      collectBeacon: (slug) =>
        set((s) =>
          s.collectedBeacons.includes(slug)
            ? s
            : { collectedBeacons: [...s.collectedBeacons, slug] },
        ),
      openBeacon: (slug) => set({ openBeaconSlug: slug }),
    }),
    {
      name: "velocity-chapter-ignition",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : localStorage,
      ),
      partialize: (s) => ({ collectedBeacons: s.collectedBeacons }),
    },
  ),
);

export function useChapter<T>(selector: (state: ChapterState) => T): T {
  return useStore(chapterStore, selector);
}
