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
    (e: React.MouseEvent) => {
      if (Math.abs(dragX) < 5) {
        onPress(candidate.id);
      }
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
      className="relative bg-card rounded-3xl border border-border shadow-lg overflow-hidden select-none"
      style={{
        width: "min(320px, 85vw)",
        cursor: isDragging ? "grabbing" : "grab",
        transform: isSwiping
          ? `translateX(${swipeOutX}) rotate(${rotation}deg)`
          : `translateX(${dragX}px) rotate(${rotation}deg)`,
        transition: isDragging ? "none" : "transform 0.3s ease",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      {/* Imagen del candidato */}
      <div className="relative w-full" style={{ aspectRatio: "3/4" }}>
        {candidate.person.image_candidate_url && (
          <Image
            src={candidate.person.image_candidate_url}
            alt={candidate.person.fullname}
            fill
            className="object-cover pointer-events-none"
            draggable={false}
            sizes="320px"
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Badge ME GUSTA */}
        <div
          className="absolute top-6 right-6 bg-success rounded-2xl px-6 py-3 border-4 border-success rotate-12 z-10"
          style={{ opacity: likeOpacity }}
        >
          <span className="text-white font-black text-2xl">ME GUSTA</span>
        </div>

        {/* Badge DESCARTO */}
        <div
          className="absolute top-6 left-6 bg-destructive rounded-2xl px-6 py-3 border-4 border-destructive -rotate-12 z-10"
          style={{ opacity: nopeOpacity }}
        >
          <span className="text-white font-black text-2xl">DESCARTO</span>
        </div>

        {/* Partido + Número de lista */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
          {candidate.political_party?.logo_url && (
            <div className="bg-white rounded-xl p-2 shadow-lg">
              <Image
                src={candidate.political_party.logo_url}
                alt={candidate.political_party.name ?? "Partido"}
                width={48}
                height={48}
                className="object-contain"
                draggable={false}
              />
            </div>
          )}
          {candidate.list_number && (
            <div className="bg-primary rounded-xl px-4 py-2 shadow-lg ml-auto">
              <span className="text-white font-black text-2xl">
                {candidate.list_number}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Cuerpo: nombre + botón info */}
      <div className="px-5 pt-4 pb-1 bg-card">
        <div className="flex items-start justify-between gap-3">
          <p className="text-foreground text-xl font-black leading-tight flex-1">
            {candidate.person.fullname}
          </p>

          {/* Botón "Ver perfil" — independiente del swipe */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPress(candidate.id);
            }}
            className="bg-muted rounded-full p-2.5 mt-0.5 hover:bg-muted/70 transition-colors shrink-0"
          >
            <Info size={18} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Instrucciones de swipe */}
      <div className="flex items-center justify-center gap-4 px-5 py-4 border-t border-border bg-card mt-3">
        <div className="flex items-center gap-2">
          <div className="bg-destructive/20 rounded-full p-2">
            <X size={16} className="text-destructive" />
          </div>
          <span className="text-muted-foreground text-xs">
            Desliza izquierda
          </span>
        </div>
        <span className="text-muted-foreground">•</span>
        <div className="flex items-center gap-2">
          <div className="bg-success/20 rounded-full p-2">
            <Heart size={16} className="text-success" />
          </div>
          <span className="text-muted-foreground text-xs">Desliza derecha</span>
        </div>
      </div>
    </div>
  );
};
