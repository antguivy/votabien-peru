"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Clock,
  Scale,
  Vote,
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  LogIn,
  BookOpen,
  FileText,
  Layers,
  ChevronRight,
  BrainCircuit,
} from "lucide-react";
import { Button } from "./ui/button";

export type FeatureType =
  | "candidatos"
  | "match"
  | "simulador"
  | "trivia"
  | "partidos"
  | "comparador"
  | "general";

interface FeatureConfig {
  title: string;
  description: string;
}

const FEATURE_CONFIGS: Record<FeatureType, FeatureConfig> = {
  candidatos: {
    title: "Directorio de Candidatos ERM 2026",
    description:
      "Hojas de vida y declaraciones juradas del JNE, acompañadas de seguimiento de noticias de prensa y antecedentes públicos verificados.",
  },
  match: {
    title: "Mi Candidato (Match con IA)",
    description:
      "Herramienta desarrollada para elecciones generales que utiliza Inteligencia Artificial y búsqueda semántica (RAG) para conectar las prioridades ciudadanas con el historial y posturas de los candidatos.",
  },
  simulador: {
    title: "Simulador de Votación",
    description:
      "Cédula interactiva con Modo Libre y Modo Retos para practicar el marcado sobre las columnas oficiales y conocer los criterios de votos válidos, blancos, nulos y viciados.",
  },
  trivia: {
    title: "Trivia Cívica",
    description:
      "Preguntas didácticas organizadas en 4 ejes temáticos: competencias de autoridades, detector de promesas inviables, reglas del sufragio y archivo de declaraciones.",
  },
  partidos: {
    title: "Partidos y Organizaciones Políticas",
    description:
      "Estamos consolidando la información de las agrupaciones políticas y movimientos regionales que participan en este proceso electoral.",
  },
  comparador: {
    title: "Comparador de Fórmulas y Planes",
    description:
      "Módulo analítico interactivo diseñado para contrastar cara a cara planes de gobierno, propuestas sectoriales y fórmulas electorales en paralelo.",
  },
  general: {
    title: "Estamos preparando las herramientas para las Elecciones 2026",
    description:
      "Nuestro equipo viene investigando y recopilando información pública de los candidatos a nivel nacional para ofrecerte datos claros, verificados y sin sesgos.",
  },
};

const TECH_PILLARS = {
  match: {
    title: "Capacidades Técnicas y Metodología",
    techName: "Motor de Afinidad con IA (RAG)",
    techDesc:
      "Búsqueda semántica sobre vectores de texto que cruza prioridades ciudadanas con el registro público de candidatos.",
    items: [
      {
        title: "Búsqueda Semántica Vectorial (RAG)",
        desc: "Indexación sobre vectores de texto (pgvector) para correlacionar inquietudes ciudadanas con fuentes documentales en tiempo real.",
      },
      {
        title: "Neutralidad y Explicabilidad",
        desc: "Desglose transparente de afinidad temática con citas y fuentes verificadas, sin ponderaciones partidarias.",
      },
      {
        title: "Privacidad y Anonimato",
        desc: "Procesamiento seguro en memoria sin almacenamiento de datos personales ni perfilamiento del votante.",
      },
    ],
  },
  comparador: {
    title: "Capacidades Técnicas y Metodología",
    techName: "Matriz de Contraste Programático",
    techDesc:
      "Visualización simultánea de propuestas, hojas de vida y ejes de gobierno de las organizaciones políticas.",
    items: [
      {
        title: "Contraste Temático Multidimensional",
        desc: "Visualización en paralelo por sectores (seguridad, salud, educación y economía) entre organizaciones políticas.",
      },
      {
        title: "Trazabilidad con Documentos Oficiales",
        desc: "Información extraída directamente de los planes de gobierno y hojas de vida registradas ante el JNE.",
      },
      {
        title: "Análisis Cara a Cara",
        desc: "Interfaz comparativa diseñada para identificar rápidamente divergencias programáticas y consensos entre listas.",
      },
    ],
  },
};

// 26 de septiembre de 2026, 00:00:00 UTC-5 (Hora de Perú)
const LAUNCH_DATE_TIMESTAMP = new Date("2026-09-26T00:00:00-05:00").getTime();

interface DaysLeft {
  days: number;
  isPast: boolean;
}

function calculateDaysLeft(): DaysLeft {
  const diff = LAUNCH_DATE_TIMESTAMP - Date.now();
  if (diff <= 0) {
    return { days: 0, isPast: true };
  }
  return {
    days: Math.ceil(diff / (1000 * 60 * 60 * 24)),
    isPast: false,
  };
}

let cachedClientSnapshot: DaysLeft = calculateDaysLeft();
let lastSnapshotMinute = 0;

function getClientSnapshot(): DaysLeft {
  const currentMinute = Math.floor(Date.now() / 60000);
  if (currentMinute !== lastSnapshotMinute) {
    lastSnapshotMinute = currentMinute;
    cachedClientSnapshot = calculateDaysLeft();
  }
  return cachedClientSnapshot;
}

const SERVER_SNAPSHOT: DaysLeft = Object.freeze(calculateDaysLeft());

function getServerSnapshot(): DaysLeft {
  return SERVER_SNAPSHOT;
}

function subscribeDays(callback: () => void) {
  const interval = setInterval(callback, 60000);
  return () => clearInterval(interval);
}

function useDaysLeft(): DaysLeft {
  return useSyncExternalStore(
    subscribeDays,
    getClientSnapshot,
    getServerSnapshot,
  );
}

interface UnderConstructionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  feature?: FeatureType;
  estimatedDate?: string;
  showBackButton?: boolean;
  showExploreButton?: boolean;
  isTeam?: boolean;
  backHref?: string;
  icon?: "construction" | "hammer";
}

export default function UnderConstruction({
  title,
  subtitle,
  description,
  feature = "general",
  estimatedDate,
  showBackButton = true,
  showExploreButton = true,
  isTeam = true,
  backHref = "/",
}: UnderConstructionProps) {
  const pathname = usePathname();
  const config = FEATURE_CONFIGS[feature] || FEATURE_CONFIGS.general;

  const resolvedTitle = title || config.title;
  const resolvedDescription = description || config.description;

  const daysLeft = useDaysLeft();

  const loginCallbackUrl = pathname
    ? `/auth/login?callbackUrl=${encodeURIComponent(pathname)}`
    : "/auth/login";

  const isGeneralElectionTool = feature === "match" || feature === "comparador";
  const techPillars =
    isGeneralElectionTool && (feature === "match" || feature === "comparador")
      ? TECH_PILLARS[feature]
      : null;

  return (
    <div className="w-full bg-background text-foreground py-10 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Bloque Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
          {/* Columna Izquierda: Información & Acciones */}
          <div className="lg:col-span-7">
            {isGeneralElectionTool && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold mb-4">
                <BrainCircuit className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Módulo de Innovación Cívica · Elecciones Generales</span>
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight mb-4">
              {resolvedTitle}
            </h1>

            {(subtitle ||
              (isGeneralElectionTool &&
                (feature === "match"
                  ? "Motor de afinidad con Inteligencia Artificial (RAG)"
                  : "Matriz de análisis programático cara a cara"))) && (
              <p className="text-base font-semibold text-brand mb-3">
                {subtitle ||
                  (feature === "match"
                    ? "Motor de afinidad con Inteligencia Artificial (RAG)"
                    : "Matriz de análisis programático cara a cara")}
              </p>
            )}

            <p className="text-base text-muted-foreground leading-relaxed mb-8">
              {resolvedDescription}
            </p>

            {/* Lista técnica vs Avance del trabajo */}
            {isGeneralElectionTool && techPillars ? (
              <div className="bg-card border border-border rounded-xl p-5 mb-8">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3.5">
                  {techPillars.title}
                </h2>
                <ul className="space-y-3.5 text-sm">
                  {techPillars.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand/15 text-brand flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <div>
                        <span className="font-medium text-foreground">
                          {item.title}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-5 mb-8">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3.5">
                  Avance del trabajo
                </h2>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        Recopilación oficial del JNE
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Hojas de vida, fórmulas inscritas, declaraciones juradas
                        de bienes y antecedentes declarados.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand/15 text-brand flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-brand" />
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        Seguimiento de noticias y fuentes públicas
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Recopilación de cobertura periodística y antecedentes
                        con enlaces directos para consulta ciudadana.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3 opacity-60">
                    <div className="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="w-3 h-3" strokeWidth={1.75} />
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        Lanzamiento público
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Apertura de herramientas de consulta ciudadana (26 de
                        septiembre).
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex flex-wrap items-center gap-3">
              {showExploreButton && (
                <Button
                  asChild
                  size="lg"
                  className="bg-brand hover:bg-brand/90 text-white font-medium shadow-xs"
                >
                  <Link
                    href={
                      isGeneralElectionTool ? "/candidatos" : "/legisladores"
                    }
                  >
                    {isGeneralElectionTool
                      ? "Explorar Herramientas ERM 2026"
                      : "Ver Congresistas actuales"}
                    <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.75} />
                  </Link>
                </Button>
              )}

              {showBackButton && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="font-medium"
                >
                  <Link href={backHref}>
                    <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={1.75} />
                    Volver al Inicio
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Columna Derecha: Ficha Técnica (si es herramienta general) vs Tarjeta de Lanzamiento */}
          <div className="lg:col-span-5">
            {isGeneralElectionTool ? (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/70">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Ficha de Innovación
                  </span>
                  {feature === "match" ? (
                    <BrainCircuit
                      className="w-4 h-4 text-brand"
                      strokeWidth={1.75}
                    />
                  ) : (
                    <Scale className="w-4 h-4 text-brand" strokeWidth={1.75} />
                  )}
                </div>

                <div className="mb-5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 uppercase tracking-wider">
                    Tecnología VotaBien Perú
                  </span>
                  <div className="text-xl font-bold tracking-tight text-foreground mt-2">
                    {techPillars?.techName}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {techPillars?.techDesc}
                  </div>
                </div>

                {/* Especificaciones clave */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 mb-5 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Despliegue:</span>
                    <span className="font-semibold text-foreground">
                      Probado en Elecciones Generales
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Metodología:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Neutralidad & Fuentes Abiertas
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Escalabilidad:
                    </span>
                    <span className="font-medium text-foreground">
                      Disponible para integración
                    </span>
                  </div>
                </div>

                {/* Independencia */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-start gap-2.5 text-xs text-muted-foreground mb-5">
                  <ShieldCheck
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                    strokeWidth={1.75}
                  />
                  <p className="leading-snug">
                    Herramienta desarrollada bajo principios de trazabilidad
                    documental, software cívico y neutralidad política.
                  </p>
                </div>

                {/* Demostración para el equipo / aliados */}
                {isTeam && (
                  <div className="pt-4 border-t border-border flex flex-col gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      Demostración para aliados y equipo técnico:
                    </span>
                    <Link
                      href={loginCallbackUrl}
                      className="inline-flex items-center justify-between p-2.5 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand/90 transition-colors shadow-xs"
                    >
                      <span className="flex items-center gap-2">
                        <LogIn className="w-3.5 h-3.5" strokeWidth={1.75} />
                        Iniciar sesión para probar la herramienta
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/70">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Lanzamiento Oficial
                  </span>
                  <Calendar className="w-4 h-4 text-brand" strokeWidth={1.75} />
                </div>

                <div className="mb-5">
                  <div className="text-2xl font-bold tracking-tight text-foreground">
                    {estimatedDate || "26 de septiembre de 2026"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    00:00 horas (Hora de Perú)
                  </div>
                </div>

                {/* Días restantes */}
                <div className="mb-5 p-4 rounded-xl bg-muted/40 border border-border/60">
                  <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground font-medium">
                    <Clock
                      className="w-3.5 h-3.5 text-brand"
                      strokeWidth={1.75}
                    />
                    <span>
                      {daysLeft.isPast ? "Estado:" : "Tiempo restante:"}
                    </span>
                  </div>

                  {!daysLeft.isPast ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                        {daysLeft.days}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">
                        {daysLeft.days === 1
                          ? "día restante"
                          : "días restantes"}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium py-1">
                      ¡Plataforma disponible! Puedes acceder a las herramientas.
                    </div>
                  )}
                </div>

                {/* Independencia */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-start gap-2.5 text-xs text-muted-foreground mb-5">
                  <ShieldCheck
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                    strokeWidth={1.75}
                  />
                  <p className="leading-snug">
                    Plataforma ciudadana independiente, sin publicidad ni fines
                    partidarios.
                  </p>
                </div>

                {/* Enlace para el equipo */}
                {isTeam && (
                  <div className="pt-4 border-t border-border flex flex-col gap-1.5">
                    <span className="text-[11px] text-muted-foreground">
                      ¿Eres parte del equipo o voluntario?
                    </span>
                    <Link
                      href={loginCallbackUrl}
                      className="inline-flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted text-xs font-medium text-foreground transition-colors border border-border/60"
                    >
                      <span className="flex items-center gap-2">
                        <LogIn
                          className="w-3.5 h-3.5 text-brand"
                          strokeWidth={1.75}
                        />
                        Inicia sesión para previsualizar
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sección de Herramientas */}
        <div className="pt-8 border-t border-border/80">
          <div className="mb-6">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Herramientas para ERM 2026
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Disponibles este 26 de septiembre para consulta ciudadana.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {/* 1. Candidatos (Activo 26 Sep) */}
            <div className="p-4 rounded-xl bg-card border border-border/80 hover:border-border transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-brand/10 text-brand">
                    <FileText className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    26 de septiembre
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">
                  Candidatos ERM 2026
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hojas de vida y declaraciones juradas del JNE, acompañadas de
                  seguimiento de noticias de prensa y antecedentes públicos
                  verificados.
                </p>
              </div>
            </div>

            {/* 2. Simulador (Activo 26 Sep) */}
            <div className="p-4 rounded-xl bg-card border border-border/80 hover:border-border transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-brand/10 text-brand">
                    <Vote className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    26 de septiembre
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">
                  Simulador de Votación
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cédula interactiva con Modo Libre y Modo Retos para practicar
                  el marcado en las columnas oficiales y aprender a identificar
                  votos válidos, blancos, nulos y viciados.
                </p>
              </div>
            </div>

            {/* 3. Trivia (Activo 26 Sep) */}
            <div className="p-4 rounded-xl bg-card border border-border/80 hover:border-border transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-brand/10 text-brand">
                    <BookOpen className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    26 de septiembre
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">
                  Trivia Cívica
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Retos didácticos en 4 ejes temáticos: competencias de
                  autoridades, detector de promesas inviables, reglas de
                  votación y declaraciones en cámara.
                </p>
              </div>
            </div>
          </div>

          {/* Subsección: Desarrolladas en elecciones generales */}
          <div className="pt-6 border-t border-border/60">
            <div className="mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Desarrolladas en elecciones generales
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Herramientas cívicas desarrolladas y desplegadas por VotaBien
                Perú en procesos electorales previos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 4. Match Electoral (Elecciones Generales) */}
              <div className="p-4 rounded-xl bg-muted/25 border border-border/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                      <Scale className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                      Elecciones Generales
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">
                    Mi Candidato (Match con IA)
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Motor de afinidad con Inteligencia Artificial y búsqueda
                    semántica (RAG) que analizó en tiempo real las prioridades
                    del ciudadano frente al perfil y declaraciones de
                    candidatos.
                  </p>
                </div>
              </div>

              {/* 5. Comparador (Elecciones Generales) */}
              <div className="p-4 rounded-xl bg-muted/25 border border-border/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                      <Layers className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                      Elecciones Generales
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">
                    Comparador Parlamentario (Versus)
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Módulo de análisis cara a cara desarrollado para contrastar
                    el trabajo real de legisladores: asistencia a sesiones,
                    producción de proyectos de ley y sanciones éticas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
