"use client";

import { useState } from "react";
import { Check, ImageIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCopilotoStore } from "../_lib/store";
import { ChecklistTask, VisualRef } from "../_lib/types";

interface VisualRefSheetProps {
  ref_: VisualRef;
  totalItemsInTask: number;
}

/**
 * One reference screenshot with its checkable verification items.
 * Rendered as a thumbnail trigger + full-height bottom sheet.
 */
function VisualRefSheet({ ref_, totalItemsInTask }: VisualRefSheetProps) {
  const [open, setOpen] = useState(false);
  const completedVisualItems = useCopilotoStore((s) => s.completedVisualItems);
  const toggleVisualItem = useCopilotoStore((s) => s.toggleVisualItem);

  const items = ref_.items ?? [];
  const doneCount = items.filter((it) => completedVisualItems[it.id]).length;
  const isRefComplete = items.length > 0 && doneCount === items.length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Thumbnail trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative shrink-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-xl"
        aria-label={`Abrir referencia visual: ${ref_.caption}`}
      >
        <div
          className={`h-16 w-24 sm:h-18 sm:w-28 rounded-xl overflow-hidden border-2 bg-muted/30 transition-all group-active:scale-95 ${
            isRefComplete
              ? "border-emerald-600/40"
              : "border-border/80 group-hover:border-brand/50"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ref_.src}
            alt={ref_.alt}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Progress badge */}
        {items.length > 0 && (
          <span
            className={`absolute -top-1.5 -right-1.5 text-[9px] font-mono font-black px-1.5 py-0.5 rounded-md border shadow-xs ${
              isRefComplete
                ? "bg-emerald-500 text-white border-emerald-600"
                : "bg-background text-muted-foreground border-border"
            }`}
          >
            {isRefComplete ? (
              <Check className="h-2.5 w-2.5" />
            ) : (
              `${doneCount}/${items.length}`
            )}
          </span>
        )}

        <p className="mt-1 text-[9.5px] font-mono font-bold text-muted-foreground leading-tight line-clamp-2">
          {ref_.caption}
        </p>
      </button>

      {/* Full-height bottom sheet with image + checkable items */}
      <SheetContent
        side="bottom"
        className="h-[92dvh] max-w-4xl mx-auto rounded-t-2xl border-t border-border/80 px-0 sm:px-0"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="px-4 pb-2 pt-3 border-b border-border/60 shrink-0">
            <SheetTitle className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-brand shrink-0" />
              {ref_.caption}
            </SheetTitle>
            <SheetDescription className="text-[11px] text-left">
              Compara el material físico con la imagen de referencia oficial de
              la ONPE y verifica cada ítem. Tarea #{totalItemsInTask}.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 overscroll-contain">
            {/* Reference image (browser handles pinch-zoom on touch) */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ref_.src}
                alt={ref_.alt}
                className="w-full rounded-lg select-none"
                style={{ touchAction: "pinch-zoom" }}
              />
            </div>

            {/* Checkable verification items */}
            {items.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-muted-foreground">
                  Verificación física ({doneCount}/{items.length})
                </p>
                {items.map((item) => {
                  const isDone = !!completedVisualItems[item.id];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleVisualItem(item.id)}
                      className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all active:scale-[0.99] ${
                        isDone
                          ? "bg-emerald-500/10 border-emerald-600/30"
                          : "bg-card border-border/80 hover:border-brand/40"
                      }`}
                      aria-pressed={isDone}
                    >
                      <span
                        className={`h-5 w-5 shrink-0 rounded-lg flex items-center justify-center border transition-all ${
                          isDone
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-border bg-background"
                        }`}
                      >
                        {isDone && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-bold ${
                          isDone
                            ? "text-emerald-800 dark:text-emerald-300"
                            : "text-foreground"
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {items.length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center pb-2">
                Esta imagen es solo de referencia. No requiere verificación por
                ítems.
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface TaskVisualRefsProps {
  task: ChecklistTask;
}

/**
 * Row of ONPE reference screenshots attached to a checklist task.
 * Renders nothing when the task has no visualRefs (no layout cost).
 */
export function TaskVisualRefs({ task }: TaskVisualRefsProps) {
  const refs = task.visualRefs ?? [];
  if (refs.length === 0) return null;

  return (
    <div className="mt-2.5 rounded-xl bg-muted/20 border border-border/50 p-2.5 space-y-1.5">
      <p className="text-[9.5px] font-mono uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1.5">
        <ImageIcon className="h-3 w-3 text-brand" />
        <span>Material de referencia ONPE</span>
      </p>
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {refs.map((ref_) => (
          <VisualRefSheet
            key={ref_.src}
            ref_={ref_}
            totalItemsInTask={refs.reduce(
              (acc, r) => acc + (r.items?.length ?? 0),
              0,
            )}
          />
        ))}
      </div>
    </div>
  );
}
