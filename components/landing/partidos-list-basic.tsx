"use client";

import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Building2, ChevronRight, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getTextColor, needsOverlay } from "@/lib/utils/color-utils";
import { PoliticalPartyBase } from "@/interfaces/political-party";

interface PartidosListProps {
  partidos: PoliticalPartyBase[];
}

const PartidosListBasic = ({ partidos }: PartidosListProps) => {
  if (!partidos || partidos.length === 0) {
    return (
      <div className="text-center py-16 md:py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-md bg-muted mb-4 md:mb-6">
          <Building2 className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
          No hay partidos para mostrar
        </h3>
        <p className="text-sm md:text-base text-muted-foreground">
          No se encontraron partidos políticos activos
        </p>
      </div>
    );
  }

  return (
    <section className="container mx-auto px-4 py-12">
      {/* Header con título y descripción */}
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4">
          Partidos Políticos
        </h2>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          Conoce los partidos políticos activos y sus propuestas para el país
        </p>
      </div>

      {/* Grid de partidos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
        {partidos.map((partido, index) => {
          // Mostrar: 6 en mobile/tablet, 6 en md/lg, 8 en xl
          const isHiddenOnMobile = index >= 6;
          const isHiddenOnXl = index >= 8;

          if (isHiddenOnXl) return null;

          const partidoColor = partido.color_hex || "oklch(0.45 0.15 260)";
          const textColor = getTextColor(partidoColor);
          const hasOverlay = needsOverlay(partidoColor);

          return (
            <Link
              key={partido.id}
              href={`/partidos/${partido.id}`}
              className={`group text-left w-full ${
                isHiddenOnMobile ? "hidden xl:block" : ""
              }`}
            >
              <Card className="p-0 shadow-sm hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 transform hover:-translate-y-1 h-full flex flex-col overflow-hidden">
                {/* Header con diseño vertical optimizado */}
                <CardHeader
                  className="relative overflow-hidden p-4 md:p-6 flex-grow flex flex-col items-center justify-center text-center min-h-[180px] md:min-h-[200px]"
                  style={{
                    background: `linear-gradient(135deg, ${partidoColor} 0%, ${partidoColor}dd 100%)`,
                  }}
                >
                  {hasOverlay && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/40 to-gray-900/20"></div>
                  )}

                  <CardTitle className="flex flex-col items-center relative z-10 w-full h-full">
                    {/* Logo centrado arriba - SIEMPRE en la misma posición */}
                    <div className="flex-shrink-0 pt-2">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden ring-2 ring-white/30 group-hover:ring-white/50 group-hover:scale-105 transition-all duration-300">
                        {partido.logo_url ? (
                          <Image
                            src={partido.logo_url}
                            alt={partido.name}
                            width={80}
                            height={80}
                            className="object-contain p-1.5"
                          />
                        ) : (
                          <Building2 className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2 md:gap-3 flex-grow justify-center mt-3">
                      {/* Acrónimo destacado - solo si existe */}
                      {partido.acronym && (
                        <span
                          className={`inline-flex items-center px-3 py-1 md:px-4 md:py-1.5 rounded-full text-sm md:text-base font-bold shadow-md backdrop-blur-sm ${
                            textColor === "text-white"
                              ? "bg-white/25 text-white ring-1 ring-white/30"
                              : "bg-gray-900/25 text-gray-900 ring-1 ring-gray-900/30"
                          }`}
                        >
                          {partido.acronym}
                        </span>
                      )}

                      <div
                        className={`text-xs md:text-sm font-semibold transition-colors leading-tight px-2 ${textColor} group-hover:opacity-90 ${
                          partido.acronym
                            ? "line-clamp-2 md:line-clamp-3"
                            : "line-clamp-3 md:line-clamp-4"
                        }`}
                      >
                        {partido.name}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>

                {/* Footer compacto */}
                <CardFooter className="p-3 md:p-4 flex items-center justify-between border-t border-border/50 flex-shrink-0 bg-card">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                      partido.active
                        ? "bg-success/10 text-success border border-success/20"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        partido.active ? "bg-success" : "bg-muted-foreground"
                      }`}
                    ></span>
                    {partido.active ? "Activo" : "Inactivo"}
                  </span>

                  <span className="inline-flex items-center text-primary group-hover:text-primary/80 font-medium text-xs transition-colors">
                    Ver más
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </CardFooter>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* CTA para ver todos los partidos */}
      <div className="flex justify-center mt-8 md:mt-12">
        <Link
          href="/partidos?active=true"
          className="group inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-primary text-primary-foreground rounded-full font-semibold text-sm md:text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          Ver todos los partidos
          <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
};

export default PartidosListBasic;
