"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Briefcase,
  GraduationCap,
  AlertTriangle,
  DollarSign,
  Home,
  ChevronRight,
  MapPin,
  Vote,
  AlertCircle,
  CheckCircle2,
  User,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { PersonDetailCandidate } from "@/interfaces/person";
import { getBackgroundVariant } from "@/lib/utils/color-enums";

const getStatusBadgeStyles = (status: string) => {
  const s = status.toUpperCase();
  if (s.includes("INSCRITO") || s.includes("ADMITIDO"))
    return "bg-success/15 text-success border-success/30 hover:bg-success/25";
  if (
    s.includes("TACHA") ||
    s.includes("EXCLUIDO") ||
    s.includes("IMPROCEDENTE")
  )
    return "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25";
  if (s.includes("RENUNCIA") || s.includes("RETIRO"))
    return "bg-warning/15 text-warning border-warning/30 hover:bg-warning/25";
  return "bg-secondary text-secondary-foreground";
};

export default function DetailCandidato({
  persona,
}: {
  persona: PersonDetailCandidate;
}) {
  const [showStickyNav, setShowStickyNav] = useState(false);

  const candidaturaPrincipal =
    persona.candidacies?.find((c) => c.active) ||
    persona.candidacies?.sort(
      (a, b) =>
        (b.electoral_process?.year || 0) - (a.electoral_process?.year || 0),
    )[0];

  useEffect(() => {
    const onScroll = () => setShowStickyNav(window.scrollY > 200);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="bg-background min-h-screen pb-8 font-sans selection:bg-brand/20">
      {/* STICKY NAV */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-md transition-all duration-300 transform",
          showStickyNav
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0",
        )}
      >
        <div className="container mx-auto px-3 md:px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm overflow-hidden min-w-0">
            <div className="relative w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden border border-border flex-shrink-0">
              <Image
                src={
                  persona.image_candidate_url ||
                  persona.image_url ||
                  "/images/default-avatar.svg"
                }
                alt="Avatar"
                fill
                className="object-cover"
              />
            </div>
            <span className="font-semibold truncate">{persona.fullname}</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            {candidaturaPrincipal?.list_number && (
              <Badge
                variant="outline"
                className="font-bold border-brand text-brand text-xs md:text-sm px-2 py-0.5"
              >
                N° {candidaturaPrincipal.list_number}
              </Badge>
            )}
            <Link
              href="/candidatos"
              className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <span className="hidden sm:inline">Volver</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="relative bg-gradient-to-b from-muted via-background to-background pt-4 md:pt-6 pb-6 md:pb-8 border-b border-border">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />

        <div className="container mx-auto px-3 md:px-4 relative z-10">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8 items-start">
            {/* FOTO */}
            <div className="w-full md:w-auto flex justify-center md:block flex-shrink-0">
              <div className="relative group">
                <div
                  className={cn(
                    "relative w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 lg:w-48 lg:h-48 rounded-full p-1.5 border-2 shadow-xl transition-transform duration-500 group-hover:scale-[1.02]",
                    candidaturaPrincipal?.active
                      ? "border-brand"
                      : "border-border",
                  )}
                >
                  <div className="relative w-full h-full rounded-full overflow-hidden bg-muted">
                    <Image
                      src={
                        persona.image_candidate_url ||
                        persona.image_url ||
                        "/images/default-avatar.svg"
                      }
                      alt={persona.fullname}
                      fill
                      className="object-cover object-top"
                      priority
                    />
                  </div>
                  {candidaturaPrincipal && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                      <Badge
                        className={cn(
                          "whitespace-nowrap shadow-lg px-2 md:px-3 py-0.5 text-[10px] md:text-xs uppercase tracking-wide border",
                          getStatusBadgeStyles(candidaturaPrincipal.status),
                        )}
                      >
                        {candidaturaPrincipal.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* INFORMACIÓN PRINCIPAL */}
            <div className="flex-1 w-full min-w-0 space-y-3 md:space-y-4">
              <div className="text-center md:text-left space-y-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-foreground tracking-tight uppercase leading-tight">
                  {persona.name}{" "}
                  <span className="text-primary">{persona.lastname}</span>
                </h1>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm">
                  {persona.profession && (
                    <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md border border-border/50">
                      <Briefcase className="w-3.5 h-3.5 text-brand" />
                      <span className="text-xs md:text-sm">
                        {persona.profession}
                      </span>
                    </div>
                  )}
                  {persona.birth_date && (
                    <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md border border-border/50">
                      <User className="w-3.5 h-3.5 text-brand" />
                      <span className="text-xs md:text-sm">
                        {new Date().getFullYear() -
                          new Date(persona.birth_date).getFullYear()}{" "}
                        años
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* CARD DE CANDIDATURA */}
              {candidaturaPrincipal && (
                <div className="bg-card border border-border shadow-sm rounded-lg md:rounded-xl overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 md:w-1.5 h-full bg-brand" />
                  <div className="p-3 md:p-4 lg:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4">
                    <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                      <div className="relative w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 shrink-0 bg-white rounded-lg border border-border p-1 shadow-sm">
                        {candidaturaPrincipal.political_party.logo_url ? (
                          <Image
                            src={candidaturaPrincipal.political_party.logo_url}
                            alt={candidaturaPrincipal.political_party.name}
                            fill
                            className="object-contain p-1"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted text-xs text-center text-muted-foreground">
                            Sin Logo
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-0.5 min-w-0">
                        <p className="text-[10px] md:text-xs font-bold text-brand tracking-wider uppercase">
                          Candidato a
                        </p>
                        <h2 className="text-base md:text-lg lg:text-xl font-bold text-foreground leading-tight">
                          {candidaturaPrincipal.type.replace(/_/g, " ")}
                        </h2>
                        <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                          <span className="truncate">
                            {candidaturaPrincipal.electoral_district?.name ||
                              "Distrito Único"}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/80 pt-0.5 truncate">
                          {candidaturaPrincipal.political_party.name}
                        </p>
                      </div>
                    </div>

                    {candidaturaPrincipal.list_number && (
                      <div className="shrink-0 flex flex-col items-center gap-1.5">
                        <span className="text-[9px] md:text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                          Marca el
                        </span>
                        <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-white border-2 border-black rounded-lg flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)]">
                          <span className="text-4xl md:text-5xl lg:text-6xl font-black text-black tracking-tighter">
                            {candidaturaPrincipal.list_number}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO DETALLADO */}
      <div className="container mx-auto px-3 md:px-4 mt-6 md:mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* COLUMNA PRINCIPAL (2/3) */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* ANTECEDENTES */}
            <section>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-1.5 md:p-2 bg-warning/10 rounded-lg">
                  <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-warning" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-foreground">
                  Sentencias y Antecedentes
                </h3>
              </div>

              <Card className="pt-0 border-warning/30 bg-warning/5">
                <CardContent className="p-0">
                  {persona.backgrounds.length > 0 ? (
                    <>
                      {persona.backgrounds.map((bg, idx) => (
                        <div
                          key={bg.id}
                          className={cn(
                            "p-3 md:p-4 space-y-2 hover:bg-warning/10 transition-colors",
                            idx !== 0 && "border-t border-warning/20",
                          )}
                        >
                          <div className="flex flex-wrap justify-between items-start gap-2">
                            <Badge
                              variant={getBackgroundVariant(bg.type)}
                              className="uppercase px-2 py-0.5 text-xs"
                            >
                              {bg.type}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="border-foreground/20 text-foreground/70 text-[10px]"
                            >
                              {bg.status.replace(/_/g, " ")}
                            </Badge>
                          </div>

                          {bg.publication_date && (
                            <p className="text-xs text-muted-foreground">
                              Publicado: {bg.publication_date}
                            </p>
                          )}

                          <div>
                            <h4 className="font-bold text-foreground text-sm md:text-base mb-1">
                              {bg.title}
                            </h4>
                            <p className="text-xs md:text-sm text-foreground/80 leading-relaxed bg-white/50 p-2 md:p-3 rounded-md border border-warning/10">
                              {bg.summary}
                            </p>
                          </div>

                          {bg.sanction && (
                            <div className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-destructive">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Sanción: {bg.sanction}
                            </div>
                          )}

                          {bg.source_url ? (
                            <a
                              href={bg.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {bg.source}
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Fuente: {bg.source}
                            </span>
                          )}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-6 md:py-8 text-muted-foreground flex flex-col items-center">
                      <Briefcase className="w-8 h-8 md:w-10 md:h-10 mb-2 opacity-20" />
                      <span className="text-sm">No registra</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* EXPERIENCIA LABORAL */}
            <section className="grid sm:grid-cols-2 gap-4">
              {/* EDUCACIÓN */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <h3 className="text-sm md:text-base font-bold text-foreground">
                    Formación Académica
                  </h3>
                </div>
                <Card className="pt-0 border-border shadow-sm">
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/50">
                      {/* Secundaria */}
                      <div className="p-3 md:p-4 bg-muted/20">
                        <h5 className="text-xs md:text-sm font-semibold text-foreground">
                          Educación Secundaria
                        </h5>
                        {persona.secondary_school ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] mt-1"
                          >
                            Completa
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[10px] mt-1"
                          >
                            Incompleta
                          </Badge>
                        )}
                      </div>

                      {/* Técnica */}
                      {persona.technical_education?.map((edu, i) => (
                        <div key={`tech-${i}`} className="p-3 md:p-4">
                          <div className="flex justify-between items-start gap-2">
                            <h5 className="text-xs md:text-sm font-semibold text-foreground">
                              {edu.career}
                            </h5>
                            {edu.concluded === "Si" && (
                              <CheckCircle2 className="w-3 h-3 text-success flex-shrink-0" />
                            )}
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-[9px] md:text-[10px] mt-1"
                          >
                            Técnica
                          </Badge>
                          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                            {edu.graduate_school}
                          </p>
                        </div>
                      ))}

                      {/* Sin educación universitaria */}
                      {persona.no_university_education?.map((edu, i) => (
                        <div key={`no-uni-${i}`} className="p-3 md:p-4">
                          <div className="flex justify-between items-start gap-2">
                            <h5 className="text-xs md:text-sm font-semibold text-foreground">
                              {edu.career}
                            </h5>
                            {edu.concluded === "Si" && (
                              <CheckCircle2 className="w-3 h-3 text-success flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                            {edu.graduate_school}
                          </p>
                        </div>
                      ))}

                      {/* Universidad */}
                      {persona.university_education?.map((edu, i) => (
                        <div key={`uni-${i}`} className="p-3 md:p-4">
                          <div className="flex justify-between items-start gap-2">
                            <h5 className="text-xs md:text-sm font-semibold text-foreground">
                              {edu.degree}
                            </h5>
                            {edu.concluded === "Si" && (
                              <CheckCircle2 className="w-3 h-3 text-success flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
                            {edu.university} - {edu.year_of_completion}
                          </p>
                        </div>
                      ))}
                      {/* Posgrado */}
                      {persona.postgraduate_education?.map((edu, i) => (
                        <div
                          key={`post-${i}`}
                          className="p-3 md:p-4 bg-primary/5"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <h5 className="text-xs md:text-sm font-bold text-foreground leading-tight">
                              {edu.degree}
                            </h5>
                            {edu.concluded === "Si" && (
                              <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-success flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] md:text-xs text-primary mt-0.5">
                            {edu.specialization}
                          </p>
                          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                            {edu.graduate_school} - {edu.year_of_completion}
                          </p>
                        </div>
                      ))}
                    </div>

                    {!persona.secondary_school &&
                      !persona.university_education?.length &&
                      !persona.postgraduate_education?.length &&
                      !persona.technical_education?.length &&
                      !persona.no_university_education?.length && (
                        <div className="p-4 md:p-6 text-center text-xs md:text-sm text-muted-foreground">
                          No registra educación
                        </div>
                      )}
                  </CardContent>
                </Card>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <h3 className="text-sm md:text-base font-bold text-foreground">
                    Experiencia Laboral
                  </h3>
                </div>
                <Card className="pt-0 border-border shadow-sm">
                  <CardContent className="p-3 md:p-4">
                    {persona.work_experience?.length > 0 ? (
                      <div className="space-y-3">
                        {persona.work_experience.map((exp, i) => (
                          <div
                            key={i}
                            className="p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex flex-row gap-5 items-center justify-start">
                              <h4 className="text-sm md:text-base font-bold text-foreground">
                                {exp.position}
                              </h4>
                              <span className="inline-block text-[10px] md:text-xs text-muted-foreground bg-background px-2 py-0.5 rounded border border-border/50">
                                {exp.period}
                              </span>
                            </div>

                            <p className="text-xs md:text-sm text-primary font-medium mt-0.5">
                              {exp.organization}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 md:py-8 text-muted-foreground flex flex-col items-center">
                        <Briefcase className="w-8 h-8 md:w-10 md:h-10 mb-2 opacity-20" />
                        <span className="text-sm">
                          No registra experiencia laboral
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>
            <section className="grid sm:grid-cols-2 gap-4">
              {/* TRAYECTORIA POLÍTICA */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Vote className="w-4 h-4 text-brand" />
                  <h3 className="text-sm md:text-base font-bold text-foreground">
                    Historial Político
                  </h3>
                </div>
                <Card className="pt-0 border-border shadow-sm">
                  <CardContent className="p-3 md:p-4 space-y-3 md:space-y-4">
                    <div>
                      <h5 className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase mb-2">
                        Elecciones Ganadas
                      </h5>
                      {persona.popular_election?.length > 0 ? (
                        <ul className="space-y-2">
                          {persona.popular_election.map((elec, i) => (
                            <li
                              key={i}
                              className="text-xs md:text-sm border-l-2 border-success pl-2.5 md:pl-3 py-1 bg-success/5 rounded-r"
                            >
                              <p className="font-medium text-foreground leading-tight">
                                {elec.position}
                              </p>
                              <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
                                {elec.political_organization}
                              </p>
                              <span className="text-[9px] md:text-[10px] text-success font-semibold">
                                {elec.period}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs md:text-sm text-muted-foreground italic">
                          No registra
                        </p>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <h5 className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase mb-2">
                        Cargos Partidarios
                      </h5>
                      {persona.political_role?.length > 0 ? (
                        <ul className="space-y-2">
                          {persona.political_role.map((rol, i) => (
                            <li key={i} className="text-xs md:text-sm">
                              <p className="font-medium text-foreground leading-tight">
                                {rol.position}
                              </p>
                              <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {rol.political_organization}
                              </p>
                              <span className="text-[9px] md:text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded inline-block mt-1">
                                {rol.period}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs md:text-sm text-muted-foreground italic">
                          No registra
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* BIENES */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Home className="w-4 h-4 md:w-5 md:h-5 text-info" />
                  <h3 className="text-sm md:text-base font-bold text-foreground">
                    Bienes y Rentas
                  </h3>
                </div>
                <Card className="pt-0 border-border shadow-sm max-h-[280px] overflow-y-auto">
                  <CardContent className="p-0">
                    {persona.assets?.length > 0 ? (
                      <div className="divide-y divide-border">
                        {persona.assets.map((asset, i) => (
                          <div
                            key={i}
                            className="p-3 md:p-4 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <Badge className="text-[10px] uppercase bg-primary/5 text-primary/80 px-1.5 py-0.5">
                                {asset.type}
                              </Badge>
                              <span className="text-xs md:text-sm font-mono font-bold">
                                {asset.value}
                              </span>
                            </div>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              {asset.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 md:p-6 text-center text-xs md:text-sm text-muted-foreground">
                        Sin registro
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>
            {/* TRANSPARENCIA PATRIMONIAL */}
            <section className="grid sm:grid-cols-2 gap-4">
              {/* INGRESOS */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-success" />
                  <h3 className="text-sm md:text-base font-bold text-foreground">
                    Ingresos Anuales
                  </h3>
                </div>
                <Card className="pt-0 border-border shadow-sm">
                  <CardContent className="p-0">
                    {persona.incomes?.length > 0 ? (
                      <div className="divide-y divide-border">
                        {persona.incomes.map((inc, i) => (
                          <div key={i} className="p-3 md:p-4 space-y-2">
                            <div className="flex justify-between items-center text-xs md:text-sm">
                              <span className="text-muted-foreground">
                                Público
                              </span>
                              <span className="font-medium">
                                {inc.public_income}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs md:text-sm">
                              <span className="text-muted-foreground">
                                Privado
                              </span>
                              <span className="font-medium">
                                {inc.private_income}
                              </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center font-bold text-success text-sm md:text-base">
                              <span>TOTAL</span>
                              <span>{inc.total_income}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 md:p-6 text-center text-xs md:text-sm text-muted-foreground">
                        Sin información
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>

          {/* COLUMNA LATERAL (1/3) */}
          <div className="space-y-4 md:space-y-6">
            {/* BIOGRAFÍA DETALLADA - TIMELINE PERIODÍSTICO */}
            {persona.detailed_biography &&
              persona.detailed_biography.length > 0 && (
                <section>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="p-1.5 md:p-2 bg-brand/10 rounded-lg">
                      <Calendar className="w-4 h-4 md:w-5 md:h-5 text-brand" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-foreground">
                      Timeline
                    </h3>
                  </div>

                  <Card className="pt-0 border-border shadow-sm">
                    <CardContent className="p-0">
                      <div className="divide-y divide-border">
                        {persona.detailed_biography.map((bio, idx) => (
                          <div
                            key={idx}
                            className="p-3 md:p-4 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 mb-2">
                              <Badge
                                variant="outline"
                                className="w-fit text-xs border-brand/30 text-brand"
                              >
                                {bio.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-medium">
                                {bio.date}
                              </span>
                              {bio.source_url && (
                                <Link
                                  href={bio.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {bio.source}
                                </Link>
                              )}
                            </div>
                            <p className="text-sm text-foreground leading-relaxed mb-2">
                              {bio.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </section>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
