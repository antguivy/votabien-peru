"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ImageIcon, ArrowRight, Layers, Sparkles } from "lucide-react";
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { useCopilotoStore } from "../_lib/store";
import { ChecklistTask, VisualImage, VisualRef } from "../_lib/types";
import {
  getTaskVisualItemKey,
  getTaskVisualRequiredKeys,
} from "../_lib/constants";

/* ── Feed: compact thumbnail card for a package or inspection unit ── */

interface FeedVisualCardProps {
  task: ChecklistTask;
  ref_: VisualRef;
  onOpen: () => void;
}

function FeedVisualCard({ task, ref_, onOpen }: FeedVisualCardProps) {
  const completedVisualRefs = useCopilotoStore((s) => s.completedVisualRefs);
  const toggleVisualRef = useCopilotoStore((s) => s.toggleVisualRef);

  const coverImage = ref_.images[0];
  const totalCount = ref_.images.length;
  const isSingle = totalCount === 1;

  // Single-item key vs multi-item progress
  const singleKey = coverImage
    ? getTaskVisualItemKey(task.id, coverImage.src)
    : "";
  const isSingleDone = isSingle && !!completedVisualRefs[singleKey];

  // For multi-item package: count completed items
  const doneCount = ref_.images.filter(
    (img) => !!completedVisualRefs[getTaskVisualItemKey(task.id, img.src)],
  ).length;
  const requiredCount = ref_.images.filter((img) => !img.isOptional).length;
  const isPackageComplete = doneCount >= requiredCount && requiredCount > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className={`group relative rounded-xl border overflow-hidden shadow-2xs transition-all select-none ${
        isPackageComplete || isSingleDone
          ? "border-emerald-600/40 bg-emerald-500/5"
          : "border-border/80 bg-zinc-50 dark:bg-zinc-900/40 hover:border-brand/40"
      }`}
    >
      {/* Click image / body → open full-height inspection drawer */}
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        aria-label={`Abrir fotos de: ${ref_.title}`}
      >
        <div className="aspect-[16/10] w-full flex items-center justify-center p-1.5 bg-muted/20 relative">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage.src}
              alt={coverImage.alt}
              className="w-full h-full object-contain select-none transition-transform group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center text-muted-foreground">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}

          {/* Badge indicating multiple reference photos / progress */}
          {!isSingle && (
            <span
              className={`absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold shadow-2xs border ${
                isPackageComplete
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : doneCount > 0
                    ? "bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40 backdrop-blur-xs"
                    : "bg-background/90 text-foreground border-border backdrop-blur-xs"
              }`}
            >
              <Layers className="h-2.5 w-2.5" />
              <span>
                {doneCount > 0
                  ? `${doneCount}/${totalCount} listos`
                  : `${totalCount} fotos`}
              </span>
            </span>
          )}
        </div>

        <div className="px-2 py-1.5 bg-background/90 backdrop-blur-xs border-t border-border/60">
          <p className="text-[10px] sm:text-[11px] font-bold text-foreground truncate">
            {ref_.title}
          </p>
        </div>
      </button>

      {/* Check button:
          - If single photo: toggle directly right from feed
          - If multi-photo: opens drawer to inspect and check item-by-item */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (isSingle) {
            toggleVisualRef(singleKey);
          } else {
            onOpen();
          }
        }}
        aria-label={
          isSingle
            ? `Marcar verificado: ${ref_.title}`
            : `Abrir verificación de: ${ref_.title}`
        }
        className={`absolute top-1.5 right-1.5 h-7 w-7 rounded-full border shadow-xs flex items-center justify-center hover:scale-110 active:scale-90 transition-all ${
          isSingleDone || isPackageComplete
            ? "bg-emerald-600 border-emerald-600 text-white"
            : "bg-background/95 dark:bg-zinc-800/95 border-border/90 hover:border-emerald-500"
        }`}
      >
        <Check
          className={`h-3.5 w-3.5 transition-colors ${
            isSingleDone || isPackageComplete
              ? "text-white stroke-[3]"
              : "text-zinc-400 dark:text-zinc-500"
          }`}
          strokeWidth={isSingleDone || isPackageComplete ? 3 : 2.5}
        />
      </button>
    </motion.div>
  );
}

/* ── Drawer: clean editorial step item without nested card borders ── */

interface DrawerStepItemProps {
  task: ChecklistTask;
  image: VisualImage;
  stepNumber: number;
}

function DrawerStepItem({ task, image, stepNumber }: DrawerStepItemProps) {
  const completedVisualRefs = useCopilotoStore((s) => s.completedVisualRefs);
  const toggleVisualRef = useCopilotoStore((s) => s.toggleVisualRef);

  const key = getTaskVisualItemKey(task.id, image.src);
  const isDone = !!completedVisualRefs[key];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={`space-y-3 pb-6 border-b border-border/50 last:border-b-0 ${
        isDone ? "opacity-75" : ""
      }`}
    >
      {/* Step Action Bar: Step number badge + Caption + Optional badge + Verify Button */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {/* Step number badge (01, 02...) */}
          <span
            className={`shrink-0 inline-flex items-center justify-center h-6 px-2 rounded-md font-mono text-[11px] font-black tracking-wider ${
              isDone
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-600/30"
                : "bg-muted text-foreground border border-border"
            }`}
          >
            {String(stepNumber).padStart(2, "0")}
          </span>

          <div className="min-w-0 space-y-1">
            <p
              className={`text-xs sm:text-sm font-bold leading-snug ${
                isDone
                  ? "line-through text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              {image.caption}
            </p>

            {image.isOptional && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                <span>{image.optionalBadge ?? "Solo si aplica"}</span>
              </span>
            )}
          </div>
        </div>

        {/* Verify button right at the top next to step title */}
        <button
          type="button"
          onClick={() => toggleVisualRef(key)}
          className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all active:scale-95 border shadow-2xs ${
            isDone
              ? "bg-emerald-600 text-white border-emerald-600"
              : "bg-background hover:bg-muted text-foreground border-border hover:border-zinc-400"
          }`}
        >
          <div
            className={`h-4 w-4 rounded-full flex items-center justify-center border transition-colors ${
              isDone
                ? "border-white bg-white/20"
                : "border-zinc-400 dark:border-zinc-500 bg-muted/60"
            }`}
          >
            <Check
              className={`h-2.5 w-2.5 ${
                isDone
                  ? "text-white stroke-[3]"
                  : "text-zinc-500 dark:text-zinc-400 stroke-[2.5]"
              }`}
            />
          </div>
          <span>{isDone ? "Listo" : "Marcar ✓"}</span>
        </button>
      </div>

      {/* Clean uncropped image container without nested card borders */}
      <div
        className={`w-full rounded-2xl overflow-hidden bg-zinc-100/80 dark:bg-zinc-900/60 p-2 sm:p-3 flex items-center justify-center min-h-[160px] border transition-colors ${
          isDone ? "border-emerald-600/20" : "border-border/60"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          alt={image.alt}
          className="w-full h-auto max-h-[44vh] object-contain select-none"
          loading="eager"
        />
      </div>
    </motion.div>
  );
}

/* ── Full-height inspection drawer with clean editorial sections ── */

interface TaskVisualDrawerProps {
  task: ChecklistTask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function TaskVisualDrawer({ task, open, onOpenChange }: TaskVisualDrawerProps) {
  const completedVisualRefs = useCopilotoStore((s) => s.completedVisualRefs);
  const [activeTab, setActiveTab] = useState<"pending" | "done">("pending");

  const refs = task.visualRefs ?? [];

  // Grouped structure: each ref has its images
  let globalStepCounter = 0;
  const groupedData = refs.map((ref_) => {
    const items = ref_.images.map((image) => {
      globalStepCounter++;
      const key = getTaskVisualItemKey(task.id, image.src);
      return {
        key,
        ref_,
        image,
        stepNumber: globalStepCounter,
        isDone: !!completedVisualRefs[key],
      };
    });

    const refDoneCount = items.filter((it) => it.isDone).length;
    return {
      ref_,
      items,
      refDoneCount,
      totalCount: items.length,
    };
  });

  const allItems = groupedData.flatMap((g) => g.items);
  const pending = allItems.filter((it) => !it.isDone);
  const done = allItems.filter((it) => it.isDone);
  const requiredPending = pending.filter((it) => !it.image.isOptional);

  // Tabs appear ONLY after the user verifies at least 1 image
  const showTabs = done.length > 0;
  const currentTab = showTabs ? activeTab : "pending";

  const hasMultipleRefs = refs.length > 1;

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent
        noScroll
        className="!max-h-[94dvh] !h-[92dvh] !mt-2 sm:max-w-2xl flex flex-col p-0 overflow-hidden rounded-t-2xl"
      >
        {/* Static Header */}
        <CredenzaHeader className="px-4 sm:px-6 pt-3 pb-2.5 border-b border-border/60 shrink-0 text-left space-y-1">
          <div className="flex items-center justify-between gap-2">
            <CredenzaTitle className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-brand shrink-0" />
              <span>{task.title.replace(/^\d+\.\s*/, "")}</span>
            </CredenzaTitle>

            <span
              className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                requiredPending.length === 0
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-600/30"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {done.length}/{allItems.length} verificados
            </span>
          </div>

          <CredenzaDescription className="text-xs text-muted-foreground leading-relaxed">
            {task.description}
          </CredenzaDescription>
        </CredenzaHeader>

        {/* Scrollable inspection body with clean editorial dividers */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
          {/* Tabs appear ONLY after the user verifies at least 1 image */}
          {showTabs && (
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-muted/50 border border-border/60 sticky top-0 z-10 backdrop-blur-sm bg-background/95">
              <button
                type="button"
                onClick={() => setActiveTab("pending")}
                className={`py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                  currentTab === "pending"
                    ? "bg-background text-foreground shadow-xs border border-border/70"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pendientes ({pending.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("done")}
                className={`py-1.5 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  currentTab === "done"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Realizadas ({done.length})</span>
                <Check className="h-3 w-3 stroke-[3]" />
              </button>
            </div>
          )}

          {/* Pending items list */}
          {currentTab === "pending" && (
            <div className="space-y-6">
              {groupedData.map((group) => {
                const groupPending = group.items.filter((it) => !it.isDone);
                if (groupPending.length === 0) return null;

                return (
                  <div key={group.ref_.id} className="space-y-4">
                    {/* Package Section Header: rendered ONCE per ref only if multiple refs exist */}
                    {hasMultipleRefs && (
                      <div className="pt-2 pb-1 border-b border-border/70 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-brand" />
                          <h3 className="text-xs sm:text-sm font-black text-foreground uppercase tracking-wide font-mono">
                            {group.ref_.title}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground">
                          {group.refDoneCount}/{group.totalCount} listos
                        </span>
                      </div>
                    )}

                    {/* Steps list */}
                    <div className="space-y-5">
                      <AnimatePresence mode="popLayout" initial={false}>
                        {groupPending.map((it) => (
                          <DrawerStepItem
                            key={it.key}
                            task={task}
                            image={it.image}
                            stepNumber={it.stepNumber}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}

              {/* All required completed celebration */}
              {requiredPending.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 text-center space-y-3"
                >
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <Check className="h-6 w-6 stroke-[3]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      ¡Todos los materiales obligatorios verificados!
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      La tarea se ha marcado automáticamente en tu lista.
                    </p>
                  </div>
                  {done.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("done")}
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-brand hover:underline pt-2"
                    >
                      <span>Ver {done.length} pasos realizados</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {/* Done items list */}
          {currentTab === "done" && (
            <div className="space-y-6">
              {groupedData.map((group) => {
                const groupDone = group.items.filter((it) => it.isDone);
                if (groupDone.length === 0) return null;

                return (
                  <div key={group.ref_.id} className="space-y-4">
                    {hasMultipleRefs && (
                      <div className="pt-2 pb-1 border-b border-border/70 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-600" />
                          <h3 className="text-xs sm:text-sm font-black text-foreground uppercase tracking-wide font-mono">
                            {group.ref_.title}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {groupDone.length}/{group.totalCount} listos
                        </span>
                      </div>
                    )}

                    <div className="space-y-5">
                      <AnimatePresence mode="popLayout" initial={false}>
                        {groupDone.map((it) => (
                          <DrawerStepItem
                            key={it.key}
                            task={task}
                            image={it.image}
                            stepNumber={it.stepNumber}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CredenzaContent>
    </Credenza>
  );
}

/* ── Public entrypoint for TabChecklist ── */

interface TaskVisualRefsProps {
  task: ChecklistTask;
}

export function TaskVisualRefs({ task }: TaskVisualRefsProps) {
  const refs = task.visualRefs ?? [];
  const completedVisualRefs = useCopilotoStore((s) => s.completedVisualRefs);
  const [open, setOpen] = useState(false);

  if (refs.length === 0) return null;

  // Check required keys across all refs in this task
  const requiredKeys = getTaskVisualRequiredKeys(task);
  const isTaskVisuallyComplete =
    requiredKeys.length > 0 &&
    requiredKeys.every((key) => !!completedVisualRefs[key]);

  // Count total items
  const totalItems = refs.reduce((acc, r) => acc + r.images.length, 0);
  const doneItems = refs.reduce(
    (acc, r) =>
      acc +
      r.images.filter(
        (img) => !!completedVisualRefs[getTaskVisualItemKey(task.id, img.src)],
      ).length,
    0,
  );

  return (
    <div className="mt-2.5 space-y-2 select-none">
      {/* Feed thumbnail grid for each package (max 3 visible) */}
      {!isTaskVisuallyComplete && (
        <div
          className={`grid gap-2 ${
            refs.length === 1
              ? "grid-cols-1 sm:max-w-xs"
              : refs.length === 2
                ? "grid-cols-2 sm:max-w-md"
                : "grid-cols-3"
          }`}
        >
          {refs.map((ref_) => (
            <FeedVisualCard
              key={ref_.id}
              task={task}
              ref_={ref_}
              onOpen={() => setOpen(true)}
            />
          ))}
        </div>
      )}

      {/* Clean status pill when all required materials are verified */}
      {isTaskVisuallyComplete && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold hover:bg-emerald-500/15 transition-all shadow-2xs active:scale-95"
        >
          <Check className="h-3.5 w-3.5 stroke-[3]" />
          <span>
            {doneItems}/{totalItems} fotos verificadas
          </span>
          <span className="text-[10px] font-sans font-normal text-muted-foreground underline ml-1">
            Ver fotos
          </span>
        </button>
      )}

      {/* Full-height drawer for granular item-by-item verification */}
      <TaskVisualDrawer task={task} open={open} onOpenChange={setOpen} />
    </div>
  );
}
