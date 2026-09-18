"use client";

import { useState } from "react";
import {
  UniversityEducation,
  PostgraduateEducation,
  TechnicalEducation,
  Incomes,
  Assets,
  PersonBase,
} from "@/interfaces/person";
import { GraduationCap, Wallet, Building2, Car } from "lucide-react";

interface PerfilSectionProps {
  person: PersonBase;
}

const formatCurrency = (amount?: string | number | null) => {
  if (!amount) return "S/ 0.00";
  const num =
    typeof amount === "string"
      ? parseFloat(amount.replace(/[^\d.-]/g, ""))
      : amount;
  if (isNaN(num)) return "S/ 0.00";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 2,
  }).format(num);
};

export function PerfilSection({ person }: PerfilSectionProps) {
  const [showAllAssets, setShowAllAssets] = useState(false);
  const university = (person.university_education ||
    []) as UniversityEducation[];
  const postgraduate = (person.postgraduate_education ||
    []) as PostgraduateEducation[];
  const technical = (person.technical_education || []) as TechnicalEducation[];
  const incomeData = person.incomes?.[0] as Incomes | undefined;
  const assets = (person.assets || []) as Assets[];
  const visibleAssets = showAllAssets ? assets : assets.slice(0, 4);

  const hasEducation =
    university.length > 0 || postgraduate.length > 0 || technical.length > 0;
  const hasWealth = !!incomeData || assets.length > 0;

  return (
    <section id="sec-perfil" className="py-10 scroll-mt-28">
      <header className="flex items-baseline justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-baseline gap-2.5">
          <span className="text-xs font-mono font-bold text-brand">05</span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Formación Académica y Patrimonio
          </h2>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
          Fuente: Declaración Jurada JNE
        </span>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ── 1. Formación Académica ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <GraduationCap className="w-4 h-4 text-brand" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Estudios Superiores
            </h3>
          </div>

          {!hasEducation ? (
            <p className="text-xs text-muted-foreground italic">
              No se han registrado estudios universitarios o de postgrado en su
              ficha oficial.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Postgrados */}
              {postgraduate.map((pos, idx) => (
                <div
                  key={`pos-${idx}`}
                  className="p-3.5 rounded-xl border border-border/80 bg-card space-y-1 shadow-2xs"
                >
                  <span className="text-[10px] font-mono font-bold uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                    Postgrado · {pos.degree || "Especialización"}
                  </span>
                  <h4 className="text-sm font-semibold text-foreground">
                    {pos.specialization || "Estudios de Postgrado"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {pos.graduate_school} ·{" "}
                    {pos.concluded === "SI" ? "Concluido" : "En curso"}
                  </p>
                </div>
              ))}

              {/* Universitaria */}
              {university.map((uni, idx) => (
                <div
                  key={`uni-${idx}`}
                  className="p-3.5 rounded-xl border border-border/80 bg-card space-y-1 shadow-2xs"
                >
                  <span className="text-[10px] font-mono font-semibold uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    Grado / Título
                  </span>
                  <h4 className="text-sm font-semibold text-foreground">
                    {uni.degree || "Estudios Universitarios"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {uni.university} ·{" "}
                    {uni.concluded === "SI" ? "Concluido" : "En curso"}
                  </p>
                </div>
              ))}

              {/* Técnica */}
              {technical.map((tec, idx) => (
                <div
                  key={`tec-${idx}`}
                  className="p-3.5 rounded-xl border border-border/80 bg-card space-y-1 shadow-2xs"
                >
                  <span className="text-[10px] font-mono font-semibold uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    Educación Técnica
                  </span>
                  <h4 className="text-sm font-semibold text-foreground">
                    {tec.career}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {tec.graduate_school}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 2. Declaración Jurada de Patrimonio ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Wallet className="w-4 h-4 text-brand" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Declaración de Bienes y Rentas
            </h3>
          </div>

          {!hasWealth ? (
            <p className="text-xs text-muted-foreground italic">
              No se registran datos de ingresos anuales ni bienes declarados
              ante el JNE.
            </p>
          ) : (
            <div className="divide-y divide-border/60 bg-card rounded-xl border border-border/80 p-4 shadow-2xs space-y-3">
              {/* Ingresos */}
              {incomeData && (
                <div className="pb-3 space-y-1">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-foreground">
                      Ingreso Anual Total
                    </span>
                    <span className="text-lg sm:text-xl font-black text-foreground tabular-nums">
                      {formatCurrency(incomeData.total_income)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-muted-foreground gap-2 flex-wrap">
                    <span>
                      Público: {formatCurrency(incomeData.public_income)}
                    </span>
                    <span>
                      Privado: {formatCurrency(incomeData.private_income)}
                    </span>
                  </div>
                </div>
              )}

              {/* Bienes Declarados */}
              {assets.length > 0 && (
                <div className="pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                      Bienes Muebles e Inmuebles ({assets.length})
                    </span>
                  </div>
                  <div className="space-y-3">
                    {visibleAssets.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className="p-1 rounded bg-muted/60 text-muted-foreground mt-0.5 shrink-0">
                            {item.type?.toLowerCase().includes("inmueble") ? (
                              <Building2 className="w-3.5 h-3.5" />
                            ) : (
                              <Car className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-foreground block leading-snug break-words">
                              {item.type}
                            </span>
                            {item.description && (
                              <span className="text-[11px] text-muted-foreground block leading-relaxed break-words mt-0.5">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0 pl-1">
                          <span className="font-mono font-bold tabular-nums text-foreground whitespace-nowrap block">
                            {formatCurrency(item.value)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {assets.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setShowAllAssets(!showAllAssets)}
                      className="text-xs font-mono font-semibold text-primary hover:underline pt-2 block text-left"
                    >
                      {showAllAssets
                        ? "Ver menos bienes"
                        : `Ver todos los bienes (${assets.length})`}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
