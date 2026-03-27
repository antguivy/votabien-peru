"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import {
  FileText,
  Mail,
  Check,
  Copy,
  GraduationCap,
  AlertTriangle,
  Briefcase,
  ChevronRight,
  DollarSign,
  Home,
  Vote,
  ArrowRightLeft,
  User,
  ScrollText,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { SlSocialFacebook, SlSocialTwitter } from "react-icons/sl";
import { PiTiktokLogo } from "react-icons/pi";
import { RiInstagramLine } from "react-icons/ri";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { formatFechaJsonable } from "@/lib/utils/date";
import { NoDataMessage } from "@/components/no-data-message";
import BillsDialog from "./bills-dialog";
import ProyectoItem from "./proyect-item";
import { cn } from "@/lib/utils";
import {
  backgroundTypeConfig,
  DEFAULT_BACKGROUND_CONFIG,
} from "@/lib/utils/background-config";
import { LegislatorDetailWithPerson } from "@/interfaces/legislator";

export default function DetailLegislador({
  legislador,
}: {
  legislador: LegislatorDetailWithPerson;
}) {
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  const [openBills, setOpenBills] = useState(false);

  const persona = legislador.person;
  const periodoActivo = legislador;
  const proyectos = periodoActivo?.bill_authorships || [];
  const bancadas = periodoActivo?.parliamentary_memberships || [];
  const asistencias = periodoActivo?.attendances || [];
  const bancadaActual = bancadas.length > 0 ? bancadas[0] : null;

  const PREVIEW_LIMIT = 4; // Mostramos un poco más porque hay más espacio

  // --- STATS PROYECTOS ---
  const stats_proyectos = useMemo(() => {
    const counts = {
      PRESENTADO: 0,
      EN_PROCESO: 0,
      APROBADO: 0,
      ARCHIVADO: 0,
      RETIRADO: 0,
      total: 0,
    };
    proyectos.forEach((p) => {
      const group = (p.status_group || "PRESENTADO") as keyof typeof counts;
      if (counts[group] !== undefined) counts[group]++;
      else counts.PRESENTADO++;
      counts.total++;
    });
    return counts;
  }, [proyectos]);

  // --- STATS ASISTENCIA ---
  const stats_asistencia = useMemo(() => {
    if (!asistencias.length) return null;
    let presentes = 0;
    let licencias = 0;
    let ausencias = 0;
    asistencias.forEach((a) => {
      const s = a.attendance_status?.toUpperCase() || "";
      if (s.includes("ASISTENCIA") || s.includes("PRESENT")) presentes++;
      else if (s.includes("LICENCIA")) licencias++;
      else if (s.includes("AUSEN") || s.includes("FALTA")) ausencias++;
    });
    const total = asistencias.length;
    return {
      total,
      presentes,
      licencias,
      ausencias,
      porcentajePresencia: Math.round((presentes / total) * 100),
    };
  }, [asistencias]);

  const hasSocialLinks =
    persona.facebook_url ||
    persona.twitter_url ||
    persona.instagram_url ||
    persona.tiktok_url;

  // --- NAVBAR SCROLL ---
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 120);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!periodoActivo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <AlertTriangle className="w-10 h-10 text-warning mb-4" />
        <h2 className="text-xl font-bold">Legislador no activo</h2>
        <p className="text-muted-foreground">
          Esta persona no tiene un periodo legislativo activo.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* NAVBAR STICKY MÓVIL */}
      <div
        className={cn(
          "fixed md:hidden top-0 left-0 right-0 z-[100] border-b border-border/80 bg-background/95 backdrop-blur-sm transition-all duration-300 ease-in-out shadow-sm",
          show
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none",
        )}
      >
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="p-1 hover:text-foreground">
              <Home className="w-3.5 h-3.5" />
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="font-semibold text-foreground truncate">
              {persona.fullname}
            </span>
          </nav>
        </div>
      </div>

      {/* ===== HEADER COMPACTO ===== */}
      <div className="relative pb-4 md:pb-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-background shadow-xl overflow-hidden bg-muted relative">
                <Image
                  src={persona.image_url || "/images/default-avatar.svg"}
                  alt={persona.fullname}
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
              {/* Logo Bancada */}
              {bancadaActual?.parliamentary_group?.logo_url && (
                <div className="absolute -bottom-1 -right-1 bg-background p-1 rounded-full shadow-md border border-border">
                  <Image
                    src={bancadaActual.parliamentary_group.logo_url}
                    alt="Bancada"
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                </div>
              )}
            </div>

            {/* Info Texto */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-foreground leading-tight">
                {persona.fullname}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4 text-sm md:text-base">
                <span className="font-semibold text-primary">
                  {bancadaActual?.parliamentary_group?.name ||
                    periodoActivo.elected_by_party?.name}
                </span>
                <span className="hidden md:inline text-muted-foreground">
                  •
                </span>
                <span className="text-muted-foreground">
                  {periodoActivo.electoral_district?.name || "Perú"}
                </span>
              </div>

              {/* Redes Sociales en Header */}
              {hasSocialLinks && (
                <div className="flex justify-center md:justify-start gap-3 mt-2">
                  {persona.facebook_url && (
                    <Link
                      href={persona.facebook_url}
                      target="_blank"
                      className="text-muted-foreground hover:text-[#1877F2] transition-colors"
                    >
                      <SlSocialFacebook className="w-5 h-5" />
                    </Link>
                  )}
                  {persona.twitter_url && (
                    <Link
                      href={persona.twitter_url}
                      target="_blank"
                      className="text-muted-foreground hover:text-[#1DA1F2] transition-colors"
                    >
                      <SlSocialTwitter className="w-5 h-5" />
                    </Link>
                  )}
                  {persona.instagram_url && (
                    <Link
                      href={persona.instagram_url}
                      target="_blank"
                      className="text-muted-foreground hover:text-[#E1306C] transition-colors"
                    >
                      <RiInstagramLine className="w-5 h-5" />
                    </Link>
                  )}
                  {persona.tiktok_url && (
                    <Link
                      href={persona.tiktok_url}
                      target="_blank"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <PiTiktokLogo className="w-5 h-5" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== CONTENIDO CON TABS ===== */}
      <div className="container mx-auto px-4">
        <Tabs defaultValue="labor" className="w-full">
          {/* LISTA DE PESTAÑAS */}
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="labor">Legislativo</TabsTrigger>
            <TabsTrigger
              value="politica"
              // className="data-[state=active]:text-destructive"zz
            >
              Trayectoria
            </TabsTrigger>
            <TabsTrigger value="hoja-vida">Hoja de Vida</TabsTrigger>
          </TabsList>

          {/* --- TAB 1: LABOR LEGISLATIVA (Core) --- */}
          <TabsContent
            value="labor"
            className="space-y-4 animate-in fade-in-50 duration-300"
          >
            {/* KPIs Resumidos */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="shadow-none border bg-card">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-foreground">
                    {stats_proyectos.total}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase font-medium">
                    Total Proyectos
                  </span>
                </CardContent>
              </Card>
              <Card className="shadow-none border bg-card">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-success">
                    {stats_proyectos.APROBADO}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase font-medium">
                    Proyectos Aprobados
                  </span>
                </CardContent>
              </Card>
              {/* <Card className="shadow-none border bg-card">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-blue-500">
                    {stats_asistencia?.porcentajePresencia || 0}%
                  </span>
                  <span className="text-xs text-muted-foreground uppercase font-medium">
                    Asistencia
                  </span>
                </CardContent>
              </Card> */}
              <Card className="shadow-none border bg-card">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-orange-500">
                    {bancadas.length}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase font-medium">
                    Cambios de Bancada
                  </span>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Columna Izquierda: Proyectos (2/3 ancho) */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-l-4 border-l-primary shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" /> Producción
                      Legislativa
                    </CardTitle>
                    <CardDescription>
                      Proyectos de ley presentados en el periodo actual
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {proyectos.slice(0, PREVIEW_LIMIT).map((proyecto) => (
                      <ProyectoItem
                        key={`${proyecto.id}`}
                        proyecto={proyecto}
                      />
                    ))}
                    {proyectos.length > PREVIEW_LIMIT && (
                      <Button
                        onClick={() => setOpenBills(true)}
                        variant="outline"
                        className="w-full"
                      >
                        Ver los {proyectos.length} proyectos
                      </Button>
                    )}
                    {proyectos.length === 0 && (
                      <NoDataMessage text="No ha presentado proyectos." />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Columna Derecha: Asistencia (1/3 ancho) */}
              <div className="lg:col-span-1">
                <Card className="h-full shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Vote className="w-4 h-4 text-blue-500" />
                      Asistencia al Pleno
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats_asistencia ? (
                      <div className="space-y-6">
                        <div className="relative pt-2">
                          <div className="flex items-end justify-between mb-2">
                            <span className="text-3xl font-bold">
                              {stats_asistencia.porcentajePresencia}%
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Presente
                            </span>
                          </div>
                          <div className="h-4 w-full bg-muted rounded-full overflow-hidden flex">
                            <div
                              style={{
                                width: `${(stats_asistencia.presentes / stats_asistencia.total) * 100}%`,
                              }}
                              className="bg-blue-500 h-full"
                            />
                            <div
                              style={{
                                width: `${(stats_asistencia.licencias / stats_asistencia.total) * 100}%`,
                              }}
                              className="bg-yellow-400 h-full"
                            />
                            <div
                              style={{
                                width: `${(stats_asistencia.ausencias / stats_asistencia.total) * 100}%`,
                              }}
                              className="bg-red-500 h-full"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />{" "}
                              Asistencias
                            </span>
                            <span className="font-bold">
                              {stats_asistencia.presentes}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-yellow-400" />{" "}
                              Licencias
                            </span>
                            <span className="font-bold">
                              {stats_asistencia.licencias}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500" />{" "}
                              Faltas
                            </span>
                            <span className="font-bold">
                              {stats_asistencia.ausencias}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <NoDataMessage text="No disponible por el momento" />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* --- TAB 2: TRAYECTORIA POLÍTICA --- */}
          <TabsContent
            value="politica"
            className="space-y-6 animate-in fade-in-50 duration-300"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Historial Bancadas */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-orange-500" />{" "}
                    Historial de Bancadas
                  </CardTitle>
                  <CardDescription>
                    Cambios de grupo parlamentario
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bancadas.length > 0 ? (
                    <div className="relative border-l-2 border-border ml-3 space-y-6 py-2">
                      {bancadas.map((b, i) => (
                        <div key={b.id} className="pl-6 relative">
                          <div
                            className={cn(
                              "absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 bg-background",
                              i === 0
                                ? "border-orange-500"
                                : "border-muted-foreground",
                            )}
                          />
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-bold text-foreground text-base">
                                {b.parliamentary_group?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFechaJsonable(b.start_date)} —{" "}
                                {b.end_date
                                  ? formatFechaJsonable(b.end_date)
                                  : "Actualidad"}
                              </p>
                            </div>
                            {b.parliamentary_group?.logo_url && (
                              <Image
                                src={b.parliamentary_group.logo_url}
                                alt="Logo"
                                width={32}
                                height={32}
                                className="rounded object-contain opacity-80"
                              />
                            )}
                          </div>
                          {b.change_reason && i !== bancadas.length - 1 && (
                            <div className="mt-2 bg-muted/50 p-2 rounded text-xs italic text-muted-foreground border border-border/50">
                              “{b.change_reason}”
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <NoDataMessage text="No ha cambiado de bancada." />
                  )}
                </CardContent>
              </Card>

              {/* Antecedentes */}
              <Card className="pt-0 shadow-sm border-warning/40">
                <CardHeader className="py-2 bg-warning/20">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    Antecedentes reportados
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 px-4 pb-4 flex flex-col gap-4">
                  {persona.backgrounds && persona.backgrounds.length > 0 ? (
                    persona.backgrounds.map((bg, i) => {
                      const isJNE = bg.source?.toUpperCase() === "JNE";
                      const config =
                        backgroundTypeConfig[bg.type?.toUpperCase()] ??
                        DEFAULT_BACKGROUND_CONFIG;

                      return (
                        <div key={bg.id ?? i} className="flex flex-col gap-1.5">
                          {/* Row: badge + fecha */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  "text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                                  config.header,
                                  config.badge,
                                )}
                              >
                                {bg.type}
                              </span>
                              {isJNE && (
                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
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

                          {/* Título */}
                          <p className="text-base font-semibold text-foreground leading-snug">
                            {bg.title}
                          </p>

                          {/* Resumen */}
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {bg.summary}
                          </p>

                          {/* Fuente */}
                          <div className="flex items-center justify-between gap-2">
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
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-primary transition-colors shrink-0"
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

                          {/* Separador manual, excepto el último */}
                          {i < persona.backgrounds.length - 1 && (
                            <div className="border-t border-dashed border-border/60 mt-1" />
                          )}
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* --- TAB 3: HOJA DE VIDA --- */}
          <TabsContent
            value="hoja-vida"
            className="space-y-6 animate-in fade-in-50 duration-300"
          >
            {/* Contacto & Ingresos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm uppercase text-muted-foreground">
                    <Mail className="w-4 h-4" /> Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {periodoActivo.institutional_email ? (
                    <Button
                      variant="secondary"
                      className="w-full justify-between h-auto py-3 px-4"
                      onClick={() =>
                        copyToClipboard(
                          periodoActivo.institutional_email,
                          "email",
                        )
                      }
                    >
                      <span className="truncate text-sm">
                        {periodoActivo.institutional_email}
                      </span>
                      {isCopied("email") ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                  ) : (
                    <NoDataMessage text="Correo no público" />
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm uppercase text-muted-foreground">
                    <DollarSign className="w-4 h-4" /> Ingresos (Año Previo)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {persona.incomes?.length > 0 ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total Declarado
                        </p>
                        <p className="text-2xl font-mono font-bold">
                          S/ {persona.incomes[0].total_income}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <p>
                          <span className="text-muted-foreground">
                            Público:
                          </span>{" "}
                          S/ {persona.incomes[0].public_income}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Privado:
                          </span>{" "}
                          S/ {persona.incomes[0].private_income}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <NoDataMessage text="No disponible" />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Educación y Experiencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-muted-foreground" />{" "}
                    Educación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {persona.postgraduate_education?.map((edu, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-bold">{edu.specialization}</p>
                      <p className="text-muted-foreground text-xs">
                        {edu.graduate_school} • {edu.degree}
                      </p>
                    </div>
                  ))}
                  {persona.university_education?.map((edu, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-bold">{edu.degree}</p>
                      <p className="text-muted-foreground text-xs">
                        {edu.university}
                      </p>
                    </div>
                  ))}
                  {!persona.postgraduate_education?.length &&
                    !persona.university_education?.length && (
                      <NoDataMessage text="Sin registros de educación superior." />
                    )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-muted-foreground" />{" "}
                    Experiencia Laboral
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {persona.work_experience?.map((exp, i) => (
                    <div
                      key={i}
                      className="text-sm relative pl-4 border-l-2 border-border"
                    >
                      <p className="font-bold">{exp.position}</p>
                      <p className="text-muted-foreground text-xs">
                        {exp.organization}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        {exp.period}
                      </p>
                    </div>
                  ))}
                  {!persona.work_experience?.length && (
                    <NoDataMessage text="Sin registros laborales previos." />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <BillsDialog
        proyectos={proyectos}
        isOpen={openBills}
        onClose={() => setOpenBills(false)}
      />
    </div>
  );
}
