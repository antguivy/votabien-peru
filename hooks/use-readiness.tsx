"use client";

// hooks/use-readiness.ts
// Tracks progress across VotaBien's 4 tools.
// No auth — persisted in localStorage.
//
// Thresholds:
//   match:      5  (searches/results viewed)
//   trivia:     4  (1 level per region: Costa, Sierra, Selva, Hanan Pacha)
//   comparador: 20 (unique party pairs viewed)
//   simulador:  5  (simulations completed)

import { useCallback, useEffect, useState } from "react";

export type ReadinessTool = "match" | "trivia" | "comparador" | "simulador";

export interface ReadinessState {
  match: boolean;
  trivia: boolean;
  comparador: boolean;
  simulador: boolean;
  matchInteractions: number;
  triviaLevelsCompleted: number;
  comparadorInteractions: number;
  simuladorInteractions: number;
}

// Exported so the UI can render progress bars
export const THRESHOLDS: Record<ReadinessTool, number> = {
  match: 5,
  trivia: 4,
  comparador: 20,
  simulador: 5,
};

const STORAGE_KEY = "votabien-readiness";

const defaultState: ReadinessState = {
  match: false,
  trivia: false,
  comparador: false,
  simulador: false,
  matchInteractions: 0,
  triviaLevelsCompleted: 0,
  comparadorInteractions: 0,
  simuladorInteractions: 0,
};

function readFromStorage(): ReadinessState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

function writeToStorage(state: ReadinessState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function bump(
  prev: ReadinessState,
  tool: ReadinessTool,
  counterKey: keyof ReadinessState,
): ReadinessState {
  if (prev[tool]) return prev;
  const newCount = (prev[counterKey] as number) + 1;
  const next: ReadinessState = {
    ...prev,
    [counterKey]: newCount,
    [tool]: newCount >= THRESHOLDS[tool],
  };
  writeToStorage(next);
  return next;
}

export function useReadiness() {
  const [readiness, setReadiness] = useState<ReadinessState>(defaultState);

  useEffect(() => {
    setReadiness(readFromStorage());
  }, []);

  const markMatchInteraction = useCallback(() => {
    setReadiness((prev) => bump(prev, "match", "matchInteractions"));
  }, []);

  const markTriviaLevel = useCallback(() => {
    setReadiness((prev) => bump(prev, "trivia", "triviaLevelsCompleted"));
  }, []);

  const markComparadorInteraction = useCallback(() => {
    setReadiness((prev) => bump(prev, "comparador", "comparadorInteractions"));
  }, []);

  const markSimuladorInteraction = useCallback(() => {
    setReadiness((prev) => bump(prev, "simulador", "simuladorInteractions"));
  }, []);

  const progress: Record<ReadinessTool, number> = {
    match: Math.min(
      100,
      Math.round((readiness.matchInteractions / THRESHOLDS.match) * 100),
    ),
    trivia: Math.min(
      100,
      Math.round((readiness.triviaLevelsCompleted / THRESHOLDS.trivia) * 100),
    ),
    comparador: Math.min(
      100,
      Math.round(
        (readiness.comparadorInteractions / THRESHOLDS.comparador) * 100,
      ),
    ),
    simulador: Math.min(
      100,
      Math.round(
        (readiness.simuladorInteractions / THRESHOLDS.simulador) * 100,
      ),
    ),
  };

  const completedCount = (
    ["match", "trivia", "comparador", "simulador"] as ReadinessTool[]
  ).filter((t) => readiness[t]).length;

  const isFullyReady = completedCount === 4;
  const percentReady = Math.round((completedCount / 4) * 100);

  return {
    readiness,
    progress,
    markMatchInteraction,
    markTriviaLevel,
    markComparadorInteraction,
    markSimuladorInteraction,
    completedCount,
    isFullyReady,
    percentReady,
  };
}
