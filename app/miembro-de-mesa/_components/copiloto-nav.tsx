"use client";

import { useEffect, useRef } from "react";
import { useCopilotoStore, CopilotoTab } from "../_lib/store";
import { calculateElectionTotals } from "../_lib/reconciliation";

interface NavChipItem {
  id: CopilotoTab;
  num: string;
  label: string;
  badge?: string;
}

export function CopilotoNav() {
  const activeTab = useCopilotoStore((s) => s.activeTab);
  const setActiveTab = useCopilotoStore((s) => s.setActiveTab);
  const votersTarget = useCopilotoStore((s) => s.votersTarget);
  const sheets = useCopilotoStore((s) => s.sheets);

  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate status for the Cuadre tab
  const activeSheetTotals = calculateElectionTotals(sheets["5A"]);
  const is5AMatched =
    votersTarget > 0 && activeSheetTotals.totalVotes === votersTarget;

  const items: NavChipItem[] = [
    { id: "checklist", num: "01", label: "Fases & Tareas" },
    {
      id: "calculadora",
      num: "02",
      label: "Cuadre de Actas",
      badge: is5AMatched ? "✓ Cuadró" : undefined,
    },
    { id: "arbitro", num: "03", label: "Árbitro de Votos" },
    { id: "sobres", num: "04", label: "Sobres de Seguridad" },
  ];

  // Auto-scroll active chip into horizontal view when activeTab changes
  useEffect(() => {
    if (!containerRef.current) return;
    const activeChip = containerRef.current.querySelector(
      `[data-chip-id="${activeTab}"]`,
    ) as HTMLElement | null;

    if (activeChip) {
      activeChip.scrollIntoView({
        inline: "center",
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [activeTab]);

  return (
    <nav
      className="sticky top-[53px] z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 bg-background/90 backdrop-blur-md border-b border-border/70 shadow-xs"
      aria-label="Navegación del copiloto de mesa"
    >
      <div
        ref={containerRef}
        className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-chip-id={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`shrink-0 inline-flex items-baseline gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border select-none active:scale-95 ${
                isActive
                  ? "bg-foreground text-background border-foreground shadow-xs"
                  : "bg-muted/30 text-muted-foreground border-border/70 hover:bg-muted/60 hover:text-foreground"
              }`}
              aria-current={isActive ? "true" : "false"}
            >
              <span
                className={`text-[10px] font-bold ${
                  isActive ? "text-background/70" : "text-brand"
                }`}
              >
                {item.num}
              </span>
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1 rounded ${
                    isActive
                      ? "bg-background/20 text-background"
                      : "bg-success/15 text-success"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
