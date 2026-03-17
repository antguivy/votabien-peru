"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

const CANDIDATE_LINKS = [
  {
    tipo: "Presidente",
    descripcion: "1 escaño · voto nacional",
    href: "/candidatos?type=PRESIDENTE&limit=30",
    accentClass: "bg-red-600",
  },
  {
    tipo: "Senadores Nacionales",
    descripcion: "Lista única · 30 curules",
    href: "/candidatos?type=SENADOR&limit=30",
    accentClass: "bg-violet-600",
  },
  {
    tipo: "Senadores Regionales",
    descripcion: "Lista por región · 30 curules",
    href: "/candidatos?type=SENADOR&limit=30&districtType=multiple",
    accentClass: "bg-sky-600",
  },
  {
    tipo: "Diputados",
    descripcion: "130 escaños · voto regional",
    href: "/candidatos?type=DIPUTADO&limit=30",
    accentClass: "bg-emerald-600",
  },
];

export default function CandidatosNav() {
  return (
    <section className="w-full px-5 md:px-8 py-8 md:py-10">
      <div className="max-w-xl md:max-w-5xl mx-auto">
        {/* Label */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] md:text-[11px] font-black uppercase text-muted-foreground tracking-[0.3em]">
            Explora por cargo
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
          {CANDIDATE_LINKS.map((link) => (
            <Link
              key={link.tipo}
              href={link.href}
              className="group relative flex items-center justify-between gap-2 px-4 py-3.5 md:py-4 rounded-xl border border-border bg-card transition-all duration-200 hover:border-border-secondary hover:-translate-y-px hover:shadow-sm active:scale-[0.98] overflow-hidden"
            >
              {/* Left accent bar */}
              <div
                className={`absolute inset-y-0 left-0 w-[3px] rounded-l-xl ${link.accentClass}`}
              />

              <div className="pl-1 min-w-0">
                <p className="text-[13px] md:text-sm font-black text-foreground leading-tight">
                  {link.tipo}
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 leading-tight">
                  {link.descripcion}
                </p>
              </div>

              <ChevronRight
                size={14}
                className="flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-60 transition-all duration-200 -translate-x-1 group-hover:translate-x-0"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
