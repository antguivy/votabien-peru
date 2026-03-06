"use client";

// components/game/LevelModal.tsx

import { GameLevel } from "@/interfaces/game-types";
import { HelpCircle, Play, Star, Trophy, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface LevelModalProps {
  visible: boolean;
  level: GameLevel | null;
  onClose: () => void;
  onPlay: () => void;
}

export function LevelModal({
  visible,
  level,
  onClose,
  onPlay,
}: LevelModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!visible || !level) return null;

  const isBoss = level.is_boss;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Card */}
      <div className="relative w-[85%] max-w-sm bg-card border-2 border-border rounded-3xl p-6 shadow-2xl">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-muted p-2 rounded-full hover:bg-muted/80 transition-colors"
        >
          <X size={20} className="text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div
            className={`px-4 py-1.5 rounded-full mb-4 border ${
              isBoss
                ? "bg-destructive/20 border-destructive"
                : "bg-amber-500/10 border-amber-500/30"
            }`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-[2px] ${
                isBoss ? "text-destructive" : "text-amber-600"
              }`}
            >
              {isBoss ? "NIVEL JEFE" : `NIVEL ${level.id}`}
            </span>
          </div>
          <h2 className="text-foreground text-2xl font-black text-center leading-7">
            {level.title}
          </h2>
        </div>

        {/* Stars (if already played) */}
        {level.stars > 0 && (
          <div className="flex justify-center gap-1 mb-6">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                size={24}
                fill={s <= level.stars ? "#eab308" : "transparent"}
                color={s <= level.stars ? "#eab308" : "#71717a"}
              />
            ))}
          </div>
        )}

        {/* Description */}
        <div className="bg-muted p-5 rounded-2xl mb-8 border border-border/50">
          <p className="text-muted-foreground text-center font-medium italic text-sm leading-5">
            ❝{level.description}❞
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-4 mb-8">
          <div className="flex flex-col items-center bg-background border border-border rounded-xl p-3 flex-1">
            <Trophy size={18} className="text-yellow-500 mb-1" />
            <span className="text-[10px] text-muted-foreground font-bold uppercase">
              Recompensa
            </span>
            <span className="text-base font-black text-foreground">
              +100 XP
            </span>
          </div>
          <div className="flex flex-col items-center bg-background border border-border rounded-xl p-3 flex-1">
            <HelpCircle size={18} className="text-blue-500 mb-1" />
            <span className="text-[10px] text-muted-foreground font-bold uppercase">
              Preguntas
            </span>
            <span className="text-base font-black text-foreground">
              {level.questions.length}
            </span>
          </div>
        </div>

        {/* Play button */}
        <button
          type="button"
          onClick={onPlay}
          className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-white text-lg uppercase tracking-wider transition-opacity hover:opacity-90 ${
            isBoss ? "bg-destructive" : "bg-amber-500"
          }`}
        >
          <Play fill="white" color="white" size={20} />
          {level.stars > 0 ? "REPETIR" : "JUGAR"}
        </button>
      </div>
    </div>
  );
}
