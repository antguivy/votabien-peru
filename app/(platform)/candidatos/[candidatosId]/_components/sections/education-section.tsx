"use client";

import { GraduationCap, CheckCircle2, AlertCircle } from "lucide-react";
import { PersonWithBackground } from "@/interfaces/person";

interface EducationSectionProps {
  person: PersonWithBackground;
}

export function EducationSection({ person }: EducationSectionProps) {
  const postgraduate = person.postgraduate_education || [];
  const university = person.university_education || [];
  const technical = person.technical_education || [];
  const other = person.no_university_education || [];

  const hasAnyEducation =
    postgraduate.length > 0 ||
    university.length > 0 ||
    technical.length > 0 ||
    other.length > 0;

  return (
    <section
      id="sec-formacion"
      className="py-8 border-b border-border/70 scroll-mt-24"
    >
      <header className="flex items-baseline justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-baseline gap-2.5">
          <span className="text-xs font-mono font-bold text-brand">03</span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Formación Académica
          </h2>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          Fuente: Hoja de vida declarada (JNE)
        </span>
      </header>

      {!hasAnyEducation ? (
        <div className="p-8 rounded-2xl border border-border/60 bg-muted/20 text-center flex flex-col items-center gap-2">
          <GraduationCap className="w-8 h-8 text-muted-foreground/50" />
          <p className="text-sm font-bold text-foreground">
            Sin estudios declarados
          </p>
          <p className="text-xs text-muted-foreground">
            El candidato no declaró estudios técnicos, universitarios ni de
            posgrado en su hoja de vida oficial.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Posgrado */}
          {postgraduate.map((edu, i) => {
            const isConcluded = edu.concluded !== "NO";
            return (
              <div
                key={`post-${i}`}
                className="p-4 rounded-xl border border-border/70 bg-card hover:bg-muted/15 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand">
                      Posgrado
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                        isConcluded
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}
                    >
                      {isConcluded ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {isConcluded ? "Concluido" : "Inconcluso"}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-foreground leading-snug">
                    {edu.specialization}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {edu.graduate_school}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                  <span>Grado: {edu.degree || "Declarado"}</span>
                  {edu.year_of_completion && (
                    <span>{edu.year_of_completion}</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Universitaria */}
          {university.map((edu, i) => {
            const isConcluded = edu.concluded !== "NO";
            return (
              <div
                key={`uni-${i}`}
                className="p-4 rounded-xl border border-border/70 bg-card hover:bg-muted/15 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      Universitaria
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                        isConcluded
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}
                    >
                      {isConcluded ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {isConcluded ? "Concluido" : "Inconcluso"}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-foreground leading-snug">
                    {edu.degree}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {edu.university}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                  <span>Carrera declarada</span>
                  {edu.year_of_completion && (
                    <span>{edu.year_of_completion}</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Técnica */}
          {technical.map((edu, i) => {
            const isConcluded = edu.concluded !== "NO";
            return (
              <div
                key={`tech-${i}`}
                className="p-4 rounded-xl border border-border/70 bg-card hover:bg-muted/15 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      Técnica Superior
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                        isConcluded
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}
                    >
                      {isConcluded ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {isConcluded ? "Concluido" : "Inconcluso"}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-foreground leading-snug">
                    {edu.career}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {edu.graduate_school}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/40 text-[11px] font-mono text-muted-foreground">
                  <span>Educación técnica declarada</span>
                </div>
              </div>
            );
          })}

          {/* No universitaria */}
          {other.map((edu, i) => {
            const isConcluded = edu.concluded !== "NO";
            return (
              <div
                key={`oth-${i}`}
                className="p-4 rounded-xl border border-border/70 bg-card hover:bg-muted/15 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      Otros Estudios
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                        isConcluded
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {isConcluded ? "Concluido" : "Inconcluso"}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-foreground leading-snug">
                    {edu.career}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {edu.graduate_school}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
