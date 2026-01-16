"use client";

import {
  Building2,
  History,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
  Users,
  ChevronRight,
  Home,
  ScrollText,
  Gavel,
  Wallet,
  AlertCircle,
  Maximize2,
  Info,
  ArrowDownCircle,
  ArrowUpCircle,
  FileText,
} from "lucide-react";
import {
  SlSocialFacebook,
  SlSocialTwitter,
  SlSocialYoutube,
} from "react-icons/sl";
import { PiTiktokLogo } from "react-icons/pi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PartyHistory, PoliticalPartyDetail } from "@/interfaces/politics";
import Image from "next/image";
import Link from "next/link";
import { getTextColor, needsOverlay } from "@/lib/utils/color-utils";
import { cn } from "@/lib/utils";
import PeruSeatsMapSimple from "@/components/politics/peru-seats-map";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/ui/credenza";
import { PlanGobiernoFlashcards } from "./flash-cards";

const TimelineList = ({ items }: { items: PartyHistory[] }) => {
  const sortedItems = [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="relative space-y-6 sm:space-y-8">
      {sortedItems.map((item, idx) => (
        <div key={idx} className="relative flex gap-4 sm:gap-6 group">
          {/* Fecha */}
          <div className="flex-shrink-0 w-16 sm:w-24 text-right pt-1">
            <span className="text-sm sm:text-base font-bold text-primary tabular-nums block">
              {item.date}
            </span>
          </div>

          {/* Línea y punto */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="relative z-10 w-3 h-3 rounded-full bg-primary ring-4 ring-background group-hover:ring-primary/20 group-hover:scale-125 transition-all duration-300 mt-1.5" />
            {idx < sortedItems.length - 1 && (
              <div className="w-px flex-1 bg-gradient-to-b from-primary/80 via-primary/40 to-primary/20 min-h-[3rem]" />
            )}
          </div>

          {/* Contenido */}
          <div className="flex-1 pb-2 min-w-0">
            <div className="bg-muted/40 hover:bg-muted/70 border border-border/50 hover:border-primary/30 rounded-xl p-3 sm:p-4 transition-all duration-300 group-hover:shadow-md">
              <p className="text-sm sm:text-base text-foreground leading-relaxed font-medium">
                {item.event}
              </p>
              {item.source && (
                <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  {item.source_url ? (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Fuente: {item.source}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Fuente: {item.source}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function DetailParty({
  party,
}: {
  party: PoliticalPartyDetail;
}) {
  const partidoColor = party.color_hex ?? "#888888";
  const hasOverlay = needsOverlay(partidoColor);
  const textColor = getTextColor(partidoColor);

  const parentAlliance = party.parent_alliance;

  const displayPlan = {
    summary:
      parentAlliance?.government_plan_summary || party.government_plan_summary,
    url: parentAlliance?.government_plan_url || party.government_plan_url,
    audio: parentAlliance?.government_audio_url || party.government_audio_url,
    isInherited: !!parentAlliance, // Flag para saber si mostrar el aviso
    sourceName: parentAlliance?.name,
    sourceId: parentAlliance?.id,
  };
  const hasPlanData = displayPlan.summary && displayPlan.summary.length > 0;

  const formatNumber = (num: number | null | undefined) => {
    if (!num) return "No disponible";
    return new Intl.NumberFormat("es-PE").format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount);
  };

  const totalSeats = party.seats_by_district.reduce(
    (acc, item) => acc + (item.seats || 0),
    0,
  );

  const añosFundacion = party.foundation_date
    ? new Date().getFullYear() - new Date(party.foundation_date).getFullYear()
    : null;

  // --- SOCIAL LINKS ---
  const socialLinks = (
    <div className="grid grid-cols-2 gap-3 w-full">
      {party.facebook_url && (
        <Link
          href={party.facebook_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-center gap-2 px-3 py-3 bg-[#1877F2] text-white rounded-lg hover:opacity-90 active:scale-95 transition-all duration-200 shadow-sm"
        >
          <SlSocialFacebook className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-semibold truncate">Facebook</span>
        </Link>
      )}

      {party.twitter_url && (
        <Link
          href={party.twitter_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-center gap-2 px-3 py-3 bg-[#1DA1F2] text-white rounded-lg hover:opacity-90 active:scale-95 transition-all duration-200 shadow-sm"
        >
          <SlSocialTwitter className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-semibold truncate">X (Twitter)</span>
        </Link>
      )}

      {party.tiktok_url && (
        <Link
          href={party.tiktok_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-center gap-2 px-3 py-3 bg-gradient-to-br from-[#010101] via-[#121212] to-[#343434] text-white rounded-lg hover:opacity-90 active:scale-95 transition-all duration-200 shadow-sm"
        >
          <PiTiktokLogo className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-semibold truncate">TikTok</span>
        </Link>
      )}

      {party.youtube_url && (
        <Link
          href={party.youtube_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-center gap-2 px-3 py-3 bg-[#FF0000] text-white rounded-lg hover:opacity-90 active:scale-95 transition-all duration-200 shadow-sm"
        >
          <SlSocialYoutube className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-semibold truncate">YouTube</span>
        </Link>
      )}
    </div>
  );

  const hasSocialLinks =
    party.facebook_url ||
    party.twitter_url ||
    party.tiktok_url ||
    party.youtube_url;

  const MAX_TIMELINE_ITEMS = 5;
  const timelineItems = party.party_timeline || [];
  const sortedTimeline = [...timelineItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const initialTimeline = sortedTimeline.slice(0, MAX_TIMELINE_ITEMS);
  const hasMoreTimeline = sortedTimeline.length > MAX_TIMELINE_ITEMS;

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div
        className="border-b border-border bg-background backdrop-brightness-0 supports-[backdrop-filter]:bg-background sticky top-0 z-50"
        style={{
          background: `linear-gradient(135deg, ${partidoColor} 0%, ${partidoColor}dd 100%)`,
        }}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-xs text-foreground">
            <Link
              href="/"
              className="hover:text-foreground transition-colors p-1"
            >
              <Home className="w-3.5 h-3.5" />
            </Link>
            <ChevronRight className="w-3 h-3 text-foreground" />
            <Link
              href="/partidos?active=true"
              className="hover:text-foreground transition-colors"
            >
              Partidos
            </Link>
            <ChevronRight className="w-3 h-3 text-foreground" />
            <span className="font-medium text-foreground max-w-[150px]">
              {party.name}
            </span>
          </nav>

          {/* Badge de Estado en el Nav */}
          {party.active && (
            <Badge
              variant="outline"
              className="hidden sm:flex border-success text-muted bg-success text-[10px] h-5 px-2 gap-1.5"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-muted opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-muted"></span>
              </span>
              Activo
            </Badge>
          )}
        </div>
      </div>

      {/* Header Hero */}
      <div
        className="relative border-b border-border"
        style={{
          background: `linear-gradient(135deg, ${partidoColor} 0%, ${partidoColor}dd 100%)`,
        }}
      >
        {hasOverlay && (
          <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-black/10" />
        )}

        <div className="container mx-auto p-4 relative z-10">
          <div className="flex flex-row items-start sm:items-center gap-6">
            {/* Logo */}
            {party.logo_url ? (
              <div className="relative w-20 h-20 sm:w-28 sm:h-28 bg-white rounded-2xl flex items-center justify-center shadow-2xl ring-2 ring-white/30 overflow-hidden flex-shrink-0">
                <Image
                  src={party.logo_url}
                  alt={party.name}
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 640px) 80px, 112px"
                  priority
                />
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-28 sm:h-28 bg-white/90 rounded-2xl flex items-center justify-center shadow-2xl flex-shrink-0">
                <Building2 className="w-10 h-10 sm:w-14 sm:h-14 text-muted-foreground" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1
                className={cn(
                  "text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 leading-tight",
                  textColor,
                )}
              >
                {party.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2">
                {party.acronym && (
                  <Badge className="bg-background/30 border-0 font-bold text-base">
                    {party.acronym}
                  </Badge>
                )}

                {party.ideology &&
                  party.ideology.split("\n").map((ide, i) => (
                    <Badge
                      key={i}
                      className={cn("bg-background/30 border-0", textColor)}
                    >
                      {ide}
                    </Badge>
                  ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {añosFundacion && (
              <div className="flex items-center gap-3 bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0",
                    textColor,
                  )}
                >
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p
                    className={cn("text-xl font-bold leading-none", textColor)}
                  >
                    {añosFundacion}
                  </p>
                  <p className={cn("text-[10px] opacity-80", textColor)}>
                    años de fundación
                  </p>
                </div>
              </div>
            )}
            {party.total_afiliates && (
              <div className="flex items-center gap-3 bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0",
                    textColor,
                  )}
                >
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p
                    className={cn("text-xl font-bold leading-none", textColor)}
                  >
                    {formatNumber(party.total_afiliates)}
                  </p>
                  <p className={cn("text-[10px] opacity-80", textColor)}>
                    afiliados
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 bg-white/10 p-2 rounded-lg backdrop-blur-sm">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0",
                  textColor,
                )}
              >
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className={cn("text-xl font-bold leading-none", textColor)}>
                  {totalSeats}
                </p>
                <p className={cn("text-[10px] opacity-80", textColor)}>
                  escaños actuales
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMNA IZQUIERDA (Info, Social, Contacto) */}
          <div className="lg:col-span-1 flex flex-col space-y-6 order-1">
            <div className="lg:sticky lg:top-24 space-y-6 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto no-scrollbar pr-1">
              {(party.purpose || party.slogan || party.party_president) && (
                <Card>
                  <CardHeader className="hidden">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ScrollText className="w-5 h-5 text-primary" />
                      Identidad Institucional
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {" "}
                    {party.party_president && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                          Presidente del Partido
                        </p>
                        <p className="text-base font-medium text-foreground flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary/70" />
                          {party.party_president}
                        </p>
                      </div>
                    )}
                    {party.slogan && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                          Lema
                        </p>
                        <p className="text-sm font-medium italic text-foreground/90 bg-muted/30 p-3 rounded-lg border-l-2 border-primary">
                          &ldquo;{party.slogan}&rdquo;
                        </p>
                      </div>
                    )}
                    {party.purpose && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                          Motivo de creación
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed text-justify">
                          {party.purpose}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 2. CARD: REDES SOCIALES */}
              {hasSocialLinks && (
                <Card>
                  <CardHeader className="hidden pb-3">
                    <CardTitle className="text-sm font-semibold uppercase text-muted-foreground">
                      Redes Sociales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>{socialLinks}</CardContent>{" "}
                </Card>
              )}

              {/* 3. CARD: CONTACTO */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Sede Central
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {party.main_office && (
                    <div className="flex items-start gap-3 group">
                      <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">
                          Dirección
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">
                          {party.main_office}
                        </p>
                      </div>
                    </div>
                  )}

                  {party.phone && (
                    <div className="flex items-center gap-3 group">
                      <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
                        <Phone className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">
                          Teléfono
                        </p>
                        <a
                          href={`tel:${party.phone}`}
                          className="text-sm hover:underline"
                        >
                          {party.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {party.email && (
                    <div className="flex items-center gap-3 group">
                      <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
                        <Mail className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">
                          Email
                        </p>
                        <a
                          href={`mailto:${party.email}`}
                          className="text-sm hover:underline truncate block"
                        >
                          {party.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {party.website && (
                    <div className="flex items-center gap-3 group">
                      <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
                        <Globe className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">
                          Web Oficial
                        </p>
                        <a
                          href={`https://${party.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Visitar sitio <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* COLUMNA DERECHA (Timeline, Finanzas, Casos, Mapa) */}
          <div className="lg:col-span-2 order-2 flex flex-col space-y-6">
            {hasPlanData && (
              <div className="space-y-3">
                {/* Aviso si es heredado */}
                {displayPlan.isInherited && (
                  <div className="border border-primary rounded-lg p-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm text-primary">
                      <p className="font-semibold">
                        Plan de Gobierno Unificado
                      </p>
                      <p className="opacity-90">
                        Este partido participa en las elecciones como parte de{" "}
                        <strong>{displayPlan.sourceName}</strong>. A
                        continuación se muestra el plan de gobierno de la
                        alianza.
                      </p>
                    </div>
                  </div>
                )}
                <PlanGobiernoFlashcards
                  audio_url={displayPlan.audio}
                  planes={displayPlan.summary}
                  government_plan_url={displayPlan.url}
                />
              </div>
            )}

            {/* 1. TIMELINE HISTÓRICO */}
            {timelineItems.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    {/* IZQUIERDA: Título */}
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <History className="w-6 h-6" />
                      Línea de Tiempo
                    </CardTitle>

                    {/* DERECHA: Texto informativo (Top Right) */}
                    {hasMoreTimeline && (
                      <span className="text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                        {MAX_TIMELINE_ITEMS} de {timelineItems.length} eventos
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="bg-gradient-to-br from-primary/5 to-primary/0 rounded-xl p-6">
                    {/* Lista cortada */}
                    <TimelineList items={initialTimeline} />

                    {/* ABAJO: Botón Trigger (Bottom) */}
                    {hasMoreTimeline && (
                      <div className="mt-6 pt-4 border-t border-border/50">
                        <Credenza>
                          <CredenzaTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full sm:w-auto mx-auto flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Maximize2 className="w-4 h-4" />
                              Ver historial completo
                            </Button>
                          </CredenzaTrigger>

                          {/* Contenido del Modal/Drawer */}
                          <CredenzaContent className="max-w-3xl max-h-[80vh] flex flex-col">
                            <CredenzaHeader>
                              <CredenzaTitle className="flex items-center gap-2 text-xl mb-4">
                                <History className="w-5 h-5 text-primary" />
                                Historia Completa: {party.name}
                              </CredenzaTitle>
                            </CredenzaHeader>
                            <CredenzaBody className="overflow-y-auto pr-2">
                              <TimelineList items={timelineItems} />
                            </CredenzaBody>
                          </CredenzaContent>
                        </Credenza>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            {/* 2. FINANCIAMIENTO */}
            {party.financing_reports && party.financing_reports.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Wallet className="w-6 h-6 text-foreground/70" />
                    Transparencia Financiera
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Declaraciones presentadas a la ONPE
                  </p>
                </CardHeader>
                <CardContent>
                  {party.financing_reports.map((report) => {
                    // Calcular totales por categoría
                    const ingresos = report.transactions
                      .filter((t) => t.category === "INGRESO")
                      .reduce((acc, t) => acc + (t.amount || 0), 0);

                    const gastos = report.transactions
                      .filter((t) => t.category === "GASTO")
                      .reduce((acc, t) => acc + (t.amount || 0), 0);

                    const deudas = report.transactions
                      .filter((t) => t.category === "DEUDA")
                      .reduce((acc, t) => acc + (t.amount || 0), 0);

                    // Configuración del badge según filing_status
                    const rawStatus = report.filing_status.toLowerCase();
                    let statusConfig = {
                      label: "Presentado",
                      className:
                        "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
                      icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
                    };

                    if (rawStatus.includes("fuera")) {
                      statusConfig = {
                        label: "Fuera de Plazo",
                        className:
                          "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
                        icon: <AlertCircle className="w-3 h-3 mr-1" />,
                      };
                    } else if (
                      rawStatus.includes("no_presentado") ||
                      rawStatus.includes("pendiente")
                    ) {
                      statusConfig = {
                        label: "No Presentado",
                        className:
                          "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
                        icon: <AlertCircle className="w-3 h-3 mr-1" />,
                      };
                    }

                    // Formatear periodo
                    const periodLabel = `${new Date(report.period_start).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })} - ${new Date(report.period_end).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })}`;

                    return (
                      <div
                        key={report.id}
                        className="border border-border rounded-xl overflow-hidden mb-4 last:mb-0"
                      >
                        {/* Header del Reporte */}
                        <div className="bg-muted/40 p-4 border-b border-border flex flex-col w-full">
                          <div className="flex flex-row justify-between items-start w-full gap-2">
                            <h3 className="font-bold text-foreground text-lg leading-tight">
                              {report.report_name}
                            </h3>
                            <Badge
                              variant="outline"
                              className={cn(
                                "border px-3 py-1 font-medium whitespace-nowrap ml-auto",
                                statusConfig.className,
                              )}
                            >
                              {statusConfig.icon}
                              {statusConfig.label.toUpperCase()}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground font-medium mt-0.5">
                            {report.source_name}
                          </p>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                            <Calendar className="w-3 h-3" />
                            <span>Periodo: {periodLabel}</span>
                          </div>
                        </div>

                        {/* Dashboard de Totales */}
                        <div className="grid grid-cols-3 divide-x divide-border border-b border-border bg-card">
                          <div className="p-4 text-center sm:text-left">
                            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center justify-center sm:justify-start gap-1">
                              <ArrowUpCircle className="w-3 h-3 text-emerald-600" />
                              Ingresos
                            </span>
                            <p className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">
                              {formatCurrency(ingresos)}
                            </p>
                          </div>
                          <div className="p-4 text-center sm:text-left">
                            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center justify-center sm:justify-start gap-1">
                              <ArrowDownCircle className="w-3 h-3 text-rose-600" />
                              Gastos
                            </span>
                            <p className="text-xl sm:text-2xl font-bold text-rose-700 mt-1">
                              {formatCurrency(gastos)}
                            </p>
                          </div>
                          <div className="p-4 text-center sm:text-left">
                            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider flex items-center justify-center sm:justify-start gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              Deudas
                            </span>
                            <p className="text-xl sm:text-2xl font-bold text-amber-700 mt-1">
                              {formatCurrency(deudas)}
                            </p>
                          </div>
                        </div>

                        {/* Lista de Transacciones */}
                        <div className="divide-y divide-border bg-card">
                          {report.transactions.map((transaction) => {
                            const labelMap: Record<string, string> = {
                              i_fpd: "Financiamiento Público Directo",
                              i_f_privado: "Financiamiento Privado",
                              i_operacionales: "Ingresos Operacionales",
                              g_fondo_fpd: "Gastos con Fondo Público",
                              g_fondo_f_privado: "Gastos con Fondo Privado",
                              g_operacionales: "Gastos Operacionales",
                              d_total: "Deuda Total Acumulada",
                            };

                            const label =
                              labelMap[transaction.flow_type || ""] ||
                              transaction.flow_type?.replace(/_/g, " ") ||
                              "Concepto Vario";

                            const isIngreso =
                              transaction.category === "INGRESO";
                            const isDeuda = transaction.category === "DEUDA";

                            const amountColor = isIngreso
                              ? "text-emerald-700"
                              : isDeuda
                                ? "text-amber-700"
                                : "text-rose-700";

                            const amountSign =
                              transaction.category === "GASTO" ? "- " : "";

                            return (
                              <div
                                key={transaction.id}
                                className="p-4 hover:bg-muted/10 transition-colors"
                              >
                                <div className="flex flex-row justify-between sm:items-start gap-1 sm:gap-4 mb-2">
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">
                                      {label}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground capitalize bg-muted px-1.5 py-0.5 rounded">
                                        {transaction.category}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-left sm:text-right mt-1 sm:mt-0">
                                    <p
                                      className={cn(
                                        "text-base font-bold tabular-nums",
                                        amountColor,
                                      )}
                                    >
                                      {amountSign}
                                      {formatCurrency(transaction.amount ?? 0)}
                                    </p>
                                  </div>
                                </div>

                                {transaction.notes && (
                                  <div className="mt-2 bg-muted/50 p-3 rounded-lg border border-border/50 text-sm animate-in fade-in duration-300">
                                    <div className="flex items-start gap-2">
                                      <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <span className="font-semibold text-xs text-foreground block mb-0.5">
                                          Observación:
                                        </span>
                                        <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
                                          {transaction.notes}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Footer con Link */}
                        <div className="bg-muted/20 p-3 border-t border-border text-center">
                          <Link
                            href={report.source_url || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Ver documento original en ONPE
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* 3. ANTECEDENTES / CASOS LEGALES */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Gavel className="w-6 h-6" />
                  Antecedentes y Sanciones
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Historial de sanciones electorales y casos judiciales
                </p>
              </CardHeader>
              <CardContent>
                {party.legal_cases && party.legal_cases.length > 0 ? (
                  <div className="space-y-4">
                    {party.legal_cases.map((legalCase, index) => {
                      const status = legalCase.status?.toUpperCase() || "";
                      let badgeClass = "bg-slate-100 text-slate-700"; // Default (Resuelto/Archivado)

                      if (
                        status.includes("SANCIONADO") ||
                        status.includes("FUNDADA")
                      ) {
                        badgeClass =
                          "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400";
                      } else if (
                        status.includes("PROCESO") ||
                        status.includes("INVESTIGACIÓN")
                      ) {
                        badgeClass =
                          "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400";
                      } else if (
                        status.includes("RESUELTO") ||
                        status.includes("SUBSANADO")
                      ) {
                        badgeClass =
                          "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400";
                      }

                      // Lógica de icono según la fuente (Oficial vs Medios)
                      const isOfficialSource = [
                        "ONPE",
                        "JNE",
                        "JURADO NACIONAL DE ELECCIONES",
                        "GOB.PE",
                      ].includes(legalCase.source_name?.toUpperCase() || "");

                      return (
                        <div
                          key={index}
                          className="group relative flex flex-col gap-3 p-4 rounded-lg border border-border/60 bg-card hover:bg-muted/30 hover:border-amber-200/50 transition-all duration-200"
                        >
                          {/* Decoración lateral */}
                          <div className="absolute left-0 top-4 bottom-4 w-1 bg-amber-500 rounded-r-full" />

                          <div className="pl-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div className="space-y-1">
                              <h4 className="font-bold text-foreground text-sm sm:text-base leading-tight">
                                {legalCase.case_type}
                              </h4>
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" />
                                {legalCase.date}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "whitespace-nowrap h-6 text-[10px] font-semibold border",
                                badgeClass,
                              )}
                            >
                              {legalCase.status}
                            </Badge>
                          </div>

                          <div className="pl-3">
                            <p className="text-sm text-foreground/80 leading-relaxed text-justify">
                              {legalCase.description}
                            </p>
                          </div>

                          {/* Footer con Fuente */}
                          {legalCase.source_url && (
                            <div className="pl-3 mt-1 pt-3 border-t border-border/40 flex items-center justify-end">
                              <a
                                href={legalCase.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group/link inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors bg-muted/50 hover:bg-primary/5 px-2 py-1 rounded-md"
                              >
                                {isOfficialSource ? (
                                  <FileText className="w-3 h-3" />
                                ) : (
                                  <ExternalLink className="w-3 h-3" />
                                )}
                                <span className="font-medium">
                                  Fuente: {legalCase.source_name}
                                </span>
                                <ChevronRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900 rounded-xl">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
                      Sin antecedentes registrados
                    </h4>
                    <p className="text-sm text-emerald-700/80 dark:text-emerald-300/80 mt-1 max-w-xs">
                      No se encontraron sanciones ni sentencias firmes
                      reportadas en nuestra base de datos para este partido.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 4. MAPA DE ESCAÑOS (Existente) */}
            {party.seats_by_district && party.seats_by_district.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <PeruSeatsMapSimple
                    partyName={party.name}
                    partyColor={party.color_hex ?? "#888888"}
                    seatsByDistrict={party.seats_by_district}
                    totalSeats={totalSeats}
                  />
                </CardContent>
              </Card>
            )}

            {/* 5. LISTA DE CONGRESISTAS (OCULTO) */}
            {/* {party.elected_legislators && party.elected_legislators.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Users className="w-6 h-6 text-primary" />
                    Congresistas Electos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {party.elected_legislators.map((legislator) => (
                        // ... lógica de renderizado existente ...
                      ))}
                   </div>
                </CardContent>
              </Card>
            )} 
            */}
          </div>
        </div>
      </div>
    </div>
  );
}
