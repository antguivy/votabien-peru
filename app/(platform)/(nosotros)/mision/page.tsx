import {
  Target,
  Eye,
  Scale,
  Database,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Footer from "@/components/landing/footer";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";

// Cuando tengas las imágenes, pásalas como prop imageSrc
// Por ahora el componente usa un fondo decorativo CSS que se ve bien solo

export default function MissionPage() {
  return (
    <ContentPlatformLayout>
      <section className="pt-4 container mx-auto">
        {/* ── Quote con imagen de fondo ── */}
        <SectionWithBackground
          className="py-20 md:py-28 border-b border-border"
          imageSrc="/images/plaza-de-armas-lima.jpg"
        >
          <div className="container mx-auto px-4 max-w-4xl text-center">
            {/* Comillas decorativas */}
            <span className="block text-6xl md:text-7xl font-serif leading-none text-white/30 mb-2 select-none">
              ❝
            </span>
            <h2 className="text-2xl md:text-4xl font-serif italic text-white leading-snug mb-8 text-balance drop-shadow-md">
              No queremos un país donde la desinformación decida el rumbo.
              Queremos electores que conozcan a quién votan, qué hicieron y qué
              proponen.
            </h2>
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-brand" />
              <p className="text-sm text-white uppercase tracking-widest font-semibold">
                Infórmate, tu voto importa
              </p>
              <div className="h-px w-8 bg-brand" />
            </div>
          </div>
        </SectionWithBackground>

        {/* ── Misión y Visión ── */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">
              {/* Misión */}
              <div className="space-y-6 group">
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">
                  Nuestra Misión
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Centralizar, verificar y democratizar el acceso a la
                  información política. Existimos para eliminar la barrera
                  técnica entre los datos del Congreso y el ciudadano de a pie.
                </p>
                <ul className="space-y-3 pt-2">
                  <CheckItem text="Verificación rigurosa con fuentes primarias" />
                  <CheckItem text="Neutralidad política absoluta" />
                  <CheckItem text="Tecnología de código abierto" />
                </ul>
              </div>

              {/* Visión */}
              <div className="space-y-6 group">
                <div className="w-12 h-12 bg-info/10 dark:bg-info/20 rounded-xl flex items-center justify-center text-info mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Eye className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">
                  Nuestra Visión
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Ser el estándar de referencia para la transparencia electoral
                  en Latinoamérica. Visualizamos un 2026 donde el debate público
                  se base en métricas de desempeño y hechos, no en ruido
                  mediático.
                </p>
                <ul className="space-y-3 pt-2">
                  <CheckItem text="Ciudadanía digitalmente activa" />
                  <CheckItem text="Voto basado en evidencia" />
                  <CheckItem text="Reducción de la brecha informativa" />
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Ejes de Acción con imagen de fondo ── */}
        <SectionWithBackground
          className="py-16 md:py-24 border-y border-border"
          imageSrc="/images/congreso-peru.jpg"
          variant="warm"
        >
          <div className="container mx-auto px-4 max-w-6xl">
            {/* Título */}
            <div className="mb-12">
              {/* <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-2 drop-shadow-md">
                Lo que hacemos
              </p> */}
              <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-md">
                Ejes de Acción 2026
              </h2>
              <div className="h-1 w-20 bg-brand rounded-full" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <FeatureCard
                icon={<Database className="w-5 h-5" />}
                title="Radiografía del Candidato"
                description="Perfiles exhaustivos que cruzan antecedentes penales, formación académica y trayectoria partidaria. Sin filtros, solo datos."
              />
              {/* <FeatureCard
                icon={<TrendingUp className="w-5 h-5" />}
                title="Métricas Legislativas"
                description="Para quienes buscan reelección: analizamos asistencia, producción de leyes y sentido de votación en temas clave."
              /> */}
              <FeatureCard
                icon={<Scale className="w-5 h-5" />}
                title="Imparcialidad Algorítmica"
                description="Nuestros algoritmos no opinan. Presentan la información cruda y ordenada para evitar cualquier sesgo editorial."
              />
              {/* <FeatureCard
                icon={<CheckCircle2 className="w-5 h-5" />}
                title="Verificación en Tiempo Real"
                description="Un sistema vivo que se actualiza semanalmente conforme avanza la campaña y surgen nuevas alianzas o denuncias."
              /> */}
            </div>
          </div>
        </SectionWithBackground>

        <Footer />
      </section>
    </ContentPlatformLayout>
  );
}

// ── Componente de sección con fondo decorativo CSS
// Cuando tengas imágenes, agrega la prop imageSrc y descomentar el bloque de Image
function SectionWithBackground({
  imageSrc,
  variant = "cool",
  className,
  children,
}: {
  imageSrc?: string;
  variant?: "cool" | "warm";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl ${className ?? ""}`}
    >
      {/* ── Fondo base siempre oscuro — estas secciones son zonas de contraste
          intencional, no siguen el tema del sistema ── */}
      <div className="absolute inset-0 bg-[oklch(0.13_0.03_240)]" />

      {/* ── Capa de color según variante ── */}
      {variant === "cool" ? (
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.18_0.04_250)] via-transparent to-[oklch(0.10_0.02_230)] opacity-80" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.16_0.04_20)] via-transparent to-[oklch(0.10_0.02_240)] opacity-80" />
      )}

      {/* ── Imagen opcional (cuando la tengas, pasa imageSrc) ── */}
      {imageSrc && (
        <>
          <Image
            src={imageSrc}
            alt=""
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Overlay siempre oscuro — la imagen necesita oscuridad,
              no el tema del sistema. Funciona igual en light y dark. */}
          <div className="absolute inset-0 bg-black/65" />
        </>
      )}

      {/* ── Resplandor con primary de la paleta ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,var(--primary)_0%,transparent_70%)] opacity-[0.08]" />

      {/* ── Patrón de puntos con foreground de la paleta ── */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* ── Franja brand en el borde superior ── */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent" />

      {/* Contenido */}
      <div className="relative z-10">{children}</div>
    </section>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3 text-muted-foreground">
      <div className="mt-2 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
      <span className="text-sm md:text-base">{text}</span>
    </li>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-brand/40 hover:bg-white/10 transition-all duration-300">
      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white mb-4 group-hover:bg-brand group-hover:text-white transition-colors duration-200">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-white/65 leading-relaxed text-sm md:text-base">
        {description}
      </p>
    </div>
  );
}
