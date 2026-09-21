import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  PhaseId,
  ElectionType,
  ElectionSheetState,
  EnvelopeColor,
} from "./types";
import { createInitialElectionSheet } from "./reconciliation";

export type CopilotoTab =
  | "checklist"
  | "calculadora"
  | "arbitro"
  | "sobres"
  | "protocolos";

interface CopilotoState {
  activeTab: CopilotoTab;
  activePhase: PhaseId;
  completedTasks: Record<string, boolean>;
  votersTarget: number;
  sheets: Record<ElectionType, ElectionSheetState>;
  sealedEnvelopes: Record<EnvelopeColor, boolean>;

  // Actions
  setActiveTab: (tab: CopilotoTab) => void;
  setActivePhase: (phase: PhaseId) => void;
  toggleTask: (taskId: string) => void;
  setVotersTarget: (target: number) => void;
  updateOptionVotes: (
    type: ElectionType,
    optionId: string,
    votes: number,
  ) => void;
  addSheetOption: (type: ElectionType, name: string) => void;
  removeSheetOption: (type: ElectionType, optionId: string) => void;
  updateSpecialVotes: (
    type: ElectionType,
    field: "whiteVotes" | "nullVotes" | "impugnedVotes",
    count: number,
  ) => void;
  toggleEnvelopeSealed: (color: EnvelopeColor) => void;
  resetAllData: () => void;
}

const initialSheets: Record<ElectionType, ElectionSheetState> = {
  "5A": createInitialElectionSheet(
    "5A",
    "Elección Regional — Gobernador",
    "Hoja Borrador 5A y Acta Sección C",
  ),
  "5B": createInitialElectionSheet(
    "5B",
    "Elección Regional — Consejeros",
    "Hoja Borrador 5B y Acta Sección C",
  ),
  "5C": createInitialElectionSheet(
    "5C",
    "Elección Municipal — Provincial",
    "Hoja Borrador 5C y Acta Sección C",
  ),
  "5D": createInitialElectionSheet(
    "5D",
    "Elección Municipal — Distrital",
    "Hoja Borrador 5D y Acta Sección C",
  ),
};

export const useCopilotoStore = create<CopilotoState>()(
  persist(
    (set, _get) => ({
      activeTab: "checklist",
      activePhase: "instalacion",
      completedTasks: {},
      votersTarget: 0,
      sheets: initialSheets,
      sealedEnvelopes: {
        plomo: false,
        rojo: false,
        verde: false,
        celeste: false,
        anaranjado: false,
      },

      setActiveTab: (tab) => set({ activeTab: tab }),
      setActivePhase: (phase) => set({ activePhase: phase }),

      toggleTask: (taskId) =>
        set((state) => ({
          completedTasks: {
            ...state.completedTasks,
            [taskId]: !state.completedTasks[taskId],
          },
        })),

      setVotersTarget: (target) => set({ votersTarget: Math.max(0, target) }),

      updateOptionVotes: (type, optionId, votes) =>
        set((state) => {
          const currentSheet = state.sheets[type];
          if (!currentSheet) return state;

          const updatedOptions = currentSheet.options.map((opt) =>
            opt.id === optionId ? { ...opt, votes: Math.max(0, votes) } : opt,
          );

          return {
            sheets: {
              ...state.sheets,
              [type]: {
                ...currentSheet,
                options: updatedOptions,
              },
            },
          };
        }),

      addSheetOption: (type, name) =>
        set((state) => {
          const currentSheet = state.sheets[type];
          if (!currentSheet) return state;

          const newOption = {
            id: `opt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            name:
              name.trim() || `Organización ${currentSheet.options.length + 1}`,
            votes: 0,
          };

          return {
            sheets: {
              ...state.sheets,
              [type]: {
                ...currentSheet,
                options: [...currentSheet.options, newOption],
              },
            },
          };
        }),

      removeSheetOption: (type, optionId) =>
        set((state) => {
          const currentSheet = state.sheets[type];
          if (!currentSheet) return state;

          return {
            sheets: {
              ...state.sheets,
              [type]: {
                ...currentSheet,
                options: currentSheet.options.filter((o) => o.id !== optionId),
              },
            },
          };
        }),

      updateSpecialVotes: (type, field, count) =>
        set((state) => {
          const currentSheet = state.sheets[type];
          if (!currentSheet) return state;

          return {
            sheets: {
              ...state.sheets,
              [type]: {
                ...currentSheet,
                [field]: Math.max(0, count),
              },
            },
          };
        }),

      toggleEnvelopeSealed: (color) =>
        set((state) => ({
          sealedEnvelopes: {
            ...state.sealedEnvelopes,
            [color]: !state.sealedEnvelopes[color],
          },
        })),

      resetAllData: () =>
        set({
          completedTasks: {},
          votersTarget: 0,
          sheets: initialSheets,
          sealedEnvelopes: {
            plomo: false,
            rojo: false,
            verde: false,
            celeste: false,
            anaranjado: false,
          },
          activePhase: "instalacion",
        }),
    }),
    {
      name: "votabien-copiloto-mesa-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
