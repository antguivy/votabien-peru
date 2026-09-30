"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ImageIcon,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { useCopilotoStore } from "../_lib/store";
import { ChecklistTask, VisualRef } from "../_lib/types";
import { getTaskVisualKey } from "../_lib/constants";

/* ── Feed: compact thumbnail card for a pending material unit ── */

interface FeedVisualCardProps {
  task: ChecklistTask;
  ref_: VisualRef;
  onOpen: () => void;
}

function FeedVisualCard({ task, ref_, onOpen }: FeedVisualCardProps) {
  const toggleVisualRef = useCopilotoStore((s) => s.toggleVisualRef);
  const key = getTaskVisualKey(task.id, ref_.id);
  const coverImage = ref_.images[0];
  const photoCount = ref_.images.length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className="group relative rounded-xl border border-border/80 bg-zinc-50 dark:bg-zinc-900/40 overflow-hidden shadow-2xs hover:border-brand/40 transition-colors select-none"
    >
      {/* Click image/body → open full-height inspection drawer */}
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        aria-label={`Ver material: ${ref_.title}`}
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

          {/* Badge indicating multiple reference photos */}
          {photoCount > 1 && (
            <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-background/90 backdrop-blur-xs border border-border text-[9px] font-mono font-bold text-foreground shadow-2xs">
              <Layers className="h-2.5 w-2.5 text-brand" />
              <span>{photoCount} fotos</span>
            </span>
          )}
        </div>

        <div className="px-2 py-1.5 bg-background/90 backdrop-blur-xs border-t border-border/60">
          <p className="text-[10px] sm:text-[11px] font-bold text-foreground truncate">
            {ref_.title}
          </p>
        </div>
      </button>

      {/* Check button with visible GRAY checkmark when pending */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleVisualRef(key);
        }}
        aria-label={`Marcar verificado: ${ref_.title}`}
        className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-background/95 dark:bg-zinc-800/95 border border-border/90 shadow-xs flex items-center justify-center hover:scale-110 active:scale-90 transition-all hover:border-emerald-500"
      >
        <Check
          className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 hover:text-emerald-600 transition-colors"
          strokeWidth={2.5}
        />
      </button>
    </motion.div>
  );
}

/* ── Drawer: full-inspection card with carousel support ── */

interface DrawerInspectionCardProps {
  task: ChecklistTask;
  ref_: VisualRef;
  isDone: boolean;
}

function DrawerInspectionCard({
  task,
  ref_,
  isDone,
}: DrawerInspectionCardProps) {
  const toggleVisualRef = useCopilotoStore((s) => s.toggleVisualRef);
  const key = getTaskVisualKey(task.id, ref_.id);
  const [slideIndex, setSlideIndex] = useState(0);

  const images = ref_.images;
  const currentImage = images[slideIndex] ?? images[0];
  const totalSlides = images.length;

  const nextSlide = () => {
    setSlideIndex((prev) => (prev + 1 < totalSlides ? prev + 1 : prev));
  };

  const prevSlide = () => {
    setSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
      className={`rounded-2xl border p-3 sm:p-4 space-y-3 transition-colors ${
        isDone
          ? "bg-emerald-500/5 border-emerald-600/30"
          : "bg-card border-border/80 shadow-xs"
      }`}
    >
      {/* Title & subtitle */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm sm:text-base font-bold text-foreground">
            {ref_.title}
          </h4>
          {ref_.description && (
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              {ref_.description}
            </p>
          )}
        </div>

        {totalSlides > 1 && (
          <span className="shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
            {slideIndex + 1} de {totalSlides}
          </span>
        )}
      </div>

      {/* 100% visible image viewer (object-contain with zero crop) */}
      <div className="relative w-full rounded-xl overflow-hidden border border-border/70 bg-zinc-100 dark:bg-zinc-900/60 p-2 sm:p-3 flex items-center justify-center min-h-[170px]">
        {currentImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={currentImage.src}
            src={currentImage.src}
            alt={currentImage.alt}
            className="w-full h-auto max-h-[42vh] object-contain select-none"
            loading="eager"
          />
        )}

        {/* Carousel controls if more than 1 image */}
        {totalSlides > 1 && (
          <>
            {slideIndex > 0 && (
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Foto anterior"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/90 dark:bg-zinc-800/90 border border-border shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            {slideIndex < totalSlides - 1 && (
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Foto siguiente"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/90 dark:bg-zinc-800/90 border border-border shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Slide dots and specific slide caption */}
      {totalSlides > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-0.5">
          {images.map((img, idx) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setSlideIndex(idx)}
              aria-label={`Ir a foto ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                slideIndex === idx
                  ? "w-6 bg-brand"
                  : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
              }`}
            />
          ))}
        </div>
      )}

      {/* Current photo caption */}
      {currentImage && currentImage.caption && (
        <div className="rounded-lg bg-muted/40 border border-border/50 px-2.5 py-1.5 text-xs text-foreground font-medium leading-relaxed flex items-start gap-2">
          <span className="text-[10px] font-mono font-bold text-brand uppercase tracking-wider shrink-0 mt-0.5">
            {totalSlides > 1 ? `Foto ${slideIndex + 1}:` : "Detalle:"}
          </span>
          <span className="text-muted-foreground">{currentImage.caption}</span>
        </div>
      )}

      {/* Control row with prominent verify button */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/40">
        <p className="text-[11px] text-muted-foreground font-mono">
          {isDone
            ? "✓ Material revisado y verificado"
            : "Verifica el contenido físico antes de marcar"}
        </p>

        <button
          type="button"
          onClick={() => toggleVisualRef(key)}
          className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all active:scale-95 border ${
            isDone
              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
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
          <span>{isDone ? "Verificado" : "Marcar ✓"}</span>
        </button>
      </div>
    </motion.div>
  );
}

/* ── Full-height inspection drawer with conditional tabs ── */

interface TaskVisualDrawerProps {
  task: ChecklistTask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function TaskVisualDrawer({ task, open, onOpenChange }: TaskVisualDrawerProps) {
  const completedVisualRefs = useCopilotoStore((s) => s.completedVisualRefs);
  const [activeTab, setActiveTab] = useState<"pending" | "done">("pending");

  const refs = task.visualRefs ?? [];
  const entries = refs.map((ref_) => {
    const key = getTaskVisualKey(task.id, ref_.id);
    return { ref_, key, isDone: !!completedVisualRefs[key] };
  });

  const pending = entries.filter((e) => !e.isDone);
  const done = entries.filter((e) => e.isDone);

  // Tabs are completely hidden when 0 items are verified (clean single-purpose view)
  const showTabs = done.length > 0;

  // Auto-switch back to pending tab if done items were all cleared
  const currentTab = showTabs ? activeTab : "pending";

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
                pending.length === 0
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-600/30"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {done.length}/{refs.length} listos
            </span>
          </div>

          <CredenzaDescription className="text-xs text-muted-foreground leading-relaxed">
            {task.description}
          </CredenzaDescription>
        </CredenzaHeader>

        {/* Scrollable inspection body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 space-y-4">
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

          {/* Pending items list: when an item is checked, next item rises smoothly from below */}
          {currentTab === "pending" && (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout" initial={false}>
                {pending.map((e) => (
                  <DrawerInspectionCard
                    key={e.key}
                    task={task}
                    ref_={e.ref_}
                    isDone={false}
                  />
                ))}
              </AnimatePresence>

              {/* All completed celebration */}
              {pending.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-10 text-center space-y-3"
                >
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <Check className="h-6 w-6 stroke-[3]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      ¡Todos los materiales verificados!
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
                      <span>Ver {done.length} materiales verificados</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {/* Done items list */}
          {currentTab === "done" && (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout" initial={false}>
                {done.map((e) => (
                  <DrawerInspectionCard
                    key={e.key}
                    task={task}
                    ref_={e.ref_}
                    isDone={true}
                  />
                ))}
              </AnimatePresence>
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

  const entries = refs.map((ref_) => {
    const key = getTaskVisualKey(task.id, ref_.id);
    return { ref_, key, isDone: !!completedVisualRefs[key] };
  });

  const pending = entries.filter((e) => !e.isDone);

  // Maximum 3 pending thumbnails shown in the feed (anti-clutter rule)
  const visiblePending = pending.slice(0, 3);
  const allCompleted = pending.length === 0;

  return (
    <div className="mt-2.5 space-y-2 select-none">
      {/* Feed thumbnail grid — shows ONLY pending items (max 3) */}
      {!allCompleted && (
        <div
          className={`grid gap-2 ${
            visiblePending.length === 1
              ? "grid-cols-1 sm:max-w-xs"
              : visiblePending.length === 2
                ? "grid-cols-2 sm:max-w-md"
                : "grid-cols-3"
          }`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {visiblePending.map((e) => (
              <FeedVisualCard
                key={e.key}
                task={task}
                ref_={e.ref_}
                onOpen={() => setOpen(true)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Clean status pill when all materials are verified */}
      {allCompleted && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold hover:bg-emerald-500/15 transition-all shadow-2xs active:scale-95"
        >
          <Check className="h-3.5 w-3.5 stroke-[3]" />
          <span>
            {refs.length}/{refs.length} materiales verificados
          </span>
          <span className="text-[10px] font-sans font-normal text-muted-foreground underline ml-1">
            Ver fotos
          </span>
        </button>
      )}

      {/* Full-height drawer for large-scale inspection */}
      <TaskVisualDrawer task={task} open={open} onOpenChange={setOpen} />
    </div>
  );
}
