"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChamberType, LegislatorCondition } from "@/interfaces/politics";
import { ParliamentaryGroupBasic } from "@/interfaces/parliamentary-membership";
import { LegislatorCard } from "@/interfaces/legislator";
import { ElectoralDistrictBase } from "@/interfaces/electoral-district";
import { fetchLegislatorsAction } from "@/actions/legislators";
import {
  AlertBadge,
  SANCION_LABEL,
  getWorstActiveSanction,
} from "./alert-badge";
import { RnasSanction } from "@/interfaces/person";

// ── Chamber config ────────────────────────────────────────────────────────

const CHAMBER_CONFIG = {
  SENADO: {
    label: "Senador",
    bgBadge: "bg-role-senator/90 text-white backdrop-blur-sm",
    ring: "group-hover:ring-role-senator/30",
  },
  DIPUTADOS: {
    label: "Diputado",
    bgBadge: "bg-role-deputy/90 text-white backdrop-blur-sm",
    ring: "group-hover:ring-role-deputy/30",
  },
  CONGRESO: {
    label: "Congresista",
    bgBadge: "bg-primary/90 text-white backdrop-blur-sm",
    ring: "group-hover:ring-primary/30",
  },
};

// ── Condition config ──────────────────────────────────────────────────────

const CONDITION_BADGE: Record<string, { label: string; className: string }> = {
  [LegislatorCondition.LICENCIA]: {
    label: "Licencia",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
  },
  [LegislatorCondition.SUSPENDIDO]: {
    label: "Suspendido",
    className:
      "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200",
  },
  [LegislatorCondition.DESTITUIDO]: {
    label: "Destituido",
    className:
      "bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-200",
  },
  [LegislatorCondition.FALLECIDO]: {
    label: "Fallecido",
    className:
      "bg-zinc-100 text-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-200",
  },
};

// ── Card ──────────────────────────────────────────────────────────────────

const LegislatorCardItem = ({ legislador }: { legislador: LegislatorCard }) => {
  const chamberKey = legislador.chamber || ChamberType.CONGRESO;
  const chamber =
    CHAMBER_CONFIG[chamberKey as keyof typeof CHAMBER_CONFIG] ??
    CHAMBER_CONFIG.CONGRESO;

  const conditionBadge =
    legislador.condition !== LegislatorCondition.EN_EJERCICIO
      ? CONDITION_BADGE[legislador.condition]
      : null;

  const { person, elected_by_party, electoral_district } = legislador;
  const partyColorHex = elected_by_party?.color_hex || "#6b7280";

  const hasConviction = person.has_sanction;
  const isPenal = person.has_penal_sentence;

  const worstSanction = getWorstActiveSanction(
    person.rnas_sanctions as RnasSanction[] | null,
  );

  const hasAlerts =
    person.is_incumbent || hasConviction || isPenal || !!worstSanction;

  return (
    <Link
      href={`/legisladores/${legislador.id}`}
      className="group relative flex flex-col h-full select-none"
    >
      <div
        className={cn(
          "relative h-full flex flex-col overflow-hidden rounded-2xl bg-card",
          "border shadow-sm",
          "transition-all duration-300 ease-out",
          "group-hover:-translate-y-1 group-hover:shadow-md",
          "group-hover:ring-2 ring-offset-2 ring-offset-background",
          chamber.ring,
          hasConviction
            ? "border-destructive/30 dark:border-destructive/20"
            : "border-border/60",
        )}
      >
        {/* Barra de color del partido */}
        <div
          className="h-[3px] w-full flex-shrink-0"
          style={{ backgroundColor: partyColorHex }}
        />

        <div className="flex flex-col p-3 gap-2.5">
          {/* ── Fila 1: foto | logo + badge ── */}
          <div className="flex items-start gap-2.5">
            {/* Foto */}
            <div className="relative w-[56px] h-[56px] rounded-full overflow-hidden flex-shrink-0 border-2 border-border/60 bg-muted">
              {person.image_url || person.image_candidate_url ? (
                <Image
                  src={
                    person.image_url ||
                    person.image_candidate_url ||
                    "/images/default-avatar.svg"
                  }
                  alt={person.fullname}
                  fill
                  sizes="56px"
                  className="object-cover object-top scale-110 transition-transform duration-500 group-hover:scale-125"
                  onError={(e) => {
                    e.currentTarget.src = "/images/default-avatar.svg";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary">
                  <Users className="w-5 h-5 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* Columna derecha */}
            <div className="flex-1 flex flex-col items-end gap-1.5 min-w-0">
              <div className="flex items-center gap-1.5">
                {elected_by_party?.logo_url && (
                  <div className="relative size-[30px] rounded-md overflow-hidden bg-white flex-shrink-0 border border-border/40">
                    <Image
                      src={elected_by_party.logo_url}
                      alt={elected_by_party.name}
                      fill
                      sizes="30px"
                      className="object-contain p-0.5"
                    />
                  </div>
                )}
              </div>
              <span
                className={cn(
                  "inline-flex items-center text-[10px] h-[18px] px-1.5 rounded-full font-bold",
                  chamber.bgBadge,
                )}
              >
                {chamber.label}
              </span>
              {conditionBadge && (
                <span
                  className={cn(
                    "inline-flex items-center text-[10px] h-[18px] px-1.5 rounded-full font-bold",
                    conditionBadge.className,
                  )}
                >
                  {conditionBadge.label}
                </span>
              )}
            </div>
          </div>

          {/* ── Fila 2: nombre ── */}
          <h3 className="font-bebas text-[16px] sm:text-[17px] leading-tight tracking-wide text-card-foreground group-hover:text-primary transition-colors duration-200 line-clamp-3 flex-1">
            {person.fullname}
          </h3>

          {/* ── Fila 3: profesión + distrito ── */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {person.profession && (
              <span className="inline-flex items-center text-[11px] font-semibold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                {person.profession}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-[120px]">
                {electoral_district.name}
              </span>
            </span>
          </div>

          {/* ── Fila 4: alertas ── */}
          {hasAlerts && (
            <>
              <div className="h-px bg-border/40" />
              <div className="flex flex-wrap gap-1">
                {person.is_incumbent && (
                  <AlertBadge variant="blue">
                    Congresista Período Anterior
                  </AlertBadge>
                )}
                {hasConviction && (
                  <AlertBadge variant="red">
                    {isPenal ? "Sentenciado" : "Sancionado"}
                  </AlertBadge>
                )}
                {worstSanction && (
                  <AlertBadge
                    variant={
                      worstSanction.tipo_sancion === "EXPULSION"
                        ? "red"
                        : worstSanction.tipo_sancion === "SUSPENSION"
                          ? "amber"
                          : "orange"
                    }
                  >
                    {SANCION_LABEL[worstSanction.tipo_sancion] ??
                      "RNAS · Sancionado"}
                  </AlertBadge>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

// ── Skeleton ───────────────────────────────────────────────────────────────

const LegisladorSkeleton = () => (
  <div className="rounded-2xl bg-card border border-border/40 animate-pulse overflow-hidden">
    <div className="h-[3px] w-full bg-muted" />
    <div className="p-3 space-y-2.5">
      <div className="flex items-start gap-2.5">
        <div className="w-[56px] h-[56px] rounded-full bg-muted flex-shrink-0" />
        <div className="flex-1 flex flex-col items-end gap-2">
          <div className="flex gap-1.5">
            <div className="w-[30px] h-[30px] rounded-md bg-muted" />
          </div>
          <div className="w-16 h-[18px] rounded-full bg-muted" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
      </div>
      <div className="flex gap-1">
        <div className="h-4 w-20 rounded bg-muted" />
        <div className="h-4 w-14 rounded bg-muted" />
      </div>
    </div>
  </div>
);

// ── Main List ──────────────────────────────────────────────────────────────

interface LegisladoresListProps {
  legisladores: LegislatorCard[];
  bancadas: ParliamentaryGroupBasic[];
  distritos: ElectoralDistrictBase[];
  currentFilters: {
    chamber?: ChamberType | string;
    groups?: string | string[];
    districts?: string | string[];
    search?: string;
  };
  infiniteScroll?: boolean;
}

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

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 font-manrope">
        {legisladores.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-32 text-center opacity-0 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-5">
              <Users className="w-9 h-9 text-muted-foreground/30" />
            </div>
            <h3 className="text-2xl font-bebas text-foreground mb-1">
              No se encontraron legisladores
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Ajusta los filtros para ver resultados
            </p>
          </div>
        ) : (
          legisladores.map((leg, index) => (
            <div
              key={`${leg.id}-${index}`}
              className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-backwards"
              style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
            >
              <LegislatorCardItem legislador={leg} />
            </div>
          ))
        )}

        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <LegisladorSkeleton key={`sk-${i}`} />
          ))}
      </div>

      {infiniteScroll && (
        <>
          <div ref={observerTarget} className="h-4 mt-8" />
          {!hasMore && legisladores.length > 0 && (
            <div className="py-10 flex justify-center">
              <span className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground/40 uppercase">
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
