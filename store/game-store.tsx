// store/game-store.ts
// Web version: AsyncStorage → localStorage via zustand/middleware's default storage.

"use client";

import { getRegionByLevel } from "@/constants/regions-data";
import { hydrateLevelsWithQuestions } from "@/lib/level-hydrator";
import {
  GameLevel,
  GameRegion,
  LevelProgress,
  TriviaQuestion,
} from "@/interfaces/game-types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface GameState {
  rawQuestions: TriviaQuestion[];
  levelsProgress: Record<number, LevelProgress>;
  userXp: number;
  highestUnlockedLevel: number;

  getLevels: () => GameLevel[];
  getCurrentRegion: () => GameRegion;

  setQuestions: (questions: TriviaQuestion[]) => void;
  completeLevel: (
    levelId: number,
    stars: 0 | 1 | 2 | 3,
    xpGained: number,
  ) => void;
  resetProgress: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      rawQuestions: [],
      levelsProgress: {},
      highestUnlockedLevel: 1,
      userXp: 0,

      getLevels: () => {
        const { rawQuestions, highestUnlockedLevel, levelsProgress } = get();
        return hydrateLevelsWithQuestions(
          rawQuestions,
          highestUnlockedLevel,
          levelsProgress,
        );
      },

      getCurrentRegion: () => {
        return getRegionByLevel(get().highestUnlockedLevel).id;
      },

      setQuestions: (questions) => {
        set({ rawQuestions: questions });
      },

      completeLevel: (levelId, stars, xpGained) => {
        set((state) => {
          const current = state.levelsProgress[levelId] ?? {
            stars: 0,
            status: "unlocked",
          };
          const newStars = Math.max(current.stars, stars) as 0 | 1 | 2 | 3;
          const newProgress = {
            ...state.levelsProgress,
            [levelId]: { stars: newStars, status: "completed" as const },
          };
          const newHighest =
            levelId === state.highestUnlockedLevel
              ? state.highestUnlockedLevel + 1
              : state.highestUnlockedLevel;

          return {
            levelsProgress: newProgress,
            userXp: state.userXp + xpGained,
            highestUnlockedLevel: newHighest,
          };
        });
      },

      resetProgress: () =>
        set({
          levelsProgress: {},
          userXp: 0,
          highestUnlockedLevel: 1,
          rawQuestions: [],
        }),
    }),
    {
      name: "votabien-game-storage-v3",
      // Default storage is localStorage in the browser — no AsyncStorage needed
      storage: createJSONStorage(() => {
        // Safe SSR guard: Next.js runs some code on the server where localStorage doesn't exist
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (state) => ({
        levelsProgress: state.levelsProgress,
        userXp: state.userXp,
        highestUnlockedLevel: state.highestUnlockedLevel,
        // rawQuestions NOT persisted — always fetched fresh from API
      }),
    },
  ),
);
