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
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PersonDetailCandidate } from "@/interfaces/person";

export default function DetailCandidato({
  persona,
}: {
  persona: PersonDetailCandidate;
}) {
  const [showStickyNav, setShowStickyNav] = useState(false);
  const candidate = persona.active_candidacy; // Usamos la propiedad directa

  // Lógica para sticky nav
  useEffect(() => {
    const onScroll = () => setShowStickyNav(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div>
      {/* --- STICKY NAV (Optimizado) --- */}
      <div
        className={cn(
          "fixed top-0 inset-x-0 z-50 border-b bg-background/80 backdrop-blur-xl transition-all duration-300",
          showStickyNav
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0",
        )}
      >
        <div className="container max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border">
              <Image
                src={persona.image_candidate_url || "/placeholder.png"}
                alt="Avatar"
                fill
                className="object-cover"
              />
            </div>
            <span className="font-semibold text-sm max-w-[150px] sm:max-w-xs">
              {persona.name} {persona.lastname}
            </span>
          </div>
          {candidate?.list_number && (
            <Badge variant="default" className="bg-brand text-white font-bold">
              Marca el {candidate.list_number}
            </Badge>
          )}
        </div>
      </div>

      {/* --- HERO SECTION --- */}
      <div className="relative pb-8 md:pb-12">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* Foto con borde de estado */}
            <div className="relative shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background shadow-xl overflow-hidden relative z-10">
                <Image
                  src={
                    persona.image_candidate_url ||
                    persona.image_url ||
                    "/images/default.svg"
                  }
                  alt={persona.name}
                  fill
                  className="object-cover"
                  priority
                />
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

            {/* Info Principal */}
            <div className="flex-1 text-center md:text-left space-y-2 w-full">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <Badge
                    variant="outline"
                    className="mb-2 text-muted-foreground border-brand/20 bg-brand/5"
                  >
                    {candidate.type.replace(/_/g, " ")}
                  </Badge>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none text-foreground uppercase">
                    {persona.name} <br />
                    <span className="text-brand">{persona.lastname}</span>
                  </h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {candidate.electoral_district?.name}
                    </div>
                    {persona.profession && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {persona.profession}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {new Date().getFullYear() -
                        new Date(persona.birth_date!).getFullYear()}{" "}
                      años
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="container mx-auto">
        {/* SECCIÓN DE ALERTAS (Solo si existen) */}
        {persona.backgrounds.length > 0 && (
          <Card className="p-0 border-l-4 mb-6 border-l-destructive shadow-md bg-destructive/5 border-t-0 border-r-0 border-b-0">
            <CardContent className="p-4 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-destructive">
                  Atención: Antecedentes Registrados
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Este candidato tiene {persona.backgrounds.length} registro(s)
                  reportados en su hoja de vida. Revisa la pestaña “Legal” para
                  más detalles.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TABS DE INFORMACIÓN */}
        <Tabs defaultValue="hoja-vida" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50 rounded-xl mb-6">
            <TabsTrigger
              value="hoja-vida"
              className="py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Hoja de Vida
            </TabsTrigger>
            <TabsTrigger
              value="legal"
              className="py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-destructive font-medium"
            >
              Legal
            </TabsTrigger>
            <TabsTrigger
              value="bienes"
              className="py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Bienes
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Timeline
            </TabsTrigger>
          </TabsList>

          {/* 1. HOJA DE VIDA (Educación y Trabajo) */}
          <TabsContent value="hoja-vida" className="space-y-6">
            {/* Educación */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                    <GraduationCap size={20} />
                  </div>
                  <CardTitle className="text-lg">Formación Académica</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 grid gap-4">
                {/* Aquí renderizas tus listas de universidad/técnico con el diseño que ya tenías pero más limpio */}
                {persona.university_education?.map((edu, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm text-foreground">
                        {edu.degree}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {edu.university} • {edu.year_of_completion}
                      </p>
                    </div>
                  </div>
                ))}
                {/* ... resto de lógica de educación ... */}
              </CardContent>
            </Card>

            {/* Trabajo */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                    <Briefcase size={20} />
                  </div>
                  <CardTitle className="text-lg">Experiencia Laboral</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {persona.work_experience?.map((exp, i) => (
                  <div
                    key={i}
                    className="relative pl-4 border-l-2 border-muted pb-4 last:pb-0"
                  >
                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <h4 className="font-bold text-sm">{exp.position}</h4>
                    <p className="text-sm text-foreground/80">
                      {exp.organization}
                    </p>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded mt-1 inline-block">
                      {exp.period}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. LEGAL / SENTENCIAS */}
          <TabsContent value="legal">
            <div className="grid gap-4">
              {persona.backgrounds.map((bg, i) => (
                <Card
                  key={i}
                  className="pt-0 border-l-4 border-l-destructive overflow-hidden"
                >
                  <div className="bg-destructive/10 p-2 text-xs font-bold text-destructive uppercase tracking-wider px-4">
                    {bg.type}
                  </div>
                  <CardContent className="pt-4">
                    <h4 className="font-bold text-lg mb-2">{bg.title}</h4>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border">
                      {bg.summary}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-4 text-sm">
                      {bg.sanction && (
                        <span className="text-destructive font-semibold flex items-center gap-1">
                          <AlertCircle size={14} /> Sanción: {bg.sanction}
                        </span>
                      )}
                      {bg.status && (
                        <Badge variant="outline">
                          {bg.status.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {persona.backgrounds.length === 0 && (
                <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-50" />
                  <h3 className="text-lg font-medium text-foreground">
                    Hoja de vida limpia
                  </h3>
                  <p className="text-muted-foreground">
                    No se registran sentencias o antecedentes declarados.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* 3. BIENES Y RENTAS */}
          <TabsContent value="bienes" className="space-y-6">
            {/* Resumen de Ingresos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Ingresos Totales (Anual)
                    </p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                      {/* Aquí lógica para sumar ingresos o mostrar el último */}
                      {persona.incomes?.[0]?.total_income || "S/ 0.00"}
                    </p>
                  </div>
                </CardContent>
              </Card>
              {/* Lista detallada debajo... */}
            </div>
            {/* Lista de inmuebles/muebles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Patrimonio Declarado
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {persona.assets?.map((asset, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Home className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{asset.type}</span>
                    </div>
                    <span className="font-mono text-sm">{asset.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. TIMELINE / BIO */}
          <TabsContent value="timeline">
            <Card>
              <CardContent className="pt-6">
                <div className="border-l-2 border-muted ml-3 space-y-8">
                  {persona.detailed_biography?.map((bio, i) => (
                    <div key={i} className="relative pl-8">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-background bg-brand" />
                      <span className="text-xs font-bold text-brand block mb-1">
                        {bio.date}
                      </span>
                      <p className="text-sm text-foreground">
                        {bio.description}
                      </p>
                      {bio.source_url && (
                        <Link
                          href={bio.source_url}
                          target="_blank"
                          className="text-xs text-muted-foreground flex items-center gap-1 mt-2 hover:text-brand"
                        >
                          <ExternalLink size={12} /> Fuente
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
