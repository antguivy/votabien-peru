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
import { ShareButton } from "@/components/share-rs";
import {
  CandidateDetail,
  CandidatePresidentials,
} from "@/interfaces/candidate";
import { RegistrosOficiales } from "./oficial-register";
import { getLastUpdated } from "@/lib/utils/date";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  backgroundTypeConfig,
  DEFAULT_BACKGROUND_CONFIG,
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

export default function DetailCandidato({
  candidate,
  formula = [],
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

  const hasEducation =
    (persona.postgraduate_education?.length || 0) > 0 ||
    (persona.university_education?.length || 0) > 0 ||
    (persona.technical_education?.length || 0) > 0 ||
    (persona.no_university_education?.length || 0) > 0;

  const hasPolitics =
    (persona.popular_election?.length || 0) > 0 ||
    (persona.political_role?.length || 0) > 0;

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
                <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-foreground uppercase">
                  {persona.name} <br />
                  <span className="text-primary">{persona.lastname}</span>
                </h1>
              </div>

              {/* Pills de info — sin REINFO, eso va en RegistrosOficiales */}
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
            </div>
            <div className="text-center">
              {lastUpdated && (
                <p className="text-[11px] text-success flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Información actualizada{" "}
                  {formatDistanceToNow(lastUpdated, {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              )}

              <ShareButton
                title={`${persona.name} ${persona.lastname}`}
                url={shareUrl}
                text={`Conoce más sobre ${persona.fullname} en VotaBien Perú`}
                trackingId={candidate.id}
                trackingType="candidato"
              />
            </div>
          </div>
        </div>
      </div>
      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="container max-w-5xl mx-auto">
        {/* Alerta antecedentes — minimalista */}
        {persona.backgrounds && persona.backgrounds.length > 0 && (
          <div className="mb-4 flex items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/80">
              Se encontraron{" "}
              <strong className="text-foreground">
                {persona.backgrounds.length} antecedente
                {persona.backgrounds.length !== 1 ? "s" : ""}
              </strong>{" "}
              documentados. Revisa la pestaña{" "}
              <span className="font-semibold text-destructive">
                Antecedentes
              </span>
              .
            </p>
          </div>
        )}

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
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="hoja-vida">Perfil</TabsTrigger>
            <TabsTrigger
              value="antecedentes"
              className="data-[state=active]:text-destructive"
            >
              Antecedentes
            </TabsTrigger>
            <TabsTrigger value="bienes">Bienes</TabsTrigger>
            <TabsTrigger value="noticias">Noticias</TabsTrigger>
          </TabsList>

          {/* ── 1. HOJA DE VIDA ── */}
          <TabsContent
            value="hoja-vida"
            className="space-y-8 animate-in fade-in-50"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Columna izquierda */}
              <div className="space-y-4">
                {formula.length > 0 && (
                  <Card className="shadow-none border-border/60">
                    <CardHeader className="pb-3 border-b border-border/40">
                      <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                        <Landmark className="w-4 h-4 text-muted-foreground" />
                        Fórmula presidencial
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      {formula.map((vp) => (
                        <Link
                          key={vp.id}
                          href={`/candidatos/${vp.id}`}
                          className="flex items-center gap-3 group p-2 rounded-lg hover:bg-muted/40 transition-colors -mx-2"
                        >
                          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-border/40 bg-muted shrink-0 group-hover:border-primary/40 transition-colors">
                            <Image
                              src={
                                vp.person.image_candidate_url ||
                                "/images/default.svg"
                              }
                              alt={vp.person.fullname}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-tight truncate group-hover:text-primary transition-colors">
                              {vp.person.fullname}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {vp.type === "VICEPRESIDENTE_1"
                                ? "1er Vicepresidente"
                                : "2do Vicepresidente"}
                            </p>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors shrink-0" />
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                )}
                {/* Trayectoria política */}
                <Card className="shadow-none border-border/60">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                      <Vote className="w-4 h-4 text-muted-foreground" />
                      Trayectoria Política
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-6">
                    {!hasPolitics ? (
                      <NoDataMessage text="No registra trayectoria política previa." />
                    ) : (
                      <>
                        {persona.popular_election?.length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <Landmark className="w-3 h-3" />
                              Elección popular
                            </p>
                            <div className="space-y-3">
                              {persona.popular_election.map((elec, i) => (
                                <div
                                  key={i}
                                  className="pl-3 border-l-2 border-border"
                                >
                                  <p className="font-semibold text-sm">
                                    {elec.position}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {elec.political_organization}
                                  </p>
                                  <span className="text-[11px] text-muted-foreground">
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
                              <div className="h-px bg-border/50 my-4" />
                            )}
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <User className="w-3 h-3" />
                              Cargos partidarios
                            </p>
                            <div className="space-y-3">
                              {persona.political_role.map((role, i) => (
                                <div
                                  key={i}
                                  className="pl-3 border-l-2 border-border"
                                >
                                  <p className="font-semibold text-sm">
                                    {role.position}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {role.political_organization}
                                  </p>
                                  <span className="text-[11px] text-muted-foreground">
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

                {/* Experiencia laboral */}
                <Card className="shadow-none border-border/60">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      Experiencia Laboral
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {persona.work_experience?.length > 0 ? (
                      persona.work_experience.map((exp, i) => (
                        <div key={i} className="relative pl-5">
                          <div className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                          <p className="font-semibold text-sm leading-tight">
                            {exp.position}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {exp.organization}
                          </p>
                          <span className="text-[11px] text-muted-foreground">
                            {exp.period}
                          </span>
                        </div>
                      ))
                    ) : (
                      <NoDataMessage text="No registra información laboral." />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Columna derecha: educación */}
              <Card className="shadow-none border-border/60 h-fit">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    Formación Académica
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-5">
                  {!hasEducation ? (
                    <NoDataMessage text="No registra información académica." />
                  ) : (
                    <>
                      {persona.postgraduate_education?.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                            Posgrado
                          </p>
                          <div className="space-y-3">
                            {persona.postgraduate_education.map((edu, i) => (
                              <div
                                key={i}
                                className="p-3 rounded-lg bg-muted/30 border border-border/40"
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <div>
                                    <p className="font-semibold text-sm">
                                      {edu.specialization}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {edu.graduate_school}
                                    </p>
                                  </div>
                                  {edu.concluded === "NO" && (
                                    <span className="text-[10px] text-destructive bg-destructive/8 px-1.5 py-0.5 rounded shrink-0">
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
                            <div className="h-px bg-border/50" />
                          )}
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                            Universitaria
                          </p>
                          <div className="space-y-3">
                            {persona.university_education.map((edu, i) => (
                              <div key={i} className="flex gap-3 items-start">
                                <div
                                  className={cn(
                                    "mt-1.5 w-1.5 h-1.5 rounded-full shrink-0",
                                    edu.concluded === "SI"
                                      ? "bg-primary"
                                      : "border border-destructive",
                                  )}
                                />
                                <div>
                                  <p className="font-semibold text-sm">
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
                                      <span className="text-[10px] text-destructive">
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
                          <div className="h-px bg-border/50" />
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-4">
                            Técnica
                          </p>
                          <div className="space-y-3">
                            {persona.technical_education.map((edu, i) => (
                              <div key={i} className="flex gap-3 items-start">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                                <div>
                                  <p className="font-semibold text-sm">
                                    {edu.career}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {edu.graduate_school}
                                  </p>
                                  {edu.concluded === "NO" && (
                                    <span className="text-[10px] text-destructive">
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
                          <div className="h-px bg-border/50" />
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-4">
                            Otros estudios
                          </p>
                          <div className="space-y-2">
                            {persona.no_university_education.map((edu, i) => (
                              <div key={i}>
                                <p className="text-sm font-medium">
                                  {edu.career}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {edu.graduate_school}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── 2. ANTECEDENTES ── */}
          <TabsContent value="antecedentes" className="animate-in fade-in-50">
            <div className="space-y-4">
              {persona.backgrounds && persona.backgrounds.length > 0 ? (
                persona.backgrounds.map((bg, i) => {
                  const isJNE = bg.source?.toUpperCase() === "JNE";
                  const config =
                    backgroundTypeConfig[bg.type?.toUpperCase()] ??
                    DEFAULT_BACKGROUND_CONFIG;

                  return (
                    <div
                      key={bg.id ?? i}
                      className={cn(
                        "rounded-sm border border-border/50 border-l-2 overflow-hidden",
                        config.border,
                      )}
                    >
                      {/* Header */}
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
                          {isJNE && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
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

                      {/* Body */}
                      <div className="px-3 py-3 space-y-2">
                        <p className="text-base font-semibold text-foreground leading-tight">
                          {bg.title}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {bg.summary}
                        </p>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-xs text-muted-foreground">
                            Fuente:{" "}
                            <span className="font-medium text-foreground">
                              {bg.source}
                            </span>
                          </span>
                          {bg.source_url && (
                            <Link
                              href={bg.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-primary transition-colors shrink-0"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {isJNE
                                ? "Ver en JNE"
                                : new URL(bg.source_url).hostname.replace(
                                    "www.",
                                    "",
                                  )}
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
            {incomeData ? (
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
            ) : (
              <NoDataMessage
                text="No se registra información de ingresos declarada."
                icon={DollarSign}
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-none border-border/60">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Home className="w-4 h-4 text-muted-foreground" />
                    Bienes declarados
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2">
                  {persona.assets?.length > 0 ? (
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
                            <p className="text-sm font-medium">{asset.type}</p>
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
                  Información patrimonial declarada ante el Jurado Nacional de
                  Elecciones (JNE) en la Hoja de Vida del presente proceso
                  electoral. Los montos corresponden al ejercicio fiscal
                  anterior.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* ── 4. NOTICIAS ── */}
          <TabsContent value="noticias" className="animate-in fade-in-50">
            <Card className="shadow-none border-border/60">
              <CardContent className="pt-6">
                {persona.detailed_biography?.length > 0 ? (
                  <div className="border-l border-border/60 ml-3 space-y-6">
                    {persona.detailed_biography.map((bio, i) => (
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
                  <NoDataMessage text="No se encontraron noticias en medios periodísticos." />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
