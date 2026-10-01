import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  ElectionType,
  MemberRole,
  AgreementAssignee,
  TallyItem,
} from "./types";
import {
  emptyTallySheet,
  isFixedTallyId,
  normalizeTallies,
} from "./reconciliation";

export type CopilotoTab = "checklist" | "calculadora" | "arbitro" | "sobres";

interface CopilotoState {
  activeTab: CopilotoTab;
  selectedRole: MemberRole | null;
  internalAgreements: Record<string, AgreementAssignee>;
  completedTasks: Record<string, boolean>;
  completedVisualRefs: Record<string, boolean>;
  votersTarget: number;
  /** Currently open sheet in the cuadre tab. */
  calculadoraSheet: ElectionType;
  tallies: Record<ElectionType, TallyItem[]>;

  // Actions
  setActiveTab: (tab: CopilotoTab) => void;
  setSelectedRole: (role: MemberRole | null) => void;
  assignAgreement: (taskId: string, assignee: AgreementAssignee) => void;
  toggleTask: (taskId: string) => void;
  toggleVisualRef: (key: string) => void;
  setTaskVisualCompletion: (taskId: string, done: boolean) => void;
  setVotersTarget: (target: number) => void;
  setCalculadoraSheet: (type: ElectionType) => void;
  addTallyItem: (type: ElectionType, value: number, label?: string) => void;
  updateTallyItem: (
    type: ElectionType,
    itemId: string,
    value: number,
    label?: string,
  ) => void;
  removeTallyItem: (type: ElectionType, itemId: string) => void;
  clearTally: (type: ElectionType) => void;
  resetAllData: () => void;
}

const initialTallies: Record<ElectionType, TallyItem[]> = {
  "5A": emptyTallySheet(),
  "5B": emptyTallySheet(),
  "5C": emptyTallySheet(),
  "5D": emptyTallySheet(),
};

export const useCopilotoStore = create<CopilotoState>()(
  persist(
    (set, _get) => ({
      activeTab: "checklist",
      selectedRole: null,
      internalAgreements: {},
      completedTasks: {},
      completedVisualRefs: {},
      votersTarget: 0,
      calculadoraSheet: "5A",
      tallies: initialTallies,

      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedRole: (role) => set({ selectedRole: role }),

      assignAgreement: (taskId, assignee) =>
        set((state) => ({
          internalAgreements: {
            ...state.internalAgreements,
            [taskId]: assignee,
          },
        })),

      toggleTask: (taskId) =>
        set((state) => ({
          completedTasks: {
            ...state.completedTasks,
            [taskId]: !state.completedTasks[taskId],
          },
        })),

      toggleVisualRef: (key) =>
        set((state) => ({
          completedVisualRefs: {
            ...state.completedVisualRefs,
            [key]: !state.completedVisualRefs[key],
          },
        })),

      setTaskVisualCompletion: (taskId, done) =>
        set((state) => ({
          completedTasks: {
            ...state.completedTasks,
            [taskId]: done,
          },
        })),

      setVotersTarget: (target) => set({ votersTarget: Math.max(0, target) }),
      setCalculadoraSheet: (type) => set({ calculadoraSheet: type }),

      addTallyItem: (type, value, label) =>
        set((state) => {
          const currentList = normalizeTallies(state.tallies?.[type]);
          const parties = currentList.filter(
            (item) => !isFixedTallyId(item.id),
          );
          const fixed = currentList.filter((item) => isFixedTallyId(item.id));
          const newItem: TallyItem = {
            id: `tally-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            value: Math.max(0, Number(value) || 0),
            label: label?.trim() || `Fila ${parties.length + 1}`,
          };
          return {
            tallies: {
              ...(state.tallies ?? initialTallies),
              [type]: [...parties, newItem, ...fixed],
            },
          };
        }),

      updateTallyItem: (type, itemId, value, label) =>
        set((state) => {
          const currentList = normalizeTallies(state.tallies?.[type]);
          return {
            tallies: {
              ...(state.tallies ?? initialTallies),
              [type]: currentList.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      value: Math.max(0, Number(value) || 0),
                      ...(label !== undefined ? { label } : {}),
                    }
                  : item,
              ),
            },
          };
        }),

      removeTallyItem: (type, itemId) =>
        set((state) => {
          if (isFixedTallyId(itemId)) return state;
          const currentList = normalizeTallies(state.tallies?.[type]);
          return {
            tallies: {
              ...(state.tallies ?? initialTallies),
              [type]: currentList.filter((item) => item.id !== itemId),
            },
          };
        }),

      clearTally: (type) =>
        set((state) => ({
          tallies: {
            ...(state.tallies ?? initialTallies),
            [type]: emptyTallySheet(),
          },
        })),

      resetAllData: () =>
        set({
          completedTasks: {},
          completedVisualRefs: {},
          votersTarget: 0,
          calculadoraSheet: "5A",
          tallies: initialTallies,
          selectedRole: null,
          internalAgreements: {},
        }),
    }),
    {
      name: "votabien-copiloto-mesa-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
