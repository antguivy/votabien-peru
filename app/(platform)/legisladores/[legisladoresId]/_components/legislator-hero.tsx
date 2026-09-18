"use client";

import Image from "next/image";
import { Mail, ShieldAlert } from "lucide-react";
import { LegislatorDetailWithPerson } from "@/interfaces/legislator";
import { ChamberType } from "@/interfaces/politics";

interface LegislatorHeroProps {
  legislador: LegislatorDetailWithPerson;
}

export function LegislatorHero({ legislador }: LegislatorHeroProps) {
  const person = legislador.person;
  const metrics = legislador.legislatormetrics;
  const party = legislador.elected_by_party;
  const memberships = legislador.parliamentary_memberships || [];
  const currentMembership = memberships.length > 0 ? memberships[0] : null;
  const currentGroup = currentMembership?.parliamentary_group;

  const totalPartyChanges = metrics?.total_party_changes ?? 0;
  const isDefector = metrics?.is_defector ?? totalPartyChanges > 0;
  const roleLabel =
    legislador.chamber === ChamberType.SENADO ? "Senador" : "Diputado";

  return (
    <section className="relative pb-8 border-b-2 border-foreground/80">
      {/* ── Alerta si no está activo o suspendido ── */}
      {!legislador.active && (
        <div className="mb-4 px-3.5 py-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            Este legislador no se encuentra en ejercicio activo en el periodo
            parlamentario vigente.
          </span>
        </div>
      )}

      {/* ── Alerta Institucional de Transfuguismo ── */}
      {isDefector && (
        <div className="mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5 font-bold">
              ⚠️
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 bg-amber-200/80 dark:bg-amber-900/50 px-2 py-0.5 rounded">
                  Alerta Cívica de Transfuguismo
                </span>
                <span className="text-sm font-bold text-amber-950 dark:text-amber-100">
                  Registra {totalPartyChanges}{" "}
                  {totalPartyChanges === 1 ? "cambio" : "cambios"} de grupo
                  parlamentario
                </span>
              </div>
              <p className="text-xs text-amber-900/85 dark:text-amber-200/90 leading-relaxed">
                Fue electo por el partido{" "}
                <strong className="font-bold text-foreground">
                  {party?.name || "Partido de Elección"}
                </strong>
                {currentGroup && currentGroup.name !== party?.name && (
                  <>
                    {" "}
                    y actualmente integra la bancada{" "}
                    <strong className="font-bold text-foreground">
                      {currentGroup.name}
                    </strong>
                  </>
                )}
                .
              </p>
            </div>
          </div>
          <a
            href="#sec-bancadas"
            className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold font-mono tracking-wide transition-colors shadow-xs"
          >
            Ver Trayectoria &rarr;
          </a>
        </div>
      )}

      {/* ── Contenedor Hero Asimétrico ── */}
      <div className="flex flex-col sm:flex-row gap-6 md:gap-8 items-start">
        {/* Retrato con Marco Editorial Doble (Double-Bezel) */}
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
                className="object-cover object-top filter contrast-[1.02]"
                priority
              />
            </div>
          </div>

          {/* Sello de Bancada Actual o Partido */}
          {currentGroup?.logo_url ? (
            <div className="absolute -bottom-2 -right-2 bg-card p-1 rounded-xl shadow-xs border border-border">
              <div className="relative w-7 h-7 sm:w-8 sm:h-8">
                <Image
                  src={currentGroup.logo_url}
                  alt={currentGroup.name || "Bancada"}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          ) : currentGroup?.acronym ? (
            <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-lg bg-card border border-border font-mono font-bold text-xs text-primary shadow-xs">
              {currentGroup.acronym}
            </div>
          ) : party?.logo_url ? (
            <div className="absolute -bottom-2 -right-2 bg-card p-1 rounded-xl shadow-xs border border-border">
              <div className="relative w-7 h-7 sm:w-8 sm:h-8">
                <Image
                  src={party.logo_url}
                  alt={party.name || "Partido"}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Datos de Identidad y Rol */}
        <div className="flex-1 text-center sm:text-left space-y-3 min-w-0">
          {/* Eyebrow de cargo */}
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/60 border border-border/60 text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>{roleLabel}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground leading-tight">
            {person.name}{" "}
            <span className="text-muted-foreground font-bold">
              {person.lastname}
            </span>
          </h1>

          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground flex-wrap">
            <span>
              Periodo{" "}
              <strong className="text-foreground font-semibold">
                2026 – 2031
              </strong>
            </span>
            {legislador.electoral_district?.name && (
              <>
                <span className="text-border">·</span>
                <span className="uppercase font-medium text-foreground/85">
                  {legislador.electoral_district.name}
                </span>
              </>
            )}
            {person.profession && (
              <>
                <span className="text-border">·</span>
                <span className="uppercase text-muted-foreground">
                  {person.profession}
                </span>
              </>
            )}
          </div>

          {/* Afiliación y Contacto Oficial */}
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap pt-1">
            {party && (
              <span className="px-2.5 py-1 rounded-md border border-border/80 bg-muted/30 text-xs font-mono text-muted-foreground">
                Partido:{" "}
                <strong className="text-foreground font-semibold">
                  {party.name}
                </strong>
              </span>
            )}
            {currentGroup && (
              <span className="px-2.5 py-1 rounded-md border border-border/80 bg-muted/30 text-xs font-mono text-muted-foreground">
                Bancada:{" "}
                <strong className="text-foreground font-semibold">
                  {currentGroup.name}
                </strong>
              </span>
            )}
            {isDefector && (
              <span className="px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                ⚠️ {totalPartyChanges}{" "}
                {totalPartyChanges === 1 ? "cambio" : "cambios"}
              </span>
            )}
            {legislador.institutional_email && (
              <a
                href={`mailto:${legislador.institutional_email}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/80 bg-muted/30 text-xs font-mono text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                title="Correo institucional"
              >
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{legislador.institutional_email}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
