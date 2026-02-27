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
  AlertCircle,
  Maximize2,
  Info,
  ArrowDownCircle,
  ArrowUpCircle,
  FileText,
  LayoutDashboard,
  CircleDollarSign,
  Map as MapIcon,
} from "lucide-react";
import {
  SlSocialFacebook,
  SlSocialTwitter,
  SlSocialYoutube,
} from "react-icons/sl";
import { PiTiktokLogo } from "react-icons/pi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useState, useEffect } from "react";
import { NoDataMessage } from "@/components/no-data-message";
import { ShareButton } from "@/components/share-rs";
import { getCandidateTypeIcon, getFlowType } from "@/lib/utils/helper-enums";
import { CandidatePresidentials } from "@/interfaces/candidate";

// --- SUBCOMPONENTE: TIMELINE ---
const TimelineList = ({ items }: { items: PartyHistory[] }) => {
  const sortedItems = [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="relative space-y-8 pl-2">
      {sortedItems.map((item, idx) => (
        <div key={idx} className="relative flex gap-6 group">
          {/* Línea conectora */}
          <div className="absolute left-[5px] top-2 bottom-[-32px] w-px bg-border group-last:bottom-auto group-last:h-full" />

          {/* Punto y Contenido */}
          <div className="flex-shrink-0 mt-1.5 z-10">
            <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-background group-hover:scale-125 transition-transform duration-300" />
          </div>

          <div className="flex-1 pb-2 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
              <span className="text-sm font-bold text-primary tabular-nums bg-primary/5 px-2 py-0.5 rounded w-fit">
                {item.date}
              </span>
            </div>
            <div className="bg-card hover:bg-muted/40 border border-border/60 rounded-xl p-4 transition-all duration-300 shadow-sm hover:shadow-md">
              <p className="text-sm sm:text-base text-foreground font-medium leading-relaxed">
                {item.event}
              </p>
              {item.source && (
                <div className="mt-3 pt-2 border-t border-border/50 flex items-center gap-1.5">
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  {item.source_url ? (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline font-medium"
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
  principalCandidates,
  shareUrl,
}: {
  party: PoliticalPartyDetail;
  principalCandidates: CandidatePresidentials[];
  shareUrl: string;
}) {
  const [showStickyNav, setShowStickyNav] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowStickyNav(window.scrollY > 200);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const partidoColor = party.color_hex ?? "#888888";
  const hasOverlay = needsOverlay(partidoColor);
  const textColor = getTextColor(partidoColor);

  const parentAlliance = party.parent_alliance;

  const displayPlan = {
    summary:
      parentAlliance?.government_plan_summary || party.government_plan_summary,
    url: parentAlliance?.government_plan_url || party.government_plan_url,
    audio: parentAlliance?.government_audio_url || party.government_audio_url,
    isInherited: !!parentAlliance,
    sourceName: parentAlliance?.name,
    sourceId: parentAlliance?.id,
  };
  const hasPlanData = displayPlan.summary && displayPlan.summary.length > 0;

  const formatNumber = (num: number | null | undefined) => {
    if (!num) return "0";
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

  // --- SOCIAL LINKS (JSX Helper) ---
  const SocialLinks = () => (
    <div className="grid grid-cols-2 gap-3 w-full">
      {party.facebook_url && (
        <Link
          href={party.facebook_url}
          target="_blank"
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#1877F2]/10 text-[#1877F2] rounded-lg hover:bg-[#1877F2]/20 transition-colors"
        >
          <SlSocialFacebook className="w-4 h-4" />{" "}
          <span className="text-xs font-bold">Facebook</span>
        </Link>
      )}
      {party.twitter_url && (
        <Link
          href={party.twitter_url}
          target="_blank"
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-black/5 text-black dark:text-white dark:bg-white/10 rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
        >
          <SlSocialTwitter className="w-4 h-4" />{" "}
          <span className="text-xs font-bold">X (Twitter)</span>
        </Link>
      )}
      {party.tiktok_url && (
        <Link
          href={party.tiktok_url}
          target="_blank"
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-pink-500/10 text-pink-600 rounded-lg hover:bg-pink-500/20 transition-colors"
        >
          <PiTiktokLogo className="w-4 h-4" />{" "}
          <span className="text-xs font-bold">TikTok</span>
        </Link>
      )}
      {party.youtube_url && (
        <Link
          href={party.youtube_url}
          target="_blank"
          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600/10 text-red-600 rounded-lg hover:bg-red-600/20 transition-colors"
        >
          <SlSocialYoutube className="w-4 h-4" />{" "}
          <span className="text-xs font-bold">YouTube</span>
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
    <div className="min-h-screen bg-background pb-10">
      {/* NAVBAR STICKY */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-[50] border-b border-border/80 bg-background/95 backdrop-blur-sm transition-all duration-300 shadow-sm",
          showStickyNav
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
            <Link href="/partidos" className="hover:text-foreground">
              Partidos
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="font-semibold text-foreground truncate max-w-[200px]">
              {party.name}
            </span>
          </nav>
        </div>
      </div>

      {/* HERO SECTION */}
      <div
        className="relative border-b border-border"
        style={{
          background: `linear-gradient(135deg, ${partidoColor} 0%, ${partidoColor}dd 100%)`,
        }}
      >
        {hasOverlay && <div className="absolute inset-0 bg-black/20" />}

        <div className="container mx-auto p-4 pt-6 pb-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Logo */}
            <div className="relative w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl flex items-center justify-center shadow-2xl ring-4 ring-white/20 flex-shrink-0">
              {party.logo_url ? (
                <Image
                  src={party.logo_url}
                  alt={party.name}
                  fill
                  className="object-contain p-3"
                  priority
                />
              ) : (
                <Building2 className="w-12 h-12 text-muted-foreground" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left min-w-0">
              <h1
                className={cn(
                  "text-3xl md:text-5xl font-black mb-2 leading-tight tracking-tight",
                  textColor,
                )}
              >
                {party.name}
              </h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
                {/* {party.acronym && (
                  <Badge className="bg-background/20 backdrop-blur-md border-0 text-inherit">
                    {party.acronym}
                  </Badge>
                )} */}
                {party.ideology?.split("\n").map((ide, i) => (
                  <Badge
                    key={i}
                    className={cn(
                      "bg-background/20 backdrop-blur-md border-0",
                      textColor,
                    )}
                  >
                    {ide}
                  </Badge>
                ))}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto md:mx-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
                  <span className={cn("block text-xl font-bold", textColor)}>
                    {añosFundacion || "-"}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] opacity-80 uppercase font-medium",
                      textColor,
                    )}
                  >
                    Años
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
                  <span className={cn("block text-xl font-bold", textColor)}>
                    {formatNumber(party.total_afiliates)}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] opacity-80 uppercase font-medium",
                      textColor,
                    )}
                  >
                    Afiliados
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
                  <span className={cn("block text-xl font-bold", textColor)}>
                    {totalSeats}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] opacity-80 uppercase font-medium",
                      textColor,
                    )}
                  >
                    Escaños
                  </span>
                </div>
              </div>
              <ShareButton
                title={`${party.name}`}
                url={shareUrl}
                text={`Conoce más sobre ${party.name} en VotaBien Perú`}
                trackingId={party.id}
                trackingType="partido"
              />
            </div>
          </div>
        </div>
      </div>
      {/* CONTENIDO CON TABS */}
      <div className="container mx-auto mt-8">
        <Tabs defaultValue="resumen" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-muted/50 rounded-xl gap-1">
            <TabsTrigger
              value="resumen"
              className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex gap-2 items-center justify-center"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-xs font-bold">Resumen</span>
            </TabsTrigger>
            <TabsTrigger
              value="trayectoria"
              className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex gap-2 items-center justify-center"
            >
              <History className="w-4 h-4" />
              <span className="text-xs font-bold">Trayectoria</span>
            </TabsTrigger>
            <TabsTrigger
              value="finanzas"
              className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex gap-2 items-center justify-center"
            >
              <CircleDollarSign className="w-4 h-4" />
              <span className="text-xs font-bold">Finanzas</span>
            </TabsTrigger>
            <TabsTrigger
              value="territorio"
              className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex gap-2 items-center justify-center"
            >
              <MapIcon className="w-4 h-4" />
              <span className="text-xs font-bold">Territorio</span>
            </TabsTrigger>
          </TabsList>

          {/* === TAB 1: RESUMEN (Plan, Identidad, Contacto) === */}
          <TabsContent
            value="resumen"
            className="space-y-6 animate-in fade-in-50 duration-300"
          >
            {/* 1. PLAN DE GOBIERNO (Destacado) */}
            {hasPlanData && (
              <div className="space-y-2">
                {displayPlan.isInherited && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-3">
                    <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-bold text-primary">Plan de Alianza</p>
                      <p className="text-muted-foreground">
                        Este plan pertenece a la alianza{" "}
                        <strong>{displayPlan.sourceName}</strong>.
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 2. IDENTIDAD */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    Candidatura Presidencial
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {principalCandidates &&
                    principalCandidates.length > 0 &&
                    principalCandidates.map((c) => (
                      <Link
                        key={c.id}
                        href={`/candidatos/${c.person.id}`}
                        className="flex items-center gap-4 rounded-lg p-2 -mx-2 hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                          {c.person.image_candidate_url ? (
                            <Image
                              src={c.person.image_candidate_url}
                              alt={c.person.fullname}
                              width={48}
                              height={48}
                              className="object-contain w-full h-full"
                            />
                          ) : (
                            <Users className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {c.person.fullname}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {c.type}
                          </p>
                        </div>
                      </Link>
                    ))}
                  {!principalCandidates && (
                    <NoDataMessage text="Sin candidatos" />
                  )}
                </CardContent>
              </Card>

              {/* 3. CONTACTO Y REDES */}
              <div className="space-y-6">
                {hasSocialLinks && (
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        Redes Sociales
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SocialLinks />
                    </CardContent>
                  </Card>
                )}

                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" /> Sede
                      Central
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {party.main_office ? (
                      <div className="flex gap-3">
                        <div className="bg-muted p-2 h-fit rounded">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="text-sm">
                          <p className="font-medium text-foreground">
                            {party.main_office}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Dirección Legal
                          </p>
                        </div>
                      </div>
                    ) : (
                      <NoDataMessage text="Dirección no registrada." />
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                      {party.phone && (
                        <a
                          href={`tel:${party.phone}`}
                          className="flex items-center gap-2 text-sm p-2 hover:bg-muted rounded transition-colors"
                        >
                          <Phone className="w-4 h-4 text-muted-foreground" />{" "}
                          {party.phone}
                        </a>
                      )}
                      {party.email && (
                        <a
                          href={`mailto:${party.email}`}
                          className="flex items-center gap-2 text-sm p-2 hover:bg-muted rounded transition-colors truncate"
                        >
                          <Mail className="w-4 h-4 text-muted-foreground" />{" "}
                          <span className="truncate">{party.email}</span>
                        </a>
                      )}
                      {party.website && (
                        <a
                          href={`https://${party.website}`}
                          target="_blank"
                          className="flex items-center gap-2 text-sm p-2 hover:bg-muted rounded transition-colors col-span-full text-primary font-medium"
                        >
                          <Globe className="w-4 h-4" /> {party.website}{" "}
                          <ExternalLink className="w-3 h-3 ml-auto" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* === TAB 2: TRAYECTORIA (Historia y Legal) === */}
          <TabsContent
            value="trayectoria"
            className="space-y-6 animate-in fade-in-50 duration-300"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* TIMELINE (Columna principal) */}
              <div className="lg:col-span-7">
                <Card className="h-full shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <History className="w-5 h-5 text-primary" /> Cronología
                      </CardTitle>
                      {hasMoreTimeline && (
                        <Badge variant="secondary" className="text-[10px]">
                          {timelineItems.length} Eventos
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      Hitos importantes en la historia del partido
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {timelineItems.length > 0 ? (
                      <>
                        <TimelineList items={initialTimeline} />
                        {hasMoreTimeline && (
                          <div className="mt-8 pt-4 border-t text-center">
                            <Credenza>
                              <CredenzaTrigger asChild>
                                <Button variant="outline" className="w-full">
                                  <Maximize2 className="w-4 h-4 mr-2" /> Ver
                                  historia completa
                                </Button>
                              </CredenzaTrigger>
                              <CredenzaContent className="max-w-2xl h-[80vh] flex flex-col">
                                <CredenzaHeader>
                                  <CredenzaTitle>
                                    Historia Completa
                                  </CredenzaTitle>
                                </CredenzaHeader>
                                <CredenzaBody className="overflow-y-auto pr-2">
                                  <TimelineList items={timelineItems} />
                                </CredenzaBody>
                              </CredenzaContent>
                            </Credenza>
                          </div>
                        )}
                      </>
                    ) : (
                      <NoDataMessage text="No hay eventos registrados en la línea de tiempo." />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* LEGAL (Columna lateral) */}
              <div className="lg:col-span-5">
                <Card className="h-full shadow-sm border-orange-200 dark:border-orange-900 bg-orange-50/30 dark:bg-orange-950/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                      <Gavel className="w-5 h-5" /> Antecedentes
                    </CardTitle>
                    <CardDescription>
                      Sanciones y procesos reportados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {party.legal_cases && party.legal_cases.length > 0 ? (
                      <div className="space-y-4">
                        {party.legal_cases.map((legalCase, i) => (
                          <div
                            key={i}
                            className="bg-background border border-border p-4 rounded-xl shadow-sm"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <Badge
                                variant="outline"
                                className="text-[10px] font-bold border-orange-200 bg-orange-50 text-orange-800"
                              >
                                {legalCase.status || "Reportado"}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {legalCase.date}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm mb-1">
                              {legalCase.case_type}
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                              {legalCase.description}
                            </p>
                            {legalCase.source_url && (
                              <a
                                href={legalCase.source_url}
                                target="_blank"
                                className="text-[10px] text-primary hover:underline flex items-center justify-end gap-1"
                              >
                                Fuente: {legalCase.source_name}{" "}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <p className="font-medium text-green-800">
                          Sin antecedentes
                        </p>
                        <p className="text-xs text-green-700/70 mt-1">
                          No se encontraron sanciones firmes reportadas.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* === TAB 3: FINANZAS === */}
          <TabsContent
            value="finanzas"
            className="space-y-6 animate-in fade-in-50 duration-300"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CircleDollarSign className="w-5 h-5 text-emerald-600" />{" "}
                  Reportes Financieros
                </CardTitle>
                <CardDescription>
                  Declaraciones presentadas a la ONPE
                </CardDescription>
              </CardHeader>
              <CardContent>
                {party.financing_reports &&
                party.financing_reports.length > 0 ? (
                  <div className="space-y-6">
                    {party.financing_reports.map((report) => {
                      const ingresos = report.transactions
                        .filter((t) => t.category === "INGRESO")
                        .reduce((acc, t) => acc + (t.amount || 0), 0);
                      const gastos = report.transactions
                        .filter((t) => t.category === "GASTO")
                        .reduce((acc, t) => acc + (t.amount || 0), 0);

                      // Badge Estado
                      const isLate = report.filing_status
                        .toLowerCase()
                        .includes("fuera");
                      const isMissing = report.filing_status
                        .toLowerCase()
                        .includes("no presentado");
                      const statusColor = isMissing
                        ? "destructive"
                        : isLate
                          ? "warning"
                          : "success";

                      return (
                        <div
                          key={report.id}
                          className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                        >
                          {/* Header Reporte */}
                          <div className="bg-muted/30 p-4 border-b flex flex-col md:flex-row justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-foreground">
                                  {report.report_name}
                                </h3>
                                <Badge
                                  variant={statusColor}
                                  className="text-[10px] h-5"
                                >
                                  {report.filing_status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />{" "}
                                {new Date(
                                  report.period_start,
                                ).toLocaleDateString()}{" "}
                                -{" "}
                                {new Date(
                                  report.period_end,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            {/* Resumen Rápido */}
                            <div className="flex gap-4 text-right">
                              <div>
                                <span className="text-[10px] uppercase text-muted-foreground font-bold block">
                                  Ingresos
                                </span>
                                <span className="text-sm font-bold text-emerald-600 flex items-center justify-end gap-1">
                                  <ArrowUpCircle className="w-3 h-3" />{" "}
                                  {formatCurrency(ingresos)}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase text-muted-foreground font-bold block">
                                  Gastos
                                </span>
                                <span className="text-sm font-bold text-rose-600 flex items-center justify-end gap-1">
                                  <ArrowDownCircle className="w-3 h-3" />{" "}
                                  {formatCurrency(gastos)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Transacciones (Collapsible-like but open) */}
                          <div className="bg-card p-0 divide-y">
                            {report.transactions.map((t) => (
                              <div
                                key={t.id}
                                className="p-3 px-4 flex justify-between items-center hover:bg-muted/20"
                              >
                                <div>
                                  <p className="text-xs font-medium text-foreground">
                                    {getFlowType(t.flow_type)}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] h-4 mt-1 border-muted-foreground/30 text-muted-foreground"
                                  >
                                    {t.category}
                                  </Badge>
                                </div>
                                <span
                                  className={cn(
                                    "font-mono text-sm font-medium",
                                    t.category === "GASTO"
                                      ? "text-rose-600"
                                      : "text-emerald-600",
                                  )}
                                >
                                  {t.category === "GASTO" ? "-" : "+"}{" "}
                                  {formatCurrency(t.amount || 0)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <NoDataMessage text="No hay reportes financieros disponibles." />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === TAB 4: TERRITORIO === */}
          <TabsContent
            value="territorio"
            className="space-y-6 animate-in fade-in-50 duration-300"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-primary" /> Representación
                  Nacional
                </CardTitle>
                <CardDescription>
                  Distribución de escaños por región
                </CardDescription>
              </CardHeader>
              <CardContent>
                {party.seats_by_district &&
                party.seats_by_district.length > 0 ? (
                  <PeruSeatsMapSimple
                    partyName={party.name}
                    partyColor={party.color_hex ?? "#888888"}
                    seatsByDistrict={party.seats_by_district}
                    totalSeats={totalSeats}
                  />
                ) : (
                  <NoDataMessage text="No tiene representación parlamentaria actual." />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
