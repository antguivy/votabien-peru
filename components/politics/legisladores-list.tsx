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
  ArrowRight,
} from "lucide-react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FilterField } from "@/components/ui/filter-panel";
import {
  ChamberType,
  FiltersPerson,
  LegislatorCondition,
} from "@/interfaces/politics";
import { ParliamentaryGroupBasic } from "@/interfaces/parliamentary-membership";
import { LegislatorCard } from "@/interfaces/legislator";

import { cn } from "@/lib/utils";
import { ElectoralDistrictBase } from "@/interfaces/electoral-district";
import { fetchLegislatorsAction } from "@/actions/legislators";

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

// Configuración por Cámara
const CHAMBER_CONFIG = {
  SENADO: {
    label: "Senador",
    color: "text-role-senator",
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

  const ConditionIcon = condition.icon;
  const chamberKey = legislador.chamber || ChamberType.CONGRESO;
  const chamber =
    CHAMBER_CONFIG[chamberKey as keyof typeof CHAMBER_CONFIG] ??
    CHAMBER_CONFIG.CONGRESO;

  const partyColor =
    legislador.current_parliamentary_group?.color_hex || "#94a3b8";
  const bancada = legislador.current_parliamentary_group?.name || "Sin Bancada";

  return (
    <Link
      href={`/legisladores/${legislador.id}`}
      className="group relative flex flex-col w-full h-full bg-card hover:bg-card/80 rounded-2xl border border-border/50 hover:border-border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl p-5 pt-6"
    >
      {/* Línea superior con color del partido */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 transition-opacity opacity-80 group-hover:opacity-100"
        style={{ backgroundColor: partyColor }}
      />

      {/* --- CABECERA: FOTO MESURADA Y ETIQUETAS --- */}
      <div className="flex justify-between items-start mb-5">
        {/* Avatar del candidato */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-muted flex-shrink-0 border-2 border-background shadow-sm">
          {legislador.person.image_candidate_url ||
          legislador.person.image_url ? (
            <Image
              src={
                legislador.person.image_candidate_url ||
                legislador.person.image_url!
              }
              alt={legislador.person.fullname}
              fill
              className={cn(
                "object-cover object-top transition-transform duration-700 group-hover:scale-105",
                (legislador.condition === LegislatorCondition.FALLECIDO ||
                  legislador.condition === LegislatorCondition.DESTITUIDO) &&
                  "grayscale opacity-80",
              )}
              sizes="(max-width: 768px) 80px, 80px"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Etiquetas flotantes a la derecha */}
        <div className="flex flex-col items-end gap-2 text-right">
          <div className="px-2 py-1 rounded bg-muted text-[10px] font-bold shadow-sm text-muted-foreground uppercase tracking-wider">
            {chamber.label}
          </div>
          {legislador.condition !== LegislatorCondition.EN_EJERCICIO && (
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide shadow-sm border",
                condition.badge,
              )}
            >
              <ConditionIcon className="w-3 h-3" />
              <span className="uppercase">{condition.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* --- CUERPO: DATOS PRINCIPALES --- */}
      <div className="flex flex-col flex-1">
        {/* Grupo Parlamentario */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-2.5 h-2.5 rounded-sm flex-shrink-0 shadow-sm"
            style={{ backgroundColor: partyColor }}
          />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider line-clamp-1">
            {bancada}
          </p>
        </div>

        {/* Nombre del Político */}
        <h3 className="font-bebas text-xl sm:text-2xl leading-[1.1] text-foreground group-hover:text-primary transition-colors mb-4">
          {legislador.person.fullname.toUpperCase()}
        </h3>

        {/* Divisor Inferior (Distrito y Flecha) */}
        <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary/70" />
            <span className="truncate max-w-[140px]">
              {legislador.electoral_district.name}
            </span>
          </div>

          <div className="w-7 h-7 rounded-full bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center transition-colors flex-shrink-0">
            <ArrowRight className="w-3.5 h-3.5 text-primary group-hover:translate-x-0.5 transition-transform" />
          </div>
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

// Skeleton actualizado para que concuerde con el nuevo diseño
const LegisladorSkeleton = () => (
  <div className="flex flex-col h-full bg-card/50 rounded-2xl p-5 pt-6 border border-border/30 animate-pulse min-h-[260px]">
    <div className="flex justify-between items-start mb-5">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted flex-shrink-0" />
      <div className="w-20 h-6 bg-muted rounded" />
    </div>
    <div className="flex items-center gap-2 mb-2">
      <div className="w-2.5 h-2.5 bg-muted rounded-sm" />
      <div className="w-3/4 h-3 bg-muted rounded" />
    </div>
    <div className="w-full h-6 bg-muted rounded mb-2" />
    <div className="w-2/3 h-6 bg-muted rounded mb-4" />
    <div className="mt-auto pt-4 border-t border-border/20 flex justify-between">
      <div className="w-24 h-4 bg-muted rounded" />
      <div className="w-7 h-7 bg-muted rounded-full" />
    </div>
  </div>
);

const PAGE_SIZE = 30;

const LegisladoresList = ({
  legisladores: initialLegisladores,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  bancadas,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

      const newLegisladores = await fetchLegislatorsAction({
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLegisladores(initialLegisladores);
    setHasMore(initialLegisladores.length >= PAGE_SIZE);
  }, [initialLegisladores]);

  // Se omite filterFields por brevedad ya que no cambia el layout

  return (
    <div className="w-full">
      {/* Grid consistente */}
      <div className="lg:pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 font-manrope items-stretch">
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
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-backwards h-full"
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
