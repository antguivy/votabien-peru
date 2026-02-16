"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ArrowUpRight, Users, Star, Sparkles } from "lucide-react";
import { FilterPanel, FilterField } from "@/components/ui/filter-panel";
import {
  CandidacyType,
  ElectoralDistrictBase,
  FiltersCandidates,
  typeOptions,
} from "@/interfaces/politics";
import { cn } from "@/lib/utils";
import { CandidateCard } from "@/interfaces/candidate";
import { getCandidatesCards } from "@/queries/public/candidacies";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getTextColor, needsOverlay } from "@/lib/utils/color-utils";

const TYPE_CONFIG = {
  PRESIDENTE: {
    label: "PRESIDENTE",
    bgBadge: "bg-role-president/90 text-white backdrop-blur-sm",
    ring: "group-hover:ring-role-president/30",
  },
  SENADOR: {
    label: "SENADOR",
    bgBadge: "bg-role-senator/90 text-white backdrop-blur-sm",
    ring: "group-hover:ring-role-senator/30",
  },
  DIPUTADO: {
    label: "DIPUTADO",
    bgBadge: "bg-role-deputy/90 text-white backdrop-blur-sm",
    ring: "group-hover:ring-role-deputy/30",
  },
  // Fallback
  DEFAULT: {
    label: "CANDIDATO",
    bgBadge: "bg-gray-600/90 text-white backdrop-blur-sm",
    ring: "group-hover:ring-gray-400/30",
  },
};

const CandidateCardItem = ({ candidato }: { candidato: CandidateCard }) => {
  const typeKey = candidato.type as keyof typeof TYPE_CONFIG;
  const config = TYPE_CONFIG[typeKey] || TYPE_CONFIG.DEFAULT;

  const { person, political_party, electoral_district, list_number } =
    candidato;
  const partyColorHex = political_party?.color_hex || "#000000";
  const dynamicTextColorClass = getTextColor(partyColorHex);

  return (
    <Link
      href={`/candidatos/${person.id}`}
      className="group relative flex flex-col h-full select-none"
    >
      <div
        className={cn(
          "relative h-full overflow-hidden rounded-[1.5rem] bg-card transition-all duration-300 ease-out",
          "border border-border/50 shadow-sm",
          "group-hover:-translate-y-1 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
          "group-hover:ring-2 ring-offset-2 ring-offset-background",
          config.ring,
        )}
      >
        {/* --- SECCIÓN FOTO CON LOGO Y NÚMERO --- */}
        <div className="relative w-full bg-muted overflow-hidden">
          {/* Badge Tipo */}
          <div className="absolute top-3 left-3 z-20">
            <span
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm",
                config.bgBadge,
              )}
            >
              {candidato.type}
            </span>
          </div>

          {/* Imagen */}
          {person.image_candidate_url ? (
            <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden">
              <Image
                src={person.image_candidate_url}
                alt={person.fullname}
                fill
                className="object-contain transition-transform duration-700 ease-in-out group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="w-full aspect-[3/4] rounded-xl overflow-hidden flex items-center justify-center bg-muted/50">
              <Users className="w-16 h-16 text-muted-foreground/20" />
            </div>
          )}

          {/* Gradiente inferior */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent z-10" />

          {/* Logo y Número - DENTRO de la foto */}
          <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between">
            {/* Logo Partido */}
            {political_party?.logo_url ? (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-white/80 bg-white p-0.5 shrink-0 shadow-lg">
                <Image
                  src={political_party.logo_url}
                  alt={political_party.name}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-white/90 flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
            )}

            {/* Número Electoral */}
            {list_number && (
              <div
                style={{ backgroundColor: partyColorHex }}
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl shadow-lg",
                  "transform transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110",
                  dynamicTextColorClass,
                  "border-2 border-white/50",
                )}
              >
                <span className="font-black text-xl font-mono leading-none">
                  {list_number}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="relative flex flex-col p-3 z-20 min-h-[120px]">
          {/* NOMBRE DEL CANDIDATO - ocupa el espacio disponible */}
          <div className="flex-1 flex items-start mb-2">
            <h3 className="font-bebas text-base sm:text-lg leading-tight text-card-foreground group-hover:text-primary transition-colors line-clamp-2 w-full">
              {person.fullname.toUpperCase()}
            </h3>
          </div>

          {/* FOOTER: Ubicación y Botón - siempre abajo */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-auto">
            {/* Distrito */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium truncate pr-2 max-w-[70%]">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{electoral_district?.name}</span>
            </div>

            {/* Botón de acción */}
            <div
              style={{ backgroundColor: partyColorHex }}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ml-auto shadow-sm",
                dynamicTextColorClass,
                "group-hover:scale-110 group-hover:shadow-md",
              )}
            >
              <ArrowUpRight className="w-4 h-4" />
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [candidatos, setCandidatos] =
    useState<CandidateCard[]>(initialCandidaturas);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialCandidaturas.length >= PAGE_SIZE,
  );
  const observerTarget = useRef<HTMLDivElement>(null);

  const prevTypeRef = useRef(currentFilters.type);

  useEffect(() => {
    if (prevTypeRef.current !== currentFilters.type) {
      const newParams = new URLSearchParams(searchParams.toString());

      // 1. Siempre limpiamos 'search' y 'districts' al cambiar de cargo
      if (newParams.has("search")) newParams.delete("search");
      if (newParams.has("districts")) newParams.delete("districts");

      // 2. Lógica específica para districtType
      if (currentFilters.type === "SENADOR") {
        // Si cambiamos a SENADOR y no hay districtType, seteamos "unico" por defecto
        if (!newParams.has("districtType")) {
          newParams.set("districtType", "unico");
        }
      } else {
        // Para cualquier otro cargo, districtType no debe existir
        if (newParams.has("districtType")) {
          newParams.delete("districtType");
        }
      }

      // Actualizamos la URL si hubo cambios
      // Comparamos strings para evitar updates innecesarios
      if (newParams.toString() !== searchParams.toString()) {
        router.replace(`${pathname}?${newParams.toString()}`);
      }

      // Actualizamos la referencia
      prevTypeRef.current = currentFilters.type;
    }
  }, [currentFilters.type, pathname, router, searchParams]);

  const effectiveFilters = useMemo(() => {
    const filters = { ...currentFilters };
    if (filters.type === "SENADOR" && !filters.districtType) {
      filters.districtType = "unico";
    }
    return filters;
  }, [currentFilters]);

  const loadMore = useCallback(async () => {
    if (!infiniteScroll || loading || !hasMore) return;
    setLoading(true);

    try {
      const nextPage = Math.ceil(candidatos.length / PAGE_SIZE) + 1;

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
        districtType: currentFilters.districtType,
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

  // Lógica de visualización de campos
  const showDistricts = useMemo(() => {
    const type = currentFilters.type;
    if (type === "DIPUTADO") return true;
    if (type === "SENADOR") return currentFilters.districtType === "multiple";
    return false;
  }, [currentFilters.type, currentFilters.districtType]);

  const showDistrictType = useMemo(() => {
    return currentFilters.type === "SENADOR";
  }, [currentFilters.type]);

  const districtOptions = useMemo(() => {
    return distritos.map((d) => ({
      value: d.name,
      label: d.name,
    }));
  }, [distritos]);

  const filterFields: FilterField[] = useMemo(() => {
    const fields: FilterField[] = [
      {
        id: "search",
        label: "Buscar",
        type: "search",
        placeholder: "Buscar candidato...",
        searchPlaceholder: "Nombre, DNI...",
        defaultValue: "",
      },
      {
        id: "type",
        label: "Cargo",
        type: "select",
        placeholder: "Selecciona el cargo",
        options: typeOptions,
        hideLabel: true,
      },
    ];

    if (showDistrictType) {
      fields.push({
        id: "districtType",
        label: "Tipo de Distrito",
        type: "select",
        placeholder: "Selecciona el tipo",
        options: [
          { value: "unico", label: "Único (Nacional)" },
          { value: "multiple", label: "Múltiple (Distrital)" },
        ],
        defaultValue: "unico",
        hideLabel: true,
      });
    }

    fields.push({
      id: "districts",
      label: "Distrito Electoral",
      type: "multi-select",
      placeholder: showDistricts
        ? "Selecciona distritos"
        : "No disponible para este cargo",
      disabled: !showDistricts,
      options: districtOptions,
    });

    return fields;
  }, [distritos, showDistricts, showDistrictType, districtOptions]);

  const defaultFilters = {
    search: "",
    type: "",
    districts: [],
    districtType: undefined,
  };

  return (
    <div className="w-full">
      {infiniteScroll && (
        <div className="sticky top-1 z-30 lg:bg-background/80 lg:backdrop-blur-xl lg:p-2 lg:rounded-2xl lg:border lg:border-border/50 lg:shadow-sm">
          <FilterPanel
            fields={filterFields}
            currentFilters={effectiveFilters}
            onApplyFilters={() => {}}
            baseUrl="/candidatos"
            defaultFilters={defaultFilters}
          />
        </div>
      )}

      <div className="grid grid-cols-2 lg:pt-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-6 font-manrope">
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
