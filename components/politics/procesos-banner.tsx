"use client";

import Image from "next/image";
import { Calendar, Timer } from "lucide-react";
import Link from "next/link";

interface ProcesoElectoral {
  id: string;
  nombre: string;
  año: number;
  fecha_elecciones: string;
  activo: boolean;
}

interface ProcesosElectoralesBannerProps {
  procesos: ProcesoElectoral[];
}

const ProcesosElectoralesBanner = ({
  procesos,
}: ProcesosElectoralesBannerProps) => {
  if (!procesos?.length) return null;

  const procesoActivo = procesos[0];
  const fechaElecciones = new Date(procesoActivo.fecha_elecciones);
  const fechaFormateada = fechaElecciones.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hoy = new Date();
  const diasRestantes = Math.ceil(
    (fechaElecciones.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <section className="relative overflow-hidden rounded-xl shadow-lg border border-border/40">
      {/* Imagen de fondo desenfocada */}
      <div className="absolute inset-0">
        <Image
          src="/images/bg-elecciones-peru.jpg"
          alt="Fondo elecciones Perú"
          fill
          priority
          className="object-cover brightness-90 blur-[3px] scale-105 transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/60 to-background/30 dark:from-background/90 dark:via-background/70 dark:to-background/40 backdrop-blur-sm" />
      </div>

      {/* Blobs animados */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
        <div className="absolute top-0 left-0 w-56 h-56 bg-gradient-to-tr from-primary to-destructive rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-0 w-56 h-56 bg-gradient-to-tr from-warning to-success rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 container mx-auto px-6 py-10 flex flex-col lg:flex-row items-center justify-between gap-6 text-foreground">
        <div className="flex-1 text-center lg:text-left space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {procesoActivo.nombre}
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 text-sm md:text-base">
            <div className="inline-flex items-center gap-2 bg-background/40 backdrop-blur-md rounded-lg px-3 py-1.5 border border-border/30">
              <Calendar className="size-4 text-primary" />
              <span>{fechaFormateada}</span>
            </div>

            {diasRestantes > 0 && (
              <div className="inline-flex items-center gap-2 bg-warning/20 text-warning-foreground backdrop-blur-md rounded-lg px-3 py-1.5 border border-warning/30">
                <Timer className="size-4" />
                <span className="font-semibold">
                  {diasRestantes} {diasRestantes === 1 ? "día" : "días"}{" "}
                  restantes
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Link
            // href={`/procesos-electorales/${procesoActivo.id}`}
            href={`/`}
            className="group inline-flex items-center justify-center px-5 py-2.5 md:px-6 md:py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-md hover:shadow-lg hover:bg-primary/90 transition-all duration-300"
          >
            <svg
              className="w-4 h-4 md:w-5 md:h-5 mr-2 transition-transform group-hover:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Ver Información
          </Link>

          <Link
            href="/candidatos"
            className="group inline-flex items-center justify-center px-5 py-2.5 md:px-6 md:py-3 border border-primary/70 text-primary font-semibold rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300 backdrop-blur-sm"
          >
            <svg
              className="w-4 h-4 md:w-5 md:h-5 mr-2 transition-transform group-hover:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Ver Candidatos
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProcesosElectoralesBanner;
