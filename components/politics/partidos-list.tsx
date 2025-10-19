"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import PartidoDialog from "./partido-dialog";
import { PartidoDetail } from "@/interfaces/politics";
import Image from "next/image";


interface PartidosListProps {
  partidos: PartidoDetail[];
}

const PartidosList = ({ partidos }: PartidosListProps) => {
  const [selectedPartido, setSelectedPartido] = useState<PartidoDetail | null>(null);
  if (!partidos || partidos.length === 0) {
    return (
      <div className="text-center py-16 md:py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-md bg-muted mb-4 md:mb-6">
          <svg
            className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground"
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
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {partidos.map((partido) => {
          const partidoColor = partido.color_hex || "oklch(0.45 0.15 260)";

          return (
            <button
              key={partido.id}
              onClick={() => setSelectedPartido(partido)}
              className="group text-left w-full"
            >
              <div className="bg-card rounded-xl md:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-border hover:border-primary/50 transform hover:-translate-y-1">
                {/* Header con color del partido */}
                <div
                  className="h-28 md:h-32 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${partidoColor} 0%, ${partidoColor}dd 100%)`,
                  }}
                >
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-[length:16px_16px]"></div>
                  </div>

                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full -ml-10 -mb-10 group-hover:scale-110 transition-transform duration-500"></div>

                  {/* Logo del partido */}
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    {partido.logo_url ? (
                      <div className="relative w-16 h-16 md:w-20 md:h-20 bg-card rounded-lg p-2 shadow-lg ring-2 ring-white/20 group-hover:ring-white/40 transition-all group-hover:scale-110 duration-300">
                        <Image
                          src={partido.logo_url}
                          alt={partido.nombre}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-card rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/20 group-hover:ring-white/40 transition-all group-hover:scale-110 duration-300">
                        <Building2 className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-4 md:p-5">
                  {partido.sigla && (
                    <div className="mb-3">
                      <span
                        className="inline-flex items-center px-2.5 md:px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: partidoColor }}
                      >
                        {partido.sigla}
                      </span>
                    </div>
                  )}

                  <h3 className="font-bold text-base md:text-lg text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2 min-h-[3rem] md:min-h-[3.5rem] leading-tight">
                    {partido.nombre}
                  </h3>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 md:px-2.5 py-1 rounded-full text-xs font-medium ${
                        partido.activo
                          ? "bg-success/10 text-success border border-success/20"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          partido.activo ? "bg-success" : "bg-muted-foreground"
                        }`}
                      ></span>
                      {partido.activo ? "Activo" : "Inactivo"}
                    </span>

                    <span className="inline-flex items-center text-primary group-hover:text-primary/80 font-medium text-xs md:text-sm transition-colors">
                      Ver más
                      <svg
                        className="w-3.5 h-3.5 md:w-4 md:h-4 ml-1 group-hover:translate-x-1 transition-transform"
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
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Dialog */}
      {selectedPartido && (
        <PartidoDialog
          partido={selectedPartido}
          isOpen={!!selectedPartido}
          onClose={() => setSelectedPartido(null)}
        />
      )}
    </>
  );
};

export default PartidosList;
