"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ArrowUpRight, Users, Star } from "lucide-react";
import { FilterPanel, FilterField } from "@/components/ui/filter-panel";
import {
  CandidacyType,
  ElectoralDistrictBase,
  FiltersCandidates,
} from "@/interfaces/politics";
import { cn } from "@/lib/utils";
import { CandidateCard } from "@/interfaces/candidate";
import { getCandidatesCards } from "@/queries/public/candidacies";

const TYPE_CONFIG = {
  PRESIDENTE: {
    color: "text-role-president",
    bg: "bg-role-president",
    border: "border-role-president/20",
    light: "bg-role-president/10",
    ring: "ring-role-president/20",
  },
  SENADOR: {
    color: "text-role-senator",
    bg: "bg-role-senator",
    border: "border-role-senator/20",
    light: "bg-role-senator/10",
    ring: "ring-role-senator/20",
  },
  DIPUTADO: {
    color: "text-role-deputy",
    bg: "bg-role-deputy",
    border: "border-role-deputy/20",
    light: "bg-role-deputy/10",
    ring: "ring-role-deputy/20",
  },
};

const CandidateCardItem = ({ candidato }: { candidato: CandidateCard }) => {
  const config = TYPE_CONFIG[candidato.type as keyof typeof TYPE_CONFIG] || {
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
    light: "bg-muted/50",
    ring: "ring-muted",
  };

  return (
    <Link
      href={`/candidatos/${candidato.person.id}`}
      className="group relative flex flex-col h-full"
    >
      <div
        className={cn(
          "relative h-full overflow-hidden rounded-[1.5rem] bg-card transition-all duration-300 ease-out",
          "border border-border/50 shadow-sm",
          "group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]",
          "group-hover:ring-4 ring-offset-0 ring-offset-background",
          config.ring,
        )}
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          <div className="absolute top-2.5 left-2.5 z-10">
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase shadow-sm backdrop-blur-md bg-card/95",
                config.color,
              )}
            >
              {candidato.type}
            </span>
          </div>

          {candidato.list_number && (
            <div className="absolute top-2.5 right-2.5 z-10 transform transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full shadow-md border-2 border-card",
                  config.bg,
                )}
              >
                <span className="text-primary-foreground font-black text-sm font-mono">
                  {candidato.list_number}
                </span>
              </div>
            </div>
          )}

          {candidato.person.image_candidate_url ? (
            <Image
              src={candidato.person.image_candidate_url}
              alt={candidato.person.fullname}
              fill
              className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/50 to-transparent opacity-40 transition-opacity group-hover:opacity-30" />
        </div>

        <div className="relative p-3 -mt-8 flex-grow flex flex-col justify-end">
          <div className="relative rounded-xl bg-card/95 backdrop-blur-md p-3.5 shadow-sm border border-border/50 transition-colors group-hover:border-border">
            {candidato.political_party && (
              <div className="flex items-start gap-1.5 mb-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
                  style={{
                    backgroundColor:
                      candidato.political_party.color_hex || "currentColor",
                  }}
                />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-tight">
                  {candidato.political_party.name}
                </p>
              </div>
            )}

            <h3 className="font-bebas text-xl leading-[0.95] text-card-foreground mb-2 group-hover:text-primary transition-colors break-words">
              {candidato.person.fullname.toUpperCase()}
            </h3>

            <div className="flex items-end justify-between mt-3 pt-2 border-t border-border/50">
              {candidato.electoral_district && (
                <div className="flex items-start gap-1 text-[11px] text-muted-foreground font-medium leading-tight pr-2">
                  <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>{candidato.electoral_district.name}</span>
                </div>
              )}

              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ml-auto",
                  config.light,
                  "group-hover:bg-foreground group-hover:text-background",
                )}
              >
                <ArrowUpRight
                  className={cn(
                    "w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
                    config.color,
                    "group-hover:text-background",
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

interface CandidatosListProps {
  candidaturas: CandidateCard[];
  distritos: ElectoralDistrictBase[];
  procesoId: string;
  currentFilters: FiltersCandidates;
  infiniteScroll?: boolean;
}

const CandidatoSkeleton = () => (
  <div className="aspect-[3/4] w-full rounded-[1.25rem] bg-muted animate-pulse" />
);

const PAGE_SIZE = 20;

const CandidatosList = ({
  candidaturas: initialCandidaturas,
  distritos,
  procesoId,
  currentFilters,
  infiniteScroll = true,
}: CandidatosListProps) => {
  const [candidatos, setCandidatos] =
    useState<CandidateCard[]>(initialCandidaturas);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialCandidaturas.length >= PAGE_SIZE,
  );
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!infiniteScroll || loading || !hasMore) return;
    setLoading(true);

    try {
      const currentPage = Math.ceil(candidatos.length / PAGE_SIZE);
      const nextPage = currentPage + 1;

      const districtsFilter =
        currentFilters.districts && currentFilters.districts !== "all"
          ? typeof currentFilters.districts === "string"
            ? currentFilters.districts.split(",")
            : currentFilters.districts
          : undefined;

      const typeFilter =
        currentFilters.type && currentFilters.type !== "all"
          ? currentFilters.type
          : undefined;

      const newCandidatos = await getCandidatesCards({
        electoral_process_id: procesoId,
        page: nextPage,
        pageSize: PAGE_SIZE,
        search: currentFilters.search,
        type: typeFilter,
        districts: districtsFilter,
      });

      if (!newCandidatos || newCandidatos.length === 0) {
        setHasMore(false);
      } else {
        setCandidatos((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const uniqueNewCandidates = newCandidatos.filter(
            (c) => !existingIds.has(c.id),
          );
          if (uniqueNewCandidates.length === 0) setHasMore(false);
          return [...prev, ...uniqueNewCandidates];
        });
        if (newCandidatos.length < PAGE_SIZE) setHasMore(false);
      }
    } catch (error) {
      console.error("Error cargando más candidatos:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [
    infiniteScroll,
    loading,
    hasMore,
    candidatos.length,
    currentFilters,
    procesoId,
  ]);

  useEffect(() => {
    if (!infiniteScroll) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );
    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [infiniteScroll, hasMore, loading, loadMore]);

  useEffect(() => {
    setCandidatos(initialCandidaturas);
    setHasMore(initialCandidaturas.length >= PAGE_SIZE);
  }, [initialCandidaturas]);

  const filterFields: FilterField[] = [
    {
      id: "search",
      label: "Buscar",
      type: "search",
      placeholder: "Buscar candidato...",
      searchPlaceholder: "Nombre",
      defaultValue: "",
    },
    {
      id: "type",
      label: "Tipo",
      type: "select",
      placeholder: "Tipo",
      options: Object.entries(CandidacyType).map(([key, label]) => ({
        value: key,
        label,
      })),
    },
    {
      id: "districts",
      label: "Distrito Electoral",
      type: "multi-select",
      placeholder: "Distrito",
      options: distritos.map((d) => ({
        value: d.name,
        label: d.name,
      })),
    },
  ];

  const defaultFilters = { search: "", type: "", districts: [] };

  return (
    <div className="w-full">
      {infiniteScroll && (
        <div className="mb-6 sticky top-1 z-30 lg:bg-background/80 lg:backdrop-blur-xl lg:p-2 lg:rounded-2xl lg:border lg:border-border/50 lg:shadow-sm">
          {/* El FilterPanel ahora se encarga de todo:
             - En Desktop: Muestra la barra normal
             - En Mobile: Está invisible hasta que recibe el evento 'toggle-filter-panel' 
          */}
          <FilterPanel
            fields={filterFields}
            currentFilters={currentFilters}
            onApplyFilters={() => {}}
            baseUrl="/candidatos"
            defaultFilters={defaultFilters}
          />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-6 font-manrope">
        {candidatos.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-32 text-center opacity-0 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 animate-bounce">
              <Star className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-3xl font-bebas text-foreground mb-2">
              No se encontraron candidatos
            </h3>
            <p className="text-muted-foreground max-w-md">
              Prueba cambiando los filtros de búsqueda.
            </p>
          </div>
        ) : (
          candidatos.map((candidato, index) => (
            <div
              key={`${candidato.id}-${index}`}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-backwards"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CandidateCardItem candidato={candidato} />
            </div>
          ))
        )}

        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <CandidatoSkeleton key={i} />
          ))}
      </div>

      {infiniteScroll && (
        <>
          <div ref={observerTarget} className="h-4 mt-8" />
          {!hasMore && candidatos.length > 0 && (
            <div className="py-12 flex justify-center opacity-50 hover:opacity-100 transition-opacity">
              <span className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
                — Fin de la lista —
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CandidatosList;
