"use client";

import { Building2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FilterField, FilterPanel } from "../ui/filter-panel";
import { SimplePagination } from "../ui/pagination";
import { cn } from "@/lib/utils";
import { PoliticalPartyListPaginated } from "@/interfaces/political-party";

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

  const defaultFilters = { search: "", active: "all", limit: 30, offset: 0 };
  const totalPages = Math.ceil(partidos.total / partidos.limit);
  const currentPage = Math.floor(partidos.offset / partidos.limit) + 1;

  return (
    <div className="w-full">
      {infiniteScroll && (
        <div
          className="sticky top-1 z-30 mb-4
        lg:bg-background/80 lg:backdrop-blur-xl lg:p-2 lg:rounded-2xl lg:border lg:border-border/50 lg:shadow-sm"
        >
          <FilterPanel
            fields={filterFields}
            currentFilters={currentFilters}
            onApplyFilters={() => {}}
            baseUrl="/partidos"
            defaultFilters={defaultFilters}
            showMobileTrigger={true}
          />
        </div>
      )}

      {!partidos.items || partidos.items.length === 0 ? (
        <div className="py-24 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-muted mb-4">
            <Building2 className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">
            No se encontraron partidos con los filtros aplicados
          </p>
        </div>
      ) : (
        <>
          <div className="grid lg:pt-4 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3 mb-8">
            {partidos.items.map((partido) => {
              const partidoColor = partido.color_hex || "oklch(0.45 0.15 260)";

              return (
                <Link
                  key={partido.id}
                  href={`/partidos/${partido.id}`}
                  className="group"
                >
                  <div
                    className={cn(
                      "relative flex flex-col items-center text-center overflow-hidden rounded-xl h-full",
                      "border border-border/60 bg-card",
                      "transition-all duration-300",
                      "hover:-translate-y-1 hover:shadow-lg hover:border-primary/20",
                    )}
                  >
                    {/* Franja de color top */}
                    <div
                      className="w-full h-1 flex-shrink-0"
                      style={{ backgroundColor: partidoColor }}
                    />

                    {/* Cuerpo — padding uniforme, altura fija */}
                    <div className="flex flex-col items-center gap-2 px-2.5 pt-3 pb-3 w-full flex-1">
                      {/* Logo */}
                      <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center border border-border/30 overflow-hidden flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300">
                        {partido.logo_url ? (
                          <Image
                            src={partido.logo_url}
                            alt={partido.name}
                            width={44}
                            height={44}
                            className="object-contain p-1"
                          />
                        ) : (
                          <Building2 className="w-5 h-5 text-muted-foreground/30" />
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-1 flex-1 justify-center">
                        {partido.acronym ? (
                          <>
                            <span className="text-xs font-black text-foreground tracking-wide leading-tight">
                              {partido.acronym}
                            </span>
                            <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                              {partido.name}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs font-semibold text-foreground leading-tight line-clamp-3 px-1">
                            {partido.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

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
