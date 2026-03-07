"use client";

import Image from "next/image";
import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { HitoBasic } from "@/interfaces/hito";

const AUTOPLAY_INTERVAL = 6000;

export default function PhotoStory({ hitos }: { hitos: HitoBasic[] }) {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (transitioning || index === current) return;
      clearTimers();
      setTransitioning(true);
      setProgress(0);
      setTimeout(() => {
        setCurrent(index);
        setTransitioning(false);
      }, 600);
    },
    [transitioning, current, clearTimers],
  );

  const next = useCallback(() => {
    goTo((current + 1) % hitos.length);
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + hitos.length) % hitos.length);
  }, [current, goTo]);

  useEffect(() => {
    clearTimers();
    setProgress(0);
    const startTime = Date.now();

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / AUTOPLAY_INTERVAL) * 100, 100));
    }, 50);

    timeoutRef.current = setTimeout(next, AUTOPLAY_INTERVAL);

    return clearTimers;
  }, [current, next, clearTimers]);

  const moment = hitos[current];
  const nextMoment = hitos[(current + 1) % hitos.length];

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          MOBILE  (< md) — stack vertical, altura natural
      ═══════════════════════════════════════════════════ */}
      <section className="px-4 md:hidden flex flex-col w-full bg-background">
        {/* Imagen — aspect ratio fijo, sin altura forzada */}
        <div className="relative w-full aspect-video bg-background overflow-hidden">
          {hitos.map((m, i) => (
            <div
              key={m.id}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                opacity: i === current ? (transitioning ? 0 : 1) : 0,
                transform:
                  i === current
                    ? transitioning
                      ? "scale(1.03)"
                      : "scale(1)"
                    : "scale(1.03)",
                transition: "opacity 0.6s ease, transform 0.6s ease",
                pointerEvents: i === current ? "auto" : "none",
              }}
            >
              <Image
                src={m.photo_url || ""}
                alt={m.photo_description || ""}
                width={1200}
                height={1200}
                className="max-w-full max-h-full rounded-xl object-contain"
                priority={i === 0}
              />
            </div>
          ))}

          <div
            className="absolute inset-x-0 bottom-0 h-10 z-10 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, var(--background) 100%)",
            }}
          />
        </div>

        {/* Panel de texto — altura natural */}
        <div
          className="flex flex-col gap-5 pt-4 pb-8 bg-background"
          style={{
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? "translateY(8px)" : "translateY(0)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono text-brand font-bold">
              {moment.index}
            </span>
            <span className="w-6 h-px bg-brand/50" />
            <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
              {moment.photo_description}
            </span>
          </div>

          <blockquote className="text-lg font-semibold text-foreground leading-[1.45] tracking-tight">
            ❝{moment.quote}❞
          </blockquote>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {moment.date}
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="text-xs text-muted-foreground/60">
              {moment.location}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-1.5 flex-1">
              {hitos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Ir al momento ${i + 1}`}
                  className="relative h-[3px] rounded-full overflow-hidden bg-muted flex-1"
                >
                  <span
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full",
                      i === current ? "bg-brand" : "bg-muted-foreground/30",
                    )}
                    style={{
                      width:
                        i === current
                          ? `${progress}%`
                          : i < current
                            ? "100%"
                            : "0%",
                      transition: i === current ? "none" : "width 0.4s ease",
                    }}
                  />
                </button>
              ))}
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={prev}
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all duration-200"
                aria-label="Anterior"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M8.5 2.5L4 7l4.5 4.5" />
                </svg>
              </button>
              <button
                onClick={next}
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all duration-200"
                aria-label="Siguiente"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M5.5 2.5L10 7l-4.5 4.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          DESKTOP  (>= md) — split horizontal, altura natural
      ═══════════════════════════════════════════════════ */}
      <section className="hidden md:flex relative w-full bg-background py-8">
        {/* Panel izquierdo — ancho fijo, altura natural */}
        <div className="relative z-10 flex flex-col justify-between w-[42%] lg:w-[38%] px-10 py-8 flex-shrink-0 bg-background">
          <div
            className="flex flex-col gap-6"
            style={{
              opacity: transitioning ? 0 : 1,
              transform: transitioning ? "translateY(12px)" : "translateY(0)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-brand font-bold">
                {moment.index}
              </span>
              <span className="w-8 h-px bg-brand/50" />
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                {moment.photo_description}
              </span>
            </div>

            <blockquote className="text-2xl md:text-3xl lg:text-[2rem] font-semibold text-foreground leading-[1.3] tracking-tight">
              ❝{moment.quote}❞
            </blockquote>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {moment.date}
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="text-sm text-muted-foreground/60">
                {moment.location}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-5 mt-10">
            <div className="flex gap-2">
              {hitos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Ir al momento ${i + 1}`}
                  className="relative h-[3px] rounded-full overflow-hidden bg-muted flex-1"
                >
                  <span
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full",
                      i === current ? "bg-brand" : "bg-muted-foreground/30",
                    )}
                    style={{
                      width:
                        i === current
                          ? `${progress}%`
                          : i < current
                            ? "100%"
                            : "0%",
                      transition: i === current ? "none" : "width 0.4s ease",
                    }}
                  />
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={prev}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all duration-200"
                  aria-label="Anterior"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M8.5 2.5L4 7l4.5 4.5" />
                  </svg>
                </button>
                <button
                  onClick={next}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all duration-200"
                  aria-label="Siguiente"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M5.5 2.5L10 7l-4.5 4.5" />
                  </svg>
                </button>
              </div>

              <button
                className="opacity-50 hover:opacity-80 transition-opacity"
                onClick={next}
              >
                <div className="w-7 h-7 rounded overflow-hidden">
                  <Image
                    src={nextMoment.photo_url || ""}
                    alt=""
                    width={28}
                    height={28}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Panel derecho — imagen con aspect ratio natural */}
        <div className="relative flex-1 overflow-hidden bg-background rounded-xl">
          <div
            className="absolute inset-y-0 left-0 w-10 z-10 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, var(--background) 0%, transparent 80%)",
            }}
          />

          {/* Imagen invisible que da la altura al panel */}
          <Image
            src={hitos[current].photo_url || ""}
            alt=""
            width={1200}
            height={1200}
            className="w-full h-auto object-contain rounded-2xl invisible"
            aria-hidden
          />

          {/* Imágenes animadas encima */}
          {hitos.map((m, i) => (
            <div
              key={m.id}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                opacity: i === current ? (transitioning ? 0 : 1) : 0,
                transform:
                  i === current
                    ? transitioning
                      ? "scale(1.04)"
                      : "scale(1)"
                    : "scale(1.04)",
                transition: "opacity 0.7s ease, transform 0.7s ease",
                pointerEvents: i === current ? "auto" : "none",
              }}
            >
              <Image
                src={m.photo_url || ""}
                alt={m.photo_description || ""}
                width={1200}
                height={1200}
                sizes="62vw"
                className="max-w-full max-h-full object-contain rounded-2xl"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
