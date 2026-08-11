"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import {
  FileText,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Mail,
  Check,
  GraduationCap,
  AlertTriangle,
  Briefcase,
  ChevronRight,
  Home,
  Vote,
  ArrowRightLeft,
  ExternalLink,
  CheckCircle2,
  Newspaper,
  Copy,
  Gavel,
  DollarSign,
  Car,
  Building2,
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { formatFechaJsonable } from "@/lib/utils/date";
import { NoDataMessage } from "@/components/no-data-message";
import BillsDialog from "./bills-dialog";
import ProyectoItem from "./proyect-item";
import { cn } from "@/lib/utils";
import {
  backgroundStatusConfig,
  backgroundTypeConfig,
  DEFAULT_BACKGROUND_CONFIG,
  SEVERITY_ORDER,
  TYPE_LABELS,
  TYPE_LABELS_SINGULAR,
} from "@/lib/utils/background-config";
import { LegislatorDetailWithPerson } from "@/interfaces/legislator";
import { BillBasic } from "@/interfaces/bill";
import { calcBillStats } from "@/lib/utils/bill-status";

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

export default function DetailLegislador({
  legislador,
  approvedBills = [],
}: {
  legislador: LegislatorDetailWithPerson;
  approvedBills?: BillBasic[];
}) {
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  const [openBills, setOpenBills] = useState(false);
  const [openApprovedBills, setOpenApprovedBills] = useState(false);

  const persona = legislador.person;
  const periodoActivo = legislador;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const proyectos = periodoActivo?.bill_authorships || [];
  const bancadas = periodoActivo?.parliamentary_memberships || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const asistencias = periodoActivo?.attendances || [];
  const bancadaActual = bancadas.length > 0 ? bancadas[0] : null;
  const incomeData = persona.incomes?.[0];
  const hasAssets = (persona.assets?.length || 0) > 0;

  const PREVIEW_LIMIT = 4; // Mostramos un poco más porque hay más espacio

  // --- STATS PROYECTOS ---
  const stats_proyectos = useMemo(() => calcBillStats(proyectos), [proyectos]);

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
  const byType = persona.backgrounds?.reduce(
    (acc, bg) => {
      const key = bg.type?.toUpperCase();
      if (key) acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const backgroundTypes = SEVERITY_ORDER.filter((t) => byType?.[t]);

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
                  src={
                    persona.image_url ||
                    persona.image_candidate_url ||
                    "/images/default-avatar.svg"
                  }
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

              {persona.is_incumbent && (
                <Badge variant="secondary" className="text-xs mr-2">
                  Reelegido
                </Badge>
              )}

              <Badge
                className={cn(
                  "text-xs",
                  periodoActivo.chamber === "SENADO"
                    ? "bg-role-senator/90 text-white"
                    : periodoActivo.chamber === "DIPUTADOS"
                      ? "bg-role-deputy/90 text-white"
                      : "bg-primary/90",
                )}
              >
                {periodoActivo.chamber === "SENADO"
                  ? "Senador"
                  : periodoActivo.chamber === "DIPUTADOS"
                    ? "Diputado"
                    : "Congresista"}
              </Badge>

              {periodoActivo.institutional_email && (
                <Button
                  onClick={() =>
                    copyToClipboard(periodoActivo.institutional_email, "email")
                  }
                  variant="outline"
                  title="Copiar correo institucional"
                >
                  {periodoActivo.institutional_email}
                  {isCopied("email") ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              )}
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
        <Tabs defaultValue="labor" className="w-full">
          {/* LISTA DE PESTAÑAS */}
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="labor">Legislativo</TabsTrigger>
            <TabsTrigger value="politica">Historial Legal</TabsTrigger>
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="noticias">Noticias</TabsTrigger>
          </TabsList>

          {/* --- TAB 1: LABOR LEGISLATIVA (Core) --- */}
          <TabsContent
            value="labor"
            className="space-y-4 animate-in fade-in-50 duration-300"
          >
            {/* KPIs Resumidos */}
            <div className="grid grid-cols-4 gap-0 rounded-lg border bg-card overflow-hidden">
              {[
                {
                  value: stats_proyectos.total,
                  label: "Proyectos",
                  color: "text-foreground",
                },
                {
                  value: stats_proyectos.PUBLICADO,
                  label: "Publicados",
                  color: "text-success",
                },
                {
                  value: stats_proyectos.ARCHIVADO + stats_proyectos.RETIRADO,
                  label: "Archivados / Retirados",
                  color: "text-destructive",
                },
                {
                  value: `${stats_proyectos.total > 0 ? Math.round((stats_proyectos.PUBLICADO / stats_proyectos.total) * 100) : 0}%`,
                  label: "Efectividad",
                  color: "text-orange-500",
                },
              ].map((stat, i, arr) => (
                <div
                  key={stat.label}
                  className={cn(
                    "flex flex-col items-center justify-center py-3 px-2 text-center",
                    i !== arr.length - 1 && "border-r border-border",
                  )}
                >
                  <span
                    className={cn(
                      "text-xl font-bold leading-tight",
                      stat.color,
                    )}
                  >
                    {stat.value}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase font-medium leading-tight mt-0.5">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Columna Izquierda: Proyectos (2/3 ancho) */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-l-4 border-l-primary shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Proyectos 2026-2031
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

                {approvedBills.length > 0 && (
                  <Card className="border-l-4 border-l-green-500 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        Proyectos Aprobados (2021-2026)
                      </CardTitle>
                      <CardDescription>
                        Proyectos de ley aprobados en el periodo anterior
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {approvedBills.slice(0, PREVIEW_LIMIT).map((proyecto) => (
                        <ProyectoItem
                          key={`approved-${proyecto.id}`}
                          proyecto={proyecto}
                        />
                      ))}
                      {approvedBills.length > PREVIEW_LIMIT && (
                        <Button
                          onClick={() => setOpenApprovedBills(true)}
                          variant="outline"
                          className="w-full"
                        >
                          Ver los {approvedBills.length} proyectos aprobados
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Columna Derecha: Bancadas + Asistencia (1/3 ancho) */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ArrowRightLeft className="w-4 h-4 text-orange-500" />
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
                                <p className="font-bold text-foreground text-sm">
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
                                &ldquo;{b.change_reason}&rdquo;
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

                <Card className="shadow-sm">
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

          {/* --- TAB 2: HISTORIAL LEGAL --- */}
          <TabsContent
            value="politica"
            className="space-y-6 animate-in fade-in-50 duration-300"
          >
            {/* Antecedentes */}
            <Card className="pt-0 shadow-sm border-warning/40">
              <CardContent className="pt-2 px-4 pb-4 flex flex-col gap-4 overflow-y-auto">
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

                      // 1. Extraemos la configuración del estado
                      const statusConfig = bg.status
                        ? backgroundStatusConfig[bg.status.toUpperCase()]
                        : null;

                      return (
                        <div key={bg.id ?? i} className="flex flex-col gap-2">
                          {/* Row: badges + fecha */}
                          <div className="flex items-start sm:items-center justify-between gap-2 flex-col sm:flex-row">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={cn(
                                  "text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                                  config.header,
                                  config.badge,
                                )}
                              >
                                {bg.type}
                              </span>

                              {/* 2. Agregamos el Badge de Estado Legal */}
                              {statusConfig && (
                                <span
                                  className={cn(
                                    "text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide",
                                    statusConfig.badge,
                                  )}
                                >
                                  {bg.status.replace("_", " ")}
                                </span>
                              )}

                              {isJNE && (
                                <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full border border-border/50">
                                  JNE
                                </span>
                              )}
                            </div>
                            {bg.publication_date && (
                              <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                                {new Intl.DateTimeFormat("es-PE", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }).format(new Date(bg.publication_date))}
                              </span>
                            )}
                          </div>

                          {/* Título y Resumen */}
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground leading-snug">
                              {bg.title}
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {bg.summary}
                            </p>
                          </div>

                          {/* 3. Agregamos la Caja de Sanción adaptada a esta Card */}
                          {bg.sanction && (
                            <div className="bg-destructive/5 border border-destructive/20 rounded-md p-2 flex gap-2 items-start mt-1">
                              <Gavel className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-destructive uppercase tracking-wider mb-0.5">
                                  Sanción Impuesta / Fallo
                                </span>
                                <p className="text-xs text-foreground/90 font-medium leading-snug">
                                  {bg.sanction}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* 4. Footer con el nuevo botón de Evidencia */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 mt-1">
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
                                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-md transition-all active:scale-[0.98] w-full sm:w-auto"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {isJNE
                                  ? "Revisar documento oficial"
                                  : `Ver en ${new URL(
                                      bg.source_url,
                                    ).hostname.replace("www.", "")}`}
                              </Link>
                            )}
                          </div>

                          {/* Separador manual, excepto el último */}
                          {i < persona.backgrounds.length - 1 && (
                            <div className="border-t border border-border/60 mt-2 mb-1" />
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
          </TabsContent>

          {/* --- TAB 3: HOJA DE VIDA --- */}
          <TabsContent
            value="perfil"
            className="space-y-6 animate-in fade-in-50 duration-300"
          >
            {/* Contacto & Ingresos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Educación y Experiencia */}
              <div className="grid grid-cols-1 gap-6 md:col-span-1">
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
                        <p className="text-muted-foreground text-sm">
                          {exp.organization}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
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

              {/* Derecha: Bienes Declarados */}
              <div className="md:col-span-2 space-y-6">
                {!incomeData && !hasAssets ? (
                  <Card className="shadow-sm">
                    <CardContent className="pt-6">
                      <NoDataMessage
                        text="No se registra información patrimonial declarada."
                        icon={DollarSign}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {incomeData && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="shadow-sm">
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
                        <Card className="shadow-sm">
                          <CardContent className="p-5">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                              Sector público
                            </p>
                            <p className="text-2xl font-bold tabular-nums">
                              {formatCurrency(incomeData.public_income)}
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="shadow-sm">
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

                    <Card className="shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          Bienes declarados
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-2">
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
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* --- TAB 4: NOTICIAS --- */}
          <TabsContent
            value="noticias"
            className="space-y-6 animate-in fade-in-50 duration-300"
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-muted-foreground" />
                  En los medios
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                          <span className="inline-block px-2 py-0.5 rounded text-sm font-bold bg-primary/8 text-primary mb-2">
                            {bio.date}
                          </span>
                          <p className="text-sm text-justify text-foreground/80 leading-relaxed">
                            {bio.description}
                          </p>
                          {bio.source_url && (
                            <Link
                              href={bio.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-2 text-sm text-muted-foreground/60 hover:text-primary transition-colors"
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
                  <NoDataMessage text="Sin cobertura mediática registrada." />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BillsDialog
        proyectos={proyectos}
        isOpen={openBills}
        onClose={() => setOpenBills(false)}
      />
      <BillsDialog
        proyectos={approvedBills}
        isOpen={openApprovedBills}
        onClose={() => setOpenApprovedBills(false)}
      />
    </div>
  );
}
