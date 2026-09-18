"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ExternalLink,
  Landmark,
  Briefcase,
  Vote,
  ChevronDown,
} from "lucide-react";
import { CandidatePresidentials } from "@/interfaces/candidate";
import { PersonWithBackground } from "@/interfaces/person";

interface TrajectorySectionProps {
  person: PersonWithBackground;
  candidateId: string;
  candidacyType: string;
  formula?: CandidatePresidentials[];
}

function getMemberRoleLabel(type: string, listNumber?: number | null): string {
  switch (type) {
    case "GOBERNADOR_REGIONAL":
      return "Gobernador(a) Regional";
    case "VICEGOBERNADOR_REGIONAL":
      return "Vicegobernador(a) Regional";
    case "CONSEJERO_REGIONAL":
      return listNumber
        ? `Consejero(a) Reg. N° ${listNumber}`
        : "Consejero(a) Regional";
    case "ALCALDE_PROVINCIAL":
      return "Alcalde(sa) Provincial";
    case "REGIDOR_PROVINCIAL":
      return listNumber
        ? `Regidor(a) Prov. N° ${listNumber}`
        : "Regidor(a) Provincial";
    case "ALCALDE_DISTRITAL":
      return "Alcalde(sa) Distrital";
    case "REGIDOR_DISTRITAL":
      return listNumber
        ? `Regidor(a) Dist. N° ${listNumber}`
        : "Regidor(a) Distrital";
    case "PRESIDENTE":
      return "Presidencia";
    case "VICEPRESIDENTE_1":
      return "1er Vicepresidente";
    case "VICEPRESIDENTE_2":
      return "2do Vicepresidente";
    default:
      return type.replace(/_/g, " ");
  }
}

export function TrajectorySection({
  person,
  candidateId,
  formula = [],
}: TrajectorySectionProps) {
  const [showAllFormula, setShowAllFormula] = useState(false);
  const displayMembers = formula.filter((m) => m.id !== candidateId);
  const visibleMembers = showAllFormula
    ? displayMembers
    : displayMembers.slice(0, 6);

  const popularElections = person.popular_election || [];
  const politicalRoles = person.political_role || [];
  const workExperience = person.work_experience || [];

  return (
    <section
      id="sec-trayectoria"
      className="py-8 border-b border-border/70 scroll-mt-24"
    >
      <header className="flex items-baseline justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-baseline gap-2.5">
          <span className="text-xs font-mono font-bold text-brand">02</span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Trayectoria y Lista Electoral
          </h2>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          Fuente: Voto Informado (JNE) · Hoja de vida
        </span>
      </header>

      <div className="space-y-8">
        {/* Fórmula o Lista Acompañante */}
        {displayMembers.length > 0 && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Landmark className="w-3.5 h-3.5 text-brand" />
                Integrantes de la Lista / Fórmula
              </h3>
              <span className="text-xs font-mono text-muted-foreground">
                {displayMembers.length} postulantes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {visibleMembers.map((member) => (
                <Link
                  key={member.id}
                  href={`/candidatos/${member.id}`}
                  className="p-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-all flex items-center gap-3 group"
                >
                  <div className="relative w-9 h-9 rounded-full overflow-hidden bg-muted border border-border shrink-0">
                    <Image
                      src={
                        member.person.image_candidate_url ||
                        "/images/default.svg"
                      }
                      alt={member.person.fullname}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground group-hover:text-brand transition-colors leading-snug break-words">
                      {member.person.fullname}
                    </p>
                    <p className="text-[11px] font-mono text-muted-foreground leading-tight mt-0.5 break-words">
                      {getMemberRoleLabel(member.type, member.list_number)}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-brand transition-colors shrink-0" />
                </Link>
              ))}
            </div>

            {displayMembers.length > 6 && (
              <button
                type="button"
                onClick={() => setShowAllFormula(!showAllFormula)}
                className="w-full py-2 px-3 rounded-lg border border-border/70 bg-muted/20 hover:bg-muted/40 text-xs font-mono font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-colors"
              >
                <span>
                  {showAllFormula
                    ? "Mostrar menos postulantes"
                    : `Ver lista completa (${displayMembers.length} integrantes)`}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showAllFormula ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Trayectoria Política */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Vote className="w-3.5 h-3.5 text-brand" />
              Cargos Partidarios y de Elección
            </h3>

            {popularElections.length === 0 && politicalRoles.length === 0 ? (
              <div className="p-4 rounded-xl border border-border/60 bg-muted/15 text-xs text-muted-foreground">
                No registra cargos partidarios ni de elección popular previa en
                su hoja de vida.
              </div>
            ) : (
              <div className="relative pl-5 border-l-2 border-border/70 space-y-4 ml-1">
                {popularElections.map((elec, i) => (
                  <div key={`elec-${i}`} className="relative group">
                    <span className="absolute -left-[27px] top-1.5 w-2.5 h-2.5 rounded-full bg-brand border-2 border-background" />
                    <span className="inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-brand/10 text-brand">
                      Elección Popular · {elec.period}
                    </span>
                    <p className="text-sm font-bold text-foreground mt-1">
                      {elec.position}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {elec.political_organization}
                    </p>
                  </div>
                ))}

                {politicalRoles.map((role, i) => (
                  <div key={`role-${i}`} className="relative group">
                    <span className="absolute -left-[27px] top-1.5 w-2.5 h-2.5 rounded-full bg-muted-foreground border-2 border-background" />
                    <span className="inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      Cargo Partidario · {role.period}
                    </span>
                    <p className="text-sm font-bold text-foreground mt-1">
                      {role.position}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {role.political_organization}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Experiencia Laboral Declarada */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-brand" />
              Experiencia Laboral Declarada
            </h3>

            {workExperience.length === 0 ? (
              <div className="p-4 rounded-xl border border-border/60 bg-muted/15 text-xs text-muted-foreground">
                No registra experiencia laboral previa en su hoja de vida
                oficial.
              </div>
            ) : (
              <div className="space-y-2">
                {workExperience.map((exp, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/20 transition-all"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words">
                          {exp.position}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug break-words">
                          {exp.organization}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-muted/60 text-muted-foreground whitespace-nowrap shrink-0">
                        {exp.period}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
