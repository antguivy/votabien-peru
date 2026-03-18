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
import { CandidateDetail } from "@/interfaces/candidate";

// Helper para formatear moneda
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
  shareUrl,
}: {
  candidate: CandidateDetail;
  shareUrl: string;
}) {
  const [showStickyNav, setShowStickyNav] = useState(false);
  const persona = candidate.person;

  // Lógica para sticky nav
  useEffect(() => {
    const onScroll = () => setShowStickyNav(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Calcular totales para la card de ingresos
  const incomeData = persona.incomes?.[0];

  // Helper para verificar si tiene alguna educación
  const hasEducation =
    (persona.postgraduate_education?.length || 0) > 0 ||
    (persona.university_education?.length || 0) > 0 ||
    (persona.technical_education?.length || 0) > 0 ||
    (persona.no_university_education?.length || 0) > 0;

  // Helper para verificar si tiene trayectoria política
  const hasPolitics =
    (persona.popular_election?.length || 0) > 0 ||
    (persona.political_role?.length || 0) > 0;

  return (
    <div className="bg-background min-h-screen">
      {/* --- STICKY NAV --- */}
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
            <Badge
              variant="default"
              className="bg-primary text-primary-foreground font-bold"
            >
              Marca el {candidate.list_number}
            </Badge>
          )}
        </div>
      </div>

      {/* --- HERO SECTION --- */}
      <div className="relative pb-8 md:pb-12 pt-6">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* Foto */}
            <div className="relative shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-foreground/5 shadow-xl overflow-hidden relative z-10">
                {/* Background blur de la misma imagen */}
                <div className="absolute inset-0 z-0">
                  <Image
                    src={persona.image_candidate_url || "/images/default.svg"}
                    alt=""
                    fill
                    className="object-contain scale-110 blur-2xl opacity-40"
                  />
                </div>

                {/* Imagen principal - completa y centrada */}
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

              {/* Badge de Partido Flotante */}
              <div className="absolute -bottom-2 -right-2 z-20 bg-white p-1.5 rounded-xl shadow-md border">
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

              {/* EL NÚMERO DE VOTACIÓN (Card destacada) */}
              <div className="absolute -bottom-2 -left-2 z-20 bg-white p-1.5 rounded-xl shadow-md border">
                {candidate.list_number && (
                  <div className="relative w-8 h-8 md:w-10 md:h-10 text-4xl text-center font-black text-black flex items-center justify-center leading-none">
                    {candidate.list_number}
                  </div>
                )}
              </div>
            </div>

            {/* Info Texto */}
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

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">
                    {candidate.electoral_district?.name}
                  </span>
                </div>
                {persona.profession && (
                  <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full">
                    <Briefcase className="w-4 h-4" />
                    <span className="font-medium">{persona.profession}</span>
                  </div>
                )}
                {persona.place_of_birth && (
                  <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full">
                    <User className="w-4 h-4" />
                    <span>Nacimiento: {persona.place_of_birth}</span>
                  </div>
                )}
                {/* {persona.updated_at && (
                  <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="text-xs">
                      Actualizado:{" "}
                      {new Intl.DateTimeFormat("es-PE", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }).format(new Date(persona.updated_at))}
                    </span>
                  </div>
                )} */}
              </div>
            </div>
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

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="container max-w-5xl mx-auto">
        {/* ALERTA DE ANTECEDENTES */}
        {persona.backgrounds && persona.backgrounds.length > 0 && (
          <div className="mb-8 p-4 border-l-4 border-destructive bg-destructive/5 rounded-r-lg flex items-start gap-4 shadow-sm">
            <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-destructive text-lg">
                Atención: Tiene Ancetecedentes
              </h3>
              <p className="text-sm text-foreground/80 mt-1">
                Se encontró{" "}
                <strong>{persona.backgrounds.length} antecedentes</strong>{" "}
                (penales, civiles o laborales) de acuerdo a nuestra
                investigación. Revisa la pestaña “Legal” para más detalles.
              </p>
            </div>
          </div>
        )}

        {/* TABS DE INFORMACIÓN */}
        <Tabs defaultValue="hoja-vida" className="w-full space-y-8">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50 rounded-xl">
            <TabsTrigger
              value="hoja-vida"
              className="py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium"
            >
              Hoja de Vida
            </TabsTrigger>
            <TabsTrigger
              value="legal"
              className="py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium text-destructive data-[state=active]:text-destructive"
            >
              Legal
            </TabsTrigger>
            <TabsTrigger
              value="bienes"
              className="py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium"
            >
              Bienes
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium"
            >
              Posturas
            </TabsTrigger>
          </TabsList>

          {/* 1. HOJA DE VIDA */}
          <TabsContent
            value="hoja-vida"
            className="space-y-8 animate-in fade-in-50"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* COLUMNA IZQUIERDA: EXPERIENCIA Y POLÍTICA */}
              <div className="space-y-8">
                {/* Trayectoria Política */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600">
                        <Vote size={20} />
                      </div>
                      <CardTitle className="text-lg">
                        Trayectoria Política
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-6">
                    {!hasPolitics ? (
                      <NoDataMessage text="No registra trayectoria política previa." />
                    ) : (
                      <>
                        {/* Cargos de Elección Popular */}
                        {persona.popular_election?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3 flex items-center gap-1">
                              <Landmark className="w-3 h-3" /> Cargos de
                              Elección Popular
                            </h4>
                            <div className="space-y-4">
                              {persona.popular_election.map((elec, i) => (
                                <div
                                  key={i}
                                  className="pl-3 border-l-2 border-orange-200"
                                >
                                  <p className="font-bold text-sm">
                                    {elec.position}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {elec.political_organization}
                                  </p>
                                  <Badge
                                    variant="secondary"
                                    className="mt-1 text-[10px] h-5"
                                  >
                                    {elec.period}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Cargos Partidarios */}
                        {persona.political_role?.length > 0 && (
                          <div>
                            {persona.popular_election?.length > 0 && (
                              <div className="h-px bg-border w-full my-4" />
                            )}
                            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3 flex items-center gap-1">
                              <User className="w-3 h-3" /> Cargos Partidarios
                            </h4>
                            <div className="space-y-4">
                              {persona.political_role.map((role, i) => (
                                <div
                                  key={i}
                                  className="pl-3 border-l-2 border-orange-200"
                                >
                                  <p className="font-bold text-sm">
                                    {role.position}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {role.political_organization}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className="mt-1 text-[10px] h-5"
                                  >
                                    {role.period}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Experiencia Laboral */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                        <Briefcase size={20} />
                      </div>
                      <CardTitle className="text-lg">
                        Experiencia Laboral
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-5">
                    {persona.work_experience?.length > 0 ? (
                      persona.work_experience.map((exp, i) => (
                        <div key={i} className="relative pl-6 pb-1">
                          <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-purple-400" />
                          <div className="absolute left-[3px] top-3.5 bottom-[-15px] w-0.5 bg-border last:hidden" />

                          <h4 className="font-bold text-sm text-foreground">
                            {exp.position}
                          </h4>
                          <p className="text-sm text-muted-foreground font-medium">
                            {exp.organization}
                          </p>
                          <Badge
                            variant="outline"
                            className="mt-1 text-[10px] h-5"
                          >
                            {exp.period}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <NoDataMessage text="No registra información laboral." />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* COLUMNA DERECHA: EDUCACIÓN */}
              <div className="space-y-8">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                        <GraduationCap size={20} />
                      </div>
                      <CardTitle className="text-lg">
                        Formación Académica
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-6">
                    {!hasEducation ? (
                      <NoDataMessage text="No registra información académica." />
                    ) : (
                      <>
                        {/* Posgrado */}
                        {persona.postgraduate_education?.length > 0 && (
                          <div>
                            <h5 className="text-xs font-bold text-muted-foreground uppercase mb-2">
                              Posgrado
                            </h5>
                            <div className="space-y-3">
                              {persona.postgraduate_education.map((edu, i) => (
                                <div
                                  key={i}
                                  className="bg-muted/30 p-3 rounded-lg border"
                                >
                                  <div className="flex justify-between items-start gap-2">
                                    <div>
                                      <p className="font-bold text-sm text-blue-700 dark:text-blue-400">
                                        {edu.specialization}
                                      </p>
                                      <p className="text-xs text-foreground/80">
                                        {edu.graduate_school}
                                      </p>
                                    </div>
                                    {edu.concluded === "NO" && (
                                      <span className="text-[10px] bg-destructive/10 text-destructive p-1 rounded-md">
                                        {"INCONCLUSO"}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-2 mt-2">
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

                        {/* Universitaria */}
                        {persona.university_education?.length > 0 && (
                          <div>
                            {persona.postgraduate_education?.length > 0 && (
                              <div className="h-px bg-border my-4" />
                            )}
                            <h5 className="text-xs font-bold text-muted-foreground uppercase mb-2">
                              Universitaria
                            </h5>
                            <div className="space-y-3">
                              {persona.university_education.map((edu, i) => (
                                <div key={i} className="flex gap-3 items-start">
                                  <div className="mt-1">
                                    {edu.concluded === "SI" ? (
                                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    ) : (
                                      <div className="w-2 h-2 rounded-full border border-destructive" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm leading-tight">
                                      {edu.degree}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {edu.university}
                                    </p>
                                    {edu.year_of_completion && (
                                      <span className="text-[10px] text-muted-foreground">
                                        {edu.year_of_completion}
                                      </span>
                                    )}
                                    {edu.concluded === "NO" && (
                                      <span className="text-[10px] bg-destructive/15 text-destructive p-1 rounded-md">
                                        {"INCONCLUSO"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Técnica */}
                        {persona.technical_education?.length > 0 && (
                          <div>
                            {(persona.university_education?.length > 0 ||
                              persona.postgraduate_education?.length > 0) && (
                              <div className="h-px bg-border my-4" />
                            )}
                            <h5 className="text-xs font-bold text-muted-foreground uppercase mb-2">
                              Técnica
                            </h5>
                            <div className="space-y-3">
                              {persona.technical_education.map((edu, i) => (
                                <div key={i} className="flex gap-3 items-start">
                                  <div className="mt-1 w-2 h-2 rounded-full bg-slate-400" />
                                  <div>
                                    <p className="font-bold text-sm leading-tight">
                                      {edu.career}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {edu.graduate_school}
                                    </p>
                                    {edu.concluded === "NO" && (
                                      <span className="text-[10px] bg-destructive/15 text-destructive p-1 rounded-md">
                                        {"INCONCLUSO"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* No Universitaria / Otros */}
                        {persona.no_university_education?.length > 0 && (
                          <div>
                            <div className="h-px bg-border my-4" />
                            <h5 className="text-xs font-bold text-muted-foreground uppercase mb-2">
                              Otros Estudios
                            </h5>
                            <div className="space-y-3">
                              {persona.no_university_education.map((edu, i) => (
                                <div key={i} className="text-sm">
                                  <p className="font-medium">{edu.career}</p>
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
            </div>
          </TabsContent>

          {/* 2. LEGAL / ANTECEDENTES */}
          <TabsContent value="legal" className="animate-in fade-in-50">
            <div className="grid gap-4 max-w-3xl mx-auto">
              {persona.backgrounds.length > 0 ? (
                persona.backgrounds.map((bg, i) => {
                  const isJNE = bg.source?.toUpperCase() === "JNE";
                  return (
                    <Card
                      key={i}
                      className="pt-0 border-l-4 border-l-destructive overflow-hidden"
                    >
                      {/* Header */}
                      <div className="bg-destructive/10 py-2 px-4 flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-destructive uppercase tracking-wider">
                            {bg.type}
                          </span>
                          {bg.publication_date && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {new Intl.DateTimeFormat("es-PE", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }).format(new Date(bg.publication_date))}
                            </span>
                          )}
                        </div>
                        {isJNE && (
                          <span className="text-[10px] text-muted-foreground bg-background/50 px-2 py-0.5 rounded shrink-0">
                            Expediente declarado
                          </span>
                        )}
                      </div>

                      <CardContent className="pt-4 space-y-4">
                        {/* Título */}
                        <h4 className="font-bold text-lg text-foreground leading-tight">
                          {bg.title}
                        </h4>

                        {/* Resumen */}
                        <div className="bg-muted/30 p-4 rounded-lg border text-sm text-foreground/80 leading-relaxed">
                          {bg.summary}
                        </div>

                        {/* Badges: sanción + estado */}
                        <div className="flex flex-wrap gap-3 text-sm">
                          {bg.sanction && (
                            <span className="text-destructive font-semibold flex items-center gap-1.5 bg-destructive/5 px-2 py-1 rounded">
                              <Gavel className="w-4 h-4" />
                              Sanción: {bg.sanction}
                            </span>
                          )}
                          {bg.status && (
                            <Badge variant="outline" className="h-7 px-3">
                              {bg.status.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>

                        {/* Footer: fuente */}
                        <div className="pt-2 border-t flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">
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
                              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              {isJNE ? "Ver en JNE" : "Ver fuente original"}
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
                  <CheckCircle2 className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-medium text-foreground">
                    No se ha encontrado información
                  </h3>
                  <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                    No hay investigaciones registradas por medios periodísticos
                    y/o de investigación.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* 3. BIENES Y RENTAS */}
          <TabsContent
            value="bienes"
            className="space-y-6 animate-in fade-in-50"
          >
            {/* Resumen de Ingresos */}
            {incomeData ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-200 dark:bg-emerald-900 rounded-full text-emerald-800 dark:text-emerald-300">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                        Total Anual
                      </span>
                    </div>
                    <p className="text-3xl font-black text-emerald-900 dark:text-emerald-100">
                      {formatCurrency(incomeData.total_income)}
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">
                      Declarado en hoja de vida
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">
                      Sector Público
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(incomeData.public_income)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">
                      Sector Privado
                    </p>
                    <p className="text-2xl font-bold">
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

            {/* Lista detallada de bienes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Home className="w-5 h-5 text-muted-foreground" /> Inmuebles
                    y Muebles
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {persona.assets?.length > 0 ? (
                    persona.assets.map((asset, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-start p-3 bg-muted/20 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border"
                      >
                        <div className="flex gap-3">
                          <div className="mt-1">
                            {asset.type.includes("CAMIONETA") ||
                            asset.type.includes("VEHICULO") ||
                            asset.type.includes("AUTO") ? (
                              <Car className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">
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
                    <NoDataMessage text="No registra bienes muebles o inmuebles." />
                  )}
                </CardContent>
              </Card>

              {/* Nota informativa */}
              <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-xl border border-blue-100 dark:border-blue-900 h-fit">
                <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <ScrollText className="w-4 h-4" /> Sobre esta información
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                  La información patrimonial mostrada corresponde a lo declarado
                  por el candidato ante el Jurado Nacional de Elecciones (JNE)
                  en su Hoja de Vida para el presente proceso electoral. Los
                  montos corresponden al ejercicio fiscal anterior al registro.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* 4. TIMELINE / BIOGRAFÍA */}
          <TabsContent value="timeline" className="animate-in fade-in-50">
            <Card>
              <CardContent className="pt-8">
                {persona.detailed_biography?.length > 0 ? (
                  <div className="max-w-3xl mx-auto border-l-2 border-primary/20 ml-4 space-y-10">
                    {persona.detailed_biography.map((bio, i) => (
                      <div key={i} className="relative pl-8">
                        {/* Punto de tiempo */}
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-background bg-primary shadow-sm" />

                        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary mb-2">
                          {bio.date}
                        </span>

                        <p className="text-base text-foreground leading-relaxed">
                          {bio.description}
                        </p>

                        {bio.source_url && (
                          <Link
                            href={bio.source_url}
                            target="_blank"
                            className="inline-flex items-center gap-1 mt-3 text-xs text-muted-foreground hover:text-primary transition-colors border-b border-dashed border-muted-foreground/50 hover:border-primary"
                          >
                            <ExternalLink size={12} /> Fuente verificada
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <NoDataMessage text="No se ha encontrado información en medios periodísticos y/o de investigación." />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
