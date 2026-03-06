"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  AlertCircle,
  Ban,
  Briefcase,
  UserX,
  Skull,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import { FilterField, FilterPanel } from "@/components/ui/filter-panel";
import {
  ChamberType,
  FiltersPerson,
  LegislatorCondition,
} from "@/interfaces/politics";
import { ParliamentaryGroupBasic } from "@/interfaces/parliamentary-membership";
import { LegislatorCard } from "@/interfaces/legislator";
import { getLegisladoresCards } from "@/queries/public/legislators";
import { cn } from "@/lib/utils";
import { ElectoralDistrictBase } from "@/interfaces/electoral-district";

// --- CONFIGURACIÓN DE ESTILOS ---

// Configuración por Estado (Condition)
const CONDITION_CONFIG = {
  [LegislatorCondition.EN_EJERCICIO]: {
    label: "Activo",
    icon: Briefcase,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-600",
    badge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
  },
  [LegislatorCondition.LICENCIA]: {
    label: "Licencia",
    icon: AlertCircle,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-600",
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border-amber-200 dark:border-amber-800",
  },
  [LegislatorCondition.SUSPENDIDO]: {
    label: "Suspendido",
    icon: Ban,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-600",
    badge:
      "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 border-rose-200 dark:border-rose-800",
  },
  [LegislatorCondition.DESTITUIDO]: {
    label: "Destituido",
    icon: UserX,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-600",
    badge:
      "bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-200 border-slate-200 dark:border-slate-800",
  },
  [LegislatorCondition.FALLECIDO]: {
    label: "Fallecido",
    icon: Skull,
    color: "text-zinc-600 dark:text-zinc-400",
    bg: "bg-zinc-600",
    badge:
      "bg-zinc-100 text-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800",
  },
};

// Configuración por Cámara (Usa tus variables de chart/roles)
// Asumimos que "chamber" viene en el objeto o lo inferimos
const CHAMBER_CONFIG = {
  SENADO: {
    label: "Senador",
    color: "text-role-senator", // Usando variables CSS definidas
    bg: "bg-role-senator",
    border: "border-role-senator/20",
    ring: "ring-role-senator/20",
    light: "bg-role-senator/10",
  },
  DIPUTADOS: {
    label: "Diputado",
    color: "text-role-deputy",
    bg: "bg-role-deputy",
    border: "border-role-deputy/20",
    ring: "ring-role-deputy/20",
    light: "bg-role-deputy/10",
  },
  // Default para congreso unicameral
  CONGRESO: {
    label: "Congresista",
    color: "text-primary",
    bg: "bg-primary",
    border: "border-primary/20",
    ring: "ring-primary/20",
    light: "bg-primary/10",
  },
};

const LegislatorCardItem = ({ legislador }: { legislador: LegislatorCard }) => {
  const condition =
    CONDITION_CONFIG[legislador.condition] ||
    CONDITION_CONFIG[LegislatorCondition.EN_EJERCICIO];

  // Usamos el color de condición para el borde o indicadores
  const ConditionIcon = condition.icon;

  const chamberKey = "CONGRESO";
  const chamber = CHAMBER_CONFIG[chamberKey as keyof typeof CHAMBER_CONFIG];

  return (
    <Link
      href={`/legisladores/${legislador.person.id}`}
      className="group relative flex w-full h-32 bg-card hover:bg-accent/5 rounded-xl border border-border/60 hover:border-border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md"
    >
      {/* --- COLUMNA IZQUIERDA: IMAGEN --- */}
      <div className="relative w-28 h-full flex-shrink-0">
        {legislador.person.image_url ? (
          <Image
            src={legislador.person.image_url}
            alt={legislador.person.fullname}
            fill
            className={cn(
              "object-cover object-top transition-transform duration-500 group-hover:scale-105",
              (legislador.condition === LegislatorCondition.FALLECIDO ||
                legislador.condition === LegislatorCondition.DESTITUIDO) &&
                "grayscale",
            )}
            sizes="120px"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Users className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* --- COLUMNA DERECHA: INFO --- */}
      <div className="flex-1 flex flex-col justify-between p-3 min-w-0">
        {/* Parte Superior: Estado y Bancada */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            {/* Bancada */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor:
                    legislador.current_parliamentary_group?.color_hex ||
                    "#94a3b8",
                }}
              />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                {legislador.current_parliamentary_group?.name || "Sin Bancada"}
              </p>
            </div>

            {/* Estado (Icono o Badge pequeño) */}
            <div
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border",
                condition.badge,
              )}
            >
              <ConditionIcon className="w-2.5 h-2.5" />
              <span className="hidden sm:inline">{condition.label}</span>
            </div>
          </div>

          {/* Nombre: Line-clamp-2 asegura que no rompa la altura fija */}
          <h3
            className="font-bebas text-lg sm:text-xl leading-[0.95] text-card-foreground group-hover:text-primary transition-colors line-clamp-2"
            title={legislador.person.fullname.toUpperCase()}
          >
            {legislador.person.fullname.toUpperCase()}
          </h3>
        </div>

        {/* Parte Inferior: Distrito y Botón */}
        <div className="flex items-end justify-between border-t border-border/40 pt-2 mt-1">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[100px]">
              {legislador.electoral_district.name}
            </span>
          </div>

          <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
};

// --- COMPONENTE LISTA PRINCIPAL ---

interface LegisladoresListProps {
  legisladores: LegislatorCard[];
  bancadas: ParliamentaryGroupBasic[];
  distritos: ElectoralDistrictBase[];
  currentFilters: FiltersPerson;
  infiniteScroll?: boolean;
}

const LegisladorSkeleton = () => (
  <div className="aspect-[3/4] w-full rounded-[1.25rem] bg-muted animate-pulse" />
);

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
      const currentPage = Math.ceil(legisladores.length / PAGE_SIZE);
      const nextPage = currentPage + 1;

      // Transformación de filtros para la query
      const groupsFilter = Array.isArray(currentFilters.groups)
        ? currentFilters.groups
        : typeof currentFilters.groups === "string"
          ? (currentFilters.groups as string).split(",")
          : undefined;

      const districtsFilter = Array.isArray(currentFilters.districts)
        ? currentFilters.districts
        : typeof currentFilters.districts === "string"
          ? (currentFilters.districts as string).split(",")
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
          const existingIds = new Set(prev.map((l) => l.id));
          const uniqueNewLegislators = newLegisladores.filter(
            (l) => !existingIds.has(l.id),
          );
          if (uniqueNewLegislators.length === 0) setHasMore(false);
          return [...prev, ...uniqueNewLegislators];
        });

        if (newLegisladores.length < PAGE_SIZE) setHasMore(false);
      }
    } catch (error) {
      console.error("Error cargando más legisladores:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [infiniteScroll, loading, hasMore, legisladores.length, currentFilters]);

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
      options: bancadas.map((p) => ({
        value: p.name,
        label: p.name,
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
    {
      id: "chamber",
      label: "Cámara",
      type: "select",
      placeholder: "Cámara",
      options: Object.values(ChamberType).map((c) => ({
        value: c,
        label: c,
      })),
    },
  ];

  const defaultFilters = {
    search: "",
    chamber: "",
    groups: [],
    districts: [],
  };

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
            baseUrl="/legisladores"
            defaultFilters={defaultFilters}
            showMobileTrigger={true}
          />
        </div>
      )}

      {/* Grid consistente con CandidatosList */}
      <div className="lg:pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 font-manrope">
        {legisladores.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-32 text-center opacity-0 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 animate-bounce">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-3xl font-bebas text-foreground mb-2">
              No se encontraron legisladores
            </h3>
            <p className="text-muted-foreground max-w-md">
              Ajusta los filtros para ver resultados
            </p>
          </div>
        ) : (
          legisladores.map((leg, index) => (
            <div
              key={`${leg.id}-${index}`}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-backwards"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <LegislatorCardItem legislador={leg} />
            </div>
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
          <div ref={observerTarget} className="h-4 mt-8" />
          {!hasMore && legisladores.length > 0 && (
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

export default LegisladoresList;
