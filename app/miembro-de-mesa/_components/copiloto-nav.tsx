"use client";

import { useCopilotoStore, CopilotoTab } from "../_lib/store";
import { calculateElectionTotals } from "../_lib/reconciliation";
import { ListChecks, Calculator, Scale, PackageCheck } from "lucide-react";

interface BottomNavItem {
  id: CopilotoTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: BottomNavItem[] = [
  {
    id: "checklist",
    label: "Fases & Tareas",
    shortLabel: "Tareas",
    icon: ListChecks,
  },
  {
    id: "calculadora",
    label: "Cuadre de Actas",
    shortLabel: "Cuadre",
    icon: Calculator,
  },
  {
    id: "arbitro",
    label: "Árbitro de Votos",
    shortLabel: "Votos",
    icon: Scale,
  },
  {
    id: "sobres",
    label: "Sobres Oficiales",
    shortLabel: "Sobres",
    icon: PackageCheck,
  },
];

export function CopilotoNav() {
  const activeTab = useCopilotoStore((s) => s.activeTab);
  const setActiveTab = useCopilotoStore((s) => s.setActiveTab);
  const votersTarget = useCopilotoStore((s) => s.votersTarget);
  const sheets = useCopilotoStore((s) => s.sheets);

  // Status for the Cuadre tab
  const activeSheetTotals = calculateElectionTotals(sheets["5A"]);
  const is5AMatched =
    votersTarget > 0 && activeSheetTotals.totalVotes === votersTarget;
  const is5AMismatched =
    votersTarget > 0 && activeSheetTotals.totalVotes !== votersTarget;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <nav
        className="w-full max-w-4xl bg-background/95 backdrop-blur-xl border-t border-border/80 px-2 sm:px-6 pt-1.5 pb-[calc(0.6rem+env(safe-area-inset-bottom))] flex items-center justify-around pointer-events-auto shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)]"
        aria-label="Navegación principal de la mesa"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`relative flex-1 max-w-[140px] flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-xl transition-all duration-150 select-none active:scale-95 ${
                isActive
                  ? "text-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {/* Active Indicator Top Glow Line */}
              {isActive && (
                <span
                  aria-hidden
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full bg-brand transition-all"
                />
              )}

              <div
                className={`relative p-1.5 rounded-xl transition-all ${
                  isActive
                    ? "bg-muted text-brand shadow-2xs"
                    : "bg-transparent text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />

                {/* Status Dot for Cuadre Tab */}
                {item.id === "calculadora" && (
                  <span
                    className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-background ${
                      is5AMatched
                        ? "bg-emerald-500"
                        : is5AMismatched
                          ? "bg-destructive animate-pulse"
                          : "hidden"
                    }`}
                  />
                )}
              </div>

              <span className="text-[10px] sm:text-[11px] font-mono tracking-tight leading-none truncate">
                <span className="hidden xs:inline">{item.label}</span>
                <span className="xs:hidden">{item.shortLabel}</span>
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
