"use client";

import Image from "next/image";
import { Briefcase, ShieldAlert, Landmark } from "lucide-react";
import { CandidateDetail } from "@/interfaces/candidate";

interface CandidateHeroProps {
  candidate: CandidateDetail;
}

function formatCandidacyRole(type: string): string {
  switch (type) {
    case "GOBERNADOR_REGIONAL":
      return "Gobernador(a) Regional";
    case "VICEGOBERNADOR_REGIONAL":
      return "Vicegobernador(a) Regional";
    case "CONSEJERO_REGIONAL":
      return "Consejero(a) Regional";
    case "ALCALDE_PROVINCIAL":
      return "Alcalde(sa) Provincial";
    case "REGIDOR_PROVINCIAL":
      return "Regidor(a) Provincial";
    case "ALCALDE_DISTRITAL":
      return "Alcalde(sa) Distrital";
    case "REGIDOR_DISTRITAL":
      return "Regidor(a) Distrital";
    case "PRESIDENTE":
      return "Presidencia de la República";
    case "VICEPRESIDENTE_1":
      return "1er Vicepresidente";
    case "VICEPRESIDENTE_2":
      return "2do Vicepresidente";
    case "SENADOR":
      return "Senado";
    case "DIPUTADO":
      return "Cámara de Diputados";
    default:
      return type.replace(/_/g, " ");
  }
}

export function CandidateHero({ candidate }: CandidateHeroProps) {
  const person = candidate.person;
  const party = candidate.political_party;
  const district = candidate.electoral_district?.name || "";

  return (
    <section className="relative pb-6 border-b border-border/70">
      {!candidate.active && (
        <div className="mb-4 px-3.5 py-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            Este candidato no forma parte del proceso electoral activo o ha sido
            excluido.
          </span>
        </div>
      )}

      {candidate.succession && (
        <div className="mb-4 px-3.5 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs flex items-start gap-2.5 animate-in fade-in duration-300">
          <Landmark className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-0.5 min-w-0">
            <p className="font-bold text-amber-900 dark:text-amber-200">
              Encabeza la lista y asume la titularidad por vacancia
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Inscrito(a) formalmente ante el JNE como{" "}
              <strong className="text-foreground">
                {formatCandidacyRole(candidate.type)}
              </strong>
              . Al encontrarse la candidatura titular
              {candidate.succession.original_candidate_name
                ? ` (${candidate.succession.original_candidate_name})`
                : ""}{" "}
              {candidate.succession.reason === "RENUNCIA"
                ? "en condición de renuncia"
                : candidate.succession.reason === "EXCLUIDO"
                  ? "excluida"
                  : candidate.succession.reason === "TACHADO"
                    ? "tachada"
                    : candidate.succession.reason === "FALLECIMIENTO"
                      ? "en baja por fallecimiento"
                      : "inactiva"}
              , de resultar electa la lista, asumirá las funciones de{" "}
              <strong className="text-foreground">
                {formatCandidacyRole(candidate.succession.target_type)}
              </strong>{" "}
              de conformidad con el {candidate.succession.legal_basis}.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-5 md:gap-7 items-start">
        {/* ── Marco de foto con Double-Bezel limpio ── */}
        <div className="relative shrink-0 mx-auto sm:mx-0">
          <div className="p-1 rounded-2xl bg-muted/40 border border-border/80 shadow-xs">
            <div className="relative w-28 h-36 sm:w-36 sm:h-44 md:w-40 md:h-48 rounded-xl overflow-hidden bg-muted">
              <Image
                src={
                  person.image_candidate_url ||
                  person.image_url ||
                  "/images/default.svg"
                }
                alt={person.fullname || `${person.name} ${person.lastname}`}
                fill
                sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 160px"
                className="object-cover object-top"
                priority
              />
            </div>
          </div>

          {/* Número electoral oculto para ERM
          {candidate.list_number && (
            <div className="absolute -bottom-2 -left-2 min-w-[34px] h-[34px] px-2 bg-foreground text-background rounded-lg shadow-sm border border-background/20 flex items-center justify-center">
              <span className="text-base font-black tabular-nums leading-none">
                {candidate.list_number}
              </span>
            </div>
          )} */}

          {/* Logo del partido */}
          {party?.logo_url && (
            <div className="absolute -bottom-2 -right-2 bg-background p-1 rounded-xl shadow-sm border border-border">
              <div className="relative w-7 h-7 sm:w-8 sm:h-8">
                <Image
                  src={party.logo_url}
                  alt={party.name || "Partido político"}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Datos de Identidad ── */}
        <div className="flex-1 text-center sm:text-left space-y-2.5 min-w-0">
          {/* Eyebrow de cargo (sin prefijo "Candidato a") */}
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/60 border border-border/60 text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
            <span>{formatCandidacyRole(candidate.type)}</span>
          </div>

          {/* Nombre con jerarquía editorial */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground leading-tight">
            {person.name}{" "}
            <span className="text-muted-foreground font-bold">
              {person.lastname}
            </span>
          </h1>

          {/* Partido y distrito (un solo lugar para el distrito) */}
          <p className="text-sm font-medium text-muted-foreground">
            {party?.name ? (
              <span className="text-foreground font-semibold">
                {party.name}
              </span>
            ) : null}
            {party?.name && district ? (
              <span className="mx-1.5 text-border">·</span>
            ) : null}
            <span>{district}</span>
          </p>

          {/* Pills informativas (solo profesión, no duplicamos distrito) */}
          {person.profession && (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/40 border border-border/60 text-foreground/80 font-medium">
                <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                {person.profession}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
