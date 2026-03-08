import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ReadinessTool = "match" | "trivia" | "comparador" | "simulador";

export const THRESHOLDS: Record<ReadinessTool, number> = {
  match: 5,
  trivia: 4,
  comparador: 20,
  simulador: 5,
};

interface ReadinessStore {
  matchInteractions: number;
  triviaRegionsCompleted: string[];
  comparadorPairs: string[];
  simuladorInteractions: number;

  markMatchInteraction: () => void;
  markTriviaRegion: (regionId: string) => void;
  markComparadorPair: (pairKey: string) => void;
  markSimuladorInteraction: () => void;
}

export const useReadinessStore = create<ReadinessStore>()(
  persist(
    (set, get) => ({
      matchInteractions: 0,
      triviaRegionsCompleted: [],
      comparadorPairs: [],
      simuladorInteractions: 0,

      markMatchInteraction: () =>
        set((s) => ({ matchInteractions: s.matchInteractions + 1 })),

      markTriviaRegion: (regionId) =>
        set((s) => {
          if (s.triviaRegionsCompleted.includes(regionId)) return s;
          return {
            triviaRegionsCompleted: [...s.triviaRegionsCompleted, regionId],
          };
        }),

      markComparadorPair: (pairKey) =>
        set((s) => {
          if (s.comparadorPairs.includes(pairKey)) return s;
          return { comparadorPairs: [...s.comparadorPairs, pairKey] };
        }),

      markSimuladorInteraction: () =>
        set((s) => ({ simuladorInteractions: s.simuladorInteractions + 1 })),
    }),
    { name: "votabien-readiness" },
  ),
);

// Selector hook — computa lo derivado fuera del store
export function useReadiness() {
  const store = useReadinessStore();

  const raw: Record<ReadinessTool, number> = {
    match: store.matchInteractions,
    trivia: store.triviaRegionsCompleted.length,
    comparador: store.comparadorPairs.length,
    simulador: store.simuladorInteractions,
  };

  const progress = (Object.keys(THRESHOLDS) as ReadinessTool[]).reduce(
    (acc, t) => {
      acc[t] = Math.min(100, Math.round((raw[t] / THRESHOLDS[t]) * 100));
      return acc;
    },
    {} as Record<ReadinessTool, number>,
  );

  const isReady = (t: ReadinessTool) => raw[t] >= THRESHOLDS[t];
  const completedCount = (Object.keys(THRESHOLDS) as ReadinessTool[]).filter(
    isReady,
  ).length;

  return {
    raw,
    progress,
    isReady,
    completedCount,
    isFullyReady: completedCount === 4,
    percentReady: Math.round((completedCount / 4) * 100),
    markMatchInteraction: store.markMatchInteraction,
    markTriviaRegion: store.markTriviaRegion,
    markComparadorPair: store.markComparadorPair,
    markSimuladorInteraction: store.markSimuladorInteraction,
  };
}
