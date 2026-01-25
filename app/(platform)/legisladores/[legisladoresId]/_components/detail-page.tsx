"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import {
  MapPin,
  Calendar,
  FileText,
  ExternalLink,
  Mail,
  Check,
  Copy,
  GraduationCap,
  AlertTriangle,
  History,
  Briefcase,
  ChevronRight,
  Landmark,
  DollarSign,
  Home,
} from "lucide-react";
import { SlSocialFacebook, SlSocialTwitter } from "react-icons/sl";
import { PiTiktokLogo } from "react-icons/pi";
import { RiInstagramLine } from "react-icons/ri";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { formatFechaJsonable } from "@/lib/utils/date";
import { NoDataMessage } from "@/components/no-data-message";
import { PersonDetailLegislator } from "@/interfaces/person";
import BillsDialog from "./bills-dialog";
import ProyectoItem from "./proyect-item";
import { cn } from "@/lib/utils";
import { getBackgroundVariant } from "@/lib/utils/color-enums";

export default function DetailLegislador({
  persona,
}: {
  persona: PersonDetailLegislator;
}) {
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  const [openBills, setOpenBills] = useState(false);

  const periodoActivo = persona.legislative_periods?.find((p) => p.active);
  const periodosOrdenados = [...(persona.legislative_periods || [])].sort(
    (a, b) =>
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
  );

  const proyectos =
    persona.legislative_periods?.flatMap(
      (periodo) => periodo.bill_authorships || [],
    ) || [];

  const PREVIEW_LIMIT = 3;

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

      if (counts[group] !== undefined) {
        counts[group]++;
      } else {
        counts.PRESENTADO++;
      }
      counts.total++;
    });

    return counts;
  }, [proyectos]);

  const tieneEducacion =
    (persona.technical_education?.length ?? 0) > 0 ||
    (persona.no_university_education?.length ?? 0) > 0 ||
    (persona.university_education?.length ?? 0) > 0 ||
    (persona.postgraduate_education?.length ?? 0) > 0;

  const hasSocialLinks =
    persona.facebook_url ||
    persona.twitter_url ||
    persona.instagram_url ||
    persona.tiktok_url;

  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const currentScroll = window.scrollY;
      setShow(currentScroll > 120);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="bg-background min-h-screen pb-10">
      <div
        className={cn(
          // Puse top-0 y z-[100] para forzar que se vea sí o sí
          "fixed md:hidden top-0 left-0 right-0 z-[100] border-b border-border/80 bg-background/95 backdrop-blur-sm transition-all duration-300 ease-in-out shadow-sm",
          show
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none",
        )}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link
              href="/"
              className="p-1 hover:text-foreground transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link
              href="/legisladores"
              className="hover:text-foreground transition-colors font-medium"
            >
              Legisladores
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="font-semibold text-foreground sm:max-w-xs truncate">
              {persona.fullname}
            </span>
          </nav>
        </div>
      </div>
      {/* ===== HEADER INSTITUCIONAL ===== */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar Institucional */}
            <div className="relative w-36 h-36 md:w-44 md:h-44 shrink-0">
              <div className="rounded-full overflow-hidden border-[4px] border-background shadow-xl w-full h-full relative bg-muted">
                <Image
                  src={persona.image_url || "/images/default-avatar.svg"}
                  alt={`Legislador ${persona.fullname}`}
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
              {periodoActivo && (
                <Badge
                  variant="success"
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 shadow-md whitespace-nowrap px-3 py-1 text-sm"
                >
                  En Funciones
                </Badge>
              )}
            </div>

            {/* Info Principal */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                  {persona.fullname}
                </h1>
                <p className="text-lg text-muted-foreground font-medium mt-1">
                  {persona.profession || "Congresista de la República"}
                </p>
              </div>

              {/* Badges de Contexto Legislativo */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                {periodoActivo?.elected_by_party && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20 text-primary-foreground text-sm font-medium">
                    {periodoActivo.elected_by_party.logo_url ? (
                      <Image
                        src={periodoActivo.elected_by_party.logo_url}
                        alt="Partido"
                        width={20}
                        height={20}
                        className="rounded-sm"
                      />
                    ) : (
                      <div className="w-5 h-5 bg-primary/20 rounded-sm" />
                    )}
                    <span className="text-foreground">
                      {periodoActivo.elected_by_party.name}
                    </span>
                  </div>
                )}

                {periodoActivo?.electoral_district && (
                  <Badge
                    variant="outline"
                    className="text-sm py-1.5 px-3 gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    {periodoActivo.electoral_district.name}
                  </Badge>
                )}

                {periodoActivo && (
                  <Badge
                    variant="secondary"
                    className="text-sm py-1.5 px-3 gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(periodoActivo.start_date).getFullYear()} -{" "}
                    {periodoActivo.end_date
                      ? new Date(periodoActivo.end_date).getFullYear()
                      : "Actualidad"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CONTENIDO PRINCIPAL ===== */}
      <div className="container mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* 1. PRODUCCIÓN LEGISLATIVA */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Proyectos de Ley del Periodo Actual
                </CardTitle>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {stats_proyectos.total}
                  </span>
                  <span>proyectos</span>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {stats_proyectos.PRESENTADO}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Presentado
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">
                    {stats_proyectos.EN_PROCESO}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    En Proceso
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {stats_proyectos.APROBADO}
                  </div>
                  <div className="text-xs text-muted-foreground">Aprobado</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">
                    {stats_proyectos.ARCHIVADO + stats_proyectos.RETIRADO}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Archivado/Retirado
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {proyectos.slice(0, PREVIEW_LIMIT).map((proyecto) => (
                  <ProyectoItem key={`${proyecto.id}`} proyecto={proyecto} />
                ))}
              </div>

              {proyectos.length > PREVIEW_LIMIT && (
                <div className="mt-4 pt-4 border-t border-border">
                  <Button
                    onClick={() => setOpenBills(true)}
                    variant="outline"
                    className="w-full"
                  >
                    Ver todos los {proyectos.length} proyectos de ley
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. TRANSPARENCIA */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                <Landmark className="w-5 h-5 text-primary" />
                Transparencia Patrimonial
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Ingresos */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="w-4 h-4" /> Ingresos Declarados
                </h4>
                {persona.incomes?.length > 0 ? (
                  <div className="overflow-x-auto border border-border rounded-lg">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted text-muted-foreground font-medium">
                        <tr>
                          <th className="px-4 py-2">Sector Público</th>
                          <th className="px-4 py-2">Sector Privado</th>
                          <th className="px-4 py-2 text-right bg-muted/80">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {persona.incomes.map((inc, i) => (
                          <tr key={i} className="bg-card">
                            <td className="px-4 py-2 font-mono">
                              {inc.public_income}
                            </td>
                            <td className="px-4 py-2 font-mono">
                              {inc.private_income}
                            </td>
                            <td className="px-4 py-2 font-mono font-bold text-right bg-muted/20">
                              {inc.total_income}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <NoDataMessage text="No registra información de ingresos." />
                )}
              </div>
            </CardContent>
          </Card>

          {/* 4. ANTECEDENTES (Siempre visible por importancia política) */}
          <Card className="pt-0 shadow-sm border-warning/80">
            <CardHeader className="pt-2 border-b border-warning/20 bg-warning/15">
              <CardTitle className="flex items-center gap-2 text-lg text-foreground/80">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Antecedentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {persona.backgrounds && persona.backgrounds.length > 0 ? (
                <div className="space-y-3">
                  {persona.backgrounds.map((bg) => (
                    <div
                      key={bg.id}
                      className="p-3 rounded-lg border border-border bg-card"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <Badge
                          variant={getBackgroundVariant(bg.type)}
                          className="text-[10px]"
                        >
                          {bg.type}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground">
                          {formatFechaJsonable(bg.publication_date)}
                        </span>
                      </div>
                      <h5 className="font-medium text-sm text-foreground">
                        {bg.title}
                      </h5>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {bg.summary}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-foreground/70">
                          Estado: {bg.status}
                        </span>
                        {bg.source_url && (
                          <Link
                            href={bg.source_url}
                            target="_blank"
                            className="ml-auto text-[10px] text-primary hover:underline flex items-center gap-1"
                          >
                            Ver fuente <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <NoDataMessage text="No registra antecedentes." />
              )}
            </CardContent>
          </Card>
        </div>

        {/* --- COLUMNA DERECHA (Sidebar) --- */}
        <div className="lg:col-span-4 space-y-6">
          {/* CONTACTO INSTITUCIONAL */}
          {periodoActivo?.institutional_email && (
            <Card className="shadow-sm border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
                  Contacto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-2 bg-muted/50 p-3 rounded-md border border-border">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm truncate">
                      {periodoActivo.institutional_email}
                    </span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() =>
                      copyToClipboard(
                        periodoActivo.institutional_email,
                        "email",
                      )
                    }
                  >
                    {isCopied("email") ? (
                      <Check className="w-3 h-3 text-success" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {/* 3. HOJA DE VIDA (Educación y Trabajo) */}
          {/* Educación */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                Formación
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {tieneEducacion ? (
                <div className="space-y-4">
                  {persona.postgraduate_education?.map((edu, i) => (
                    <div key={`post-${i}`} className="text-sm">
                      <p className="font-semibold text-foreground">
                        {edu.specialization}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {edu.graduate_school}
                      </p>
                      <Badge variant="secondary" className="mt-1 text-[10px]">
                        {edu.degree}
                      </Badge>
                    </div>
                  ))}
                  {persona.university_education?.map((edu, i) => (
                    <div key={`uni-${i}`} className="text-sm">
                      <p className="font-semibold text-foreground">
                        {edu.degree}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {edu.university}
                      </p>
                    </div>
                  ))}
                  {!persona.university_education?.length &&
                    !persona.postgraduate_education?.length &&
                    persona.technical_education?.map((edu, i) => (
                      <div key={`tech-${i}`} className="text-sm">
                        <p className="font-semibold">{edu.career}</p>
                        <p className="text-xs text-muted-foreground">
                          {edu.graduate_school}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <NoDataMessage text="Sin registros." />
              )}
            </CardContent>
          </Card>

          {/* Experiencia Laboral */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                Experiencia
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {persona.work_experience?.length > 0 ? (
                <div className="space-y-4">
                  {persona.work_experience.slice(0, 3).map((exp, i) => (
                    <div
                      key={i}
                      className="text-sm border-l-2 border-border pl-3"
                    >
                      <p className="font-semibold text-foreground">
                        {exp.position}
                      </p>
                      <p className="text-xs text-foreground/80">
                        {exp.organization}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {exp.period}
                      </p>
                    </div>
                  ))}
                  {persona.work_experience.length > 3 && (
                    <p className="text-xs text-muted-foreground italic">
                      + {persona.work_experience.length - 3} experiencias más...
                    </p>
                  )}
                </div>
              ) : (
                <NoDataMessage text="Sin registros." />
              )}
            </CardContent>
          </Card>
          {/* <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="w-4 h-4" /> Historial Legislativo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {periodosOrdenados.length > 0 ? (
                <div className="relative border-l-2 border-border ml-2 space-y-6">
                  {periodosOrdenados.map((p, i) => (
                    <div key={p.id} className="pl-6 relative">
                      <div
                        className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-background ${p.active ? "border-success bg-success/20" : "border-muted-foreground"}`}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">
                          {new Date(p.start_date).getFullYear()} -{" "}
                          {p.end_date
                            ? new Date(p.end_date).getFullYear()
                            : "Presente"}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          {p.chamber}
                        </span>
                        {p.active ? (
                          <Badge
                            variant="success"
                            className="w-fit mt-1 text-[10px]"
                          >
                            Activo
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="w-fit mt-1 text-[10px]"
                          >
                            Finalizado
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <NoDataMessage text="Sin historial previo." />
              )}
            </CardContent>
          </Card> */}

          {hasSocialLinks && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
                  Redes Sociales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {persona.facebook_url && (
                    <Link
                      href={persona.facebook_url}
                      target="_blank"
                      className="p-2 bg-[#1877F2]/10 text-[#1877F2] rounded-md hover:bg-[#1877F2]/20 transition-colors"
                    >
                      <SlSocialFacebook className="w-5 h-5" />
                    </Link>
                  )}
                  {persona.twitter_url && (
                    <Link
                      href={persona.twitter_url}
                      target="_blank"
                      className="p-2 bg-[#1DA1F2]/10 text-[#1DA1F2] rounded-md hover:bg-[#1DA1F2]/20 transition-colors"
                    >
                      <SlSocialTwitter className="w-5 h-5" />
                    </Link>
                  )}
                  {persona.instagram_url && (
                    <Link
                      href={persona.instagram_url}
                      target="_blank"
                      className="p-2 bg-[#E1306C]/10 text-[#E1306C] rounded-md hover:bg-[#E1306C]/20 transition-colors"
                    >
                      <RiInstagramLine className="w-5 h-5" />
                    </Link>
                  )}
                  {persona.tiktok_url && (
                    <Link
                      href={persona.tiktok_url}
                      target="_blank"
                      className="p-2 bg-foreground/10 text-foreground rounded-md hover:bg-foreground/20 transition-colors"
                    >
                      <PiTiktokLogo className="w-5 h-5" />
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <BillsDialog
        proyectos={proyectos}
        isOpen={openBills}
        onClose={() => setOpenBills(false)}
      />
    </div>
  );
}
