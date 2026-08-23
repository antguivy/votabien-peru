"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Briefcase,
  GraduationCap,
  DollarSign,
  Home,
  MapPin,
  ExternalLink,
  User,
  CheckCircle2,
  Landmark,
  Vote,
  Car,
  ScrollText,
  Building2,
  Gavel,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { NoDataMessage } from "@/components/no-data-message";
// import { ShareButton } from "@/components/share-rs";
import {
  CandidateDetail,
  CandidatePresidentials,
} from "@/interfaces/candidate";
import { RegistrosOficiales } from "./oficial-register";
import { getLastUpdated } from "@/lib/utils/date";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  backgroundStatusConfig,
  backgroundTypeConfig,
  DEFAULT_BACKGROUND_CONFIG,
  SEVERITY_ORDER,
  TYPE_LABELS,
  TYPE_LABELS_SINGULAR,
} from "@/lib/utils/background-config";

const formatCurrency = (amount: string | number) => {
  if (!amount) return "S/ 0.00";
  const num =
    typeof amount === "string"
      ? parseFloat(amount.replace(/[^\d.-]/g, ""))
      : amount;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(num);
};

function getMemberRoleLabel(type: string, listNumber?: number | null): string {
  switch (type) {
    case "GOBERNADOR_REGIONAL":
      return "Gobernador(a) Regional";
    case "VICEGOBERNADOR_REGIONAL":
      return "Vicegobernador(a) Regional";
    case "CONSEJERO_REGIONAL":
      return listNumber
        ? `Consejero(a) Regional · N° ${listNumber}`
        : "Consejero(a) Regional";
    case "ALCALDE_PROVINCIAL":
      return "Alcalde(sa) Provincial";
    case "REGIDOR_PROVINCIAL":
      return listNumber
        ? `Regidor(a) Provincial · N° ${listNumber}`
        : "Regidor(a) Provincial";
    case "ALCALDE_DISTRITAL":
      return "Alcalde(sa) Distrital";
    case "REGIDOR_DISTRITAL":
      return listNumber
        ? `Regidor(a) Distrital · N° ${listNumber}`
        : "Regidor(a) Distrital";
    case "PRESIDENTE":
      return "Presidente(a) de la República";
    case "VICEPRESIDENTE_1":
      return "1er Vicepresidente";
    case "VICEPRESIDENTE_2":
      return "2do Vicepresidente";
    default:
      return type.replace(/_/g, " ");
  }
}

function getTeamSectionTitle(type: string): string {
  switch (type) {
    case "GOBERNADOR_REGIONAL":
    case "VICEGOBERNADOR_REGIONAL":
      return "Fórmula Regional";
    case "CONSEJERO_REGIONAL":
      return "Fórmula y Lista Regional";
    case "ALCALDE_PROVINCIAL":
      return "Lista de Regidores Provinciales";
    case "ALCALDE_DISTRITAL":
      return "Lista de Regidores Distritales";
    case "REGIDOR_PROVINCIAL":
      return "Lista Municipal Provincial";
    case "REGIDOR_DISTRITAL":
      return "Lista Municipal Distrital";
    case "PRESIDENTE":
    case "VICEPRESIDENTE_1":
    case "VICEPRESIDENTE_2":
      return "Fórmula Presidencial";
    default:
      return "Lista de Candidatura";
  }
}

export default function DetailCandidato({
  candidate,
  formula = [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shareUrl,
  legislatorId,
}: {
  candidate: CandidateDetail;
  formula?: CandidatePresidentials[];
  shareUrl: string;
  legislatorId?: string | null;
}) {
  const [showStickyNav, setShowStickyNav] = useState(false);
  const persona = candidate.person;

  const lastUpdated = getLastUpdated(
    persona.updated_at,
    persona.backgrounds ?? [],
  );

  useEffect(() => {
    const onScroll = () => setShowStickyNav(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const incomeData = persona.incomes?.[0];
  const hasAssets = (persona.assets?.length || 0) > 0;

  const hasEducation =
    (persona.postgraduate_education?.length || 0) > 0 ||
    (persona.university_education?.length || 0) > 0 ||
    (persona.technical_education?.length || 0) > 0 ||
    (persona.no_university_education?.length || 0) > 0;

  const hasPolitics =
    (persona.popular_election?.length || 0) > 0 ||
    (persona.political_role?.length || 0) > 0;

  const byType = persona.backgrounds?.reduce(
    (acc, bg) => {
      const key = bg.type?.toUpperCase();
      if (key) acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const backgroundTypes = SEVERITY_ORDER.filter((t) => byType?.[t]);

  return (
    <div className="bg-background min-h-screen">
      {!candidate.active && (
        <div className="bg-muted border-b border-border/60 py-2 px-4 text-center">
          <p className="text-xs text-muted-foreground">
            Este candidato ya no forma parte del proceso electoral activo.
          </p>
        </div>
      )}

      {/* ── STICKY NAV ── */}
      <div
        className={cn(
          "fixed top-0 inset-x-0 z-50 border-b bg-background/80 backdrop-blur-xl transition-all duration-300",
          showStickyNav
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0",
        )}
      >
        <div className="container max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border bg-muted">
              <Image
                src={persona.image_candidate_url || "/placeholder.png"}
                alt="Avatar"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-semibold text-sm max-w-[150px] sm:max-w-xs truncate">
              {persona.name} {persona.lastname}
            </span>
          </div>
          {candidate?.list_number && (
            <Badge variant="default" className="font-bold">
              Marca el {candidate.list_number}
            </Badge>
          )}
        </div>
      </div>

      {/* ── HERO ── */}
      <div className="relative pb-4 md:pb-8">
        <div className="container max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
            {/* Foto */}
            <div className="relative shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-foreground/5 shadow-xl overflow-hidden relative">
                <div className="absolute inset-0 z-0">
                  <Image
                    src={persona.image_candidate_url || "/images/default.svg"}
                    alt=""
                    fill
                    className="object-contain scale-110 blur-2xl opacity-40"
                  />
                </div>
                <div className="relative w-full h-full z-10 bg-white">
                  <Image
                    src={persona.image_candidate_url || "/images/default.svg"}
                    alt={persona.name}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>

              {/* Logo partido */}
              <div className="absolute -bottom-2 -right-2 z-10 bg-white p-1.5 rounded-xl shadow-md border">
                <div className="relative w-8 h-8 md:w-10 md:h-10">
                  <Image
                    src={
                      candidate.political_party.logo_url ||
                      "/party-placeholder.png"
                    }
                    alt="Partido"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Número de lista */}
              {candidate.list_number && (
                <div className="absolute -bottom-2 -left-2 z-10 bg-white p-1.5 rounded-xl shadow-md border">
                  <div className="w-8 h-8 md:w-10 md:h-10 text-4xl text-center font-black text-black flex items-center justify-center leading-none">
                    {candidate.list_number}
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-3 w-full">
              <div>
                <Badge
                  variant="outline"
                  className="mb-2 text-muted-foreground border-primary/20 bg-primary/5 uppercase tracking-wide text-[10px]"
                >
                  {candidate.type.replace(/_/g, " ")}
                </Badge>
                {/* ── Nombre: más sobrio, sin uppercase agresivo ── */}
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight text-foreground">
                  {persona.name}{" "}
                  <span className="text-muted-foreground font-medium">
                    {persona.lastname}
                  </span>
                </h1>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full text-xs">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="font-medium">
                    {candidate.electoral_district?.name}
                  </span>
                </div>
                {persona.profession && (
                  <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full text-xs">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span className="font-medium">{persona.profession}</span>
                  </div>
                )}
                {persona.place_of_birth && (
                  <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full text-xs">
                    <User className="w-3.5 h-3.5" />
                    <span>{persona.place_of_birth}</span>
                  </div>
                )}
              </div>

              {/* ── Actualización + Share integrados bajo las pills ── */}
              <div className="flex justify-center lg:justify-start items-left gap-3 pt-1">
                {lastUpdated && (
                  <p className="text-xs text-success flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Actualizado{" "}
                    {formatDistanceToNow(lastUpdated, {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                )}
                {/* <ShareButton
                  title={`${persona.name} ${persona.lastname}`}
                  url={shareUrl}
                  text={`Conoce más sobre ${persona.fullname} en VotaBien Perú`}
                  trackingId={candidate.id}
                  trackingType="candidato"
                /> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="container max-w-5xl mx-auto">
        {/* ── REGISTROS ── */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {backgroundTypes.length === 0 ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span className="text-xs font-medium text-success">
                Sin historial legal
              </span>
            </div>
          ) : (
            backgroundTypes.map((type) => {
              const cfg =
                backgroundTypeConfig[type] ?? DEFAULT_BACKGROUND_CONFIG;
              const count = byType?.[type] ?? 0;
              const label =
                count === 1 ? TYPE_LABELS_SINGULAR[type] : TYPE_LABELS[type];

              return (
                <div
                  key={type}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
                    cfg.pill,
                  )}
                >
                  <span className="font-black tabular-nums">{count}</span>
                  <span className="font-medium opacity-80">
                    {count === 1 ? `registro ${label}` : `registros ${label}`}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Registros oficiales */}
        <RegistrosOficiales
          is_incumbent={persona.is_incumbent}
          reinfo_status={persona.reinfo_status}
          rnas_sanctions={persona.rnas_sanctions}
          profession={persona.profession}
          legislatorId={legislatorId}
        />

        {/* ── TABS ── */}
        <Tabs defaultValue="hoja-vida" className="w-full">
          <TabsList className="flex mb-2">
            <TabsTrigger value="hoja-vida">Perfil</TabsTrigger>
            <TabsTrigger
              value="antecedentes"
              className="data-[state=active]:text-destructive"
            >
              Historial Legal
            </TabsTrigger>
            <TabsTrigger value="bienes">Bienes</TabsTrigger>
            <TabsTrigger value="biografia">Noticias</TabsTrigger>
          </TabsList>

          {/* ── 1. HOJA DE VIDA ── */}
          <TabsContent
            value="hoja-vida"
            className="space-y-6 animate-in fade-in-50"
          >
            {(() => {
              const displayMembers = formula.filter(
                (m) => m.id !== candidate.id,
              );
              const hasTeam = displayMembers.length > 0;

              const renderEducacionCard = () => (
                <Card className="shadow-none border-border/60 py-0 gap-0 overflow-hidden h-fit">
                  <CardHeader className="py-2.5 px-4 border-b border-border/40 bg-muted/20">
                    <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2 text-foreground">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                      Formación Académica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {!hasEducation ? (
                      <NoDataMessage text="No registra información académica." />
                    ) : (
                      <>
                        {persona.postgraduate_education?.length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                              Posgrado
                            </p>
                            <div className="space-y-2.5">
                              {persona.postgraduate_education.map((edu, i) => (
                                <div
                                  key={i}
                                  className="p-2.5 rounded-lg bg-muted/30 border border-border/40"
                                >
                                  <div className="flex justify-between items-start gap-2">
                                    <div>
                                      <p className="font-semibold text-sm leading-snug">
                                        {edu.specialization}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {edu.graduate_school}
                                      </p>
                                    </div>
                                    {edu.concluded === "NO" && (
                                      <span className="text-[10px] text-destructive bg-destructive/8 px-1.5 py-0.5 rounded shrink-0 font-medium">
                                        Inconcluso
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-2 mt-2 flex-wrap">
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] h-5"
                                    >
                                      {edu.degree}
                                    </Badge>
                                    {edu.year_of_completion && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] h-5"
                                      >
                                        {edu.year_of_completion}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {persona.university_education?.length > 0 && (
                          <div>
                            {persona.postgraduate_education?.length > 0 && (
                              <div className="h-px bg-border/50 mb-3" />
                            )}
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                              Universitaria
                            </p>
                            <div className="space-y-2.5">
                              {persona.university_education.map((edu, i) => (
                                <div
                                  key={i}
                                  className="flex gap-2.5 items-start"
                                >
                                  <div
                                    className={cn(
                                      "mt-1.5 w-1.5 h-1.5 rounded-full shrink-0",
                                      edu.concluded === "SI"
                                        ? "bg-primary"
                                        : "border border-destructive",
                                    )}
                                  />
                                  <div>
                                    <p className="font-semibold text-sm leading-snug">
                                      {edu.degree}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {edu.university}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                      {edu.year_of_completion && (
                                        <span className="text-[11px] text-muted-foreground">
                                          {edu.year_of_completion}
                                        </span>
                                      )}
                                      {edu.concluded === "NO" && (
                                        <span className="text-[10px] text-destructive font-medium">
                                          Inconcluso
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {persona.technical_education?.length > 0 && (
                          <div>
                            {(persona.postgraduate_education?.length > 0 ||
                              persona.university_education?.length > 0) && (
                              <div className="h-px bg-border/50 mb-3" />
                            )}
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                              Técnica
                            </p>
                            <div className="space-y-2.5">
                              {persona.technical_education.map((edu, i) => (
                                <div
                                  key={i}
                                  className="flex gap-2.5 items-start"
                                >
                                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                                  <div>
                                    <p className="font-semibold text-sm leading-snug">
                                      {edu.career}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {edu.graduate_school}
                                    </p>
                                    {edu.concluded === "NO" && (
                                      <span className="text-[10px] text-destructive font-medium block mt-0.5">
                                        Inconcluso
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {persona.no_university_education?.length > 0 && (
                          <div>
                            {(persona.postgraduate_education?.length > 0 ||
                              persona.university_education?.length > 0 ||
                              persona.technical_education?.length > 0) && (
                              <div className="h-px bg-border/50 mb-3" />
                            )}
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                              Otros estudios
                            </p>
                            <div className="space-y-2">
                              {persona.no_university_education.map((edu, i) => (
                                <div key={i}>
                                  <p className="text-sm font-medium leading-snug">
                                    {edu.career}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {edu.graduate_school}
                                  </p>
                                  {edu.concluded === "NO" && (
                                    <span className="text-[10px] text-destructive font-medium block mt-0.5">
                                      Inconcluso
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );

              const renderExperienciaLaboralCard = () => (
                <Card className="shadow-none border-border/60 py-0 gap-0 overflow-hidden h-fit">
                  <CardHeader className="py-2.5 px-4 border-b border-border/40 bg-muted/20">
                    <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2 text-foreground">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      Experiencia Laboral
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3.5">
                    {persona.work_experience?.length > 0 ? (
                      persona.work_experience.map((exp, i) => (
                        <div
                          key={i}
                          className="relative pl-3.5 border-l-2 border-border/70"
                        >
                          <p className="font-semibold text-sm leading-snug">
                            {exp.position}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {exp.organization}
                          </p>
                          <span className="text-[11px] text-muted-foreground/80 block mt-0.5">
                            {exp.period}
                          </span>
                        </div>
                      ))
                    ) : (
                      <NoDataMessage text="No registra información laboral." />
                    )}
                  </CardContent>
                </Card>
              );

              const renderTrayectoriaPoliticaCard = () => (
                <Card className="shadow-none border-border/60 py-0 gap-0 overflow-hidden h-fit">
                  <CardHeader className="py-2.5 px-4 border-b border-border/40 bg-muted/20">
                    <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2 text-foreground">
                      <Vote className="w-4 h-4 text-muted-foreground" />
                      Trayectoria Política
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3.5">
                    {!hasPolitics ? (
                      <NoDataMessage text="No registra trayectoria política previa." />
                    ) : (
                      <>
                        {persona.popular_election?.length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Landmark className="w-3 h-3" />
                              Elección popular
                            </p>
                            <div className="space-y-2.5">
                              {persona.popular_election.map((elec, i) => (
                                <div
                                  key={i}
                                  className="pl-3 border-l-2 border-border/70"
                                >
                                  <p className="font-semibold text-sm leading-snug">
                                    {elec.position}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {elec.political_organization}
                                  </p>
                                  <span className="text-[11px] text-muted-foreground/80 block mt-0.5">
                                    {elec.period}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {persona.political_role?.length > 0 && (
                          <div>
                            {persona.popular_election?.length > 0 && (
                              <div className="h-px bg-border/50 mb-3 mt-2" />
                            )}
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <User className="w-3 h-3" />
                              Cargos partidarios
                            </p>
                            <div className="space-y-2.5">
                              {persona.political_role.map((role, i) => (
                                <div
                                  key={i}
                                  className="pl-3 border-l-2 border-border/70"
                                >
                                  <p className="font-semibold text-sm leading-snug">
                                    {role.position}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {role.political_organization}
                                  </p>
                                  <span className="text-[11px] text-muted-foreground/80 block mt-0.5">
                                    {role.period}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );

              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                  {hasTeam ? (
                    <>
                      {/* Columna izquierda: Equipo / Lista + Trayectoria Política */}
                      <div className="space-y-4">
                        <Card className="shadow-none border-border/60 py-0 gap-0 overflow-hidden">
                          <CardHeader className="py-2.5 px-4 border-b border-border/40 bg-muted/20">
                            <CardTitle className="text-sm sm:text-base font-semibold flex items-center justify-between text-foreground">
                              <div className="flex items-center gap-2">
                                <Landmark className="w-4 h-4 text-muted-foreground" />
                                <span>
                                  {getTeamSectionTitle(candidate.type)}
                                </span>
                              </div>
                              <span className="text-xs font-normal text-muted-foreground">
                                {displayMembers.length} integrante
                                {displayMembers.length > 1 ? "s" : ""}
                              </span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                            {displayMembers.map((member) => (
                              <Link
                                key={member.id}
                                href={`/candidatos/${member.id}`}
                                className="flex items-center gap-3 group p-2 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/40 transition-all -mx-1"
                              >
                                <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-border/40 bg-muted shrink-0 group-hover:border-primary/40 transition-colors">
                                  <Image
                                    src={
                                      member.person.image_candidate_url ||
                                      "/images/default.svg"
                                    }
                                    alt={member.person.fullname}
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold leading-tight truncate group-hover:text-primary transition-colors">
                                    {member.person.fullname}
                                  </p>
                                  <p className="text-xs font-medium text-muted-foreground mt-0.5">
                                    {getMemberRoleLabel(
                                      member.type,
                                      member.list_number,
                                    )}
                                  </p>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors shrink-0" />
                              </Link>
                            ))}
                          </CardContent>
                        </Card>

                        {renderTrayectoriaPoliticaCard()}
                      </div>

                      {/* Columna derecha: Educación + Experiencia Laboral */}
                      <div className="space-y-4">
                        {renderEducacionCard()}
                        {renderExperienciaLaboralCard()}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Sin equipo: Educación + Trayectoria a la izquierda, Experiencia Laboral a la derecha */}
                      <div className="space-y-4">
                        {renderEducacionCard()}
                        {renderTrayectoriaPoliticaCard()}
                      </div>
                      <div className="space-y-4">
                        {renderExperienciaLaboralCard()}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </TabsContent>

          {/* ── 2. ANTECEDENTES ── */}
          <TabsContent value="antecedentes" className="animate-in fade-in-50">
            <div className="space-y-4">
              {persona.backgrounds && persona.backgrounds.length > 0 ? (
                persona.backgrounds
                  .slice()
                  .sort((a, b) => {
                    if (!a.publication_date) return 1;
                    if (!b.publication_date) return -1;
                    return (
                      new Date(b.publication_date).getTime() -
                      new Date(a.publication_date).getTime()
                    );
                  })
                  .map((bg, i) => {
                    const isJNE = bg.source?.toUpperCase() === "JNE";
                    const config =
                      backgroundTypeConfig[bg.type?.toUpperCase()] ??
                      DEFAULT_BACKGROUND_CONFIG;

                    // Extraemos la configuración visual del estado legal
                    const statusConfig = bg.status
                      ? backgroundStatusConfig[bg.status.toUpperCase()]
                      : null;

                    return (
                      <div
                        key={bg.id ?? i}
                        className={cn(
                          "rounded-sm border border-border/50 border-l-2 overflow-hidden",
                          config.border,
                        )}
                      >
                        {/* ── HEADER (Tipo + Estado + Fecha) ── */}
                        <div
                          className={cn(
                            "flex items-center justify-between gap-2 px-3 py-2",
                            config.header,
                          )}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                "text-xs font-bold uppercase tracking-wider",
                                config.badge,
                              )}
                            >
                              {bg.type}
                            </span>

                            {/* Badge de Estado */}
                            {statusConfig && (
                              <Badge
                                className={cn(
                                  "text-xs font-semibold px-2 py-0.5",
                                  statusConfig.badge,
                                )}
                              >
                                {/* Reemplazamos guiones bajos por espacios para que se lea mejor */}
                                {bg.status.replace("_", " ")}
                              </Badge>
                            )}

                            {isJNE && (
                              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                JNE
                              </span>
                            )}
                          </div>
                          {bg.publication_date && (
                            <span className="text-xs text-muted-foreground font-mono shrink-0">
                              {new Intl.DateTimeFormat("es-PE", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }).format(new Date(bg.publication_date))}
                            </span>
                          )}
                        </div>

                        {/* ── BODY (Título + Resumen + Sanción) ── */}
                        <div className="px-3 py-3 space-y-3">
                          <div>
                            <p className="text-base font-semibold text-foreground leading-tight mb-1">
                              {bg.title}
                            </p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {bg.summary}
                            </p>
                          </div>

                          {/* NUEVO: Bloque de Sanción (Solo se muestra si existe) */}
                          {bg.sanction && (
                            <div className="bg-destructive/5 border border-destructive/20 rounded-md p-2.5 flex gap-2.5 items-start mt-2">
                              <Gavel className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-destructive uppercase tracking-wider mb-0.5">
                                  Sanción Impuesta / Fallo
                                </span>
                                <p className="text-sm text-foreground/90 font-medium">
                                  {bg.sanction}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* ── FOOTER (Fuente y Enlace) ── */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-3 border-t border-border/40">
                            <span className="text-sm text-muted-foreground">
                              Fuente:{" "}
                              <span className="font-semibold text-foreground">
                                {bg.source}
                              </span>
                            </span>

                            {bg.source_url && (
                              <Link
                                href={bg.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-md transition-all active:scale-[0.98] w-full sm:w-auto"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                {isJNE
                                  ? "Revisar documento oficial"
                                  : `Ver en ${new URL(
                                      bg.source_url,
                                    ).hostname.replace("www.", "")}`}
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="py-10 flex flex-col items-center gap-2 text-center">
                  <CheckCircle2 className="w-8 h-8 text-muted-foreground/25" />
                  <p className="text-sm text-muted-foreground">
                    Sin antecedentes documentados
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── 3. BIENES Y RENTAS ── */}
          <TabsContent
            value="bienes"
            className="space-y-6 animate-in fade-in-50"
          >
            {!incomeData && !hasAssets ? (
              <NoDataMessage
                text="No se registra información patrimonial declarada."
                icon={DollarSign}
              />
            ) : (
              <>
                {incomeData && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="shadow-none border-border/60">
                      <CardContent className="p-5">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                          Total anual declarado
                        </p>
                        <p className="text-3xl font-black text-foreground tabular-nums">
                          {formatCurrency(incomeData.total_income)}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Hoja de vida JNE
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="shadow-none border-border/60">
                      <CardContent className="p-5">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                          Sector público
                        </p>
                        <p className="text-2xl font-bold tabular-nums">
                          {formatCurrency(incomeData.public_income)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="shadow-none border-border/60">
                      <CardContent className="p-5">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                          Sector privado
                        </p>
                        <p className="text-2xl font-bold tabular-nums">
                          {formatCurrency(incomeData.private_income)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-none border-border/60 py-0 gap-0 overflow-hidden">
                    <CardHeader className="py-2.5 px-4 border-b border-border/40 bg-muted/20">
                      <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                        <Home className="w-4 h-4 text-muted-foreground" />
                        Bienes declarados
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                      {hasAssets ? (
                        persona.assets.map((asset, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-start p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex gap-2.5">
                              {asset.type.includes("CAMIONETA") ||
                              asset.type.includes("VEHICULO") ||
                              asset.type.includes("AUTO") ? (
                                <Car className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                              ) : (
                                <Building2 className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                              )}
                              <div>
                                <p className="text-sm font-medium">
                                  {asset.type}
                                </p>
                                {asset.description && (
                                  <p className="text-xs text-muted-foreground">
                                    {asset.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="font-mono text-sm font-medium whitespace-nowrap">
                              {formatCurrency(asset.value)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <NoDataMessage text="No registra bienes declarados." />
                      )}
                    </CardContent>
                  </Card>

                  <div className="rounded-xl border border-border/60 bg-muted/20 p-5 h-fit space-y-2">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <ScrollText className="w-4 h-4 text-muted-foreground" />
                      Sobre esta información
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Información patrimonial declarada ante el Jurado Nacional
                      de Elecciones (JNE) en la Hoja de Vida del presente
                      proceso electoral. Los montos corresponden al ejercicio
                      fiscal anterior.
                    </p>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* ── 4. NOTICIAS ── */}
          <TabsContent value="biografia" className="animate-in fade-in-50">
            <Card className="shadow-none border-border/60">
              <CardContent className="pt-6">
                {persona.posturas?.length > 0 ? (
                  <div className="border-l border-border/60 ml-3 space-y-6">
                    {persona.posturas
                      .slice()
                      .sort((a, b) => {
                        if (!a.date) return 1;
                        if (!b.date) return -1;
                        return (
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime()
                        );
                      })
                      .map((bio, i) => (
                        <div key={i} className="relative pl-6">
                          <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background bg-primary shadow-sm" />
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-primary/8 text-primary mb-2">
                            {bio.date}
                          </span>
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            {bio.description}
                          </p>
                          {bio.source_url && (
                            <Link
                              href={bio.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-2 text-[11px] text-muted-foreground/60 hover:text-primary transition-colors"
                            >
                              <ExternalLink size={10} />
                              {new URL(bio.source_url).hostname.replace(
                                "www.",
                                "",
                              )}
                            </Link>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <NoDataMessage text="No se registra información biográfica." />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
