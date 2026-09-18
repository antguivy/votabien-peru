"use client";

import { useEffect, useRef } from "react";

export interface NavChipItem {
  id: string;
  num: string;
  label: string;
  count?: number;
}

interface CandidateNavChipsProps {
  items: NavChipItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function CandidateNavChips({
  items,
  activeId,
  onSelect,
}: CandidateNavChipsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active chip into horizontal view when activeId changes
  useEffect(() => {
    if (!containerRef.current) return;
    const activeChip = containerRef.current.querySelector(
      `[data-chip-id="${activeId}"]`,
    ) as HTMLElement | null;

    if (activeChip) {
      activeChip.scrollIntoView({
        inline: "center",
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [activeId]);

  return (
    <nav
      className="sticky top-0 lg:top-[72px] z-30 -mx-4 px-4 py-2.5 bg-background/90 backdrop-blur-md border-y border-border/70 shadow-xs"
      aria-label="Índice de la ficha cívica"
    >
      <div
        ref={containerRef}
        className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-chip-id={item.id}
              onClick={() => onSelect(item.id)}
              className={`shrink-0 inline-flex items-baseline gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
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
              {typeof item.count === "number" && item.count > 0 && (
                <span
                  className={`text-[10px] font-bold tabular-nums ml-0.5 ${
                    isActive ? "text-background/80" : "text-muted-foreground"
                  }`}
                >
                  · {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
