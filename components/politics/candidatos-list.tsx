"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MapPin, Building2, ChevronRight, Users } from "lucide-react";
import { FilterPanel, FilterField } from "@/components/ui/filter-panel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import CandidatoDialog from "@/components/politics/candidato-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CandidateDetail,
  ElectoralDistrict,
  PoliticalPartyBase,
} from "@/interfaces/politics";
import { cn } from "@/lib/utils";

interface CandidatosListProps {
  candidaturas: CandidateDetail[];
  partidos: PoliticalPartyBase[];
  distritos: ElectoralDistrict[];
  procesoId: string;
  currentFilters: {
    search: string;
    partidos: string | string[];
    distritos: string | string[];
    tipo: string;
  };
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

const CandidatosList = ({
  candidaturas: initialCandidaturas,
  partidos,
  distritos,
  procesoId,
  currentFilters,
  infiniteScroll = true,
}: CandidatosListProps) => {
  const [candidatos, setCandidatos] =
    useState<CandidateDetail[]>(initialCandidaturas);
  const [selectedCandidato, setSelectedCandidato] =
    useState<CandidateDetail | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Carga Scroll
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialCandidaturas.length >= 10);
  const [currentSkip, setCurrentSkip] = useState(initialCandidaturas.length); // 🔥 CLAVE: Comenzar desde la cantidad ya cargada
  const observerTarget = useRef<HTMLDivElement>(null);

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.append("proceso_id", procesoId);
    if (currentFilters.tipo && currentFilters.tipo !== "all") {
      params.append("tipo", currentFilters.tipo);
    }

    if (currentFilters.search) {
      params.append("search", currentFilters.search);
    }

    if (currentFilters.partidos && currentFilters.partidos !== "all") {
      const partidosArray =
        typeof currentFilters.partidos === "string"
          ? currentFilters.partidos.split(",")
          : currentFilters.partidos;

      partidosArray.forEach((p) => {
        if (p && p !== "all") params.append("partidos", p.trim());
      });
    }

    if (currentFilters.distritos && currentFilters.distritos !== "all") {
      const distritosArray =
        typeof currentFilters.distritos === "string"
          ? currentFilters.distritos.split(",")
          : currentFilters.distritos;

      distritosArray.forEach((d) => {
        if (d && d !== "all") params.append("distritos", d.trim());
      });
    }

    params.append("skip", String(currentSkip));
    params.append("limit", "10");

    return params.toString();
  }, [procesoId, currentFilters, currentSkip]);

  const loadMore = useCallback(async () => {
    if (!infiniteScroll || loading || !hasMore) return;

    setLoading(true);

    try {
      const queryString = buildQueryString();
      const response = await fetch(`/api/candidatos?${queryString}`);

      if (!response.ok) {
        throw new Error("Error al cargar candidatos");
      }

      const newCandidtos: CandidateDetail[] = await response.json();

      if (newCandidtos.length === 0) {
        setHasMore(false);
      } else {
        setCandidatos((prev) => [...prev, ...newCandidtos]);
        setCurrentSkip((prev) => prev + newCandidtos.length);

        if (newCandidtos.length < 10) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Error cargando más candidatos:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [infiniteScroll, loading, hasMore, buildQueryString]);

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
    setCandidatos(initialCandidaturas);
    setCurrentSkip(initialCandidaturas.length);
    setHasMore(initialCandidaturas.length >= 10);
  }, [
    initialCandidaturas,
    currentFilters.tipo,
    currentFilters.search,
    currentFilters.partidos,
    currentFilters.distritos,
  ]);

  const filterFields: FilterField[] = [
    {
      id: "search",
      label: "Buscar",
      type: "search",
      placeholder: "Buscar candidato...",
      searchPlaceholder: "Nombre, DNI o profesión",
      defaultValue: "",
    },
    {
      id: "partidos",
      label: "Partido Político",
      type: "multi-select",
      placeholder: "Partido",
      options: [
        ...partidos.map((p) => ({
          value: p.name,
          label: p.name,
        })),
      ],
    },
    {
      id: "distritos",
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
      id: "tipo",
      label: "Tipo",
      type: "select",
      placeholder: "Tipo",
      options: [
        { value: "presidente", label: "Presidente" },
        { value: "senador", label: "Senador" },
        { value: "diputado", label: "Diputado" },
      ],
    },
  ];
  const defaultFilters = {
    search: "",
    partidos: [],
    distritos: [],
    tipo: "",
  };

  const handleOpenDialog = (candidato: CandidateDetail) => {
    setSelectedCandidato(candidato);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header con contador y filtros */}
      {infiniteScroll && (
        <div className="flex flex-col items-left gap-3 md:gap-4">
          <div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-1">
              Candidatos
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              {candidatos.length}{" "}
              {candidatos.length === 1 ? "candidato" : "candidatos"} encontrados
            </p>
          </div>
          <FilterPanel
            fields={filterFields}
            currentFilters={currentFilters}
            onApplyFilters={() => {}}
            baseUrl="/candidatos"
            defaultFilters={defaultFilters}
          />
        </div>
      )}

      {/* Grid de candidatos o mensaje vacío */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
        {candidatos.length === 0 ? (
          <div className="col-span-full text-center py-12 md:py-16 px-4">
            <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-muted mb-4">
              <Users className="w-7 h-7 md:w-8 md:h-8 text-muted-foreground" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">
              No se encontraron candidatos
            </h3>
            <p className="text-sm text-muted-foreground">
              Intenta ajustar los filtros para ver más resultados
            </p>
          </div>
        ) : (
          candidatos.map((candidato) => (
            <Card
              key={candidato.id}
              className="pt-0 group cursor-pointer overflow-hidden border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col h-full"
              onClick={() => handleOpenDialog(candidato)}
            >
              {/* Foto */}
              <div className="relative aspect-[3/4] bg-gradient-to-br from-primary/80 to-primary overflow-hidden">
                {candidato.person.image_url ? (
                  <Image
                    src={candidato.person.image_url}
                    alt={`${candidato.person.fullname}`}
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

                {/* Número de lista */}
                {candidato.list_number && (
                  <div className="absolute top-2 left-2">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border shadow-md">
                      <span className="text-xs md:text-sm font-bold text-foreground">
                        {candidato.list_number}
                      </span>
                    </div>
                  </div>
                )}

                {/* Tipo candidatura */}
                {candidato.type && (
                  <div className="absolute top-2 right-2">
                    <Badge
                      className={cn(
                        "text-[10px] md:text-xs font-semibold uppercase border shadow-md backdrop-blur-sm",
                        candidato.type === "Presidente" &&
                          "bg-primary text-primary-foreground",
                        candidato.type === "Senador" &&
                          "bg-info text-info-foreground",
                        candidato.type === "Diputado" &&
                          "bg-success text-success-foreground",
                      )}
                    >
                      {candidato.type}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Información */}
              <CardHeader>
                <CardTitle className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                  {candidato.person.fullname}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-1.5 flex-grow">
                {candidato.political_party && (
                  <Badge
                    className={`text-[10px] md:text-xs font-medium gap-1 border backdrop-blur-sm`}
                    style={{
                      backgroundColor: candidato.political_party.color_hex,
                    }}
                  >
                    <Building2 className="size-3 flex-shrink-0" />
                    <span className="truncate">
                      {candidato.political_party.name}
                    </span>
                  </Badge>
                )}

                {candidato.electoral_district && (
                  <div
                    className={`flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground line-clamp-1`}
                  >
                    <MapPin className="size-3 flex-shrink-0" />
                    <span className="truncate">
                      {candidato.electoral_district.name}
                    </span>
                  </div>
                )}
              </CardContent>

              {/* Footer siempre abajo */}
              <CardFooter className="border-t">
                <div className="flex items-center justify-end w-full">
                  <span className="inline-flex items-center text-primary group-hover:text-primary/80 font-medium text-[10px] md:text-xs transition-colors">
                    Ver más
                    <ChevronRight className="size-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </CardFooter>
            </Card>
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

          {!hasMore && candidatos.length > 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No hay más candidatos para mostrar
            </div>
          )}
        </>
      )}
      {/* Dialog de candidato */}
      {selectedCandidato && (
        <CandidatoDialog
          candidato={selectedCandidato}
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedCandidato(null);
          }}
        />
      )}
    </div>
  );
};

export default CandidatosList;
