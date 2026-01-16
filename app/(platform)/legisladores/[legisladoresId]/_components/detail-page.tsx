"use client";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  FileText,
  ExternalLink,
  Mail,
  Check,
  Copy,
  User,
  GraduationCap,
  AlertTriangle,
  History,
  Award,
  BookOpen,
  Microscope,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { SlSocialFacebook, SlSocialTwitter } from "react-icons/sl";
import { PiTiktokLogo } from "react-icons/pi";
import { RiInstagramLine } from "react-icons/ri";
import { Field, FieldGroup, FieldContent } from "@/components/ui/field";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { Button } from "@/components/ui/button";
import { formatFechaJsonable } from "@/lib/utils/date";
import { NoDataMessage } from "@/components/no-data-message";
import { PersonDetail } from "@/interfaces/person";
import { useMemo, useState } from "react";
import BillsDialog from "./bills-dialog";
import { BillStatusGroup, getStatusGroup } from "@/interfaces/enums";
import ProyectoItem from "./proyect-item";
import { BadgeVariant } from "@/lib/utils/bill";

export default function DetailLegislador({
  persona,
}: {
  persona: PersonDetail;
}) {
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  const periodoActivo = persona.legislative_periods?.find((p) => p.active);
  // Ordenar periodos por fecha DESC
  const periodosOrdenados = [...(persona.legislative_periods || [])].sort(
    (a, b) =>
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
  );

  const stats = [
    {
      label: "Periodos Legislativos",
      value: persona.legislative_periods?.length || 0,
      icon: History,
      color: "text-info",
    },
    {
      label: "Proyectos de Ley",
      value: periodoActivo?.bill_authorships?.length || 0,
      icon: FileText,
      color: "text-success",
    },
    {
      label: "Antecedentes",
      value: persona.backgrounds?.length || 0,
      icon: AlertTriangle,
      color: "text-warning",
    },
  ];

  const getEstadoBadgeVariant = (activo: boolean) => {
    return activo ? "success" : "secondary";
  };

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
      En_ejercicio: "En Ejercicio",
      Fallecido: "Fallecido",
      Suspendido: "Suspendido",
      Licencia: "Con Licencia",
      Destituido: "Destituido",
    };
    return labels[condition] || condition;
  };

  const getBackgroundTypeBadge = (type: string) => {
    const types: Record<string, { label: string; variant: BadgeVariant }> = {
      penal: { label: "Penal", variant: "destructive" },
      etica: { label: "Ética", variant: "warning" },
      civil: { label: "Civil", variant: "default" },
      administrativo: { label: "Administrativo", variant: "secondary" },
    };
    return types[type] || { label: type, variant: "secondary" };
  };

  const getBackgroundStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; variant: BadgeVariant }> = {
      en_investigacion: { label: "En Investigación", variant: "warning" },
      en_proceso_judicial: { label: "En Proceso Judicial", variant: "warning" },
      sentenciado: { label: "Sentenciado", variant: "destructive" },
      sancionado: { label: "Sancionado", variant: "destructive" },
      archivado: { label: "Archivado", variant: "secondary" },
      absuelto: { label: "Absuelto", variant: "success" },
      no_especificado: { label: "No Especificado", variant: "outline" },
    };
    return statuses[status] || { label: status, variant: "secondary" };
  };

  // tiene información educativa?
  const tieneEducacion =
    persona.technical_education ||
    persona.university_education ||
    persona.academic_degree ||
    persona.professional_title ||
    persona.postgraduate_education;

  const hasSocialLinks =
    persona.facebook_url ||
    persona.twitter_url ||
    persona.instagram_url ||
    persona.tiktok_url;

  const socialLinks = (
    <div className="flex flex-wrap gap-3">
      {persona.facebook_url && (
        <Link
          href={persona.facebook_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1877F2] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <SlSocialFacebook className="w-4 h-4" />
          <span className="text-sm font-medium">Facebook</span>
        </Link>
      )}

      {persona.twitter_url && (
        <Link
          href={persona.twitter_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1DA1F2] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <SlSocialTwitter className="w-4 h-4" />
          <span className="text-sm font-medium">Twitter</span>
        </Link>
      )}

      {persona.instagram_url && (
        <Link
          href={persona.instagram_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#515BD4] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <RiInstagramLine className="w-4 h-4" />
          <span className="text-sm font-medium">Instagram</span>
        </Link>
      )}

      {persona.tiktok_url && (
        <Link
          href={persona.tiktok_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-[#010101] via-[#121212] to-[#343434] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <PiTiktokLogo className="w-4 h-4" />
          <span className="text-sm font-medium">TikTok</span>
        </Link>
      )}
    </div>
  );
  const [openBills, setOpenBills] = useState(false);

  const proyectos = persona.legislative_periods?.flatMap(
    (periodo) => periodo.bill_authorships || [],
  );
  const PREVIEW_LIMIT = 3;

  // Obtener estados únicos

  // Estadísticas rápidas
  const stats_proyectos = useMemo(() => {
    const groupedStats: Record<BillStatusGroup, number> = {
      [BillStatusGroup.PRESENTADO]: 0,
      [BillStatusGroup.EN_PROCESO]: 0,
      [BillStatusGroup.APROBADO]: 0,
      [BillStatusGroup.ARCHIVADO]: 0,
      [BillStatusGroup.RETIRADO]: 0,
    };

    proyectos.forEach((p) => {
      const group = getStatusGroup(p.approval_status);
      groupedStats[group]++;
    });

    return {
      total: proyectos.length,
      ...groupedStats,
    };
  }, [proyectos]);

  return (
    <>
      <div className="bg-background min-h-screen">
        <div className="container mx-auto p-4">
          {/* ===== HERO SECTION ===== */}
          <section className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/90 p-6 text-primary-foreground relative">
              <div className="absolute inset-0 opacity-5"></div>

              <div className="relative flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-40 h-40 flex-shrink-0 rounded-full overflow-hidden border-4 border-primary-foreground/20 shadow-xl">
                  <Image
                    src={persona.image_url || "/images/default-avatar.svg"}
                    alt={`Foto de ${persona.fullname}`}
                    fill
                    className="object-cover object-top"
                  />
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                    {persona.fullname}
                  </h1>

                  {persona.profession && (
                    <p className="text-lg text-primary-foreground/90 mt-2">
                      {persona.profession}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-3 text-primary-foreground mt-4">
                    {periodoActivo?.elected_by_party && (
                      <div className="inline-flex items-center gap-2 font-medium">
                        {periodoActivo.elected_by_party.logo_url && (
                          <Image
                            src={periodoActivo.elected_by_party.logo_url}
                            alt={periodoActivo.elected_by_party.name}
                            width={24}
                            height={24}
                            className="rounded-sm"
                          />
                        )}
                        <span>{periodoActivo.elected_by_party.name}</span>
                      </div>
                    )}

                    {periodoActivo?.electoral_district && (
                      <div className="inline-flex items-center gap-2">
                        <MapPin className="size-4" />
                        <span>{periodoActivo.electoral_district.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-center md:justify-start gap-3 flex-wrap">
                    {periodoActivo && (
                      <>
                        <Badge
                          variant={getEstadoBadgeVariant(periodoActivo.active)}
                          className="text-sm px-3 py-1"
                        >
                          {getConditionLabel(periodoActivo.condition)}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="size-4" />
                          <span>
                            Periodo{" "}
                            {new Date(periodoActivo.start_date).getFullYear()} -{" "}
                            {periodoActivo.end_date
                              ? new Date(periodoActivo.end_date).getFullYear()
                              : "Actualidad"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== CONTENIDO PRINCIPAL ===== */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* --- COLUMNA PRINCIPAL --- */}
            <div className="lg:col-span-2 space-y-4">
              {/* Formación Académica */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="size-5" />
                    Formación Académica
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tieneEducacion ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {persona.technical_education &&
                        persona.technical_education !== "No" && (
                          <div className="p-3 bg-info/10 border border-info/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-1.5">
                              <BookOpen className="w-4 h-4 text-info" />
                              <span className="text-xs font-semibold text-info-foreground uppercase tracking-wide">
                                Educación Técnica
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {persona.technical_education}
                            </p>
                          </div>
                        )}

                      {persona.university_education &&
                        persona.university_education !== "No" && (
                          <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-1.5">
                              <GraduationCap className="w-4 h-4 text-primary" />
                              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                                Educación Universitaria
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {persona.university_education === "Si"
                                ? "Concluida"
                                : persona.university_education}
                            </p>
                          </div>
                        )}

                      {persona.academic_degree &&
                        persona.academic_degree !== "No" && (
                          <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Award className="w-4 h-4 text-success" />
                              <span className="text-xs font-semibold text-success uppercase tracking-wide">
                                Grado Académico
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {persona.academic_degree}
                            </p>
                          </div>
                        )}

                      {persona.professional_title &&
                        persona.professional_title !== "No" && (
                          <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Award className="w-4 h-4 text-warning" />
                              <span className="text-xs font-semibold text-warning uppercase tracking-wide">
                                Título Profesional
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {persona.professional_title}
                            </p>
                          </div>
                        )}

                      {persona.postgraduate_education &&
                        persona.postgraduate_education !== "No" && (
                          <div className="p-3 bg-accent border border-border rounded-lg md:col-span-2">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Microscope className="w-4 h-4 text-accent-foreground" />
                              <span className="text-xs font-semibold text-accent-foreground uppercase tracking-wide">
                                Estudios de Postgrado
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {persona.postgraduate_education}
                            </p>
                          </div>
                        )}
                    </div>
                  ) : (
                    <NoDataMessage text="No cuenta con información de estudios superiores registrada." />
                  )}
                </CardContent>
              </Card>

              {/* Experiencia Laboral */}
              {persona.work_experience &&
                persona.work_experience.length > 0 && (
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="size-5" />
                        Experiencia Laboral
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {persona.work_experience.map((exp, index) => (
                          <div
                            key={index}
                            className="relative pl-6 pb-3 last:pb-0"
                          >
                            {/* Línea vertical */}
                            {index < persona.work_experience.length - 1 && (
                              <div className="absolute left-[7px] top-2 bottom-0 w-px bg-border" />
                            )}

                            {/* Punto indicador */}
                            <div className="absolute left-0 top-2 size-4 rounded-full border-2 border-primary bg-background" />

                            {/* Contenido */}
                            <div className="flex items-start justify-between gap-3 min-h-[2rem]">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <h4 className="font-semibold text-sm leading-tight">
                                    {exp.position}
                                  </h4>
                                  {exp.period && (
                                    <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                                      {exp.period}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {exp.organization}
                                </p>
                                {exp.source_url && (
                                  <a
                                    href={exp.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                                  >
                                    {exp.source || "Fuente"}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Biografía */}
              {persona.detailed_biography &&
                persona.detailed_biography.length > 0 && (
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="size-5" />
                        Trayectoria y Biografía
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative space-y-6">
                        {/* Timeline line */}
                        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/50 via-primary/30 to-transparent" />

                        {persona.detailed_biography
                          .sort(
                            (a, b) =>
                              new Date(b.date).getTime() -
                              new Date(a.date).getTime(),
                          )
                          .map((item, index) => (
                            <div key={index} className="relative pl-8 group">
                              <div className="absolute left-0 top-2 w-4 h-4 bg-background border-2 border-primary rounded-full shadow-sm transition-transform group-hover:scale-125 group-hover:shadow-md" />

                              <div className="flex flex-col gap-2 pb-6 border-b border-border last:border-0 last:pb-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="text-xs capitalize font-normal"
                                  >
                                    {item.type}
                                  </Badge>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <time dateTime={item.date}>
                                      {formatFechaJsonable(item.date)}
                                    </time>
                                  </div>
                                </div>

                                <p className="text-sm text-foreground leading-relaxed">
                                  {item.description}
                                </p>

                                {item.source && item.source_url && (
                                  <Link
                                    href={item.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs hover:underline text-primary transition-colors underline-offset-2"
                                    aria-label={`source: ${item.source}`}
                                  >
                                    <span>{item.source}</span>
                                    <ExternalLink className="w-3 h-3 opacity-70" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Antecedentes */}
              <Card className="shadow-sm border-warning/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="size-5" />
                    Antecedentes Registrados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {persona.backgrounds && persona.backgrounds.length > 0 ? (
                    <div className="space-y-4">
                      {persona.backgrounds.map((antecedente) => {
                        const typeBadge = getBackgroundTypeBadge(
                          antecedente.type,
                        );
                        const statusBadge = getBackgroundStatusBadge(
                          antecedente.status,
                        );

                        return (
                          <div
                            key={antecedente.id}
                            className="p-4 bg-warning/10 border border-warning/30 rounded-lg space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-base flex-1">
                                {antecedente.title}
                              </h4>
                              <div className="flex gap-2 flex-wrap justify-end">
                                <Badge
                                  variant={typeBadge.variant}
                                  className="text-xs"
                                >
                                  {typeBadge.label}
                                </Badge>
                                <Badge
                                  variant={statusBadge.variant}
                                  className="text-xs"
                                >
                                  {statusBadge.label}
                                </Badge>
                              </div>
                            </div>

                            <p className="text-sm text-foreground">
                              {antecedente.summary}
                            </p>

                            {antecedente.sanction && (
                              <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm">
                                <span className="font-semibold">Sanción: </span>
                                {antecedente.sanction}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>
                                  {formatFechaJsonable(
                                    antecedente.publication_date,
                                  )}
                                </span>
                              </div>

                              {antecedente.source_url ? (
                                <Link
                                  href={antecedente.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 hover:underline text-primary transition-colors"
                                >
                                  {antecedente.source}
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              ) : (
                                <span>{antecedente.source}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <NoDataMessage text="No se registran antecedentes." />
                  )}
                </CardContent>
              </Card>

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
                  {/* Estadísticas agrupadas */}
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4 p-4 bg-muted rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {stats_proyectos.total}
                      </div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {stats_proyectos[BillStatusGroup.PRESENTADO]}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Presentado
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">
                        {stats_proyectos[BillStatusGroup.EN_PROCESO]}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        En Proceso
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">
                        {stats_proyectos[BillStatusGroup.APROBADO]}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Aprobado
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-destructive">
                        {stats_proyectos[BillStatusGroup.ARCHIVADO] +
                          stats_proyectos[BillStatusGroup.RETIRADO]}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Archivado/Retirado
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="space-y-2">
                    {proyectos.slice(0, PREVIEW_LIMIT).map((proyecto) => (
                      <ProyectoItem
                        key={`${proyecto.id}`}
                        proyecto={proyecto}
                      />
                    ))}
                  </div>

                  {/* Botón */}
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
            </div>

            {/* --- BARRA LATERAL --- */}
            <div className="space-y-4">
              {/* Resumen de Actividad */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Resumen de Actividad</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        <stat.icon className={`size-4 ${stat.color}`} />
                        <span className="text-sm text-foreground/80">
                          {stat.label}
                        </span>
                      </div>
                      <span className="text-lg font-bold">{stat.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Información de Contacto */}
              {periodoActivo?.institutional_email && (
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Información de Contacto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FieldGroup className="gap-2">
                      <Field>
                        <FieldContent>
                          <div className="flex items-center justify-between gap-2 w-full">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Mail className="size-4 flex-shrink-0" />
                              <span className="break-all text-sm">
                                {periodoActivo.institutional_email}
                              </span>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                copyToClipboard(
                                  periodoActivo.institutional_email,
                                  "email",
                                )
                              }
                              title={
                                isCopied("email") ? "Copiado" : "Copiar email"
                              }
                            >
                              {isCopied("email") ? (
                                <Check className="w-4 h-4 text-success" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </FieldContent>
                      </Field>
                    </FieldGroup>
                  </CardContent>
                </Card>
              )}

              {/* Redes Sociales */}
              {hasSocialLinks && (
                <>
                  <Card className="hidden lg:block">
                    <CardHeader>
                      <CardTitle className="text-lg">Redes Sociales</CardTitle>
                    </CardHeader>
                    <CardContent>{socialLinks}</CardContent>
                  </Card>

                  <div className="block lg:hidden">{socialLinks}</div>
                </>
              )}

              {/* Historial Legislativo */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="size-5" />
                    Historial Legislativo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {periodosOrdenados.length > 0 ? (
                    <div className="space-y-3">
                      {periodosOrdenados.map((periodo) => (
                        <div
                          key={periodo.id}
                          className={`p-3 border rounded-lg transition-all hover:shadow-md ${
                            periodo.active
                              ? "bg-success/10 border-success/30"
                              : "bg-muted border-border"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-semibold text-sm">
                                {periodo.chamber}
                              </h4>
                              <Badge
                                variant={
                                  periodo.active ? "success" : "secondary"
                                }
                              >
                                {periodo.active ? "Actual" : "Finalizado"}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-foreground/70">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="size-3 flex-shrink-0" />
                                <span>
                                  {new Date(periodo.start_date).getFullYear()} -{" "}
                                  {periodo.end_date
                                    ? new Date(periodo.end_date).getFullYear()
                                    : "Actualidad"}
                                </span>
                              </div>
                            </div>

                            {periodo.electoral_district && (
                              <div className="flex items-center gap-1.5 text-xs text-foreground/70">
                                <MapPin className="size-3 flex-shrink-0" />
                                <span className="truncate">
                                  {periodo.electoral_district.name}
                                </span>
                              </div>
                            )}

                            {periodo.institutional_email && (
                              <div className="flex items-center gap-1.5 text-xs text-foreground/70 pt-1">
                                <Mail className="size-3 flex-shrink-0" />
                                <span className="truncate">
                                  {periodo.institutional_email}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <NoDataMessage text="No hay historial legislativo registrado." />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <BillsDialog
        proyectos={proyectos}
        isOpen={openBills}
        onClose={() => setOpenBills(false)}
      />
    </>
  );
}
