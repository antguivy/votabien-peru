"use client";

import { candidateService } from "@/services/candidate";
import { CandidateCard, CandidateDetail } from "@/interfaces/candidate";
import { MatchResponse } from "@/interfaces/match";
import {
  BookmarkCheck,
  CheckCircle,
  ChevronRight,
  Loader2,
  SkipForward,
  X as XIcon,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SwipeCard } from "./swipe-card";
import { CandidateDetailDrawer } from "./candidate-detail";
import { CategoryType, useSavedResults } from "@/store/saved-match-results";
import { useReadiness } from "@/store/readiness-store";

const CATEGORY_ORDER: CategoryType[] = [
  "presidente",
  "senador_nacional",
  "senador_regional",
  "diputado_regional",
  "parlamento_andino",
];

const CATEGORY_CONFIG: Record<
  CategoryType,
  {
    title: string;
    color: string;
    bg: string;
    border: string;
    description: string;
  }
> = {
  presidente: {
    title: "Presidente",
    color: "#1d4ed8",
    bg: "rgba(37,99,235,0.08)",
    border: "rgba(37,99,235,0.25)",
    description: "Desliza o usa los botones para elegir",
  },
  senador_nacional: {
    title: "Senador Nacional",
    color: "#6d28d9",
    bg: "rgba(109,40,217,0.08)",
    border: "rgba(109,40,217,0.25)",
    description: "Desliza o usa los botones para elegir",
  },
  senador_regional: {
    title: "Senador Regional",
    color: "#047857",
    bg: "rgba(4,120,87,0.08)",
    border: "rgba(4,120,87,0.25)",
    description: "Desliza o usa los botones para elegir",
  },
  diputado_regional: {
    title: "Diputado Regional",
    color: "#b91c1c",
    bg: "rgba(185,28,28,0.08)",
    border: "rgba(185,28,28,0.25)",
    description: "Desliza o usa los botones para elegir",
  },
  parlamento_andino: {
    title: "Parlamento Andino",
    color: "#0f766e",
    bg: "rgba(15,118,110,0.08)",
    border: "rgba(15,118,110,0.25)",
    description: "Desliza o usa los botones para elegir",
  },
};

const MAX_SWIPE_CANDIDATES = 60;

interface Props {
  results: MatchResponse;
  onReset: () => void;
}

export const ResultsFlow = ({ results, onReset }: Props) => {
  const { saveResults, removeCandidate } = useSavedResults();
  const { markMatchInteraction } = useReadiness();
  // ID of the result entry created for this session (so we can call removeCandidate correctly)
  const savedIdRef = useRef<string | null>(null);
  const didInitialSave = useRef(false);

  const activeCategories = useMemo(
    () => CATEGORY_ORDER.filter((cat) => results.data[cat] !== undefined),
    [results],
  );

  const [categoryIndex, setCategoryIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [showFinal, setShowFinal] = useState(false);

  // Local mirror of selected candidates (starts with ALL matched candidates)
  const [selectedCandidates, setSelectedCandidates] = useState<
    Partial<Record<CategoryType, CandidateCard[]>>
  >(() => {
    const initial: Partial<Record<CategoryType, CandidateCard[]>> = {};
    CATEGORY_ORDER.forEach((cat) => {
      const list = results.data[cat];
      if (list?.length) initial[cat] = list.slice(0, MAX_SWIPE_CANDIDATES);
    });
    return initial;
  });

  // Save ALL candidates immediately on mount — creates a new result entry
  useEffect(() => {
    if (didInitialSave.current) return;
    didInitialSave.current = true;
    const initial: Partial<Record<CategoryType, CandidateCard[]>> = {};
    CATEGORY_ORDER.forEach((cat) => {
      const list = results.data[cat];
      if (list?.length) initial[cat] = list.slice(0, MAX_SWIPE_CANDIDATES);
    });
    savedIdRef.current = saveResults(initial);
    markMatchInteraction();
  }, [results, saveResults, markMatchInteraction]);

  const [selectedDetailCandidate, setSelectedDetailCandidate] =
    useState<CandidateDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const openDetail = useCallback(async (candidateId: string) => {
    setLoadingDetail(true);
    try {
      setSelectedDetailCandidate(
        await candidateService.getCandidateDetail(candidateId),
      );
    } catch {
      /* silent */
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const currentCategory = activeCategories[categoryIndex];

  const currentCandidates = useMemo(() => {
    if (!currentCategory) return [];
    return (results.data[currentCategory] ?? []).slice(0, MAX_SWIPE_CANDIDATES);
  }, [results, currentCategory]);

  const currentCandidate = currentCandidates[cardIndex];

  const goToNextCategory = useCallback(() => {
    // Sync store: elimina todos los dislikes acumulados de esta categoría
    if (currentCategory && savedIdRef.current) {
      const dislikes = dislikedRef.current[currentCategory];
      if (dislikes) {
        dislikes.forEach((id) => {
          removeCandidate(savedIdRef.current!, currentCategory, id);
        });
      }
    }

    if (categoryIndex < activeCategories.length - 1) {
      setCategoryIndex((p) => p + 1);
      setCardIndex(0);
    } else {
      setShowFinal(true);
    }
  }, [
    categoryIndex,
    activeCategories.length,
    currentCategory,
    removeCandidate,
  ]);

  const goToNextCard = useCallback(() => {
    if (cardIndex < currentCandidates.length - 1) {
      setCardIndex((p) => p + 1);
    } else {
      goToNextCategory();
    }
  }, [cardIndex, currentCandidates.length, goToNextCategory]);

  const dislikedRef = useRef<Partial<Record<CategoryType, Set<string>>>>({});

  // Swipe left → remove from persisted result + local state
  const handleSwipeLeft = useCallback(() => {
    if (!currentCategory || !currentCandidate) return;

    // Acumula el dislike
    if (!dislikedRef.current[currentCategory]) {
      dislikedRef.current[currentCategory] = new Set();
    }
    dislikedRef.current[currentCategory]!.add(currentCandidate.id);

    // Actualiza estado local inmediatamente
    setSelectedCandidates((prev) => ({
      ...prev,
      [currentCategory]: (prev[currentCategory] ?? []).filter(
        (c) => c.id !== currentCandidate.id,
      ),
    }));

    goToNextCard();
  }, [currentCategory, currentCandidate, goToNextCard]);

  // Swipe right → candidate already saved, just advance
  const handleSwipeRight = useCallback(() => {
    goToNextCard();
  }, [goToNextCard]);

  const handleAcceptRemaining = useCallback(() => {
    goToNextCategory();
  }, [goToNextCategory]);

  // ── FINAL VIEW ─────────────────────────────────────────────────────────────
  if (showFinal) {
    const hasSelections = Object.values(selectedCandidates).some(
      (arr) => arr && arr.length > 0,
    );

    return (
      <div
        className="flex-1 overflow-y-auto"
        style={{ overscrollBehaviorY: "contain", scrollbarWidth: "none" }}
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-4 mb-2">
            <div className="bg-success/15 rounded-2xl w-14 h-14 flex items-center justify-center flex-shrink-0 border border-success/20">
              <CheckCircle size={28} className="text-success" />
            </div>
            <div className="pt-1">
              <h2 className="text-2xl font-black text-foreground tracking-tight">
                Tu Selección Final
              </h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                Revisa tu elección antes de votar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-success/8 border border-success/20 rounded-xl px-3 py-2 mt-3">
            <BookmarkCheck size={14} className="text-success flex-shrink-0" />
            <p className="text-success text-xs font-semibold">
              Guardado en ❝ Mis resultados❞ - puedes consultarlo después
            </p>
          </div>
        </div>

        <div className="px-6 pb-20">
          {hasSelections ? (
            <>
              {CATEGORY_ORDER.map((cat) => {
                const selected = selectedCandidates[cat] ?? [];
                if (selected.length === 0) return null;
                const config = CATEGORY_CONFIG[cat];
                return (
                  <div key={cat} className="mb-7">
                    <div className="flex items-center gap-3 mb-3">
                      <h3
                        className="text-base font-bold tracking-tight"
                        style={{ color: config.color }}
                      >
                        {config.title}
                      </h3>
                      <div
                        className="flex-1 h-px"
                        style={{ background: config.border }}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      {selected.map((candidate) => (
                        <button
                          key={candidate.id}
                          type="button"
                          onClick={() => openDetail(candidate.id)}
                          className="bg-card rounded-2xl border border-border p-4 flex items-center text-left hover:border-primary/40 transition-colors w-full group"
                        >
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-muted mr-4 flex-shrink-0">
                            {candidate.person.image_candidate_url && (
                              <Image
                                src={candidate.person.image_candidate_url}
                                alt={candidate.person.fullname}
                                fill
                                className="object-contain object-top"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-card-foreground font-semibold text-sm leading-snug">
                              {candidate.person.fullname}
                            </p>
                            <p className="text-muted-foreground text-xs mt-0.5">
                              Toca para ver su perfil
                            </p>
                          </div>
                          <ChevronRight
                            size={18}
                            className="text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={onReset}
                className="w-full bg-secondary border border-border py-4 rounded-2xl font-bold text-secondary-foreground hover:bg-muted transition-colors mt-2"
              >
                Volver a intentar
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center py-12">
              <XIcon size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-foreground font-bold text-xl mb-2">
                Sin selección
              </h3>
              <button
                type="button"
                onClick={onReset}
                className="bg-primary py-4 px-8 rounded-2xl font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Volver a intentar
              </button>
            </div>
          )}
        </div>

        {loadingDetail && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/25 pointer-events-none">
            <div className="bg-card rounded-2xl p-5 shadow-lg border border-border">
              <Loader2 size={32} className="text-primary animate-spin" />
            </div>
          </div>
        )}
        <CandidateDetailDrawer
          candidate={selectedDetailCandidate}
          onClose={() => setSelectedDetailCandidate(null)}
        />
      </div>
    );
  }

  // ── NO CATEGORIES ──────────────────────────────────────────────────────────
  if (!currentCategory) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <p className="text-foreground text-xl font-bold text-center mb-6">
          No hay candidatos disponibles para mostrar.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="bg-primary py-3 px-6 rounded-xl font-bold text-primary-foreground"
        >
          Reiniciar
        </button>
      </div>
    );
  }

  // ── SWIPE VIEW ─────────────────────────────────────────────────────────────
  const config = CATEGORY_CONFIG[currentCategory];
  const progress = ((categoryIndex + 1) / activeCategories.length) * 100;

  // ── EMPTY CATEGORY VIEW ────────────────────────────────────────────────────
  if (currentCandidates.length === 0) {
    const isLast = categoryIndex === activeCategories.length - 1;
    return (
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header igual que el swipe view para consistencia */}
        <div className="pb-2 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <p className="text-muted-foreground text-xs font-medium">
              Paso {categoryIndex + 1} de {activeCategories.length}
            </p>
            <p className="text-foreground font-black text-lg leading-tight tracking-tight">
              {config.title}
            </p>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: config.color }}
            />
          </div>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: config.bg,
              border: `1.5px solid ${config.border}`,
            }}
          >
            <XIcon size={28} style={{ color: config.color }} />
          </div>
          <div className="text-center">
            <p className="text-foreground font-bold text-base">
              Sin coincidencias en {config.title}
            </p>
            <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed">
              Ningún candidato a {config.title.toLowerCase()} coincide con tus
              respuestas. Puedes continuar con la siguiente categoría.
            </p>
          </div>
        </div>

        {/* Botón continuar */}
        <div className="pt-1 pb-2 shrink-0">
          <button
            type="button"
            onClick={goToNextCategory}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-white transition-colors"
            style={{ backgroundColor: config.color }}
          >
            <SkipForward size={18} />
            {isLast
              ? "Ver resultados"
              : `Continuar con ${CATEGORY_CONFIG[activeCategories[categoryIndex + 1]]?.title ?? "siguiente"}`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col min-h-0"
      style={{ overscrollBehaviorY: "contain" }}
    >
      {/* Header */}
      <div className="pb-2 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-muted-foreground text-xs font-medium">
            Paso {categoryIndex + 1} de {activeCategories.length}
          </p>
          <p className="text-foreground font-black text-lg leading-tight tracking-tight">
            {config.title}
          </p>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: config.color }}
          />
        </div>
      </div>

      {/* Counter row */}
      <div className="py-2 bg-card/50 border-y border-border flex items-center justify-between shrink-0">
        <p className="text-muted-foreground text-sm flex-1">
          {config.description}
        </p>
        <div
          className="rounded-full px-3 py-1 ml-3 flex-shrink-0"
          style={{
            background: config.bg,
            border: `1px solid ${config.border}`,
          }}
        >
          <span
            className="font-bold text-sm"
            style={{
              color: config.color,
              fontFamily: "'Courier New', Courier, monospace",
              letterSpacing: "0.04em",
            }}
          >
            {cardIndex + 1}/{currentCandidates.length}
          </span>
        </div>
      </div>

      {/* Card stack */}
      <div
        className="flex-1 min-h-0 flex items-start justify-center pt-3 relative"
        style={{ overflowX: "hidden", overflowY: "visible" }}
      >
        {cardIndex < currentCandidates.length - 1 && (
          <div className="absolute opacity-40 scale-95 pointer-events-none top-3">
            <div
              className="bg-card rounded-3xl border border-border"
              style={{
                width: "min(300px, 85vw)",
                height: "clamp(160px, 28vh, 260px)",
              }}
            />
          </div>
        )}
        {currentCandidate && (
          <SwipeCard
            key={currentCandidate.id}
            candidate={currentCandidate}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onPress={openDetail}
            isTop={true}
          />
        )}
      </div>

      {/* Bottom buttons */}
      <div className="pt-1 pb-2 flex flex-col gap-2 shrink-0">
        {currentCandidates.length - cardIndex > 3 && (
          <button
            type="button"
            onClick={handleAcceptRemaining}
            className="bg-success py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-white hover:bg-success/90 transition-colors"
          >
            <CheckCircle size={18} />
            Me gustan todos ({currentCandidates.length - cardIndex})
          </button>
        )}
        <button
          type="button"
          onClick={goToNextCategory}
          className="bg-secondary border border-border py-3 rounded-2xl flex items-center justify-center gap-2 font-semibold text-secondary-foreground hover:bg-muted transition-colors"
        >
          <SkipForward size={18} />
          {categoryIndex < activeCategories.length - 1
            ? "Saltar categoría"
            : "Ver resultados"}
        </button>
      </div>

      {loadingDetail && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/25 pointer-events-none">
          <div className="bg-card rounded-2xl p-5 shadow-lg border border-border">
            <Loader2 size={32} className="text-primary animate-spin" />
          </div>
        </div>
      )}
      <CandidateDetailDrawer
        candidate={selectedDetailCandidate}
        onClose={() => setSelectedDetailCandidate(null)}
      />
    </div>
  );
};
