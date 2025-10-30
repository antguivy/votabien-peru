import { publicApi } from "@/lib/public-api";
import PartidosList from "@/components/politics/partidos-list";
import Footer from "@/components/landing/footer";
import ErrorLanding from "@/components/landing/error-landing";
import { PartidoDetail, ProcesoElectoral } from "@/interfaces/politics";
import Link from "next/link";
import { Suspense } from "react";
import HeroDualSplit from "@/components/landing/hero-dual-split";
import { Skeleton } from "@/components/ui/skeleton";
import ComparadorServer from "@/components/comparador/comparador-server";

function ComparadorSkeleton() {
  return (
    <section className="relative w-full min-h-screen bg-background overflow-hidden">
      {/* Fondo difuminado */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/40 to-background pointer-events-none" />

      {/* Contenedor split 50/50 constante (mobile también) */}
      <div className="relative z-10 flex w-full h-full min-h-[720px]">
        {/* Lado izquierdo (50%) */}
        <div className="w-1/2 flex flex-col border-r border-border bg-card">
          {/* Imagen / retrato */}
          <div className="w-full aspect-[3/4]">
            <Skeleton className="w-full h-full rounded-none" />
          </div>

          {/* Info */}
          <div className="p-6 flex flex-col gap-3">
            <Skeleton className="h-7 w-52 rounded-md" /> {/* Apellido grande */}
            <Skeleton className="h-4 w-40 rounded-md" /> {/* Nombre */}
            <Skeleton className="h-8 w-56 rounded-full" />{" "}
            {/* Partido (chip) */}
            <Skeleton className="h-4 w-36 rounded-md" /> {/* Bancada */}
            <Skeleton className="h-4 w-28 rounded-md" /> {/* Región */}
          </div>

          {/* Barra inferior tipo stats */}
          <div className="mt-auto border-t border-border px-6 py-5 bg-muted/30">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-44 rounded-md" />
              <Skeleton className="h-4 w-36 rounded-md" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
          </div>
        </div>

        {/* Lado derecho (50%) */}
        <div className="w-1/2 flex flex-col bg-card">
          <div className="w-full aspect-[3/4]">
            <Skeleton className="w-full h-full rounded-none" />
          </div>

          <div className="p-6 flex flex-col gap-3">
            <Skeleton className="h-7 w-52 rounded-md" /> {/* Apellido grande */}
            <Skeleton className="h-4 w-40 rounded-md" /> {/* Nombre */}
            <Skeleton className="h-8 w-56 rounded-full" />{" "}
            {/* Partido (chip) */}
            <Skeleton className="h-4 w-36 rounded-md" /> {/* Bancada */}
            <Skeleton className="h-4 w-28 rounded-md" /> {/* Región */}
          </div>

          <div className="mt-auto border-t border-border px-6 py-5 bg-muted/30">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-44 rounded-md" />
              <Skeleton className="h-4 w-36 rounded-md" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* VS gris centrado entre las dos mitades */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center"
      >
        <div className="relative flex items-center justify-center">
          {/* halo sutil */}
          <div className="absolute w-20 h-20 rounded-full bg-gray-300/20 blur-md" />
          {/* círculo gris sólido con texto VS */}
          <div className="relative w-16 h-16 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center shadow-md">
            <span className="text-sm font-semibold text-gray-700">VS</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function SaasPage() {
  try {
    // Obtener datos en paralelo
    const [partidos, proceso_electoral] = await Promise.all([
      publicApi.getPartidos(true) as Promise<PartidoDetail[]>,
      publicApi.getProcesosElectorales(true) as Promise<ProcesoElectoral[]>,
    ]);
    // Calcular estadísticas
    return (
      <div className="min-h-screen">
        {/* Hero Dual Split */}
        <HeroDualSplit proceso_electoral={proceso_electoral[0]} />
        <Suspense fallback={<ComparadorSkeleton />}>
          <ComparadorServer />
        </Suspense>

        {/* Partidos Políticos */}
        <section className="bg-muted/30 py-12 md:py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-8 md:mb-10">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                    Partidos Políticos
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
                    Conoce las agrupaciones políticas representadas en el
                    Congreso
                  </p>
                </div>
                <Link
                  href="/partidos"
                  className="hidden md:inline-flex items-center text-primary hover:text-primary/80 font-medium text-sm transition-colors group"
                >
                  Ver todos
                  <svg
                    className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            <PartidosList partidos={partidos} />

            {/* CTA móvil */}
            <div className="text-center mt-6 md:mt-8">
              <Link
                href="/partidos"
                className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-3.5 bg-card border-2 border-border text-foreground font-semibold rounded-lg md:rounded-xl hover:bg-accent hover:border-primary/30 transition-all shadow-sm hover:shadow-md"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                Ver todos los partidos
              </Link>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <Footer />
      </div>
    );
  } catch (error) {
    console.error("Error cargando datos de landing:", error);
    return <ErrorLanding />;
  }
}
