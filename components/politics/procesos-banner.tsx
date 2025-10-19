'use client'

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

const ProcesosElectoralesBanner = ({ procesos }: ProcesosElectoralesBannerProps) => {
  if (!procesos || procesos.length === 0) {
    return null;
  }

  // Mostrar solo el primer proceso activo
  const procesoActivo = procesos[0];
  
  // Formatear fecha
  const fechaElecciones = new Date(procesoActivo.fecha_elecciones);
  const fechaFormateada = fechaElecciones.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calcular días restantes
  const hoy = new Date();
  const diasRestantes = Math.ceil(
    (fechaElecciones.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <section className="relative bg-gradient-to-r from-destructive via-destructive/95 to-destructive/90 text-destructive-foreground py-6 md:py-8 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-destructive-foreground rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-destructive-foreground rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-48 h-48 md:w-64 md:h-64 bg-destructive-foreground rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:24px_24px] md:bg-[size:32px_32px]"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 md:gap-6">
          {/* Información del proceso */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 md:mb-3">
              {procesoActivo.nombre}
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 md:gap-4 text-xs md:text-sm">
              <div className="inline-flex items-center gap-2 bg-destructive-foreground/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-destructive-foreground/20">
                <Calendar className="size-4"/>
                <span className="font-medium">{fechaFormateada}</span>
              </div>

              {diasRestantes > 0 && (
                <div className="inline-flex items-center gap-2 bg-warning  backdrop-blur-sm rounded-lg px-3 py-1.5 border border-warning/30 shadow-lg">
                  <Timer className="size-4"/>
                  <span className="font-bold">
                    {diasRestantes} {diasRestantes === 1 ? "día" : "días"} restantes
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col justify-center sm:flex-row gap-3 w-full lg:w-auto">
            <Link
              href={`/procesos-electorales/${procesoActivo.id}`}
              className="group inline-flex items-center justify-center px-5 md:px-6 py-2.5 md:py-3 bg-destructive-foreground text-destructive font-semibold rounded-lg md:rounded-xl hover:bg-destructive-foreground/95 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg
                className="w-4 h-4 md:w-5 md:h-5 mr-2 group-hover:scale-110 transition-transform"
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
              className="group inline-flex items-center justify-center px-5 md:px-6 py-2.5 md:py-3 bg-transparent border-2 border-destructive-foreground/80 text-destructive-foreground font-semibold rounded-lg md:rounded-xl hover:bg-destructive-foreground hover:text-destructive transition-all duration-300 backdrop-blur-sm"
            >
              <svg
                className="w-4 h-4 md:w-5 md:h-5 mr-2 group-hover:scale-110 transition-transform"
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
      </div>

      {/* Decorative accent bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-warning via-warning/80 to-warning"></div>
    </section>
  );
};

export default ProcesosElectoralesBanner;