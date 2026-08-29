"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, Star, MapPin, Building2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CandidateCard, FiltersCandidates } from "@/interfaces/candidate";
import { getTextColor } from "@/lib/utils/color-utils";
import { shuffleArray } from "@/lib/utils/arrays";
import { isCapitalDistrict, getScopeLabelForType } from "@/lib/ubigeo-helpers";
import { ElectoralDistrictBase } from "@/interfaces/electoral-district";
import { Badge } from "../ui/badge";
import {
  AlertBadge,
  SANCION_LABEL,
  getWorstActiveSanction,
} from "./alert-badge";
import { RnasSanction } from "@/interfaces/person";

// ─────────────────────────────────────────────
// Config visual por tipo de candidato
// ─────────────────────────────────────────────

const TYPE_CONFIG: Record<
  string,
  { label: string; bgBadge: string; ring: string }
> = {
  GOBERNADOR_REGIONAL: {
    label: "Gobernador",
    bgBadge: "bg-indigo-600/90 text-white backdrop-blur-sm",
    ring: "group-hover:ring-indigo-500/30",
  },
  VICEGOBERNADOR_REGIONAL: {
    label: "Vicegobernador",
    bgBadge: "bg-indigo-500/90 text-white backdrop-blur-sm",
    ring: "group-hover:ring-indigo-400/30",
  },
  CONSEJERO_REGIONAL: {
    label: "Consejero",
    bgBadge: "bg-purple-600/90 text-white backdrop-blur-sm",
    ring: "group-hover:ring-purple-500/30",
  },
  ALCALDE_PROVINCIAL: {
    label: "Alcalde Provincial",
    bgBadge: "bg-amber-600/90 text-white backdrop-blur-sm",
    ring: "group-hover:ring-amber-500/30",
  },
  REGIDOR_PROVINCIAL: {
    label: "Regidor Provincial",
    bgBadge: "bg-amber-500/90 text-white backdrop-blur-sm",
    ring: "group-hover:ring-amber-400/30",
  },
  ALCALDE_DISTRITAL: {
    label: "Alcalde Distrital",
    bgBadge: "bg-emerald-600/90 text-white backdrop-blur-sm",
    ring: "group-hover:ring-emerald-500/30",
  },
  REGIDOR_DISTRITAL: {
    label: "Regidor Distrital",
    bgBadge: "bg-emerald-500/90 text-white backdrop-blur-sm",
    ring: "group-hover:ring-emerald-400/30",
  },
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
    label: "Candidato",
    bgBadge: "bg-muted text-muted-foreground backdrop-blur-sm",
    ring: "group-hover:ring-border",
  },
};

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hasArchivedRecord =
    person.has_criminal_record && !hasConviction && !isUnderInvestigation;

  const declaredIncome = person.has_income;
  const declaredAssets = person.has_assets;

  const workCount = person.work_experience_count;

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
    // hasArchivedRecord ||
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
                  sizes="56px"
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
                      sizes="30px"
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

          {/* ── Fila 2: nombre y circunscripción ── */}
          <div>
            <h3 className="font-bebas text-[16px] sm:text-[17px] leading-tight tracking-wide text-card-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 flex-1">
              {person.fullname}
            </h3>
            {candidato.electoral_district?.name && (
              <span className="text-[10px] font-bold text-muted-foreground/70 truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-2.5 h-2.5 flex-shrink-0 text-muted-foreground/60" />
                <span className="truncate">
                  {candidato.electoral_district.name}
                </span>
              </span>
            )}
          </div>

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
                  <AlertBadge variant="blue">
                    Congresista Último Periodo
                  </AlertBadge>
                )}
                {hasConviction && (
                  <AlertBadge variant="red">
                    {isPenal ? "Sentenciado" : "Sancionado"}
                  </AlertBadge>
                )}
                {isUnderInvestigation && (
                  <AlertBadge variant="amber">Investigado</AlertBadge>
                )}
                {/* {hasArchivedRecord && (
                  <AlertBadge variant="orange">Con antecedentes</AlertBadge>
                )} */}
                {!declaredIncome && (
                  <AlertBadge variant="slate">No declaró ingresos</AlertBadge>
                )}
                {!declaredAssets && (
                  <AlertBadge variant="slate">No declaró bienes</AlertBadge>
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

const DISTRICT_TYPES = [
  "GOBERNADOR_REGIONAL",
  "CONSEJERO_REGIONAL",
  "ALCALDE_PROVINCIAL",
  "ALCALDE_DISTRITAL",
  "REGIDOR_PROVINCIAL",
  "REGIDOR_DISTRITAL",
  "SENADOR_REGIONAL",
  "DIPUTADO",
];

const DistrictHintBanner = ({
  currentType,
  currentDistrict,
  distritos,
  onOpenFilters,
}: {
  currentType: string;
  currentDistrict: string;
  distritos?: ElectoralDistrictBase[];
  onOpenFilters: () => void;
}) => {
  const isSelected = !!currentDistrict;
  const scopeInfo = getScopeLabelForType(
    currentType,
    null,
    currentDistrict,
    distritos,
  );
  const displayDistrict =
    scopeInfo.displayLocation || scopeInfo.activeLocation || currentDistrict;

  const label = (() => {
    switch (currentType) {
      case "GOBERNADOR_REGIONAL":
        return "gobernadores regionales";
      case "CONSEJERO_REGIONAL":
        return "consejeros regionales";
      case "ALCALDE_PROVINCIAL":
        return "alcaldes provinciales";
      case "ALCALDE_DISTRITAL":
        return "alcaldes distritales";
      case "REGIDOR_PROVINCIAL":
        return "regidores provinciales";
      case "REGIDOR_DISTRITAL":
        return "regidores distritales";
      case "SENADOR_REGIONAL":
        return "senadores regionales";
      case "DIPUTADO":
        return "diputados";
      default:
        return "candidatos";
    }
  })();

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
        <MapPin className="w-4.5 h-4.5 text-brand" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground leading-tight">
          {isSelected
            ? `Mostrando ${label} de ${displayDistrict}`
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
        <MapPin className="w-3.5 h-3.5" />
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
  distritos?: ElectoralDistrictBase[];
  infiniteScroll?: boolean;
}

// ─────────────────────────────────────────────
// Auxiliares de renderizado de candidato
// ─────────────────────────────────────────────

const PAGE_SIZE = 40;

const CandidatosList = ({
  candidaturas: initialCandidaturas,
  procesoId,
  currentFilters,
  distritos,
  infiniteScroll = true,
}: CandidatosListProps) => {
  const router = useRouter();
  const pathname = usePathname();
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
  const capitalInfo = isCapitalDistrict(null, currentDistrict);
  const isDistritalType =
    currentFilters.type === "ALCALDE_DISTRITAL" ||
    currentFilters.type === "REGIDOR_DISTRITAL";
  const showCapitalNotice =
    isDistritalType && capitalInfo.isCapital && candidatos.length === 0;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCandidatos(initialCandidaturas);
    setHasMore(initialCandidaturas.length >= PAGE_SIZE);
    pageRef.current = Math.ceil(initialCandidaturas.length / PAGE_SIZE);
    hasMoreRef.current = initialCandidaturas.length >= PAGE_SIZE;
  }, [initialCandidaturas]);

  useEffect(() => {
    if (currentFilters.type === "PRESIDENTE") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

      const response = await fetch("/api/candidates/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
          no_sentencias: currentFilters.no_sentencias,
          min_work: currentFilters.min_work,
          education: currentFilters.education,
        }),
      });

      if (!response.ok) {
        throw new Error("Error fetching candidates via API");
      }

      const newCandidatos = (await response.json()) as CandidateCard[];

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
            distritos={distritos}
            onOpenFilters={handleOpenFilters}
          />
        )}

        {!isReady ? (
          Array.from({ length: 10 }).map((_, i) => (
            <CandidatoSkeleton key={i} />
          ))
        ) : showCapitalNotice ? (
          <div className="col-span-full flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border border-amber-500/30 bg-amber-500/5 animate-in fade-in zoom-in-95 duration-400">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1.5">
              En el distrito capital ({capitalInfo.districtName}), gobierna la
              Municipalidad Provincial
            </h3>
            <p className="text-xs text-muted-foreground max-w-lg mb-5 leading-relaxed">
              De acuerdo con la legislación electoral peruana (JNE), los
              distritos capitales de provincia no eligen alcalde distrital por
              separado. Tu autoridad municipal directa a elegir es el{" "}
              <strong>Alcalde Provincial</strong> y sus regidores.
            </p>
            <button
              onClick={() => {
                const next = new URLSearchParams(window.location.search);
                next.set("type", "ALCALDE_PROVINCIAL");
                router.replace(`${pathname}?${next.toString()}`, {
                  scroll: false,
                });
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-bold shadow-md shadow-brand/20 hover:bg-brand/90 transition-all active:scale-95"
            >
              <span>
                Ver Alcaldes Provinciales de {capitalInfo.provinceName}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : candidatos.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 text-center opacity-0 animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Star className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-2xl font-bebas text-foreground mb-1">
              No se encontraron candidatos
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-4">
              No se registraron candidatos para los filtros seleccionados.
            </p>
            <button
              onClick={handleOpenFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold border border-border/60 transition-all"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Cambiar ubicación o filtros</span>
            </button>
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
