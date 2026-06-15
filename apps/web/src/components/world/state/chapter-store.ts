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
import { chapterById } from "./chapters";

export interface ChapterState {
  activeChapterId: string;
  activeScene: string;
  phase: ChapterPhase;
  /**
   * Collected beacon slugs keyed by chapter id — the only persisted slice, so
   * progress survives reload. The phase/camera/telemetry never persist (a
   * half-run cinematic must not resurrect).
   */
  collectedByChapter: Record<string, string[]>;
  /**
   * Derived mirror of the active chapter's collected set. Kept here (not just a
   * selector) so existing reads — `s.collectedBeacons` in the HUD + beacon —
   * keep a stable array reference that only changes when the set changes.
   */
  collectedBeacons: string[];
  openBeaconSlug: string | null;
  speedKmh: number;
  rpm: number; // normalized 0..1, drives the tach + engine audio
  dispatch: (event: ChapterEvent) => void;
  setTelemetry: (t: { speedKmh: number; rpm: number }) => void;
  collectBeacon: (slug: string) => void;
  openBeacon: (slug: string | null) => void;
  /** Switch chapters: swaps scene, restarts the FSM, clears any open panel. */
  setChapter: (id: string) => void;
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

/** The active chapter's collected slugs (empty array when none recorded yet). */
function collectedFor(
  byChapter: Record<string, string[]>,
  chapterId: string,
): string[] {
  return byChapter[chapterId] ?? [];
}

/**
 * Vanilla store: the FSM phase + per-frame telemetry are read via getState() in
 * the render loop; the HUD subscribes via useChapter. Only `collectedByChapter`
 * persists (never the phase/camera/telemetry). `collectedBeacons` is a derived
 * mirror of the active chapter's set, refreshed on collect + chapter swap so
 * subscribers see a new array reference only when the set actually changes.
 */
export const chapterStore = createStore<ChapterState>()(
  persist(
    (set, get) => ({
      activeChapterId: "ignition",
      activeScene: "circuit",
      phase: INITIAL_PHASE,
      collectedByChapter: {},
      collectedBeacons: [],
      openBeaconSlug: null,
      speedKmh: 0,
      rpm: 0,
      dispatch: (event) => set({ phase: chapterReducer(get().phase, event) }),
      setTelemetry: (t) => set({ speedKmh: t.speedKmh, rpm: t.rpm }),
      collectBeacon: (slug) =>
        set((s) => {
          const current = collectedFor(s.collectedByChapter, s.activeChapterId);
          if (current.includes(slug)) return s;
          const next = [...current, slug];
          return {
            collectedByChapter: {
              ...s.collectedByChapter,
              [s.activeChapterId]: next,
            },
            collectedBeacons: next,
          };
        }),
      openBeacon: (slug) => set({ openBeaconSlug: slug }),
      setChapter: (id) =>
        set((s) => ({
          activeChapterId: id,
          activeScene: chapterById(id)?.sceneKey ?? s.activeScene,
          phase: INITIAL_PHASE,
          openBeaconSlug: null,
          collectedBeacons: collectedFor(s.collectedByChapter, id),
        })),
    }),
    {
      name: "velocity-chapters",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : localStorage,
      ),
      partialize: (s) => ({ collectedByChapter: s.collectedByChapter }),
      // Restore only collectedByChapter; re-derive the active chapter's mirror
      // so the first render reflects persisted progress.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.collectedBeacons = collectedFor(
          state.collectedByChapter,
          state.activeChapterId,
        );
      },
    },
  ),
);

export function useChapter<T>(selector: (state: ChapterState) => T): T {
  return useStore(chapterStore, selector);
}
