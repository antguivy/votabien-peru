"use client";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  FileText,
  ExternalLink,
  Mail,
  Info,
  Briefcase,
  Check,
  Copy,
  User,
  GraduationCap,
  AlertTriangle,
  History,
  Facebook,
  Twitter,
  Instagram,
  Award,
  BookOpen,
  Microscope,
} from "lucide-react";

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
import { PersonaDetail, ProyectoLey } from "@/interfaces/politics";

const NoDataMessage = ({
  text,
  icon: Icon = Info,
}: {
  text: string;
  icon?: React.ElementType;
}) => (
  <div className="flex items-center gap-3 text-sm text-slate-500 p-4 bg-slate-50 rounded-lg">
    <Icon className="size-4 text-slate-400" />
    <span>{text}</span>
  </div>
);

export default function DetailLegislador({
  persona,
}: {
  persona: PersonaDetail;
}) {
  const { copyToClipboard, isCopied } = useCopyToClipboard();

  // 🔍 Encontrar el periodo ACTIVO
  const periodoActivo = persona.periodos_legislativos?.find(
    (p) => p.esta_activo
  );

  // 📊 Ordenar periodos por fecha (más reciente primero)
  const periodosOrdenados = [...(persona.periodos_legislativos || [])].sort(
    (a, b) =>
      new Date(b.periodo_inicio).getTime() -
      new Date(a.periodo_inicio).getTime()
  );

  // 📈 Calcular años totales de servicio
  const calcularAniosServicio = () => {
    if (!persona.periodos_legislativos?.length) return 0;
    const primerPeriodo = periodosOrdenados[periodosOrdenados.length - 1];
    const ultimoPeriodo = periodosOrdenados[0];
    const inicio = new Date(primerPeriodo.periodo_inicio).getFullYear();
    const fin = periodoActivo
      ? new Date().getFullYear()
      : new Date(ultimoPeriodo.periodo_fin).getFullYear();
    return fin - inicio;
  };

  const stats = [
    {
      label: "Periodos Legislativos",
      value: persona.periodos_legislativos?.length || 0,
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
      value: periodoActivo?.proyectos_ley?.length || 0,
      icon: FileText,
      color: "text-success",
    },
  ];

  // 🎨 Función para obtener color según estado
  const getEstadoBadgeVariant = (activo: boolean) => {
    return activo ? "success" : "secondary";
  };

  const tieneAntecedentes =
    (persona.antecedentes_penales && persona.antecedentes_penales.length > 0) ||
    (persona.antecedentes_judiciales &&
      persona.antecedentes_judiciales.length > 0);

  // 🎓 Verificar si tiene información educativa
  const tieneEducacion =
    persona.educacion_tecnica ||
    persona.educacion_universitaria ||
    persona.grado_academico ||
    persona.titulo_profesional ||
    persona.post_grado;

  // ⚖️ Obtener color del badge de antecedentes
  const getAntecedentesBadgeColor = (estado: string) => {
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
      <div className="container mx-auto px-4 pb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/legisladores">Legisladores</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{persona.nombre_completo}</BreadcrumbPage>
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
                  src={persona.foto_url || "/images/default-avatar.svg"}
                  alt={`Foto de ${persona.nombre_completo}`}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                  {persona.nombre_completo}
                </h1>

                {persona.profesion && (
                  <p className="text-lg text-primary-foreground/90 mt-2">
                    {persona.profesion}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-3 text-primary-foreground mt-4">
                  {periodoActivo?.partido && (
                    <div className="inline-flex items-center gap-2 font-medium">
                      <Briefcase className="size-4" />
                      <span>{periodoActivo.partido.nombre}</span>
                    </div>
                  )}
                  {periodoActivo?.distrito && (
                    <div className="inline-flex items-center gap-2">
                      <MapPin className="size-4" />
                      <span>{periodoActivo.distrito.nombre}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-center md:justify-start gap-3">
                  <Badge
                    variant={getEstadoBadgeVariant(
                      periodoActivo?.esta_activo ?? false
                    )}
                    className="text-sm px-3 py-1"
                  >
                    {periodoActivo?.esta_activo ? "En Ejercicio" : "Inactivo"}
                  </Badge>
                  {periodoActivo && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="size-4" />
                      <span>
                        Periodo{" "}
                        {new Date(periodoActivo.periodo_inicio).getFullYear()} -{" "}
                        {new Date(periodoActivo.periodo_fin).getFullYear()}
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
            {/* 📝 Biografía */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-5" />
                  Biografía
                </CardTitle>
              </CardHeader>
              <CardContent>
                {persona.biografia_corta ? (
                  <p className="leading-relaxed whitespace-pre-line text-foreground/80">
                    {persona.biografia_corta}
                  </p>
                ) : (
                  <NoDataMessage text="No hay biografía registrada." />
                )}
              </CardContent>
            </Card>

            {/* 🎓 Formación Académica - MEJORADA */}
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
                    {/* Educación Técnica */}
                    {persona.educacion_tecnica &&
                      persona.educacion_tecnica !== "No" && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
                          <div className="flex items-center gap-2 mb-1.5">
                            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-semibold text-blue-900 dark:text-blue-300 uppercase tracking-wide">
                              Educación Técnica
                            </span>
                          </div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            {persona.educacion_tecnica}
                          </p>
                        </div>
                      )}

                    {/* Educación Universitaria */}
                    {persona.educacion_universitaria &&
                      persona.educacion_universitaria !== "No" && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-lg">
                          <div className="flex items-center gap-2 mb-1.5">
                            <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wide">
                              Educación Universitaria
                            </span>
                          </div>
                          <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                            {persona.educacion_universitaria === "Si"
                              ? "Concluida"
                              : persona.educacion_universitaria}
                          </p>
                        </div>
                      )}

                    {/* Grado Académico */}
                    {persona.grado_academico &&
                      persona.grado_academico !== "No" && (
                        <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-xs font-semibold text-green-900 dark:text-green-300 uppercase tracking-wide">
                              Grado Académico
                            </span>
                          </div>
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">
                            {persona.grado_academico}
                          </p>
                        </div>
                      )}

                    {/* Título Profesional */}
                    {persona.titulo_profesional &&
                      persona.titulo_profesional !== "No" && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                              Título Profesional
                            </span>
                          </div>
                          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                            {persona.titulo_profesional}
                          </p>
                        </div>
                      )}

                    {/* Post Grado */}
                    {persona.post_grado && persona.post_grado !== "No" && (
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 rounded-lg md:col-span-2">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Microscope className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 uppercase tracking-wide">
                            Estudios de Postgrado
                          </span>
                        </div>
                        <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                          {persona.post_grado}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ⚖️ Antecedentes - MEJORADO */}
            {tieneAntecedentes && (
              <Card className="shadow-sm border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="size-5" />
                    Antecedentes Registrados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Antecedentes Penales */}
                  {persona.antecedentes_penales &&
                    persona.antecedentes_penales.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="destructive" className="text-xs">
                            Penales
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {persona.antecedentes_penales.length}{" "}
                            {persona.antecedentes_penales.length === 1
                              ? "registro"
                              : "registros"}
                          </span>
                        </div>
                        {persona.antecedentes_penales.map(
                          (antecedente, index: number) => (
                            <div
                              key={index}
                              className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="text-xs font-semibold text-red-900 dark:text-red-300 uppercase">
                                  {antecedente.tipo}
                                </span>
                                {antecedente.estado && (
                                  <Badge
                                    variant={getAntecedentesBadgeColor(
                                      antecedente.estado
                                    )}
                                    className="text-xs"
                                  >
                                    {antecedente.estado}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-red-800 dark:text-red-200 mb-1">
                                {antecedente.descripcion}
                              </p>
                              {antecedente.año && (
                                <span className="text-xs text-red-600 dark:text-red-400">
                                  Año: {antecedente.año}
                                </span>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}

                  {/* Antecedentes Judiciales */}
                  {persona.antecedentes_judiciales &&
                    persona.antecedentes_judiciales.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="warning" className="text-xs">
                            Judiciales
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {persona.antecedentes_judiciales.length}{" "}
                            {persona.antecedentes_judiciales.length === 1
                              ? "registro"
                              : "registros"}
                          </span>
                        </div>
                        {persona.antecedentes_judiciales.map(
                          (antecedente, index: number) => (
                            <div
                              key={index}
                              className="p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 rounded-lg"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="text-xs font-semibold text-orange-900 dark:text-orange-300 uppercase">
                                  {antecedente.tipo}
                                </span>
                                {antecedente.estado && (
                                  <Badge
                                    variant={getAntecedentesBadgeColor(
                                      antecedente.estado
                                    )}
                                    className="text-xs"
                                  >
                                    {antecedente.estado}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-orange-800 dark:text-orange-200 mb-1">
                                {antecedente.descripcion}
                              </p>
                              {antecedente.año && (
                                <span className="text-xs text-orange-600 dark:text-orange-400">
                                  Año: {antecedente.año}
                                </span>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            {/* 📜 Historial Legislativo - MEJORADO */}
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
                          periodo.esta_activo
                            ? "bg-green-50 border-green-200"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="space-y-2">
                          {/* Header: Título y Badge */}
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-semibold text-sm">
                              {periodo.camara}
                            </h4>
                            <Badge
                              variant={
                                periodo.esta_activo ? "success" : "secondary"
                              }
                            >
                              {periodo.esta_activo ? "Actual" : "Finalizado"}
                            </Badge>
                          </div>

                          {/* Primera línea: Fecha y Distrito */}
                          <div className="flex items-center justify-between gap-3 text-xs text-foreground/70">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="size-3 flex-shrink-0" />
                              <span>
                                {new Date(periodo.periodo_inicio).getFullYear()}{" "}
                                - {new Date(periodo.periodo_fin).getFullYear()}
                              </span>
                            </div>
                            {periodo.distrito && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="size-3 flex-shrink-0" />
                                <span className="truncate">
                                  {periodo.distrito.nombre}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Segunda línea: Partido */}
                          {periodo.partido && (
                            <div className="flex items-center gap-1.5 text-xs text-foreground/70">
                              <Briefcase className="size-3 flex-shrink-0" />
                              <span className="truncate">
                                {periodo.partido.nombre}
                              </span>
                            </div>
                          )}

                          {/* Email si existe */}
                          {periodo.email_congreso && (
                            <div className="flex items-center gap-1.5 text-xs text-foreground/70 pt-1">
                              <Mail className="size-3 flex-shrink-0" />
                              <span className="truncate">
                                {periodo.email_congreso}
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

            {/* 📄 Proyectos de Ley */}
            {periodoActivo?.proyectos_ley && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="size-5" />
                    Proyectos de Ley del Periodo Actual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    {periodoActivo.proyectos_ley.length > 0 ? (
                      periodoActivo.proyectos_ley.map(
                        (proyecto: ProyectoLey, index: number) => (
                          <div key={proyecto.id}>
                            <Link
                              href={`/proyectos/${proyecto.id}`}
                              className="block p-4 -m-4 rounded-lg hover:bg-slate-100/80 transition-colors duration-200"
                            >
                              <FieldTitle className="text-base hover:text-primary">
                                {proyecto.titulo}
                              </FieldTitle>
                              <FieldDescription className="mt-1">
                                {proyecto.resumen}
                              </FieldDescription>
                              <FieldContent className="flex-row items-center gap-2 text-xs text-muted-foreground mt-3">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>
                                  Presentado el{" "}
                                  {new Date(
                                    proyecto.fecha_presentacion
                                  ).toLocaleDateString("es-ES", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </span>
                              </FieldContent>
                            </Link>
                            {index < periodoActivo.proyectos_ley.length - 1 && (
                              <FieldSeparator className="my-2" />
                            )}
                          </div>
                        )
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
            {/* 📊 Resumen de Actividad */}
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

            {/* 📧 Información de Contacto */}
            {periodoActivo?.email_congreso && (
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
                              {periodoActivo.email_congreso}
                            </span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(
                                periodoActivo.email_congreso,
                                "email"
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

            {/* 🌐 Redes Sociales */}
            {(persona.facebook_url ||
              persona.twitter_url ||
              persona.instagram_url) && (
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
                        <Facebook className="size-4" />
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
                        <Twitter className="size-4" />
                        <span>Twitter / X</span>
                        <ExternalLink className="size-3 ml-auto" />
                      </a>
                    )}
                    {persona.instagram_url && (
                      <a
                        href={persona.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm text-pink-600 hover:underline p-2 -m-2 rounded-md hover:bg-pink-50 transition-colors"
                      >
                        <Instagram className="size-4" />
                        <span>Instagram</span>
                        <ExternalLink className="size-3 ml-auto" />
                      </a>
                    )}
                  </FieldGroup>
                </CardContent>
              </Card>
            )}

            {/* 📋 Información Personal */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/70">DNI:</span>
                  <span className="font-medium">{persona.dni}</span>
                </div>
                {persona.fecha_nacimiento && (
                  <div className="flex justify-between">
                    <span className="text-foreground/70">
                      Fecha de Nacimiento:
                    </span>
                    <span className="font-medium">
                      {new Date(persona.fecha_nacimiento).toLocaleDateString(
                        "es-ES",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
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
