"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface NavChipItem {
  id: string;
  num: string;
  label: string;
  count?: number;
  badge?: string;
}

interface LegislatorNavChipsProps {
  items: NavChipItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function LegislatorNavChips({
  items,
  activeId,
  onSelect,
}: LegislatorNavChipsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active chip into view horizontally
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
      className="sticky top-0 lg:top-[72px] z-30 -mx-4 px-4 py-2.5 bg-background/95 backdrop-blur-md border-y border-border/70 shadow-xs"
      aria-label="Índice de la ficha del legislador"
    >
      <div
        ref={containerRef}
        className="max-w-4xl mx-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
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
              className={cn(
                "shrink-0 inline-flex items-baseline gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border",
                isActive
                  ? "bg-foreground text-background border-foreground shadow-xs"
                  : "bg-muted/40 text-muted-foreground border-border/70 hover:bg-muted/70 hover:text-foreground",
              )}
              aria-current={isActive ? "true" : "false"}
            >
              <span
                className={cn(
                  "text-[10px] font-bold",
                  isActive ? "text-background/70" : "text-brand",
                )}
              >
                {item.num}
              </span>
              <span>{item.label}</span>
              {item.badge ? (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {item.badge}
                </span>
              ) : typeof item.count === "number" && item.count > 0 ? (
                <span
                  className={cn(
                    "text-[10px] font-bold tabular-nums ml-0.5",
                    isActive ? "text-background/80" : "text-muted-foreground",
                  )}
                >
                  · {item.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
