"use client";

import {
  Download,
  FileText,
  CheckCircle2,
  ExternalLink,
  Calendar,
  Award,
  ScrollText,
  Users,
  MapPin,
  Building2,
  GraduationCap,
  Briefcase,
  History,
  BookOpen,
  Microscope,
  AlertTriangle,
} from "lucide-react";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Antecedente, CandidaturaDetail } from "@/interfaces/politics";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFechaJsonable } from "@/lib/utils/date";
import { NoDataMessage } from "@/components/no-data-message";
import Link from "next/link";

interface CandidatoDialogProps {
  candidato: CandidaturaDetail;
  isOpen: boolean;
  onClose: () => void;
}

const CandidatoDialog = ({
  candidato,
  isOpen,
  onClose,
}: CandidatoDialogProps) => {
  const { persona } = candidato;

  const edad = persona.fecha_nacimiento
    ? new Date().getFullYear() -
      new Date(persona.fecha_nacimiento).getFullYear()
    : null;

  // Verificar si tiene experiencia legislativa
  const tieneExperiencia =
    candidato.periodos_legislativos &&
    candidato.periodos_legislativos.length > 0;

  // Contar total de proyectos de ley
  const totalProyectos =
    candidato.periodos_legislativos?.reduce(
      (acc, periodo) => acc + (periodo.proyectos_ley?.length || 0),
      0,
    ) || 0;

  // Verificar si tiene educación
  const tieneEducacion =
    (persona.educacion_tecnica && persona.educacion_tecnica !== "No") ||
    (persona.educacion_universitaria &&
      persona.educacion_universitaria !== "No") ||
    (persona.grado_academico && persona.grado_academico !== "No") ||
    (persona.titulo_profesional && persona.titulo_profesional !== "No") ||
    (persona.post_grado && persona.post_grado !== "No");

  // Helper para el color de badge de antecedentes
  const getAntecedentesBadgeColor = (estado: string) => {
    const estadoLower = estado?.toLowerCase() || "";
    if (estadoLower.includes("activo") || estadoLower.includes("vigente"))
      return "destructive";
    if (estadoLower.includes("archivo") || estadoLower.includes("cerrado"))
      return "secondary";
    return "warning";
  };

  return (
    <Credenza open={isOpen} onOpenChange={onClose}>
      <CredenzaContent className="max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* HEADER */}
        <CredenzaHeader className="border-b pb-4">
          <CredenzaTitle className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-primary mb-2">
                  {persona.nombre_completo}
                </h2>
                <div className="flex items-center flex-wrap gap-2 text-sm">
                  {candidato.partido && (
                    <Badge variant="outline" className="font-semibold">
                      {candidato.partido.nombre}
                    </Badge>
                  )}
                  {candidato.numero_lista && (
                    <Badge variant="default" className="font-extrabold">
                      #{candidato.numero_lista}
                    </Badge>
                  )}
                  {tieneExperiencia && (
                    <Badge variant="secondary" className="gap-1">
                      <History className="w-3 h-3" />
                      Experiencia en Congreso
                    </Badge>
                  )}
                  {candidato.persona.antecedentes && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Antecedentes
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Stats rápidos */}
            {tieneExperiencia && (
              <div className="flex gap-4 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {candidato.periodos_legislativos.length}
                  </span>
                  <span className="text-muted-foreground">
                    {candidato.periodos_legislativos.length === 1
                      ? "periodo"
                      : "periodos"}
                  </span>
                </div>
                {totalProyectos > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <ScrollText className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{totalProyectos}</span>
                    <span className="text-muted-foreground">
                      {totalProyectos === 1 ? "proyecto" : "proyectos"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CredenzaTitle>
        </CredenzaHeader>

        <CredenzaBody className="overflow-y-auto py-4">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:inline-flex mb-4">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="propuestas">Propuestas</TabsTrigger>
              {tieneExperiencia && (
                <TabsTrigger value="trayectoria">Trayectoria</TabsTrigger>
              )}
              <TabsTrigger value="documentos">Docs</TabsTrigger>
            </TabsList>

            {/* TAB: INFORMACIÓN BÁSICA */}
            <TabsContent value="info" className="space-y-6">
              {/* Datos Personales */}
              <div>
                <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Datos Personales
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {persona.dni && (
                    <div className="bg-muted/50 rounded-lg p-3 border">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        DNI
                      </p>
                      <p className="text-sm font-semibold">{persona.dni}</p>
                    </div>
                  )}
                  {edad && (
                    <div className="bg-muted/50 rounded-lg p-3 border">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Edad
                      </p>
                      <p className="text-sm font-semibold">{edad} años</p>
                    </div>
                  )}
                  {candidato.distrito?.nombre && (
                    <div className="bg-muted/50 rounded-lg p-3 border">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Distrito Electoral
                      </p>
                      <p className="text-sm font-semibold">
                        {candidato.distrito.nombre}
                      </p>
                    </div>
                  )}
                  <div className="bg-muted/50 rounded-lg p-3 border">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Estado
                    </p>
                    <p className="text-sm font-semibold capitalize">
                      {candidato.estado}
                    </p>
                  </div>
                </div>
              </div>

              {/* Biografía */}
              {persona.biografia_detallada &&
              persona.biografia_detallada.length > 0 ? (
                <div className="relative space-y-6">
                  {/* Timeline line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/50 via-primary/30 to-transparent" />

                  {persona.biografia_detallada
                    .sort(
                      (a, b) =>
                        new Date(a.fecha).getTime() -
                        new Date(b.fecha).getTime(),
                    )
                    .map((item, index) => (
                      <div key={index} className="relative pl-8 group">
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-2 w-4 h-4 bg-background border-2 border-primary rounded-full shadow-sm transition-transform group-hover:scale-125 group-hover:shadow-md" />

                        <div className="flex flex-col gap-2 pb-6 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                          {/* Header */}
                          <div className="flex flex-wrap items-start gap-2">
                            <h4 className="font-semibold text-base leading-tight flex-1 min-w-0">
                              {item.titulo}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="text-xs capitalize font-normal"
                              >
                                {item.tipo}
                              </Badge>
                              {item.relevancia && (
                                <Badge
                                  variant={
                                    item.relevancia === "Alta"
                                      ? "destructive"
                                      : item.relevancia === "Media"
                                        ? "default"
                                        : "secondary"
                                  }
                                  className="text-xs font-medium"
                                >
                                  {item.relevancia}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {item.descripcion}
                          </p>

                          {/* Footer metadata */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <time dateTime={item.fecha}>
                                {formatFechaJsonable(item.fecha)}
                              </time>
                            </div>

                            {item.fuente && item.fuente_url && (
                              <>
                                <span className="text-slate-300 dark:text-slate-600">
                                  •
                                </span>
                                <Link
                                  href={item.fuente_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 hover:underline text-primary transition-colors underline-offset-2"
                                  aria-label={`Fuente: ${item.fuente}`}
                                >
                                  <span>{item.fuente}</span>
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

              {/* Educación */}
              {tieneEducacion ? (
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    Educación
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                </div>
              ) : (
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    Educación
                  </h3>
                  <div className="p-4 bg-muted/30 border rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                      Sin información de educación superior registrada
                    </p>
                  </div>
                </div>
              )}

              {/* Experiencia Laboral */}
              {persona.experiencia_laboral &&
                persona.experiencia_laboral.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary" />
                      Experiencia Laboral
                    </h3>
                    <div className="space-y-3">
                      {persona.experiencia_laboral.map((exp, idx: number) => (
                        <div
                          key={idx}
                          className="bg-muted/30 rounded-lg p-4 border"
                        >
                          {exp.cargo && (
                            <p className="text-sm font-semibold mb-1">
                              {exp.cargo}
                            </p>
                          )}
                          {exp.empresa && (
                            <p className="text-sm text-muted-foreground mb-1">
                              {exp.empresa}
                            </p>
                          )}
                          {exp.periodo && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                              <Calendar className="w-3 h-3" />
                              {exp.periodo}
                            </p>
                          )}
                          {exp.descripcion && (
                            <p className="text-sm text-foreground/80 leading-relaxed">
                              {exp.descripcion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Antecedentes */}
              {candidato.persona.antecedentes &&
              candidato.persona.antecedentes.length > 0 ? (
                <Card className="shadow-sm border-orange-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-800">
                      <AlertTriangle className="size-5" />
                      Antecedentes Registrados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {Object.entries(
                      persona.antecedentes.reduce<
                        Record<string, Antecedente[]>
                      >((acc, ant) => {
                        const tipo = ant.tipo || "Otros";
                        if (!acc[tipo]) acc[tipo] = [];
                        acc[tipo].push(ant);
                        return acc;
                      }, {}),
                    ).map(([tipo, lista]) => (
                      <div key={tipo} className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                          >
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
                                {antecedente.titulo || antecedente.tipo}
                              </span>
                              {antecedente.estado && (
                                <Badge
                                  variant={getAntecedentesBadgeColor(
                                    antecedente.estado,
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
                            {antecedente.fecha && (
                              <span className="text-xs text-orange-600 dark:text-orange-400">
                                Fecha: {formatFechaJsonable(antecedente.fecha)}
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
            </TabsContent>

            {/* TAB: PROPUESTAS */}
            <TabsContent value="propuestas" className="space-y-4">
              {candidato.propuestas ? (
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    Plan de Gobierno
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4 border">
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                      {candidato.propuestas}
                    </p>
                  </div>

                  {candidato.plan_gobierno_url && (
                    <a
                      href={candidato.plan_gobierno_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-primary hover:underline"
                    >
                      Ver documento completo
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-medium text-foreground mb-2">
                    Sin propuestas publicadas
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Este candidato aún no ha compartido su plan de gobierno
                  </p>
                </div>
              )}
            </TabsContent>

            {/* TAB: TRAYECTORIA LEGISLATIVA */}
            {tieneExperiencia && (
              <TabsContent value="trayectoria" className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Experiencia en el Congreso
                  </h3>

                  <div className="space-y-4">
                    {candidato.periodos_legislativos.map((periodo) => {
                      const inicio = new Date(
                        periodo.periodo_inicio,
                      ).getFullYear();
                      const fin = periodo.periodo_fin
                        ? new Date(periodo.periodo_fin).getFullYear()
                        : "Actualidad";

                      return (
                        <div
                          key={periodo.id}
                          className="border rounded-lg overflow-hidden"
                        >
                          {/* Header del periodo */}
                          <div className="bg-muted/50 p-4 border-b">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge
                                    variant={
                                      periodo.esta_activo
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {periodo.esta_activo
                                      ? "Activo"
                                      : "Finalizado"}
                                  </Badge>
                                  <Badge variant="outline">
                                    {periodo.camara}
                                  </Badge>
                                </div>
                                <p className="text-sm font-semibold">
                                  {inicio} - {fin}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5 text-xs text-foreground/70">
                                <Briefcase className="size-3 flex-shrink-0" />
                                <span className="truncate">
                                  {periodo.partido_actual?.nombre ||
                                    "No agrupados"}
                                </span>
                              </div>
                              {periodo.distrito?.nombre && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {periodo.distrito.nombre}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Proyectos de ley */}
                          {periodo.proyectos_ley &&
                          periodo.proyectos_ley.length > 0 ? (
                            <div className="p-4">
                              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                                <ScrollText className="w-4 h-4" />
                                Proyectos de Ley ({periodo.proyectos_ley.length}
                                )
                              </p>
                              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                {periodo.proyectos_ley.map((proyecto) => (
                                  <div
                                    key={proyecto.id}
                                    className="bg-background border rounded-lg p-3 hover:border-primary/50 transition-colors"
                                  >
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <p className="text-sm font-medium leading-tight flex-1">
                                        {proyecto.numero}: {proyecto.titulo}
                                      </p>
                                      <Badge
                                        variant="outline"
                                        className="text-xs shrink-0"
                                      >
                                        {proyecto.estado}
                                      </Badge>
                                    </div>
                                    {proyecto.resumen && (
                                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                        {proyecto.resumen}
                                      </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1.5">
                                      {new Date(
                                        proyecto.fecha_presentacion,
                                      ).toLocaleDateString("es-PE", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </p>
                                    {proyecto.url_documento && (
                                      <a
                                        href={proyecto.url_documento}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1.5"
                                      >
                                        Ver documento
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              Sin proyectos de ley registrados en este periodo
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            )}

            {/* TAB: DOCUMENTOS */}
            <TabsContent value="documentos" className="space-y-4">
              <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <Download className="w-4 h-4 text-primary" />
                Documentos Oficiales
              </h3>

              <div className="space-y-3">
                {/* Hoja de vida */}
                {persona.hoja_vida_url ? (
                  <a
                    href={persona.hoja_vida_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-card border rounded-lg hover:border-primary/50 hover:bg-accent transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Hoja de Vida</p>
                      <p className="text-xs text-muted-foreground">
                        Currículum vitae oficial
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-muted/30 border rounded-lg opacity-60">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Hoja de Vida
                      </p>
                      <p className="text-xs text-muted-foreground">
                        No disponible
                      </p>
                    </div>
                  </div>
                )}

                {/* Plan de gobierno */}
                {candidato.plan_gobierno_url ? (
                  <a
                    href={candidato.plan_gobierno_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-card border rounded-lg hover:border-primary/50 hover:bg-accent transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Plan de Gobierno Completo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Documento oficial PDF
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-muted/30 border rounded-lg opacity-60">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Plan de Gobierno
                      </p>
                      <p className="text-xs text-muted-foreground">
                        No disponible
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {!persona.hoja_vida_url && !candidato.plan_gobierno_url && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Download className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-medium text-foreground mb-2">
                    Sin documentos disponibles
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Este candidato aún no ha publicado documentos oficiales
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
};

export default CandidatoDialog;
