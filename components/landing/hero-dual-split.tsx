"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";

interface ElectoralProcess {
  election_date?: string;
}
interface HeroDualSplitProps {
  proceso_electoral: ElectoralProcess;
}

function calcDias(fecha: string) {
  return Math.ceil(
    (new Date(fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}
function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const QUICK_FILTERS = [
  {
    tipo: "Presidente",
    descripcion: "",
    href: "/candidatos?type=PRESIDENTE&limit=30",
    accent: "#dc2626",
  },
  {
    tipo: "Senadores Nacionales",
    descripcion: "Lista única nacional · 30 curules",
    href: "/candidatos?type=SENADOR&limit=30",
    accent: "#7c3aed",
  },
  {
    tipo: "Senadores Regionales",
    descripcion: "Lista por Región · 30 curules",
    href: "/candidatos?type=SENADOR&limit=30&districtType=multiple",
    accent: "#0284c7",
  },
  {
    tipo: "Diputados",
    descripcion: "130 escaños · voto regional",
    href: "/candidatos?type=DIPUTADO&limit=30",
    accent: "#059669",
  },
];

function useCountdown(fechaElecciones?: string) {
  const [dias, setDias] = useState(() =>
    fechaElecciones ? calcDias(fechaElecciones) : 0,
  );
  useEffect(() => {
    if (!fechaElecciones) return;
    const t = setInterval(
      () => setDias(calcDias(fechaElecciones)),
      1000 * 60 * 60,
    );
    return () => clearInterval(t);
  }, [fechaElecciones]);
  const fechaFormateada = useMemo(
    () => (fechaElecciones ? formatFecha(fechaElecciones) : ""),
    [fechaElecciones],
  );
  return { dias, fechaFormateada };
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => {
    if (value === 0) return;
    const start = prevRef.current;
    const duration = 1600;
    const startTime = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setDisplayed(Math.round(start + (value - start) * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    prevRef.current = value;
  }, [value]);
  return <>{displayed}</>;
}

export default function HeroDualSplit({
  proceso_electoral,
}: HeroDualSplitProps) {
  const { dias, fechaFormateada } = useCountdown(
    proceso_electoral.election_date,
  );
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="relative w-full overflow-hidden bg-[#060606]">
      {/* ── background split ── */}
      <div className="absolute inset-0 flex">
        <div className="relative w-1/2 overflow-hidden">
          <Image
            src="/images/hero-left.jpg"
            alt=""
            fill
            className="object-cover object-center brightness-[0.18] scale-[1.06]"
            priority
            sizes="50vw"
          />
          <div
            className="absolute inset-y-0 right-0 w-48"
            style={{
              background: "linear-gradient(to right, transparent, #060606)",
            }}
          />
        </div>
        <div className="relative w-1/2 overflow-hidden">
          <Image
            src="/images/hero-right.jpg"
            alt=""
            fill
            className="object-cover object-center brightness-[0.18] scale-[1.06]"
            priority
            sizes="50vw"
          />
          <div
            className="absolute inset-y-0 left-0 w-48"
            style={{
              background: "linear-gradient(to left, transparent, #060606)",
            }}
          />
        </div>
      </div>

      {/* top vignette */}
      <div
        className="absolute inset-x-0 top-0 h-28 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, #060606cc, transparent)",
        }}
      />

      {/* brand glow arc */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, oklch(0.4936 0.165 28.53 / 0.22) 0%, transparent 60%)",
        }}
      />

      {/* ── content — fills full viewport height ── */}
      <div className="relative z-10 flex flex-col items-center justify-center text-md text-center px-4 min-h-[calc(100svh-64px)] pt-16 pb-8">
        {/* DATE CHIP */}
        {fechaFormateada && (
          <p
            className="font-bold uppercase mb-3 md:mb-4"
            style={{
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "0.3em",
              textShadow: "0 1px 4px rgba(0,0,0,0.9)",
            }}
          >
            12 · Abril · 2026
          </p>
        )}

        {/* SLOGAN */}
        <h1
          className="font-black text-white leading-[1.0] tracking-tight mb-3 md:mb-4 max-w-5xl"
          style={{
            fontSize: "clamp(2.6rem, 7.5vw, 5rem)",
            textShadow:
              "0 2px 4px rgba(0,0,0,0.95), 0 12px 48px rgba(0,0,0,0.5)",
          }}
        >
          Infórmate,{" "}
          <span
            className="text-brand"
            style={{
              textShadow:
                "0 0 56px oklch(0.4936 0.165 28.53 / 0.65), 0 2px 4px rgba(0,0,0,0.95)",
            }}
          >
            tu voto importa
          </span>
        </h1>

        {/* DESCRIPTOR */}
        <p
          className="font-medium max-w-xs md:max-w-md leading-relaxed mb-6 md:mb-8"
          style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: "clamp(13px, 1.5vw, 16px)",
            textShadow: "0 1px 8px rgba(0,0,0,0.9)",
          }}
        >
          Candidatos, antecedentes, posturas y más.
          <br />
          Elecciones Generales Perú 2026
        </p>

        {/* COUNTDOWN */}
        <div className="flex items-center gap-4 md:gap-8 mb-8 md:mb-10">
          <div className="flex flex-col items-center">
            <span
              className="text-brand font-black tabular-nums leading-[0.9]"
              style={{
                fontSize: "clamp(4.5rem, 14vw, 10rem)",
                textShadow:
                  "0 0 80px oklch(0.4936 0.165 28.53 / 0.5), 0 4px 12px rgba(0,0,0,0.9)",
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.04em",
              }}
            >
              {mounted ? (
                <AnimatedNumber value={dias} />
              ) : (
                <span className="opacity-15">—</span>
              )}
            </span>
            <span
              className="font-black uppercase mt-1"
              style={{
                color: "rgba(255,255,255,0.38)",
                fontSize: "clamp(8px, 1vw, 11px)",
                letterSpacing: "0.4em",
                textShadow: "0 1px 4px rgba(0,0,0,0.9)",
              }}
            >
              días
            </span>
          </div>

          {/* divider vertical */}
          <div className="flex flex-col items-start gap-2 pb-3">
            <div
              className="w-px h-8 md:h-12 self-start"
              style={{ background: "rgba(255,255,255,0.15)" }}
            />
            <span
              className="font-semibold leading-snug text-left"
              style={{
                color: "rgba(255,255,255,0.72)",
                fontSize: "clamp(12px, 1.4vw, 15px)",
                textShadow: "0 1px 8px rgba(0,0,0,0.9)",
              }}
            >
              para las
              <br />
              elecciones
            </span>
          </div>
        </div>

        {/* FILTER CARDS */}
        <div className="w-full max-w-2xl md:max-w-3xl">
          {/* section label */}
          <div className="flex items-center gap-4 mb-3">
            <div
              className="flex-1 h-px"
              style={{ background: "rgba(255,255,255,0.12)" }}
            />
            <span
              className="font-black text-sm uppercase"
              style={{
                color: "rgba(255,255,255,0.38)",
                letterSpacing: "0.3em",
              }}
            >
              Explora por cargo
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: "rgba(255,255,255,0.12)" }}
            />
          </div>

          {/* 2x2 grid on mobile, 4 cols on md+ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-2.5">
            {QUICK_FILTERS.map((f, i) => (
              <Link
                key={f.tipo}
                href={f.href}
                className="group relative flex flex-col gap-2 p-3 md:p-4 rounded-2xl transition-all duration-250 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.97] overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.13)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                }}
              >
                {/* accent top bar */}
                <div
                  className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl transition-all duration-250 group-hover:h-1"
                  style={{ background: f.accent }}
                />

                {/* hover background glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-250 pointer-events-none rounded-2xl"
                  style={{
                    background: `radial-gradient(ellipse at 50% 0%, ${f.accent}22 0%, transparent 70%)`,
                  }}
                />

                {/* dot indicator */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background: f.accent,
                      boxShadow: `0 0 6px ${f.accent}80`,
                    }}
                  />
                  <span
                    className="text-xs font-bold tabular-nums"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    0{i + 1}
                  </span>
                </div>

                {/* label */}
                <div>
                  <p
                    className="font-black leading-tight tracking-tight"
                    style={{
                      color: "rgba(255,255,255,0.92)",
                      fontSize: "clamp(12px, 1.6vw, 15px)",
                    }}
                  >
                    {f.tipo}
                  </p>
                  <p
                    className="mt-0.5 text-xs leading-tight font-medium"
                    style={{
                      color: "rgba(255,255,255,0.50)",
                    }}
                  >
                    {f.descripcion}
                  </p>
                </div>

                {/* arrow — hover only */}
                <div
                  className="absolute bottom-3 right-3.5 font-black text-sm opacity-0 group-hover:opacity-80 transition-all duration-200 translate-x-1.5 group-hover:translate-x-0"
                  style={{ color: f.accent }}
                >
                  →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
