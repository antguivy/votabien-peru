"use client";

import Image from "next/image";
import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { HitoBasic } from "@/interfaces/hito";

// const MOMENTS = [
//   {
//     id: "firma",
//     date: "Febrero 2026",
//     location: "Lima, Perú",
//     photo: "/images/reunion-lima.jpeg",
//     photoAlt: "Brida, Paula y Anthony en Lima",
//     index: "01",
//     quote:
//       "Ese día pusimos fecha y firmamos. Ya no había vuelta atrás.",
//     label: "El inicio",
//   },
//   {
//     id: "meet",
//     date: "Noviembre 2025",
//     location: "Google Meet",
//     photo: "/images/meet-01.jpg",
//     photoAlt: "Primera reunión del equipo",
//     index: "02",
//     quote:
//       "Nadie se conocía en persona. Todos venían de distintas ciudades, distintas carreras. Pero había algo que todos compartíamos: la misma preocupación.",
//     label: "El equipo",
//   },
// ];

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
          MOBILE  (< md)
          Stack vertical: image top 58%, text panel bottom 42%
      ═══════════════════════════════════════════════════ */}
      <section className="md:hidden flex flex-col w-full h-[90dvh] min-h-[580px] bg-background overflow-hidden">
        {/* Image area — 58% height, black bg so contain looks clean */}
        <div
          className="relative w-full bg-background"
          style={{ height: "58%" }}
        >
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
                className="max-w-full max-h-full rounded-xl"
                priority={i === 0}
              />
            </div>
          ))}

          <div
            className="absolute inset-x-0 bottom-0 h-12 z-10 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, var(--background) 100%)",
            }}
          />
        </div>

        {/* Text panel — 42% height, full bg-background, always legible */}
        <div
          className="flex flex-col justify-between pt-3 pb-7 flex-1 bg-background"
          style={{
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? "translateY(8px)" : "translateY(0)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          {/* Index + label + quote */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-mono text-brand font-bold">
                {moment.index}
              </span>
              <span className="w-6 h-px bg-brand/50" />
              <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                {moment.label}
              </span>
            </div>
            <blockquote className="text-base font-semibold text-foreground leading-[1.45] tracking-tight">
              ❝{moment.quote}❞
            </blockquote>
          </div>

          {/* Date + controls */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {moment.date}
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="text-xs text-muted-foreground/60">
                {moment.location}
              </span>
            </div>

            {/* Progress + arrows */}
            <div className="flex items-center gap-4">
              {/* Progress bars */}
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

              {/* Arrow buttons */}
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
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          DESKTOP  (>= md)
          Split: text panel left 38%, image right 62%
      ═══════════════════════════════════════════════════ */}
      <section className="hidden md:flex relative w-full h-[90dvh] min-h-[600px] pt-4 bg-background overflow-hidden">
        {/* Left text panel */}
        <div className="relative z-10 flex flex-col justify-between w-[42%] lg:w-[38%] px-10 lg:px-16 py-12 lg:py-14 flex-shrink-0 bg-background">
          {/* Brand */}
          <p className="text-md font-semibold tracking-[0.15em] text-foreground/65">
            Infórmate, tu voto importa
          </p>

          {/* Main content */}
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

            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium text-muted-foreground">
                {moment.date}
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="text-sm text-muted-foreground/60">
                {moment.location}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-5">
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

              {/* Next hint */}
              <button
                className="flex items-center gap-2 group opacity-50 hover:opacity-80 transition-opacity"
                onClick={next}
              >
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground group-hover:text-foreground transition-colors">
                  {nextMoment.label}
                </span>
                <div className="w-7 h-7 rounded overflow-hidden flex-shrink-0">
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

        {/* Right image panel */}
        <div className="relative flex-1 overflow-hidden bg-background rounded-xl">
          {/* Left fade: image bleeds into text panel */}
          <div
            className="absolute inset-y-0 left-0 w-10 z-10 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, var(--background) 0%, transparent 80%)",
            }}
          />

          {hitos.map((m, i) => (
            <div
              key={m.id}
              className="absolute inset-0"
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
                fill
                sizes="62vw"
                className="object-contain rounded-2xl"
                priority={i === 0}
              />
            </div>
          ))}

          {/* Top/bottom vignette */}
          <div
            className="absolute inset-x-0 top-0 h-28 z-10 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in oklch, var(--background) 35%, transparent) 0%, transparent 100%)",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-28 z-10 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, color-mix(in oklch, var(--background) 35%, transparent) 0%, transparent 100%)",
            }}
          />
        </div>
      </section>
    </>
  );
}
