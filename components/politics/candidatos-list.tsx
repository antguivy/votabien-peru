"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Users, Star, MapPinned } from "lucide-react";
import { cn } from "@/lib/utils";
import { CandidateCard, FiltersCandidates } from "@/interfaces/candidate";
import { getCandidatesCards } from "@/queries/public/candidacies";
import { getTextColor } from "@/lib/utils/color-utils";
import { shuffleArray } from "@/lib/utils/arrays";
import { Badge } from "../ui/badge";
import { RnasSanction } from "@/interfaces/person";

// ─────────────────────────────────────────────
// Config visual por tipo de candidato
// ─────────────────────────────────────────────

const TYPE_CONFIG: Record<
  string,
  { label: string; bgBadge: string; ring: string }
> = {
  PRESIDENTE: {
    label: "Presidente",
    bgBadge: "bg-role-president/90 text-white backdrop-blur-sm",
    ring: "group-hover:ring-role-president/30",
  },
  SENADOR: {
    label: "Senador",
    bgBadge: "bg-role-senator/90 text-white backdrop-blur-sm",
    ring: "group-hover:ring-role-senator/30",
  },
  DIPUTADO: {
    label: "Diputado",
    bgBadge: "bg-role-deputy/90 text-white backdrop-blur-sm",
    ring: "group-hover:ring-role-deputy/30",
  },
  PARLAMENTO_ANDINO: {
    label: "Parl. Andino",
    bgBadge: "bg-teal-600/90 text-white backdrop-blur-sm",
    ring: "group-hover:ring-teal-400/30",
  },
  DEFAULT: {
    label: "Vicepresidente",
    bgBadge: "bg-muted text-muted-foreground backdrop-blur-sm",
    ring: "group-hover:ring-border",
  },
};

// ─────────────────────────────────────────────
// AlertBadge
// ─────────────────────────────────────────────

type AlertVariant = "blue" | "red" | "amber" | "orange";

function AlertBadge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: AlertVariant;
}) {
  const classes: Record<AlertVariant, string> = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/25 dark:text-blue-300",
    red: "bg-red-50 text-red-700 dark:bg-red-900/25 dark:text-red-300",
    amber:
      "bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-300",
    orange:
      "bg-orange-50 text-orange-700 dark:bg-orange-900/25 dark:text-orange-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold leading-tight whitespace-nowrap",
        classes[variant],
      )}
    >
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────
// Helpers RNAS
// ─────────────────────────────────────────────

const SANCION_SEVERITY: Record<string, number> = {
  EXPULSION: 3,
  SUSPENSION: 2,
  MULTA: 1,
  AMONESTACION: 0,
};

const SANCION_LABEL: Record<string, string> = {
  EXPULSION: "RNAS · Expulsado",
  SUSPENSION: "RNAS · Suspendido",
  MULTA: "RNAS · Multado",
  AMONESTACION: "RNAS · Amonestado",
};

function getWorstActiveSanction(
  rnas: RnasSanction[] | null,
): RnasSanction | null {
  if (!rnas || rnas.length === 0) return null;
  const active = rnas.filter((s) => s.vigente === "SI");
  if (active.length === 0) return null;
  return active.reduce((worst, s) =>
    (SANCION_SEVERITY[s.tipo_sancion] ?? 0) >
    (SANCION_SEVERITY[worst.tipo_sancion] ?? 0)
      ? s
      : worst,
  );
}

// ─────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────

const CandidateCardItem = ({ candidato }: { candidato: CandidateCard }) => {
  const typeKey = candidato.type as string;
  const config = TYPE_CONFIG[typeKey] ?? TYPE_CONFIG.DEFAULT;
  const { person, political_party, list_number } = candidato;
  const partyColorHex = political_party?.color_hex || "#6b7280";
  const dynamicTextColorClass = getTextColor(partyColorHex);

  // ── Datos derivados ──
  const hasConviction = person.has_sanction;
  const isUnderInvestigation = person.is_under_investigation;
  const isPenal = person.has_penal_sentence;
  const hasArchivedRecord =
    person.has_criminal_record && !hasConviction && !isUnderInvestigation;

  const incomes = person.incomes as Record<string, unknown> | null;
  const assets = person.assets as Record<string, unknown> | null;
  const declaredIncome = incomes != null && Object.keys(incomes).length > 0;
  const declaredAssets = assets != null && Object.keys(assets).length > 0;

  const workExp = person.work_experience as unknown[] | null;
  const workCount = Array.isArray(workExp) ? workExp.length : 0;

  const educationLabel = (() => {
    if (person.education_level === 3)
      return "Formación Universitaria/Postgrado";
    if (person.education_level === 2) return "Formación Universitaria";
    if (person.secondary_school === false) return "Sin secundaria";
    if (person.secondary_school === true) return "Secundaria completa";

    return null;
  })();
  // REINFO — solo estados problemáticos activan alerta
  const reinfoStatus = person.reinfo_status as string | null;
  const reinfoIsAlert =
    reinfoStatus === "Vigente" ||
    reinfoStatus === "Suspendido" ||
    reinfoStatus === "Excluido";

  // RNAS — peor sanción vigente
  const worstSanction = getWorstActiveSanction(
    person.rnas_sanctions as RnasSanction[] | null,
  );

  const hasAlerts =
    person.is_incumbent ||
    hasConviction ||
    isUnderInvestigation ||
    hasArchivedRecord ||
    !declaredIncome ||
    !declaredAssets ||
    reinfoIsAlert ||
    !!worstSanction;

  const hasMeta = !!educationLabel || workCount > 0;

  return (
    <Link
      href={`/candidatos/${candidato.id}`}
      className="group relative flex flex-col h-full select-none"
    >
      <div
        className={cn(
          "relative h-full flex flex-col overflow-hidden rounded-2xl bg-card",
          "border shadow-sm",
          "transition-all duration-300 ease-out",
          "group-hover:-translate-y-1 group-hover:shadow-md",
          "group-hover:ring-2 ring-offset-2 ring-offset-background",
          config.ring,
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
          {/* ── Fila 1: foto | logo + número + badge ── */}
          <div className="flex items-start gap-2.5">
            {/* Foto */}
            <div className="relative w-[56px] h-[56px] rounded-full overflow-hidden flex-shrink-0 border-2 border-border/60 bg-muted">
              {person.image_candidate_url ? (
                <Image
                  src={person.image_candidate_url}
                  alt={person.fullname}
                  fill
                  className="object-contain transition-transform duration-500 group-hover:scale-110"
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
                {political_party?.logo_url && (
                  <div className="relative size-[30px] rounded-md overflow-hidden bg-white flex-shrink-0 border border-border/40">
                    <Image
                      src={political_party.logo_url}
                      alt={political_party.name}
                      fill
                      className="object-contain p-0.5"
                    />
                  </div>
                )}
                {list_number != null && (
                  <div
                    style={{ backgroundColor: partyColorHex }}
                    className={cn(
                      "flex items-center justify-center size-[30px] rounded-md flex-shrink-0",
                      "transition-transform duration-300 group-hover:scale-105",
                      dynamicTextColorClass,
                    )}
                  >
                    <span className="font-black text-[13px] font-mono leading-none">
                      {list_number}
                    </span>
                  </div>
                )}
              </div>
              <Badge
                className={cn("text-[10px] h-[18px] px-1.5", config.bgBadge)}
              >
                {config.label}
              </Badge>
            </div>
          </div>

          {/* ── Fila 2: nombre ── */}
          <h3 className="font-bebas text-[16px] sm:text-[17px] leading-tight tracking-wide text-card-foreground group-hover:text-primary transition-colors duration-200 line-clamp-3 flex-1">
            {person.fullname}
          </h3>

          {/* ── Fila 3: meta chips ── */}
          {hasMeta && (
            <div className="flex flex-wrap gap-1">
              {educationLabel === "Sin secundaria" ? (
                <AlertBadge variant="amber">{educationLabel}</AlertBadge>
              ) : educationLabel ? (
                <span className="inline-flex items-center text-[11px] font-semibold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                  {educationLabel}
                </span>
              ) : null}

              {workCount > 0 ? (
                <span className="inline-flex items-center text-[11px] font-semibold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                  {workCount} {workCount === 1 ? "trabajo" : "trabajos"}
                </span>
              ) : (
                <AlertBadge variant="amber">Sin experiencia</AlertBadge>
              )}
            </div>
          )}

          {/* ── Fila 4: alertas ── */}
          {hasAlerts && (
            <>
              <div className="h-px bg-border/40" />
              <div className="flex flex-wrap gap-1">
                {person.is_incumbent && (
                  <AlertBadge variant="blue">Congresista Actual</AlertBadge>
                )}
                {hasConviction && (
                  <AlertBadge variant="red">
                    {isPenal ? "Sentenciado" : "Sancionado"}
                  </AlertBadge>
                )}
                {isUnderInvestigation && (
                  <AlertBadge variant="amber">Investigado</AlertBadge>
                )}
                {hasArchivedRecord && (
                  <AlertBadge variant="orange">Con antecedentes</AlertBadge>
                )}
                {!declaredIncome && (
                  <AlertBadge variant="orange">No declaró ingresos</AlertBadge>
                )}
                {!declaredAssets && (
                  <AlertBadge variant="orange">No declaró bienes</AlertBadge>
                )}

                {/* REINFO */}
                {reinfoStatus === "Vigente" && (
                  <AlertBadge variant="amber">REINFO Vigente</AlertBadge>
                )}
                {reinfoStatus === "Suspendido" && (
                  <AlertBadge variant="orange">REINFO Suspendido</AlertBadge>
                )}
                {reinfoStatus === "Excluido" && (
                  <AlertBadge variant="red">REINFO Excluido</AlertBadge>
                )}

                {/* RNAS — solo la peor sanción vigente */}
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

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────

const CandidatoSkeleton = () => (
  <div className="rounded-2xl bg-card border border-border/40 animate-pulse overflow-hidden">
    <div className="h-[3px] w-full bg-muted" />
    <div className="p-3 space-y-2.5">
      <div className="flex items-start gap-2.5">
        <div className="w-[56px] h-[56px] rounded-full bg-muted flex-shrink-0" />
        <div className="flex-1 flex flex-col items-end gap-2">
          <div className="flex gap-1.5">
            <div className="w-[30px] h-[30px] rounded-md bg-muted" />
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

// ─────────────────────────────────────────────
// DistrictHintBanner
// ─────────────────────────────────────────────

const DISTRICT_TYPES = ["SENADOR_REGIONAL", "DIPUTADO"];

const DistrictHintBanner = ({
  currentType,
  currentDistrict,
  onOpenFilters,
}: {
  currentType: string;
  currentDistrict: string;
  onOpenFilters: () => void;
}) => {
  const isSelected = !!currentDistrict;
  const label =
    currentType === "SENADOR_REGIONAL" ? "senadores regionales" : "diputados";

  return (
    <div
      className={cn(
        "col-span-full flex flex-col sm:flex-row items-start sm:items-center gap-4",
        "px-4 py-3.5 rounded-2xl border-2 border-dashed",
        "animate-in fade-in slide-in-from-top-2 duration-400",
        isSelected
          ? "border-brand/30 bg-brand/4"
          : "border-brand/50 bg-brand/6",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0",
          isSelected ? "bg-brand/12" : "bg-brand/18",
        )}
      >
        <MapPinned className="w-4.5 h-4.5 text-brand" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground leading-tight">
          {isSelected
            ? `Mostrando ${label} de ${currentDistrict}`
            : `¿En qué región votas?`}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {isSelected
            ? "Cambia la región en los filtros para ver otro distrito."
            : `Selecciona tu región para ver los ${label} de tu circunscripción.`}
        </p>
      </div>

      <button
        onClick={onOpenFilters}
        className={cn(
          "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl",
          "text-sm font-bold transition-all active:scale-95",
          "w-full sm:w-auto justify-center",
          isSelected
            ? "bg-muted text-foreground hover:bg-muted/80 border border-border/60"
            : "bg-brand text-white shadow-sm shadow-brand/20 hover:bg-brand/90",
        )}
      >
        <MapPinned className="w-3.5 h-3.5" />
        {isSelected ? "Cambiar región" : "Elegir mi región"}
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface CandidatosListProps {
  candidaturas: CandidateCard[];
  procesoId: string;
  currentFilters: FiltersCandidates;
  infiniteScroll?: boolean;
}

const PAGE_SIZE = 40;

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

const CandidatosList = ({
  candidaturas: initialCandidaturas,
  procesoId,
  currentFilters,
  infiniteScroll = true,
}: CandidatosListProps) => {
  const [candidatos, setCandidatos] =
    useState<CandidateCard[]>(initialCandidaturas);
  const [isReady, setIsReady] = useState(currentFilters.type !== "PRESIDENTE");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialCandidaturas.length >= PAGE_SIZE,
  );

  const pageRef = useRef(Math.ceil(initialCandidaturas.length / PAGE_SIZE));
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  const currentDistrict = currentFilters.districts?.[0] ?? "";
  const showDistrictHint = DISTRICT_TYPES.includes(currentFilters.type);

  useEffect(() => {
    if (currentFilters.type === "PRESIDENTE") {
      setCandidatos(shuffleArray(initialCandidaturas));
    }
    setIsReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(async () => {
    if (!infiniteScroll || loadingRef.current || !hasMoreRef.current) return;
    if (currentFilters.search?.trim()) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      const nextPage = pageRef.current + 1;
      const newCandidatos = await getCandidatesCards({
        electoral_process_id: procesoId,
        page: nextPage,
        pageSize: PAGE_SIZE,
        search: currentFilters.search,
        type: currentFilters.type,
        parties: currentFilters.parties?.length
          ? currentFilters.parties
          : undefined,
        districts: currentFilters.districts?.length
          ? currentFilters.districts
          : undefined,
        alerts: currentFilters.alerts?.length
          ? currentFilters.alerts
          : undefined,
      });

      if (!newCandidatos || newCandidatos.length === 0) {
        hasMoreRef.current = false;
        setHasMore(false);
        return;
      }

      setCandidatos((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const uniqueNew = newCandidatos.filter((c) => !existingIds.has(c.id));
        if (uniqueNew.length === 0) {
          hasMoreRef.current = false;
          setHasMore(false);
        }
        return uniqueNew.length > 0 ? [...prev, ...uniqueNew] : prev;
      });

      pageRef.current = nextPage;

      if (newCandidatos.length < PAGE_SIZE) {
        hasMoreRef.current = false;
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error cargando más candidatos:", err);
      hasMoreRef.current = false;
      setHasMore(false);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infiniteScroll, procesoId, currentFilters]);

  useEffect(() => {
    if (!infiniteScroll) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreRef.current &&
          !loadingRef.current
        ) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" },
    );
    const target = observerTarget.current;
    if (target) observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [infiniteScroll, loadMore]);

  const handleOpenFilters = useCallback(() => {
    if (window.innerWidth >= 1024) {
      window.dispatchEvent(new CustomEvent("open-desktop-region"));
    } else {
      window.dispatchEvent(new CustomEvent("toggle-filter-panel"));
    }
  }, []);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 font-manrope">
        {showDistrictHint && (
          <DistrictHintBanner
            currentType={currentFilters.type}
            currentDistrict={currentDistrict}
            onOpenFilters={handleOpenFilters}
          />
        )}

        {!isReady ? (
          Array.from({ length: 10 }).map((_, i) => (
            <CandidatoSkeleton key={i} />
          ))
        ) : candidatos.length === 0 && !showDistrictHint ? (
          <div className="col-span-full flex flex-col items-center justify-center py-32 text-center opacity-0 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-5">
              <Star className="w-9 h-9 text-muted-foreground/30" />
            </div>
            <h3 className="text-2xl font-bebas text-foreground mb-1">
              No se encontraron candidatos
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Prueba cambiando los filtros de búsqueda.
            </p>
          </div>
        ) : (
          candidatos.map((candidato, index) => (
            <div
              key={`${candidato.id}-${index}`}
              className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-backwards"
              style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
            >
              <CandidateCardItem candidato={candidato} />
            </div>
          ))
        )}

        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <CandidatoSkeleton key={`sk-${i}`} />
          ))}
      </div>

      {infiniteScroll && (
        <>
          <div ref={observerTarget} className="h-4 mt-8" />
          {!hasMore && candidatos.length > 0 && (
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

export default CandidatosList;
