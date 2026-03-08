"use client";

import { CandidateCard } from "@/interfaces/candidate";
import { ThumbsDown, ThumbsUp, Info } from "lucide-react";
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
  const didDrag = useRef(false);

  const rotation = Math.min(Math.max(dragX * 0.08, -12), 12);
  const likeOpacity = Math.min(dragX / SWIPE_THRESHOLD, 1);
  const nopeOpacity = Math.min(-dragX / SWIPE_THRESHOLD, 1);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isTop) return;
      startX.current = e.clientX;
      startY.current = e.clientY;
      isScrolling.current = null;
      didDrag.current = false;
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
      if (Math.abs(dx) > 5) didDrag.current = true;
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

  const handleCardClick = useCallback(() => {
    if (!didDrag.current) {
      onPress(candidate.id);
    }
  }, [onPress, candidate.id]);

  const swipeOutX = dragX > 0 ? "120vw" : "-120vw";

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {/* ── Card ── */}
      <div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleCardClick}
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
        {/* ── Image zone ── */}
        <div className="flex items-center bg-muted/20 px-3 pt-3 pb-2 gap-3">
          {/* Party logo */}
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

          {/* Candidate photo — clamp: 130px floor for iPhone SE, 230px ceiling */}
          <div
            className="flex-1 relative rounded-2xl overflow-hidden bg-muted"
            style={{ height: "clamp(130px, 28vh, 230px)" }}
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

            {/* Bottom gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* ME GUSTA badge */}
            <div
              className="absolute top-2 right-2 bg-success rounded-xl px-3 py-1.5 border-[3px] border-success rotate-12 z-10"
              style={{ opacity: likeOpacity }}
            >
              <span className="text-white font-black text-sm">ME GUSTA</span>
            </div>

            {/* NO ME GUSTA badge */}
            <div
              className="absolute top-2 left-2 bg-destructive rounded-xl px-3 py-1.5 border-[3px] border-destructive -rotate-12 z-10"
              style={{ opacity: nopeOpacity }}
            >
              <span className="text-white font-black text-sm">NO ME GUSTA</span>
            </div>
          </div>

          {/* List number */}
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

        {/* ── Name + tap hint ── */}
        <div className="px-4 py-2 bg-card">
          <p className="text-foreground text-sm font-black leading-tight text-center">
            {candidate.person.fullname}
          </p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Info size={11} className="text-primary/60" />
            <span className="text-primary/60 text-[10px] font-semibold">
              Toca para ver su perfil
            </span>
          </div>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div
        className="flex items-center justify-center gap-6 mt-2"
        style={{ maxWidth: "min(340px, 90vw)", width: "100%" }}
      >
        {/* No me gusta */}
        <button
          type="button"
          disabled={!isTop}
          onClick={(e) => {
            e.stopPropagation();
            onSwipeLeft();
          }}
          className="flex flex-row items-center gap-1.5 group disabled:opacity-40"
        >
          <span className="text-destructive text-xs font-bold uppercase tracking-wide">
            No me gusta
          </span>
          <div className="w-11 h-11 rounded-2xl bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center transition-all group-hover:bg-destructive/20 group-active:scale-90 group-hover:border-destructive/60">
            <ThumbsDown
              size={18}
              className="text-destructive transition-transform group-active:scale-90"
            />
          </div>
        </button>

        {/* Me gusta */}
        <button
          type="button"
          disabled={!isTop}
          onClick={(e) => {
            e.stopPropagation();
            onSwipeRight();
          }}
          className="flex flex-row items-center gap-1.5 group disabled:opacity-40"
        >
          <div className="w-11 h-11 rounded-2xl bg-success/10 border-2 border-success/30 flex items-center justify-center transition-all group-hover:bg-success/20 group-active:scale-90 group-hover:border-success/60">
            <ThumbsUp
              size={18}
              className="text-success transition-transform group-active:scale-90"
            />
          </div>
          <span className="text-success text-xs font-bold uppercase tracking-wide">
            Me gusta
          </span>
        </button>
      </div>
    </div>
  );
};
