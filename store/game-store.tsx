"use client";

import { getRegionByLevel } from "@/constants/regions-data";
import {
  hydrateLevelsWithQuestions,
  QUESTIONS_PER_LEVEL,
} from "@/lib/level-hydrator";
import {
  GameLevel,
  GameRegion,
  LevelProgress,
  TriviaQuestion,
  GamePlayMode,
} from "@/interfaces/game-types";
import { TriviaTopic, TriviaAudience } from "@/interfaces/trivia";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface TopicProgress {
  highestUnlockedLevel: number;
  levelsProgress: Record<number, LevelProgress>;
  topicXp: number;
  quizzesCompleted: number;
}

interface GameState {
  currentTopic: TriviaTopic | null;
  currentAudience: TriviaAudience | null;
  currentMode: GamePlayMode;

  rawQuestions: TriviaQuestion[];
  userXp: number;

  // Progreso particionado por slug de tema (o "general" como default)
  progressByTopic: Record<string, TopicProgress>;

  // Getters
  getLevels: (topicSlug?: string) => GameLevel[];
  getCurrentRegion: (topicSlug?: string) => GameRegion;
  getTopicProgress: (topicSlug?: string) => TopicProgress;
  highestUnlockedLevel: number;
  levelsProgress: Record<number, LevelProgress>;

  // Setters
  setCurrentTopic: (topic: TriviaTopic | null) => void;
  setCurrentAudience: (audience: TriviaAudience | null) => void;
  setMode: (mode: GamePlayMode) => void;
  setQuestions: (questions: TriviaQuestion[]) => void;

  completeLevel: (
    levelId: number,
    stars: 0 | 1 | 2 | 3,
    xpGained: number,
    topicSlug?: string,
  ) => void;

  recordQuizResult: (
    score: number,
    correctCount: number,
    total: number,
    topicSlug?: string,
  ) => void;

  resetProgress: (topicSlug?: string) => void;
}

const DEFAULT_TOPIC_PROGRESS: TopicProgress = {
  highestUnlockedLevel: 1,
  levelsProgress: {},
  topicXp: 0,
  quizzesCompleted: 0,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      currentTopic: null,
      currentAudience: null,
      currentMode: "MAP",
      rawQuestions: [],
      userXp: 0,
      progressByTopic: {},

      get highestUnlockedLevel() {
        const topicSlug = get().currentTopic?.slug || "general";
        return get().progressByTopic[topicSlug]?.highestUnlockedLevel ?? 1;
      },

      get levelsProgress() {
        const topicSlug = get().currentTopic?.slug || "general";
        return get().progressByTopic[topicSlug]?.levelsProgress ?? {};
      },

      getTopicProgress: (topicSlug) => {
        const slug = topicSlug || get().currentTopic?.slug || "general";
        return get().progressByTopic[slug] ?? { ...DEFAULT_TOPIC_PROGRESS };
      },

      getLevels: (topicSlug) => {
        const { rawQuestions, progressByTopic, currentTopic } = get();
        const slug = topicSlug || currentTopic?.slug || "general";
        const topicProg = progressByTopic[slug] ?? {
          ...DEFAULT_TOPIC_PROGRESS,
        };

        return hydrateLevelsWithQuestions(
          rawQuestions,
          topicProg.highestUnlockedLevel,
          topicProg.levelsProgress,
        );
      },

      getCurrentRegion: (topicSlug) => {
        const slug = topicSlug || get().currentTopic?.slug || "general";
        const highest = get().progressByTopic[slug]?.highestUnlockedLevel ?? 1;
        return getRegionByLevel(highest).id;
      },

      setCurrentTopic: (topic) => {
        set({ currentTopic: topic });
      },

      setCurrentAudience: (audience) => {
        set({ currentAudience: audience });
      },

      setMode: (mode) => {
        set({ currentMode: mode });
      },

      setQuestions: (questions) => {
        set({ rawQuestions: questions });
      },

      completeLevel: (levelId, stars, xpGained, topicSlug) => {
        set((state) => {
          const slug = topicSlug || state.currentTopic?.slug || "general";
          const currentProg = state.progressByTopic[slug] ?? {
            ...DEFAULT_TOPIC_PROGRESS,
          };

          const currentLevelProg = currentProg.levelsProgress[levelId] ?? {
            stars: 0,
            status: "unlocked",
          };

          const newStars = Math.max(currentLevelProg.stars, stars) as
            | 0
            | 1
            | 2
            | 3;
          const newLevelsProgress = {
            ...currentProg.levelsProgress,
            [levelId]: { stars: newStars, status: "completed" as const },
          };

          const totalLevels = Math.max(
            1,
            Math.floor(state.rawQuestions.length / QUESTIONS_PER_LEVEL),
          );

          const newHighest =
            levelId === currentProg.highestUnlockedLevel
              ? Math.min(currentProg.highestUnlockedLevel + 1, totalLevels)
              : currentProg.highestUnlockedLevel;

          const updatedTopicProg: TopicProgress = {
            ...currentProg,
            highestUnlockedLevel: newHighest,
            levelsProgress: newLevelsProgress,
            topicXp: currentProg.topicXp + xpGained,
          };

          return {
            progressByTopic: {
              ...state.progressByTopic,
              [slug]: updatedTopicProg,
            },
            userXp: state.userXp + xpGained,
          };
        });
      },

      recordQuizResult: (score, _correctCount, _total, topicSlug) => {
        set((state) => {
          const slug = topicSlug || state.currentTopic?.slug || "general";
          const currentProg = state.progressByTopic[slug] ?? {
            ...DEFAULT_TOPIC_PROGRESS,
          };

          const xpGained = Math.round(score * 0.5);

          const updatedTopicProg: TopicProgress = {
            ...currentProg,
            quizzesCompleted: currentProg.quizzesCompleted + 1,
            topicXp: currentProg.topicXp + xpGained,
          };

          return {
            progressByTopic: {
              ...state.progressByTopic,
              [slug]: updatedTopicProg,
            },
            userXp: state.userXp + xpGained,
          };
        });
      },

      resetProgress: (topicSlug) => {
        set((state) => {
          if (topicSlug) {
            const copy = { ...state.progressByTopic };
            delete copy[topicSlug];
            return { progressByTopic: copy };
          }
          return {
            progressByTopic: {},
            userXp: 0,
            rawQuestions: [],
          };
        });
      },
    }),
    {
      name: "votabien-game-storage-v5",
      version: 5,
      migrate: (persistedState: unknown, fromVersion: number) => {
        if (fromVersion < 5) {
          return {
            progressByTopic: {},
            userXp: 0,
            currentMode: "MAP",
          };
        }
        return persistedState;
      },
      storage: createJSONStorage(() => {
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
        progressByTopic: state.progressByTopic,
        userXp: state.userXp,
      }),
    },
  ),
);
