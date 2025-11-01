"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, UserCheck, Info, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterField, FilterPanel } from "@/components/ui/filter-panel";
import {
  ElectoralDistrict,
  PersonList,
  FiltersPerson,
} from "@/interfaces/politics";

interface LegisladoresListProps {
  legisladores: PersonList[];
  bancadas: string[];
  distritos: ElectoralDistrict[];
  currentFilters: FiltersPerson;
  infiniteScroll?: boolean;
}

const LegisladorSkeleton = () => (
  <Card className="pt-0 overflow-hidden border flex flex-col h-full">
    <Skeleton className="aspect-[3/4] w-full" />
    <CardHeader>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </CardHeader>
    <CardContent className="space-y-2 flex-grow">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </CardContent>
    <CardFooter className="border-t">
      <Skeleton className="h-3 w-16 ml-auto" />
    </CardFooter>
  </Card>
);

const LegisladoresList = ({
  legisladores: initialLegisladores,
  bancadas,
  distritos,
  currentFilters,
  infiniteScroll = true,
}: LegisladoresListProps) => {
  const [legisladores, setLegisladores] =
    useState<PersonList[]>(initialLegisladores);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialLegisladores.length >= 10);
  const [currentSkip, setCurrentSkip] = useState(initialLegisladores.length);
  const observerTarget = useRef<HTMLDivElement>(null);

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();

    if (currentFilters.chamber && currentFilters.chamber !== "all") {
      params.append("chamber", currentFilters.chamber);
    }

    if (currentFilters.search) {
      params.append("search", currentFilters.search);
    }

    if (currentFilters.groups && currentFilters.groups !== "all") {
      const partidosArray =
        typeof currentFilters.groups === "string"
          ? currentFilters.groups.split(",")
          : currentFilters.groups;

      partidosArray.forEach((p) => {
        if (p && p !== "all") params.append("groups", p.trim());
      });
    }

    if (currentFilters.districts && currentFilters.districts !== "all") {
      const distritosArray =
        typeof currentFilters.districts === "string"
          ? currentFilters.districts.split(",")
          : currentFilters.districts;

      distritosArray.forEach((d) => {
        if (d && d !== "all") params.append("districts", d.trim());
      });
    }

    params.append("skip", String(currentSkip));
    params.append("limit", "30");

    return params.toString();
  }, [currentFilters, currentSkip]);

  const loadMore = useCallback(async () => {
    if (!infiniteScroll || loading || !hasMore) return;

    setLoading(true);

    try {
      const queryString = buildQueryString();
      const response = await fetch(`/api/legisladores?${queryString}`);
      if (!response.ok) {
        throw new Error("Error al cargar legisladores");
      }

      const newLegisladores: PersonList[] = await response.json();

      if (newLegisladores.length === 0) {
        setHasMore(false);
      } else {
        setLegisladores((prev) => [...prev, ...newLegisladores]);
        setCurrentSkip((prev) => prev + newLegisladores.length);

        if (newLegisladores.length < 10) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Error cargando más legisladores:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [infiniteScroll, loading, hasMore, buildQueryString]);

  // Intersection Observer
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
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [infiniteScroll, hasMore, loading, loadMore]);

  useEffect(() => {
    setLegisladores(initialLegisladores);
    setCurrentSkip(initialLegisladores.length);
    setHasMore(initialLegisladores.length >= 10);
  }, [
    initialLegisladores,
    currentFilters.chamber,
    currentFilters.search,
    currentFilters.groups,
    currentFilters.districts,
  ]);

  const filterFields: FilterField[] = [
    {
      id: "search",
      label: "Buscar",
      type: "search",
      placeholder: "Buscar legislador...",
      searchPlaceholder: "Nombre, DNI o profesión",
      defaultValue: "",
    },
    {
      id: "groups",
      label: "Partido Político",
      type: "multi-select",
      placeholder: "Bancadas",
      options: [
        ...bancadas.map((p) => ({
          value: p,
          label: p,
        })),
      ],
    },
    {
      id: "districts",
      label: "Distrito Electoral",
      type: "multi-select",
      placeholder: "Distrito",
      options: [
        ...distritos.map((d) => ({
          value: d.name.toLowerCase().replace(" ", "_"),
          label: d.name,
        })),
      ],
    },
    {
      id: "chamber",
      label: "Cámara",
      type: "select",
      placeholder: "Cámara",
      options: [
        { value: "congreso", label: "Congreso" },
        { value: "senado", label: "Senado" },
        { value: "diputados", label: "Diputados" },
      ],
    },
  ];

  const defaultFilters = {
    search: "",
    chamber: "",
    groups: [],
    districts: [],
  };

  return (
    <>
      {infiniteScroll && (
        <div className="pb-4">
          <FilterPanel
            fields={filterFields}
            currentFilters={currentFilters}
            onApplyFilters={() => {}}
            baseUrl="/legisladores"
            defaultFilters={defaultFilters}
          />
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
        {legisladores.length === 0 ? (
          <div className="col-span-full text-center py-12 md:py-16 px-4">
            <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-muted mb-4">
              <Users className="w-7 h-7 md:w-8 md:h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
              No hay legisladores para mostrar
            </h3>
            <p className="text-sm md:text-base text-muted-foreground">
              No se encontraron legisladores con los filtros seleccionados
            </p>
          </div>
        ) : (
          legisladores.map((c) => (
            <Link key={c.id} href={`/legisladores/${c.id}`}>
              <Card className="pt-0 group cursor-pointer overflow-hidden border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col h-full">
                <div className="relative aspect-[3/4] bg-gradient-to-br from-primary/80 to-primary overflow-hidden">
                  {c.image_url ? (
                    <Image
                      src={c.image_url}
                      alt={`${c.name} ${c.lastname}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="w-12 h-12 md:w-16 md:h-16 text-primary-foreground/70" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="absolute top-2 right-2">
                          <Badge
                            className={`text-[10px] md:text-xs font-medium border backdrop-blur-sm ${
                              c.active_period.active
                                ? "bg-success/90 text-success-foreground border-success/30"
                                : "bg-muted/70 text-muted-foreground border-border"
                            }`}
                          >
                            {c.active_period.active ? (
                              <UserCheck className="size-3" />
                            ) : (
                              <Info className="size-3" />
                            )}
                            {c.active_period.active ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="text-xs">
                        {c.active_period.active
                          ? "Actualmente en funciones"
                          : "Fuera de funciones"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <CardHeader>
                  <CardTitle className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                    {c.name} {c.lastname}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 flex-grow">
                  {c.profession && (
                    <p className="text-[11px] md:text-xs text-muted-foreground line-clamp-2">
                      {c.profession}
                    </p>
                  )}
                  <p className="text-[10px] md:text-xs text-muted-foreground/80 font-mono">
                    DNI: {c.dni}
                  </p>
                </CardContent>

                <CardFooter className="border-t">
                  <div className="flex items-center justify-end w-full">
                    <span className="inline-flex items-center text-primary group-hover:text-primary/80 font-medium text-[10px] md:text-xs transition-colors">
                      Ver más
                      <ChevronRight className="size-4" />
                    </span>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))
        )}

        {loading && (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <LegisladorSkeleton key={`skeleton-${i}`} />
            ))}
          </>
        )}
      </div>
      {infiniteScroll && (
        <>
          <div ref={observerTarget} className="h-10 mt-4" />

          {!hasMore && legisladores.length > 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No hay más legisladores para mostrar
            </div>
          )}
        </>
      )}
    </>
  );
};

export default LegisladoresList;
