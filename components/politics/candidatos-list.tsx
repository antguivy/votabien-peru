"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ArrowUpRight, Users, Star } from "lucide-react";
import { FilterPanel, FilterField } from "@/components/ui/filter-panel";
import {
  ElectoralDistrictBase,
  FiltersCandidates,
  PoliticalPartyBase,
  PoliticalPartyListPaginated,
  typeOptions,
} from "@/interfaces/politics";
import { cn } from "@/lib/utils";
import { CandidateCard } from "@/interfaces/candidate";
import { getCandidatesCards } from "@/queries/public/candidacies";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getTextColor } from "@/lib/utils/color-utils";

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
  DEFAULT: {
    label: "CANDIDATO",
    bgBadge: "bg-muted text-muted-foreground backdrop-blur-sm",
    ring: "group-hover:ring-border",
  },
};

const CandidateCardItem = ({ candidato }: { candidato: CandidateCard }) => {
  const typeKey = candidato.type as keyof typeof TYPE_CONFIG;
  const config = TYPE_CONFIG[typeKey] || TYPE_CONFIG.DEFAULT;

  const { person, political_party, electoral_district, list_number } =
    candidato;
  const partyColorHex = political_party?.color_hex || "#6b7280";
  const dynamicTextColorClass = getTextColor(partyColorHex);

  return (
    <Link
      href={`/candidatos/${person.id}`}
      className="group relative flex flex-col h-full select-none"
    >
      <div
        className={cn(
          "relative h-full flex flex-col overflow-hidden rounded-2xl bg-card transition-all duration-300 ease-out",
          "border border-border/60 shadow-sm",
          "group-hover:-translate-y-1 group-hover:shadow-lg",
          "group-hover:ring-2 ring-offset-2 ring-offset-background",
          config.ring,
        )}
      >
        {/* ── Franja de color del partido como acento visual principal ── */}
        <div
          className="h-1.5 w-full flex-shrink-0"
          style={{ backgroundColor: partyColorHex }}
        />

        {/* ── Cuerpo ── */}
        <div className="flex flex-col flex-1 p-3 gap-3">
          {/* ── Fila superior: avatar circular + número y badge ── */}
          <div className="flex items-start justify-between gap-2">
            {/* Avatar circular
                object-cover + object-top → recorta desde la cabeza hacia abajo,
                priorizando cara y no cortando la parte superior */}
            <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-border bg-muted shadow-sm">
              {person.image_candidate_url ? (
                <Image
                  src={person.image_candidate_url}
                  alt={person.fullname}
                  fill
                  className="object-contain transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary">
                  <Users className="w-6 h-6 text-muted-foreground/40" />
                </div>
              )}
            </div>

            {/* Número de lista + badge de cargo */}
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex flex-row justify-between gap-2">
                {/* ── Partido + logo ── */}
                {political_party?.logo_url ? (
                  <div className="relative size-9 rounded overflow-hidden bg-white flex-shrink-0 border border-border/50">
                    <Image
                      src={political_party.logo_url}
                      alt={political_party.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : null}
                {list_number && (
                  <div
                    style={{ backgroundColor: partyColorHex }}
                    className={cn(
                      "flex items-center justify-center size-9 rounded-lg shadow-sm flex-shrink-0",
                      "transition-transform duration-300 group-hover:scale-105",
                      dynamicTextColorClass,
                    )}
                  >
                    <span className="font-black text-sm font-mono leading-none">
                      {list_number}
                    </span>
                  </div>
                )}
              </div>

              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase",
                  config.bgBadge,
                )}
              >
                {candidato.type}
              </span>
            </div>
          </div>

          {/* ── Nombre del candidato ── */}
          <div className="flex-1">
            <h3 className="font-bebas text-base sm:text-lg leading-tight text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
              {person.fullname.toUpperCase()}
            </h3>
          </div>

          {/* ── Separador ── */}
          <div className="h-px bg-border/60" />

          {/* ── Footer: Distrito + botón ── */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {electoral_district?.name ?? "—"}
              </span>
            </div>
            <div
              style={{ backgroundColor: partyColorHex }}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                "transition-all duration-300 group-hover:scale-110 shadow-sm",
                dynamicTextColorClass,
              )}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
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
  parties: PoliticalPartyListPaginated["items"];
  procesoId: string;
  currentFilters: FiltersCandidates;
  infiniteScroll?: boolean;
}

const CandidatoSkeleton = () => (
  <div className="rounded-2xl bg-muted animate-pulse overflow-hidden">
    <div className="h-1.5 w-full bg-muted-foreground/10" />
    <div className="p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="w-14 h-14 rounded-full bg-muted-foreground/10" />
        <div className="flex flex-col items-end gap-1.5">
          <div className="w-9 h-9 rounded-lg bg-muted-foreground/10" />
          <div className="w-16 h-4 rounded-full bg-muted-foreground/10" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-4 w-full rounded bg-muted-foreground/10" />
        <div className="h-4 w-2/3 rounded bg-muted-foreground/10" />
      </div>
      <div className="h-3 w-3/4 rounded bg-muted-foreground/10" />
      <div className="h-px bg-muted-foreground/10" />
      <div className="flex items-center justify-between">
        <div className="h-3 w-1/2 rounded bg-muted-foreground/10" />
        <div className="w-7 h-7 rounded-full bg-muted-foreground/10" />
      </div>
    </div>
  </div>
);

const PAGE_SIZE = 20;

const CandidatosList = ({
  candidaturas: initialCandidaturas,
  distritos,
  parties,
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
      if (newParams.has("search")) newParams.delete("search");
      if (newParams.has("districts")) newParams.delete("districts");
      if (newParams.has("parties")) newParams.delete("parties");
      if (currentFilters.type === "SENADOR") {
        if (!newParams.has("districtType"))
          newParams.set("districtType", "unico");
      } else {
        if (newParams.has("districtType")) newParams.delete("districtType");
      }
      if (newParams.toString() !== searchParams.toString()) {
        router.replace(`${pathname}?${newParams.toString()}`);
      }
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

      const partiesFilter =
        currentFilters.parties && currentFilters.parties !== "all"
          ? typeof currentFilters.parties === "string"
            ? currentFilters.parties.split(",")
            : currentFilters.parties
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
        parties: partiesFilter,
        districtType: currentFilters.districtType,
      });

      if (!newCandidatos || newCandidatos.length === 0) {
        setHasMore(false);
      } else {
        setCandidatos((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const uniqueNew = newCandidatos.filter((c) => !existingIds.has(c.id));
          if (uniqueNew.length === 0) setHasMore(false);
          return [...prev, ...uniqueNew];
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
        if (entries[0].isIntersecting && hasMore && !loading) loadMore();
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

  const showDistricts = useMemo(() => {
    const type = currentFilters.type;
    if (type === "DIPUTADO") return true;
    if (type === "SENADOR") return currentFilters.districtType === "multiple";
    return false;
  }, [currentFilters.type, currentFilters.districtType]);

  // const showParties = useMemo(() => {
  //   const type = currentFilters.type;
  //   if (type === "PRESIDENTE") return false;
  //   return false;
  // }, [currentFilters.type, currentFilters.districtType]);

  const showDistrictType = useMemo(
    () => currentFilters.type === "SENADOR",
    [currentFilters.type],
  );

  const districtOptions = useMemo(
    () => distritos.map((d) => ({ value: d.name, label: d.name })),
    [distritos],
  );
  const partyOptions = useMemo(
    () => parties.map((d) => ({ value: d.name, label: d.name })),
    [parties],
  );
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
      {
        id: "parties",
        label: "Partido",
        type: "multi-select",
        placeholder: "Selecciona partidos",
        // disabled: !showParties,
        options: partyOptions,
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
  }, [
    distritos,
    showDistricts,
    // showParties,
    partyOptions,
    showDistrictType,
    districtOptions,
  ]);

  const defaultFilters = {
    search: "",
    type: "",
    districts: [],
    parties: [],
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

      <div className="grid grid-cols-2 lg:pt-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-4 font-manrope">
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
              style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
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
