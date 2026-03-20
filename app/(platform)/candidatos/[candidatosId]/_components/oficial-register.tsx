"use client";

import { ExternalLink, Landmark, Pickaxe, Scale } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ReinfoStatus, RnasSanction } from "@/interfaces/person";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

interface RegistrosOficialesProps {
  is_incumbent: boolean;
  reinfo_status: ReinfoStatus | null;
  rnas_sanctions: RnasSanction[] | null;
  profession: string | null;
}

type StatusLevel = "alert" | "warning" | "neutral" | "clean";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const SANCION_LABEL: Record<string, string> = {
  EXPULSION: "Expulsión",
  SUSPENSION: "Suspensión",
  MULTA: "Multa",
  AMONESTACION: "Amonestación",
};

const SANCION_SEVERITY: Record<string, number> = {
  EXPULSION: 3,
  SUSPENSION: 2,
  MULTA: 1,
  AMONESTACION: 0,
};

const isLawyer = (profession: string | null) =>
  profession?.toUpperCase().includes("ABOGAD") ?? false;

// ─────────────────────────────────────────────────────────────────────────────
// Primitivos de UI
// ─────────────────────────────────────────────────────────────────────────────

function StatusDot({ level }: { level: StatusLevel }) {
  return (
    <span
      className={cn(
        "mt-[5px] w-1.5 h-1.5 rounded-full shrink-0",
        level === "alert" && "bg-destructive",
        level === "warning" && "bg-warning",
        level === "neutral" && "bg-info",
        level === "clean" && "bg-border",
      )}
    />
  );
}

function Source({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors group/src"
    >
      {label}
      <ExternalLink className="w-2.5 h-2.5 opacity-0 -translate-y-px group-hover/src:opacity-100 transition-all" />
    </Link>
  );
}

function Row({
  icon: Icon,
  level,
  children,
}: {
  icon: React.ElementType;
  level: StatusLevel;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <StatusDot level={level} />
      <Icon
        className={cn(
          "w-3.5 h-3.5 mt-[2px] shrink-0",
          level === "alert" && "text-destructive",
          level === "warning" && "text-warning",
          level === "neutral" && "text-info",
          level === "clean" && "text-muted-foreground/30",
        )}
      />
      <div className="flex-1 min-w-0 space-y-1">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Incumbente
// ─────────────────────────────────────────────────────────────────────────────

function IncumbentRow() {
  return (
    <Row icon={Landmark} level="neutral">
      <p className="text-sm font-semibold text-foreground leading-tight">
        Congresista en ejercicio
      </p>
      <p className="text-xs text-muted-foreground">
        Actualmente ocupa un escaño en el Congreso de la República.
      </p>
    </Row>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REINFO
// ─────────────────────────────────────────────────────────────────────────────

const REINFO_MAP: Record<
  ReinfoStatus,
  { level: StatusLevel; label: string; description: string }
> = {
  Vigente: {
    level: "warning",
    label: "REINFO · Vigente",
    description:
      "Figura en el padrón del Registro Integral de Formalización Minera (MINEM) como minero artesanal o pequeño minero.",
  },
  Suspendido: {
    level: "warning",
    label: "REINFO · Suspendido",
    description:
      "Su inscripción en el Registro Integral de Formalización Minera está actualmente suspendida.",
  },
  Excluido: {
    level: "alert",
    label: "REINFO · Excluido",
    description:
      "Fue retirado del Registro Integral de Formalización Minera (MINEM).",
  },
};

function ReinfoRow({ status }: { status: ReinfoStatus }) {
  const cfg = REINFO_MAP[status];
  return (
    <Row icon={Pickaxe} level={cfg.level}>
      <p className="text-sm font-semibold text-foreground leading-tight">
        {cfg.label}
      </p>
      <p className="text-xs text-muted-foreground">{cfg.description}</p>
      <Source
        label="territoriotomado.pe"
        href="https://territoriotomado.pe/mapa-de-candidatos-al-reinfo-2026"
      />
    </Row>
  );
}

function ReinfoCleanRow() {
  return (
    <Row icon={Pickaxe} level="clean">
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground/50">REINFO</span>
        {" · "}Sin registro en el padrón de formalización minera.
      </p>
      <Source
        label="territoriotomado.pe"
        href="https://territoriotomado.pe/mapa-de-candidatos-al-reinfo-2026"
      />
    </Row>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RNAS
// ─────────────────────────────────────────────────────────────────────────────

function RnasRow({ sanctions }: { sanctions: RnasSanction[] }) {
  const active = sanctions.filter((s) => s.vigente === "SI");
  const inactive = sanctions.filter((s) => s.vigente === "NO");

  const worstSeverity = active.reduce(
    (max, s) => Math.max(max, SANCION_SEVERITY[s.tipo_sancion] ?? 0),
    0,
  );
  const level: StatusLevel = worstSeverity >= 3 ? "alert" : "warning";

  return (
    <Row icon={Scale} level={level}>
      <p className="text-sm font-semibold text-foreground leading-tight">
        RNAS · {active.length} sanción{active.length !== 1 ? "es" : ""} vigente
        {active.length !== 1 ? "s" : ""}
      </p>

      {/* Sanciones vigentes */}
      <div className="space-y-2 pt-1">
        {active.map((s, i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-3 text-xs"
          >
            <div className="min-w-0 space-y-0.5">
              <span className="font-medium text-foreground/80 block truncate">
                {s.colegio}
              </span>
              <span className="text-muted-foreground font-mono block">
                {s.nro_colegiatura} · {s.nro_inscripcion} · {s.periodo_sancion}
              </span>
            </div>
            <span
              className={cn(
                "shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded",
                s.tipo_sancion === "EXPULSION" &&
                  "text-destructive bg-destructive/8",
                s.tipo_sancion === "SUSPENSION" && "text-warning bg-warning/10",
                (s.tipo_sancion === "MULTA" ||
                  s.tipo_sancion === "AMONESTACION") &&
                  "text-muted-foreground bg-muted",
              )}
            >
              {SANCION_LABEL[s.tipo_sancion] ?? s.tipo_sancion}
            </span>
          </div>
        ))}
      </div>

      {/* Sanciones no vigentes — colapsadas */}
      {inactive.length > 0 && (
        <details className="group pt-0.5">
          <summary className="cursor-pointer text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors list-none inline-flex items-center gap-1 select-none">
            <span className="group-open:hidden">▸</span>
            <span className="hidden group-open:inline">▾</span>
            {inactive.length} no vigente{inactive.length !== 1 ? "s" : ""}
          </summary>
          <div className="mt-2 space-y-2 opacity-40">
            {inactive.map((s, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 text-xs"
              >
                <div className="min-w-0 space-y-0.5">
                  <span className="font-medium text-foreground/80 block truncate">
                    {s.colegio}
                  </span>
                  <span className="text-muted-foreground font-mono block">
                    {s.nro_colegiatura} · {s.nro_inscripcion} ·{" "}
                    {s.periodo_sancion}
                  </span>
                </div>
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded text-muted-foreground bg-muted">
                  {SANCION_LABEL[s.tipo_sancion] ?? s.tipo_sancion}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      <Source
        label="rnas.minjus.gob.pe"
        href="https://rnas.minjus.gob.pe/rnas/public/sancionado/sancionadoMain.xhtml"
      />
    </Row>
  );
}

function RnasCleanRow() {
  return (
    <Row icon={Scale} level="clean">
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground/50">RNAS</span>
        {" · "}Sin registro en el padrón de abogados sancionados.
      </p>
      <Source
        label="rnas.minjus.gob.pe"
        href="https://rnas.minjus.gob.pe/rnas/public/sancionado/sancionadoMain.xhtml"
      />
    </Row>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export function RegistrosOficiales({
  is_incumbent,
  reinfo_status,
  rnas_sanctions,
  profession,
}: RegistrosOficialesProps) {
  const hasRnas = rnas_sanctions !== null && rnas_sanctions.length > 0;
  const candidateIsLawyer = isLawyer(profession);
  const showRnasSanctions = hasRnas;
  const showRnasFallback = !hasRnas && candidateIsLawyer;

  return (
    <section className="mb-6 rounded-xl border border-border/60 bg-card divide-y divide-border/40 overflow-hidden">
      {is_incumbent && <IncumbentRow />}
      {reinfo_status ? (
        <ReinfoRow status={reinfo_status} />
      ) : (
        <ReinfoCleanRow />
      )}
      {showRnasSanctions && <RnasRow sanctions={rnas_sanctions!} />}
      {showRnasFallback && <RnasCleanRow />}
    </section>
  );
}
