"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ImageIcon } from "lucide-react";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { useCopilotoStore } from "../_lib/store";
import { ChecklistTask, VisualRef } from "../_lib/types";
import { getTaskVisualKey } from "../_lib/constants";

/* ── Check card: one image = one checkable item ── */

interface VisualCheckCardProps {
  task: ChecklistTask;
  ref_: VisualRef;
  /** Tap on the image body (feed: opens gallery; gallery: toggles check) */
  onImageClick: () => void;
  large?: boolean;
  /** Motion layoutId for FLIP animation between tab groups (gallery only) */
  layoutId?: string;
}

function VisualCheckCard({
  task,
  ref_,
  onImageClick,
  large,
  layoutId,
}: VisualCheckCardProps) {
  const completedVisualRefs = useCopilotoStore((s) => s.completedVisualRefs);
  const toggleVisualRef = useCopilotoStore((s) => s.toggleVisualRef);

  const key = getTaskVisualKey(task.id, ref_.src);
  const isDone = !!completedVisualRefs[key];

  const thumbClasses = large ? "h-36 sm:h-44" : "h-20 sm:h-24";

  return (
    <motion.div
      layout
      layoutId={layoutId}
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.16 } }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="relative"
    >
      {/* Image body */}
      <button
        type="button"
        onClick={onImageClick}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-xl group"
        aria-label={`Referencia visual: ${ref_.caption}`}
      >
        <div
          className={`${thumbClasses} w-full rounded-xl overflow-hidden border-2 bg-muted/30 transition-all group-active:scale-[0.98] ${
            isDone
              ? "border-emerald-600/50"
              : "border-border/80 group-hover:border-brand/50"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ref_.src}
            alt={ref_.alt}
            className="h-full w-full object-cover object-top"
            loading="lazy"
          />
        </div>
        <p
          className={`mt-1 text-[9.5px] sm:text-[10px] font-mono font-bold leading-tight line-clamp-1 ${
            isDone
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-muted-foreground"
          }`}
        >
          {ref_.caption}
        </p>
      </button>

      {/* Check control → verifies this image */}
      <button
        type="button"
        onClick={() => toggleVisualRef(key)}
        aria-pressed={isDone}
        aria-label={
          isDone ? `Desmarcar ${ref_.caption}` : `Verificar ${ref_.caption}`
        }
        className={`absolute top-1.5 right-1.5 h-6 w-6 rounded-full flex items-center justify-center border-2 shadow-sm transition-all active:scale-90 ${
          isDone
            ? "bg-emerald-600 border-emerald-600 text-white"
            : "bg-background/90 backdrop-blur border-border hover:border-emerald-500"
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDone && (
            <motion.span
              key="check"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}

/* ── Gallery credenza: description + Pendiente/Realizado groups ── */

function TaskVisualGallery({
  task,
  open,
  onOpenChange,
}: {
  task: ChecklistTask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const completedVisualRefs = useCopilotoStore((s) => s.completedVisualRefs);
  const toggleVisualRef = useCopilotoStore((s) => s.toggleVisualRef);

  const refs = task.visualRefs ?? [];
  const entries = refs.map((ref_) => {
    const key = getTaskVisualKey(task.id, ref_.src);
    return { ref_, key, isDone: !!completedVisualRefs[key] };
  });
  const pending = entries.filter((e) => !e.isDone);
  const done = entries.filter((e) => e.isDone);
  const showGroups = done.length > 0;

  const renderCard = (e: (typeof entries)[number]) => (
    <VisualCheckCard
      key={e.key}
      task={task}
      ref_={e.ref_}
      large
      layoutId={`gallery-${e.key}`}
      onImageClick={() => toggleVisualRef(e.key)}
    />
  );

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-2xl p-0">
        <CredenzaHeader className="px-4 sm:px-6 pt-4 pb-3 border-b border-border/60 space-y-1">
          <CredenzaTitle className="text-sm sm:text-base font-black tracking-tight text-left flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-brand shrink-0" />
            {task.title.replace(/^\d+\.\s*/, "")}
          </CredenzaTitle>
          <CredenzaDescription className="text-[11px] sm:text-xs text-left leading-relaxed">
            {task.description}
          </CredenzaDescription>
        </CredenzaHeader>

        <CredenzaBody className="px-4 sm:px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Group headers appear only after the first image is verified */}
          {showGroups && (
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center py-1.5 text-[10px] font-mono font-black uppercase tracking-wider rounded-lg bg-background border border-border/70 shadow-xs text-muted-foreground">
                Pendientes ({pending.length})
              </div>
              <div className="text-center py-1.5 text-[10px] font-mono font-black uppercase tracking-wider rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-600/30">
                Realizadas ({done.length})
              </div>
            </div>
          )}

          {/* Pending — the next image rises as one above is verified */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {pending.map(renderCard)}
            </AnimatePresence>
            {showGroups && pending.length === 0 && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-emerald-700 dark:text-emerald-400 text-center font-mono font-bold py-6"
              >
                ✓ Todo verificado en esta tarea
              </motion.p>
            )}
          </div>

          {/* Done group */}
          {showGroups && (
            <div className="space-y-3 pt-3 border-t border-border/50">
              <AnimatePresence mode="popLayout" initial={false}>
                {done.map(renderCard)}
              </AnimatePresence>
            </div>
          )}

          {!showGroups && (
            <p className="text-[10.5px] text-muted-foreground text-center font-mono pb-1">
              Compara el material físico con cada imagen y márcala con el ✓
            </p>
          )}
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}

/* ── Inline visual checklist inside the task card ── */

interface TaskVisualRefsProps {
  task: ChecklistTask;
}

export function TaskVisualRefs({ task }: TaskVisualRefsProps) {
  const refs = task.visualRefs ?? [];
  const [open, setOpen] = useState(false);
  if (refs.length === 0) return null;

  return (
    <div className="mt-2.5 rounded-xl bg-muted/20 border border-border/50 p-2.5 space-y-2">
      <p className="text-[9.5px] font-mono uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1.5">
        <ImageIcon className="h-3 w-3 text-brand" />
        <span>Checklist visual — toca la imagen para verla grande</span>
      </p>

      {/* Feed row: tap image → gallery, tap ✓ → verify */}
      <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2.5">
        {refs.map((ref_) => (
          <VisualCheckCard
            key={ref_.src}
            task={task}
            ref_={ref_}
            onImageClick={() => setOpen(true)}
          />
        ))}
      </div>

      <TaskVisualGallery task={task} open={open} onOpenChange={setOpen} />
    </div>
  );
}
