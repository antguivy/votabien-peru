import { ReactNode, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  MotionValue,
} from "framer-motion";
import {
  Shuffle,
  Users,
  FileCheck,
  TrendingUp,
  AlertCircle,
  Scale,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import { PersonaList } from "@/interfaces/politics";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export interface ComparadorContentProps {
  legisladorA: PersonaList;
  legisladorB: PersonaList;
  isAnimating: boolean;
  onShuffleClick: () => void;
}

function calcularStats(legislador: PersonaList) {
  const asistencias = legislador.periodo_activo.asistencias || [];
  const proyectos = legislador.periodo_activo.proyectos_ley || [];
  const antecedentes = legislador.antecedentes || [];
  const biografia = legislador.biografia_detallada || [];

  const totalAsistencias = asistencias.length;
  const asistenciasConfirmadas = asistencias.filter((a) => a.asistio).length;
  const porcentajeAsistencia =
    totalAsistencias > 0
      ? Math.round((asistenciasConfirmadas / totalAsistencias) * 100)
      : null;

  const totalProyectos = proyectos.length;
  const proyectosAprobados = proyectos.filter((p) =>
    p.estado?.toLowerCase().includes("aprobado"),
  ).length;

  const controversias = biografia.filter(
    (b) => b.tipo === "Controversia",
  ).length;
  const totalAlertas = controversias + antecedentes.length;

  return {
    asistencia: {
      porcentaje: porcentajeAsistencia,
      total: totalAsistencias,
    },
    proyectos: {
      total: totalProyectos,
      aprobados: proyectosAprobados,
    },
    alertas: {
      total: totalAlertas,
      controversias,
      antecedentes: antecedentes.length,
    },
  };
}

export function ComparadorContent({
  legisladorA,
  legisladorB,
  isAnimating,
  onShuffleClick,
}: ComparadorContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Animaciones suaves sin zoom para evitar desplazamiento
  const photoBlur = useTransform(scrollYProgress, [0, 0.4, 1], [0, 2, 2]);

  // Overlay más dramático
  const overlayOpacity = useTransform(
    scrollYProgress,
    [0, 0.4, 1],
    [0, 0.6, 0.6],
  );

  // Animación específica para los nombres (aparecen primero)
  const nameOpacity = useTransform(
    scrollYProgress,
    [0, 0.15, 0.4],
    [0, 0.5, 1],
  );
  const nameY = useTransform(scrollYProgress, [0, 0.15, 0.4], [80, 30, 0]);
  const nameScale = useTransform(
    scrollYProgress,
    [0, 0.15, 0.4],
    [0.9, 0.95, 1],
  );

  // Animación para badges (aparecen después de los nombres)
  const badgeOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.25, 0.5],
    [0, 0.4, 1],
  );
  const badgeY = useTransform(scrollYProgress, [0.1, 0.25, 0.5], [60, 20, 0]);
  const badgeScale = useTransform(
    scrollYProgress,
    [0.1, 0.25, 0.5],
    [0.8, 0.9, 1],
  );

  // Animación para stats (aparecen al final)
  const statsOpacity = useTransform(
    scrollYProgress,
    [0.2, 0.4, 0.6],
    [0, 0.5, 1],
  );
  const statsY = useTransform(scrollYProgress, [0.2, 0.4, 0.6], [80, 30, 0]);
  const statsScale = useTransform(
    scrollYProgress,
    [0.2, 0.4, 0.6],
    [0.85, 0.92, 1],
  );

  const statsA = calcularStats(legisladorA);
  const statsB = calcularStats(legisladorB);
  const colorA =
    legisladorA.periodo_activo.partido_actual?.color_hex || "#6b7280";
  const colorB =
    legisladorB.periodo_activo.partido_actual?.color_hex || "#6b7280";

  return (
    <section className="relative py-12 md:py-20 overflow-hidden bg-gradient-to-b from-background via-muted/50 to-background">
      {/* Elementos decorativos sutiles continuando el hero */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] dark:opacity-100 opacity-30" />
        <div className="absolute top-20 left-10 w-72 h-72 md:w-96 md:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-72 h-72 md:w-96 md:h-96 bg-info/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-background to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Header centrado con container */}
      <div className="container mx-auto px-4 mb-12 md:mb-16">
        <motion.div
          className="text-center relative"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Glow sutil detrás del título */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent blur-3xl -z-10" />

          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-foreground mb-4 leading-tight">
            Tú Decides con Datos
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Compara el trabajo real de tus congresistas: asistencia, proyectos
            presentados y transparencia
          </p>
        </motion.div>
      </div>

      {/* Comparador */}
      <div className="w-full mb-10 md:mb-12 md:container md:mx-auto md:px-4">
        <div ref={containerRef} className="relative min-h-[100vh]">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="sticky top-0 h-screen overflow-hidden"
            >
              {/* Split Screen Container - Edge to edge en mobile, rounded en desktop */}
              <div className="relative h-full w-full md:rounded-2xl overflow-hidden shadow-2xl">
                <LegisladorSide
                  legislador={legisladorA}
                  stats={statsA}
                  side="left"
                  color={colorA}
                  photoBlur={photoBlur}
                  overlayOpacity={overlayOpacity}
                  nameOpacity={nameOpacity}
                  nameY={nameY}
                  nameScale={nameScale}
                  badgeOpacity={badgeOpacity}
                  badgeY={badgeY}
                  badgeScale={badgeScale}
                  statsOpacity={statsOpacity}
                  statsY={statsY}
                  statsScale={statsScale}
                />

                <LegisladorSide
                  legislador={legisladorB}
                  stats={statsB}
                  side="right"
                  color={colorB}
                  photoBlur={photoBlur}
                  overlayOpacity={overlayOpacity}
                  nameOpacity={nameOpacity}
                  nameY={nameY}
                  nameScale={nameScale}
                  badgeOpacity={badgeOpacity}
                  badgeY={badgeY}
                  badgeScale={badgeScale}
                  statsOpacity={statsOpacity}
                  statsY={statsY}
                  statsScale={statsScale}
                />

                <VSBadge colorA={colorA} colorB={colorB} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* CTAs */}
      <div className="container mx-auto px-4">
        <motion.div
          className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={onShuffleClick}
            disabled={isAnimating}
            size="lg"
            variant="outline"
            className="group relative overflow-hidden bg-card/80 backdrop-blur-sm border-2 border-border hover:border-primary/50 hover:bg-accent text-foreground transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Shuffle
              className={`w-4 h-4 transition-transform duration-300 ${
                isAnimating ? "animate-spin" : "group-hover:rotate-180"
              }`}
            />
            <span className="font-semibold">Cambiar Legisladores</span>
          </Button>

          <Link href="/comparador">
            <Button
              size="lg"
              className="group relative overflow-hidden bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <Scale className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="font-bold">Comparar Personalizadamente</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>

          <Link href="/legisladores">
            <Button
              size="lg"
              variant="outline"
              className="group bg-card/50 backdrop-blur-sm border-2 border-border hover:border-primary/50 hover:bg-accent text-foreground shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Users className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span className="font-semibold">Ver Todos</span>
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// Componente para cada lado del split
interface LegisladorSideProps {
  legislador: PersonaList;
  stats: ReturnType<typeof calcularStats>;
  side: "left" | "right";
  color: string;
  photoBlur: MotionValue<number>;
  overlayOpacity: MotionValue<number>;
  nameOpacity: MotionValue<number>;
  nameY: MotionValue<number>;
  nameScale: MotionValue<number>;
  badgeOpacity: MotionValue<number>;
  badgeY: MotionValue<number>;
  badgeScale: MotionValue<number>;
  statsOpacity: MotionValue<number>;
  statsY: MotionValue<number>;
  statsScale: MotionValue<number>;
}

function LegisladorSide({
  legislador,
  stats,
  side,
  color,
  photoBlur,
  overlayOpacity,
  nameOpacity,
  nameY,
  nameScale,
  badgeOpacity,
  badgeY,
  badgeScale,
  statsOpacity,
  statsY,
  statsScale,
}: LegisladorSideProps) {
  const isLeft = side === "left";

  return (
    <div
      className={`absolute top-0 ${isLeft ? "left-0" : "right-0"} w-1/2 h-full`}
    >
      {/* Foto de fondo - blur */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        style={{
          filter: `blur(${photoBlur}px)`,
        }}
      >
        {legislador.foto_url ? (
          <Image
            src={legislador.foto_url}
            alt={`${legislador.nombres} ${legislador.apellidos}`}
            fill
            priority
            sizes="50vw"
            className="object-cover object-top"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${color}40, ${color}10)`,
            }}
          >
            <Users className="w-32 h-32 text-foreground/20" />
          </div>
        )}

        {/* GRADIENT VERTICAL SIMÉTRICO - suave */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              to bottom,
              transparent 0%,
              transparent 40%,
              ${color}04 55%,
              ${color}12 70%,
              ${color}30 82%,
              ${color}60 92%,
              ${color}B3 100%
            )`,
          }}
        />
      </motion.div>

      {/* OVERLAY NEGRO SIMÉTRICO - suave y uniforme */}
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: overlayOpacity,
          background: `linear-gradient(
            to bottom,
            transparent 0%,
            transparent 40%,
            rgba(0,0,0,0.12) 55%,
            rgba(0,0,0,0.30) 70%,
            rgba(0,0,0,0.50) 82%,
            rgba(0,0,0,0.60) 100%
          )`,
        }}
      />

      {/* Vignette radial para profundidad */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(
            ellipse at center,
            transparent 30%,
            rgba(0,0,0,0.4) 100%
          )`,
        }}
      />

      {/* Animaciones */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-8 lg:p-12">
        {/* Info del legislador - Animación progresiva por capas */}
        <div className={`mb-6 ${isLeft ? "text-left" : "text-right"}`}>
          {/* CAPA 1: Nombres - Aparecen primero con ESCALA */}
          <motion.div
            style={{
              opacity: nameOpacity,
              y: nameY,
              scale: nameScale,
            }}
          >
            <h3 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-1 leading-tight uppercase tracking-tight drop-shadow-2xl">
              {legislador.apellidos}
            </h3>
            <p className="text-lg md:text-2xl lg:text-3xl font-bold text-white/95 mb-3 drop-shadow-lg">
              {legislador.nombres}
            </p>
          </motion.div>

          {/* CAPA 2: Badges - Aparecen después con ESCALA */}
          <motion.div
            className="flex flex-col gap-2 mb-3"
            style={{
              opacity: badgeOpacity,
              y: badgeY,
              scale: badgeScale,
            }}
          >
            {/* Partido actual o "No agrupados" */}
            <Badge
              className={`!whitespace-normal px-3 py-1.5 md:px-4 md:py-2 rounded-full backdrop-blur-xl border shadow-2xl text-white font-bold text-xs md:text-sm leading-tight text-center max-w-[220px] ${
                legislador.periodo_activo.partido_actual
                  ? "border-white/30"
                  : "border-gray-400/30 bg-gray-500/70 text-white/90"
              } ${isLeft ? "self-start" : "self-end"}`}
              style={
                legislador.periodo_activo.partido_actual
                  ? { backgroundColor: `${color}F0` }
                  : undefined
              }
            >
              <span className="break-words hyphens-auto" lang="es">
                {legislador.periodo_activo.partido_actual
                  ? legislador.periodo_activo.partido_actual.nombre
                  : "No agrupados"}
              </span>
            </Badge>

            {/* Bancada */}
            {legislador.periodo_activo.bancada_nombre &&
              legislador.periodo_activo.partido_actual?.nombre !==
                legislador.periodo_activo.bancada_nombre && (
                <Badge
                  variant="secondary"
                  className={`!whitespace-normal px-3 py-1 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 text-white/90 text-[10px] md:text-xs leading-tight text-center max-w-[220px] ${
                    isLeft ? "self-start" : "self-end"
                  }`}
                >
                  <span className="break-words hyphens-auto" lang="es">
                    Bancada: {legislador.periodo_activo.bancada_nombre}
                  </span>
                </Badge>
              )}
          </motion.div>

          {/* Distrito - También aparece con los badges */}
          <motion.p
            className="text-sm md:text-base text-white/90 font-medium drop-shadow-md"
            style={{
              opacity: badgeOpacity,
              y: badgeY,
            }}
          >
            {legislador.periodo_activo.distrito.nombre}
          </motion.p>
        </div>

        {/* CAPA 3: Stats - Aparecen al final con ESCALA */}
        <motion.div
          className="space-y-2 md:space-y-3 backdrop-blur-xl bg-black/20 rounded-2xl p-3 md:p-4 border border-white/10"
          style={{
            opacity: statsOpacity,
            y: statsY,
            scale: statsScale,
          }}
        >
          <StatBar
            icon={<TrendingUp className="w-3 h-3 md:w-4 md:h-4" />}
            label="Asistencia"
            value={stats.asistencia.porcentaje}
            total={stats.asistencia.total}
            color={color}
            side={side}
            showPercentage
          />

          <StatBar
            icon={<FileCheck className="w-3 h-3 md:w-4 md:h-4" />}
            label="Proyectos de Ley"
            value={stats.proyectos.total}
            maxValue={50}
            subtitle={`${stats.proyectos.aprobados} aprobados`}
            color={color}
            side={side}
          />

          <StatBar
            icon={<AlertCircle className="w-3 h-3 md:w-4 md:h-4" />}
            label="Alertas"
            value={stats.alertas.total}
            maxValue={10}
            color={stats.alertas.total > 0 ? "#ef4444" : color}
            side={side}
            alert={stats.alertas.total > 0}
          />
        </motion.div>
      </div>
    </div>
  );
}

interface StatBarProps {
  icon: ReactNode;
  label: string;
  value: number | null;
  maxValue?: number;
  total?: number;
  subtitle?: string;
  color: string;
  side: "left" | "right";
  showPercentage?: boolean;
  alert?: boolean;
}

// Barra de estadística
function StatBar({
  icon,
  label,
  value,
  maxValue = 100,
  total,
  subtitle,
  color,
  side,
  showPercentage = false,
  alert = false,
}: StatBarProps) {
  const isLeft = side === "left";
  const percentage = maxValue
    ? Math.min(((value ?? 0) / maxValue) * 100, 100)
    : 0;
  const displayValue = value !== null ? value : "—";

  return (
    <div className="flex flex-col gap-1">
      {/* Label y valor */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={`flex items-center justify-between gap-2 ${isLeft ? "flex-row" : "flex-row-reverse"}`}
      >
        <div
          className={`flex items-center gap-1.5 ${isLeft ? "flex-row" : "flex-row-reverse"}`}
        >
          <div className="text-white/90">{icon}</div>
          <span className="text-xs md:text-sm font-medium text-white">
            {label}
          </span>
        </div>
        <div
          className={`flex flex-col ${isLeft ? "items-end" : "items-start"}`}
        >
          <span
            className={`text-sm md:text-lg font-bold ${alert ? "text-red-400" : "text-white"}`}
          >
            {displayValue}
            {showPercentage && value !== null ? "%" : ""}
          </span>
          {subtitle && (
            <span className="text-[10px] text-white/70">{subtitle}</span>
          )}
          {total !== undefined && value !== null && (
            <span className="text-[10px] text-white/70">{total} sesiones</span>
          )}
        </div>
      </motion.div>

      {/* Barra de progreso */}
      {value !== null && (
        <div className="relative h-1.5 md:h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: `${percentage}%`, opacity: 1 }}
            transition={{
              duration: 1.2,
              ease: [0.25, 0.1, 0.25, 1],
              delay: 0.3,
            }}
            className="h-full rounded-full relative"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 12px ${color}99`,
            }}
          >
            {/* Spark effect */}
            <motion.div
              className="absolute right-0 top-0 bottom-0 w-1 bg-white/90 shadow-lg"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Glow adicional en el extremo */}
            <motion.div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/80 blur-sm"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}

// VS Badge central
function VSBadge({ colorA, colorB }: { colorA: string; colorB: string }) {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          rotateY: [0, 5, -5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative"
      >
        <div className="w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 relative">
          {/* Animated rings */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white/40"
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white/40"
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          />

          {/* Badge principal */}
          <div
            className="relative w-full h-full rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20"
            style={{
              background: `linear-gradient(135deg, ${colorA} 0%, ${colorB} 100%)`,
              boxShadow: `0 0 40px ${colorA}40, 0 0 40px ${colorB}40`,
            }}
          >
            <span className="text-xl md:text-3xl lg:text-4xl font-black text-white drop-shadow-lg">
              VS
            </span>
          </div>

          {/* Outer glow */}
          <div
            className="absolute -inset-6 rounded-full blur-2xl -z-10 opacity-50"
            style={{
              background: `radial-gradient(circle, ${colorA}60, ${colorB}60)`,
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
