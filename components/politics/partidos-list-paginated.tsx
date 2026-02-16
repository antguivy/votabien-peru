"use client";

import { Building2, ChevronRight } from "lucide-react";
import { PoliticalPartyListPaginated } from "@/interfaces/politics";
import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getTextColor, needsOverlay } from "@/lib/utils/color-utils";
import { FilterField, FilterPanel } from "../ui/filter-panel";
import { SimplePagination } from "../ui/pagination";

interface PartidosListPaginatedProps {
  partidos: PoliticalPartyListPaginated;
  currentFilters: {
    search: string;
    active: string;
    limit: number;
    offset: number;
  };
  infiniteScroll?: boolean;
}

const PartidosListPaginated = ({
  partidos,
  currentFilters,
  infiniteScroll = true,
}: PartidosListPaginatedProps) => {
  const filterFields: FilterField[] = [
    {
      id: "search",
      label: "Buscar",
      type: "search",
      placeholder: "Buscar partido por nombre o acrónimo...",
      searchPlaceholder: "Nombre o acrónimo",
      defaultValue: "",
    },
    {
      id: "active",
      label: "Estado",
      type: "select",
      placeholder: "Estado del partido",
      options: [
        { value: "all", label: "Todos" },
        { value: "true", label: "Activos" },
        { value: "false", label: "Inactivos" },
      ],
    },
  ];

  const defaultFilters = {
    search: "",
    active: "all",
    limit: 30,
    offset: 0,
  };

  const totalPages = Math.ceil(partidos.total / partidos.limit);
  const currentPage = Math.floor(partidos.offset / partidos.limit) + 1;

  return (
    <div className="w-full">
      {infiniteScroll && (
        <div className="sticky top-1 z-30 lg:bg-primary/30 lg:backdrop-blur-xl lg:p-2 lg:rounded-2xl lg:border lg:border-border/50 lg:shadow-sm">
          <FilterPanel
            fields={filterFields}
            currentFilters={currentFilters}
            onApplyFilters={() => {}}
            baseUrl="/partidos"
            defaultFilters={defaultFilters}
          />
        </div>
      )}

      {/* Lista de partidos */}
      {!partidos.items || partidos.items.length === 0 ? (
        <div className="lg:pt-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-md bg-muted mb-4 md:mb-6">
            <Building2 className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
            No hay partidos para mostrar
          </h3>
          <p className="text-sm md:text-base text-muted-foreground">
            No se encontraron partidos con los filtros aplicados
          </p>
        </div>
      ) : (
        <>
          <div className="grid lg:pt-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {partidos.items.map((partido) => {
              const partidoColor = partido.color_hex || "oklch(0.45 0.15 260)";
              const textColor = getTextColor(partidoColor);
              const hasOverlay = needsOverlay(partidoColor);

              return (
                <Link
                  key={partido.id}
                  href={`/partidos/${partido.id}`}
                  className="group text-left w-full"
                >
                  <Card className="p-0 shadow-sm hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 transform hover:-translate-y-1 h-full flex flex-col overflow-hidden">
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

                        {/* Contenedor flexible para acrónimo y nombre */}
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

                          {/* Nombre completo - ocupa más espacio si no hay acrónimo */}
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
                            partido.active
                              ? "bg-success"
                              : "bg-muted-foreground"
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

          {/* Paginación */}
          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={partidos.total}
            itemsPerPage={partidos.limit}
            baseUrl="/partidos"
            pageSizeOptions={[10, 20, 30, 40, 50]}
            currentFilters={currentFilters}
          />
        </>
      )}
    </div>
  );
};

export default PartidosListPaginated;
