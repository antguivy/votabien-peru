"use client";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  FileText,
  ExternalLink,
  Mail,
  Briefcase,
  Check,
  Copy,
  User,
  GraduationCap,
  AlertTriangle,
  History,
  Award,
  BookOpen,
  Microscope,
  Home,
} from "lucide-react";
import { SlSocialFacebook, SlSocialTwitter } from "react-icons/sl";
import { PiTiktokLogo } from "react-icons/pi";
import {
  Field,
  FieldGroup,
  FieldTitle,
  FieldDescription,
  FieldSeparator,
  FieldContent,
} from "@/components/ui/field";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PreviousCase, PersonDetail, Bill } from "@/interfaces/politics";
import { formatFechaJsonable } from "@/lib/utils/date";
import { NoDataMessage } from "@/components/no-data-message";

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

  // Años totales de servicio
  const calcularAniosServicio = () => {
    if (!persona.legislative_periods?.length) return 0;
    const primerPeriodo = periodosOrdenados[periodosOrdenados.length - 1];
    const ultimoPeriodo = periodosOrdenados[0];
    const inicio = new Date(primerPeriodo.start_date).getFullYear();
    const fin = periodoActivo
      ? new Date().getFullYear()
      : new Date(ultimoPeriodo.end_date).getFullYear();
    return fin - inicio;
  };

  const stats = [
    {
      label: "Periodos Legislativos",
      value: persona.legislative_periods?.length || 0,
      icon: History,
      color: "text-info",
    },
    {
      label: "Años de Servicio",
      value: calcularAniosServicio(),
      icon: Calendar,
      color: "text-primary",
    },
    {
      label: "Proyectos de Ley",
      value: periodoActivo?.bills?.length || 0,
      icon: FileText,
      color: "text-success",
    },
  ];

  const getEstadoBadgeVariant = (activo: boolean) => {
    return activo ? "success" : "secondary";
  };

  // tiene información educativa?
  const tieneEducacion =
    persona.technical_education ||
    persona.university_education ||
    persona.academic_degree ||
    persona.professional_title ||
    persona.postgraduate_education;

  // Color del badge de antecedentes?
  const getPreviousCasesBadgeColor = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case "rehabilitado":
      case "archivado":
      case "resuelto":
        return "secondary";
      case "en proceso":
      case "activo":
        return "warning";
      case "condenado":
      case "pendiente":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto p-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <Home className="size-5" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/legisladores">Legisladores</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{persona.fullname}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* ===== HERO SECTION ===== */}
        <section className="bg-card rounded-xl shadow-sm border border-slate-200/80 overflow-hidden mt-4">
          <div className="bg-gradient-to-r from-primary to-primary/90 p-4 text-primary-foreground relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>

            <div className="relative flex flex-col md:flex-row items-center gap-8">
              <div className="relative w-40 h-40 flex-shrink-0 rounded-full overflow-hidden border-4 border-white/20">
                <Image
                  src={persona.image_url || "/images/default-avatar.svg"}
                  alt={`Foto de ${persona.fullname}`}
                  fill
                  className="object-cover"
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
                  {periodoActivo?.current_party ? (
                    <div className="inline-flex items-center gap-2 font-medium">
                      <Briefcase className="size-4" />
                      <span>{periodoActivo.current_party.name}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 font-medium text-foreground/70">
                      <Briefcase className="size-4" />
                      <span>No agrupados</span>
                    </div>
                  )}
                  {periodoActivo?.electoral_district && (
                    <div className="inline-flex items-center gap-2">
                      <MapPin className="size-4" />
                      <span>{periodoActivo.electoral_district.name}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-center md:justify-start gap-3">
                  <Badge
                    variant={getEstadoBadgeVariant(
                      periodoActivo?.active ?? false,
                    )}
                    className="text-sm px-3 py-1"
                  >
                    {periodoActivo?.active ? "En Ejercicio" : "Inactivo"}
                  </Badge>
                  {periodoActivo && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="size-4" />
                      <span>
                        Periodo{" "}
                        {new Date(periodoActivo.start_date).getFullYear()} -{" "}
                        {new Date(periodoActivo.end_date).getFullYear()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CONTENIDO PRINCIPAL ===== */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- COLUMNA PRINCIPAL --- */}
          <div className="lg:col-span-2 space-y-4">
            {/* Biografía */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-5" />
                  Trayectoria y Biografía
                </CardTitle>
              </CardHeader>
              <CardContent>
                {persona.detailed_biography &&
                persona.detailed_biography.length > 0 ? (
                  <div className="relative space-y-6">
                    {/* Timeline line */}
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/50 via-primary/30 to-transparent" />

                    {persona.detailed_biography
                      .sort(
                        (a, b) =>
                          new Date(a.date).getTime() -
                          new Date(b.date).getTime(),
                      )
                      .map((item, index) => (
                        <div key={index} className="relative pl-8 group">
                          {/* Timeline dot */}
                          <div className="absolute left-0 top-2 w-4 h-4 bg-background border-2 border-primary rounded-full shadow-sm transition-transform group-hover:scale-125 group-hover:shadow-md" />

                          <div className="flex flex-col gap-2 pb-6 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                            {/* Header */}
                            <div className="flex flex-wrap items-start gap-2">
                              <h4 className="font-semibold text-base leading-tight flex-1 min-w-0">
                                {item.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className="text-xs capitalize font-normal"
                                >
                                  {item.type}
                                </Badge>
                                {item.relevance && (
                                  <Badge
                                    variant={
                                      item.relevance === "Alta"
                                        ? "destructive"
                                        : item.relevance === "Media"
                                          ? "default"
                                          : "secondary"
                                    }
                                    className="text-xs font-medium"
                                  >
                                    {item.relevance}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {item.description}
                            </p>

                            {/* Footer metadata */}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                <time dateTime={item.date}>
                                  {formatFechaJsonable(item.date)}
                                </time>
                              </div>

                              {item.source && item.source_url && (
                                <>
                                  <span className="text-slate-300 dark:text-slate-600">
                                    •
                                  </span>
                                  <Link
                                    href={item.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 hover:underline text-primary transition-colors underline-offset-2"
                                    aria-label={`source: ${item.source}`}
                                  >
                                    <span>{item.source}</span>
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <NoDataMessage text="No hay información detallada de la biografía." />
                )}
              </CardContent>
            </Card>

            {/* Formación Académica */}
            {tieneEducacion && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="size-5" />
                    Formación Académica
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {persona.technical_education &&
                      persona.technical_education !== "No" && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
                          <div className="flex items-center gap-2 mb-1.5">
                            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-semibold text-blue-900 dark:text-blue-300 uppercase tracking-wide">
                              Educación Técnica
                            </span>
                          </div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            {persona.technical_education}
                          </p>
                        </div>
                      )}

                    {persona.university_education &&
                      persona.university_education !== "No" && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-lg">
                          <div className="flex items-center gap-2 mb-1.5">
                            <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wide">
                              Educación Universitaria
                            </span>
                          </div>
                          <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                            {persona.university_education === "Si"
                              ? "Concluida"
                              : persona.university_education}
                          </p>
                        </div>
                      )}

                    {persona.academic_degree &&
                      persona.academic_degree !== "No" && (
                        <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-xs font-semibold text-green-900 dark:text-green-300 uppercase tracking-wide">
                              Grado Académico
                            </span>
                          </div>
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">
                            {persona.academic_degree}
                          </p>
                        </div>
                      )}

                    {persona.professional_title &&
                      persona.professional_title !== "No" && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                              Título Profesional
                            </span>
                          </div>
                          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                            {persona.professional_title}
                          </p>
                        </div>
                      )}

                    {persona.postgraduate_education &&
                      persona.postgraduate_education !== "No" && (
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 rounded-lg md:col-span-2">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Microscope className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 uppercase tracking-wide">
                              Estudios de Postgrado
                            </span>
                          </div>
                          <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                            {persona.postgraduate_education}
                          </p>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* PreviousCases */}
            {persona.previous_cases && persona.previous_cases.length > 0 ? (
              <Card className="shadow-sm border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="size-5" />
                    PreviousCases Registrados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {Object.entries(
                    persona.previous_cases.reduce<
                      Record<string, PreviousCase[]>
                    >((acc, ant) => {
                      const tipo = ant.type || "Otros";
                      if (!acc[tipo]) acc[tipo] = [];
                      acc[tipo].push(ant);
                      return acc;
                    }, {}),
                  ).map(([tipo, lista]) => (
                    <div key={tipo} className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {tipo}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {lista.length}{" "}
                          {lista.length === 1 ? "registro" : "registros"}
                        </span>
                      </div>

                      {lista.map((antecedente, i) => (
                        <div
                          key={i}
                          className="p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 rounded-lg"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-xs font-semibold text-orange-900 dark:text-orange-300 uppercase">
                              {antecedente.title || antecedente.type}
                            </span>
                            {antecedente.status && (
                              <Badge
                                variant={getPreviousCasesBadgeColor(
                                  antecedente.status,
                                )}
                                className="text-xs"
                              >
                                {antecedente.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-orange-800 dark:text-orange-200 mb-1">
                            {antecedente.description}
                          </p>
                          {antecedente.date && (
                            <span className="text-xs text-orange-600 dark:text-orange-400">
                              Fecha: {formatFechaJsonable(antecedente.date)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <NoDataMessage text="No se registran antecedentes." />
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
                  <div
                    className={`grid gap-4 ${
                      periodosOrdenados.length === 1
                        ? "grid-cols-1"
                        : "grid-cols-1 md:grid-cols-2"
                    }`}
                  >
                    {periodosOrdenados.map((periodo) => (
                      <div
                        key={periodo.id}
                        className={`p-3 border rounded-lg transition-all hover:shadow-md ${
                          periodo.active
                            ? "bg-green-50 border-green-200"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-semibold text-sm">
                              {periodo.chamber}
                            </h4>
                            <Badge
                              variant={periodo.active ? "success" : "secondary"}
                            >
                              {periodo.active ? "Actual" : "Finalizado"}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between gap-3 text-xs text-foreground/70">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="size-3 flex-shrink-0" />
                              <span>
                                {new Date(periodo.start_date).getFullYear()} -{" "}
                                {new Date(periodo.end_date).getFullYear()}
                              </span>
                            </div>
                            {periodo.electoral_district && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="size-3 flex-shrink-0" />
                                <span className="truncate">
                                  {periodo.electoral_district.name}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-foreground/70">
                            <Briefcase className="size-3 flex-shrink-0" />
                            <span className="truncate">
                              {periodo.current_party?.name || "No agrupados"}
                            </span>
                          </div>

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

            {/* Proyectos de Ley */}
            {periodoActivo?.bills && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="size-5" />
                    Proyectos de Ley del Periodo Actual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    {periodoActivo.bills.length > 0 ? (
                      periodoActivo.bills.map(
                        (proyecto: Bill, index: number) => (
                          <div key={proyecto.id}>
                            <Link
                              href={`/proyectos/${proyecto.id}`}
                              className="block p-4 -m-4 rounded-lg hover:bg-slate-100/80 transition-colors duration-200"
                            >
                              <FieldTitle className="text-base hover:text-primary">
                                {proyecto.title}
                              </FieldTitle>
                              <FieldDescription className="mt-1">
                                {proyecto.summary}
                              </FieldDescription>
                              <FieldContent className="flex-row items-center gap-2 text-xs text-muted-foreground mt-3">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>
                                  Presentado el{" "}
                                  {new Date(
                                    proyecto.submission_date,
                                  ).toLocaleDateString("es-ES", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </span>
                              </FieldContent>
                            </Link>
                            {index < periodoActivo.bills.length - 1 && (
                              <FieldSeparator className="my-2" />
                            )}
                          </div>
                        ),
                      )
                    ) : (
                      <NoDataMessage text="No se registran proyectos de ley en el periodo actual." />
                    )}
                  </FieldGroup>
                </CardContent>
              </Card>
            )}
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
                              <Check className="w-4 h-4 text-green-600" />
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
            {(persona.facebook_url ||
              persona.twitter_url ||
              persona.tiktok_url) && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Redes Sociales</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup className="gap-3">
                    {persona.facebook_url && (
                      <a
                        href={persona.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm text-blue-600 hover:underline p-2 -m-2 rounded-md hover:bg-blue-50 transition-colors"
                      >
                        <SlSocialFacebook className="size-4" />
                        <span>Facebook</span>
                        <ExternalLink className="size-3 ml-auto" />
                      </a>
                    )}
                    {persona.twitter_url && (
                      <a
                        href={persona.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm text-sky-600 hover:underline p-2 -m-2 rounded-md hover:bg-sky-50 transition-colors"
                      >
                        <SlSocialTwitter className="size-4" />
                        <span>Twitter / X</span>
                        <ExternalLink className="size-3 ml-auto" />
                      </a>
                    )}
                    {persona.tiktok_url && (
                      <a
                        href={persona.tiktok_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm text-gray-900 hover:text-[#69C9D0] p-2 -m-2 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <PiTiktokLogo className="size-4" />
                        <span>Tiktok</span>
                        <ExternalLink className="size-3 ml-auto" />
                      </a>
                    )}
                  </FieldGroup>
                </CardContent>
              </Card>
            )}

            {/* Información Personal */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/70">DNI:</span>
                  <span className="font-medium">{persona.dni}</span>
                </div>
                {persona.birth_date && (
                  <div className="flex justify-between">
                    <span className="text-foreground/70">
                      Fecha de Nacimiento:
                    </span>
                    <span className="font-medium">
                      {new Date(persona.birth_date).toLocaleDateString(
                        "es-ES",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-foreground/70">Registro:</span>
                  <span className="font-medium">
                    {new Date(persona.created_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
