"use client";

import { CandidateCard } from "@/interfaces/candidate";
import { Heart, Info, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

interface Props {
  candidate: CandidateCard;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onPress: (candidateId: string) => void;
  isTop: boolean;
}

const SWIPE_THRESHOLD = 80;

export const SwipeCard = ({
  candidate,
  onSwipeLeft,
  onSwipeRight,
  onPress,
  isTop,
}: Props) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef<boolean | null>(null);

  const rotation = Math.min(Math.max(dragX * 0.08, -12), 12);
  const likeOpacity = Math.min(dragX / SWIPE_THRESHOLD, 1);
  const nopeOpacity = Math.min(-dragX / SWIPE_THRESHOLD, 1);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isTop) return;
      startX.current = e.clientX;
      startY.current = e.clientY;
      isScrolling.current = null;
      setIsDragging(true);
      cardRef.current?.setPointerCapture(e.pointerId);
    },
    [isTop],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;
      if (isScrolling.current === null) {
        isScrolling.current = Math.abs(dy) > Math.abs(dx);
      }
      if (isScrolling.current) return;
      setDragX(dx);
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (!isScrolling.current) {
      if (dragX > SWIPE_THRESHOLD) {
        setIsSwiping(true);
        setTimeout(onSwipeRight, 200);
        return;
      } else if (dragX < -SWIPE_THRESHOLD) {
        setIsSwiping(true);
        setTimeout(onSwipeLeft, 200);
        return;
      }
    }
    setDragX(0);
    isScrolling.current = null;
  }, [isDragging, dragX, onSwipeRight, onSwipeLeft]);

  const handleClick = useCallback(
    (_e: React.MouseEvent) => {
      if (Math.abs(dragX) < 5) onPress(candidate.id);
    },
    [dragX, onPress, candidate.id],
  );

  const swipeOutX = dragX > 0 ? "120vw" : "-120vw";

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
      className="relative bg-card rounded-3xl border border-border shadow-lg overflow-hidden select-none w-full"
      style={{
        maxWidth: "min(340px, 90vw)",
        cursor: isDragging ? "grabbing" : "grab",
        transform: isSwiping
          ? `translateX(${swipeOutX}) rotate(${rotation}deg)`
          : `translateX(${dragX}px) rotate(${rotation}deg)`,
        transition: isDragging ? "none" : "transform 0.3s ease",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      {/* ── Zona imagen: 3 columnas (logo | foto | número) ── */}
      <div className="flex items-center bg-muted/20 px-3 pt-3 pb-2 gap-3">
        {/* Columna izquierda — logo del partido */}
        <div className="w-12 shrink-0 flex items-center justify-center">
          {candidate.political_party?.logo_url ? (
            <div className="bg-white rounded-xl p-1.5 shadow border border-border/40">
              <Image
                src={candidate.political_party.logo_url}
                alt={candidate.political_party.name ?? "Partido"}
                width={36}
                height={36}
                className="object-contain"
                draggable={false}
              />
            </div>
          ) : null}
        </div>

        {/* Imagen centrada — proporción vertical tipo carnet */}
        <div
          className="flex-1 relative rounded-2xl overflow-hidden bg-muted"
          style={{ height: 230 }}
        >
          {candidate.person.image_candidate_url ? (
            <Image
              src={candidate.person.image_candidate_url}
              alt={candidate.person.fullname}
              fill
              className="object-contain pointer-events-none"
              draggable={false}
              sizes="220px"
            />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}

          {/* Gradiente inferior */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Badge ME GUSTA */}
          <div
            className="absolute top-2 right-2 bg-success rounded-xl px-3 py-1.5 border-[3px] border-success rotate-12 z-10"
            style={{ opacity: likeOpacity }}
          >
            <span className="text-white font-black text-sm">ME GUSTA</span>
          </div>

          {/* Badge DESCARTO */}
          <div
            className="absolute top-2 left-2 bg-destructive rounded-xl px-3 py-1.5 border-[3px] border-destructive -rotate-12 z-10"
            style={{ opacity: nopeOpacity }}
          >
            <span className="text-white font-black text-sm">DESCARTO</span>
          </div>
        </div>

        {/* Columna derecha — número de lista */}
        <div className="w-12 shrink-0 flex items-center justify-center">
          {candidate.list_number ? (
            <div className="bg-primary rounded-xl w-12 h-12 flex items-center justify-center shadow">
              <span className="text-white font-black text-xl leading-none">
                {candidate.list_number}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Nombre + botón info ── */}
      <div className="px-4 py-3 flex items-center gap-3 bg-card">
        <p className="text-foreground text-base font-black leading-tight flex-1">
          {candidate.person.fullname}
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPress(candidate.id);
          }}
          className="bg-muted rounded-full p-2 hover:bg-muted/70 transition-colors shrink-0"
        >
          <Info size={16} className="text-muted-foreground" />
        </button>
      </div>

      {/* ── Instrucciones swipe ── */}
      <div className="flex items-center justify-center gap-4 px-4 py-2.5 border-t border-border bg-card">
        <div className="flex items-center gap-1.5">
          <div className="bg-destructive/15 rounded-full p-1.5">
            <X size={12} className="text-destructive" />
          </div>
          <span className="text-muted-foreground text-xs">Izquierda</span>
        </div>
        <span className="text-border text-xs">|</span>
        <div className="flex items-center gap-1.5">
          <div className="bg-success/15 rounded-full p-1.5">
            <Heart size={12} className="text-success" />
          </div>
          <span className="text-muted-foreground text-xs">Derecha</span>
        </div>
      </div>
    </div>
  );
};
