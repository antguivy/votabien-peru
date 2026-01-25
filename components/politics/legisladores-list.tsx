"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  ChevronRight,
  AlertCircle,
  Ban,
  Briefcase,
  UserX,
  Skull,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
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
  ChamberType,
  ElectoralDistrictBase,
  FiltersPerson,
  LegislatorCondition,
} from "@/interfaces/politics";
import { ParliamentaryGroupBasic } from "@/interfaces/parliamentary-membership";
import { LegislatorCard } from "@/interfaces/legislator";
import { getLegisladoresCards } from "@/queries/public/legislators";

interface LegisladoresListProps {
  legisladores: LegislatorCard[];
  bancadas: ParliamentaryGroupBasic[];
  distritos: ElectoralDistrictBase[];
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
    </CardContent>
    <CardFooter className="border-t">
      <Skeleton className="h-3 w-16 ml-auto" />
    </CardFooter>
  </Card>
);

const getConditionConfig = (condition: LegislatorCondition) => {
  const configs = {
    [LegislatorCondition.EN_EJERCICIO]: {
      label: "En ejercicio",
      icon: Briefcase,
      className:
        "bg-success/90 text-success-foreground border-success/30 hover:bg-success",
      tooltip: "Legislador actualmente en funciones",
    },
    [LegislatorCondition.LICENCIA]: {
      label: "Licencia",
      icon: AlertCircle,
      className:
        "bg-warning/90 text-warning-foreground border-warning/30 hover:bg-warning",
      tooltip: "Legislador con licencia temporal",
    },
    [LegislatorCondition.SUSPENDIDO]: {
      label: "Suspendido",
      icon: Ban,
      className:
        "bg-destructive/90 text-destructive-foreground border-destructive/30 hover:bg-destructive",
      tooltip: "Legislador suspendido temporalmente",
    },
    [LegislatorCondition.DESTITUIDO]: {
      label: "Destituido",
      icon: UserX,
      className:
        "bg-muted/90 text-muted-foreground border-muted hover:bg-muted",
      tooltip: "Legislador destituido del cargo",
    },
    [LegislatorCondition.FALLECIDO]: {
      label: "Fallecido",
      icon: Skull,
      className:
        "bg-secondary/90 text-secondary-foreground border-secondary/30 hover:bg-secondary",
      tooltip: "En memoria",
    },
  };

  return configs[condition] || configs[LegislatorCondition.EN_EJERCICIO];
};

const PAGE_SIZE = 30;

const LegisladoresList = ({
  legisladores: initialLegisladores,
  bancadas,
  distritos,
  currentFilters,
  infiniteScroll = true,
}: LegisladoresListProps) => {
  const [legisladores, setLegisladores] =
    useState<LegislatorCard[]>(initialLegisladores);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialLegisladores.length >= 10);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!infiniteScroll || loading || !hasMore) return;

    setLoading(true);

    try {
      // Calculamos la siguiente página basada en cuantos items ya tenemos
      const currentPage = Math.ceil(legisladores.length / PAGE_SIZE);
      const nextPage = currentPage + 1;

      const groupsFilter =
        currentFilters.groups && currentFilters.groups !== "all"
          ? typeof currentFilters.groups === "string"
            ? currentFilters.groups.split(",")
            : currentFilters.groups
          : undefined;

      const districtsFilter =
        currentFilters.districts && currentFilters.districts !== "all"
          ? typeof currentFilters.districts === "string"
            ? currentFilters.districts.split(",")
            : currentFilters.districts
          : undefined;

      const chamberFilter =
        currentFilters.chamber && currentFilters.chamber !== "all"
          ? (currentFilters.chamber as ChamberType)
          : undefined;

      const newLegisladores = await getLegisladoresCards({
        active_only: true,
        chamber: chamberFilter,
        search: currentFilters.search,
        groups: groupsFilter,
        districts: districtsFilter,
        page: nextPage,
        pageSize: PAGE_SIZE,
      });

      if (!newLegisladores || newLegisladores.length === 0) {
        setHasMore(false);
      } else {
        setLegisladores((prev) => {
          // Creamos un Set con los IDs existentes para filtrar duplicados
          const existingIds = new Set(prev.map((l) => l.id));
          const uniqueNewLegislators = newLegisladores.filter(
            (l) => !existingIds.has(l.id),
          );

          // Si después de filtrar no queda nada nuevo
          if (uniqueNewLegislators.length === 0) {
            setHasMore(false);
          }

          return [...prev, ...uniqueNewLegislators];
        });

        if (newLegisladores.length < PAGE_SIZE) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Error cargando más legisladores:", error);
    } finally {
      setLoading(false);
    }
  }, [infiniteScroll, loading, hasMore, legisladores.length, currentFilters]); // Dependencias actualizadas

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
    setHasMore(initialLegisladores.length >= PAGE_SIZE);
  }, [initialLegisladores]);

  const filterFields: FilterField[] = [
    {
      id: "search",
      label: "Buscar",
      type: "search",
      placeholder: "Buscar legislador...",
      searchPlaceholder: "Nombre",
      defaultValue: "",
    },
    {
      id: "groups",
      label: "Grupo Parlamentario",
      type: "multi-select",
      placeholder: "Bancadas",
      options: [
        ...bancadas.map((p) => ({
          value: p.name,
          label: p.name,
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
          value: d.name,
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
        <div>
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
          legisladores.map((leg) => {
            const conditionConfig = getConditionConfig(leg.condition);
            const ConditionIcon = conditionConfig.icon;

            return (
              <Link key={leg.id} href={`/legisladores/${leg.person.id}`}>
                <Card className="pt-0 group cursor-pointer overflow-hidden border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col h-full">
                  <div className="relative aspect-[3/4] bg-gradient-to-br from-primary/80 to-primary overflow-hidden">
                    {leg.person.image_url ? (
                      <Image
                        src={leg.person.image_url}
                        alt={leg.person.fullname}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        priority={false}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-12 h-12 md:w-16 md:h-16 text-primary-foreground/70" />
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    {/* Condition Badge - Top Right */}
                    <TooltipProvider delayDuration={150}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="absolute top-2 right-2">
                            <Badge
                              className={`text-[10px] md:text-xs font-medium border backdrop-blur-sm transition-all ${conditionConfig.className}`}
                            >
                              <ConditionIcon className="size-3 mr-1" />
                              {conditionConfig.label}
                            </Badge>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-xs">
                          {conditionConfig.tooltip}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Parliamentary Group - Bottom Left */}
                    {leg.current_parliamentary_group && (
                      <div className="absolute bottom-2 left-2">
                        <Badge className="text-[10px] md:text-xs font-medium border backdrop-blur-md bg-background/80 text-foreground border-border/50 hover:bg-background/90 transition-all whitespace-normal break-words">
                          {leg.current_parliamentary_group.name}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Contenido optimizado */}
                  <div className="flex flex-col flex-grow px-3">
                    {/* Nombre */}
                    <h3 className="text-sm md:text-base font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-tight mb-2">
                      {leg.person.fullname}
                    </h3>

                    <div className="mt-auto pt-2">
                      <Badge
                        variant="secondary"
                        className="text-[10px] md:text-xs w-fit"
                      >
                        {leg.electoral_district.name}
                      </Badge>
                    </div>
                  </div>

                  <CardFooter className="border-t mt-auto">
                    <div className="flex items-center w-full gap-2">
                      {leg.person.profession && (
                        <p className="text-[11px] md:text-xs text-muted-foreground line-clamp-2 leading-snug flex-1 min-w-0">
                          {leg.person.profession}
                        </p>
                      )}

                      <span className="inline-flex items-center text-primary group-hover:text-primary/80 font-medium text-[10px] md:text-xs transition-colors whitespace-nowrap ml-auto">
                        Ver perfil
                        <ChevronRight className="size-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            );
          })
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
