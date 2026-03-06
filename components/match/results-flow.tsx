"use client";

import { candidateService } from "@/services/candidate";
import { CandidateCard, CandidateDetail } from "@/interfaces/candidate";
import { MatchResponse } from "@/interfaces/match";
import {
  Building2,
  CheckCircle,
  ChevronRight,
  Crown,
  Loader2,
  MapPin,
  SkipForward,
  Users,
  X as XIcon,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { SwipeCard } from "./swipe-card";
import { CandidateDetailDrawer } from "./candidate-detail";

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryType =
  | "presidente"
  | "senador_nacional"
  | "senador_regional"
  | "diputado_regional";

const CATEGORY_ORDER: CategoryType[] = [
  "presidente",
  "senador_nacional",
  "senador_regional",
  "diputado_regional",
];

const CATEGORY_CONFIG = {
  presidente: {
    title: "Presidente",
    Icon: Crown,
    color: "#2563EB",
    description: "Desliza para seleccionar tu presidente favorito",
  },
  senador_nacional: {
    title: "Senador Nacional",
    Icon: Building2,
    color: "#7c3aed",
    description: "Selecciona tu senador nacional",
  },
  senador_regional: {
    title: "Senador Regional",
    Icon: MapPin,
    color: "#059669",
    description: "Selecciona tu senador regional",
  },
  diputado_regional: {
    title: "Diputado Regional",
    Icon: Users,
    color: "#dc2626",
    description: "Selecciona tu diputado regional",
  },
};

const MAX_SWIPE_CANDIDATES = 40;

interface Props {
  results: MatchResponse;
  onReset: () => void;
}

// ─── ResultsFlow ──────────────────────────────────────────────────────────────

export const ResultsFlow = ({ results, onReset }: Props) => {
  const activeCategories = useMemo(
    () =>
      CATEGORY_ORDER.filter((cat) => {
        const list = results.data[cat];
        return list && list.length > 0;
      }),
    [results],
  );

  const [categoryIndex, setCategoryIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [showFinal, setShowFinal] = useState(false);

  const [selectedCandidates, setSelectedCandidates] = useState<
    Partial<Record<CategoryType, CandidateCard[]>>
  >({});
  const [rejectedCandidates, setRejectedCandidates] = useState<
    Partial<Record<CategoryType, CandidateCard[]>>
  >({});

  const [selectedDetailCandidate, setSelectedDetailCandidate] =
    useState<CandidateDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const openDetail = useCallback(async (candidateId: string) => {
    setLoadingDetail(true);
    try {
      const detail = await candidateService.getCandidateDetail(candidateId);
      setSelectedDetailCandidate(detail);
    } catch (err) {
      console.error("Error obteniendo detalle:", err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const closeDetail = useCallback(() => setSelectedDetailCandidate(null), []);

  const currentCategory = activeCategories[categoryIndex];

  const currentCandidates = useMemo(() => {
    if (!currentCategory) return [];
    return (results.data[currentCategory] ?? []).slice(0, MAX_SWIPE_CANDIDATES);
  }, [results, currentCategory]);

  const currentCandidate = currentCandidates[cardIndex];

  const goToNextCategory = useCallback(() => {
    if (categoryIndex < activeCategories.length - 1) {
      setCategoryIndex((prev) => prev + 1);
      setCardIndex(0);
    } else {
      setShowFinal(true);
    }
  }, [categoryIndex, activeCategories.length]);

  const goToNextCard = useCallback(() => {
    if (cardIndex < currentCandidates.length - 1) {
      setCardIndex((prev) => prev + 1);
    } else {
      goToNextCategory();
    }
  }, [cardIndex, currentCandidates.length, goToNextCategory]);

  const handleSwipeLeft = useCallback(() => {
    if (!currentCategory || !currentCandidate) return;
    setRejectedCandidates((prev) => {
      const list = prev[currentCategory] ?? [];
      if (list.some((c) => c.id === currentCandidate.id)) return prev;
      return { ...prev, [currentCategory]: [...list, currentCandidate] };
    });
    goToNextCard();
  }, [currentCategory, currentCandidate, goToNextCard]);

  const handleSwipeRight = useCallback(() => {
    if (!currentCategory || !currentCandidate) return;
    setSelectedCandidates((prev) => {
      const list = prev[currentCategory] ?? [];
      if (list.some((c) => c.id === currentCandidate.id)) return prev;
      return { ...prev, [currentCategory]: [...list, currentCandidate] };
    });
    goToNextCard();
  }, [currentCategory, currentCandidate, goToNextCard]);

  const handleAcceptRemaining = () => {
    if (!currentCategory) return;
    const remaining = currentCandidates.slice(cardIndex);
    setSelectedCandidates((prev) => {
      const list = prev[currentCategory] ?? [];
      const newItems = remaining.filter(
        (r) => !list.some((c) => c.id === r.id),
      );
      return { ...prev, [currentCategory]: [...list, ...newItems] };
    });
    goToNextCategory();
  };

  // ── FINAL VIEW ────────────────────────────────────────────────────────────

  if (showFinal) {
    const hasSelections = Object.values(selectedCandidates).some(
      (arr) => arr && arr.length > 0,
    );

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center mb-3">
            <div className="bg-success/20 rounded-full w-14 h-14 flex items-center justify-center mr-4 flex-shrink-0">
              <CheckCircle size={32} className="text-success" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">
                Tu Selección Final
              </h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                Revisa tu elección antes de votar
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-20">
          {hasSelections ? (
            <>
              {CATEGORY_ORDER.map((cat) => {
                const selected = selectedCandidates[cat] ?? [];
                if (selected.length === 0) return null;
                const config = CATEGORY_CONFIG[cat];
                const IconComponent = config.Icon;

                return (
                  <div key={cat} className="mb-6">
                    <div className="flex items-center mb-3">
                      <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                        <IconComponent
                          size={20}
                          style={{ color: config.color }}
                        />
                      </div>
                      <h3 className="text-xl font-black text-foreground">
                        {config.title}
                      </h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      {selected.map((candidate) => (
                        <button
                          key={candidate.id}
                          type="button"
                          onClick={() => openDetail(candidate.id)}
                          className="bg-card rounded-2xl border border-border p-4 flex items-center text-left hover:border-primary/40 transition-colors w-full"
                        >
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted mr-4 flex-shrink-0">
                            {candidate.person.image_candidate_url && (
                              <Image
                                src={candidate.person.image_candidate_url}
                                alt={candidate.person.fullname}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-card-foreground font-bold truncate">
                              {candidate.person.fullname}
                            </p>
                          </div>
                          <ChevronRight
                            size={24}
                            className="text-muted-foreground flex-shrink-0"
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
                className="w-full bg-secondary border border-border py-4 rounded-2xl font-bold text-secondary-foreground hover:bg-muted transition-colors"
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
          onClose={closeDetail}
        />
      </div>
    );
  }

  // ── NO CATEGORIES ─────────────────────────────────────────────────────────

  if (!currentCategory) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6">
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

  // ── SWIPE VIEW ────────────────────────────────────────────────────────────

  const config = CATEGORY_CONFIG[currentCategory];
  const IconComponent = config.Icon;
  const progress = ((categoryIndex + 1) / activeCategories.length) * 100;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header progress */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center flex-1">
            <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center mr-3 flex-shrink-0">
              <IconComponent size={20} style={{ color: config.color }} />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Paso {categoryIndex + 1} de {activeCategories.length}
              </p>
              <p className="text-foreground font-black text-lg leading-tight">
                {config.title}
              </p>
            </div>
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Description + counter */}
      <div className="px-6 py-3 bg-card/50 border-y border-border flex items-center justify-between">
        <p className="text-muted-foreground text-sm flex-1">
          {config.description}
        </p>
        <div className="bg-primary/10 rounded-full px-3 py-1 ml-3 flex-shrink-0">
          <span className="text-primary font-bold text-sm">
            {cardIndex + 1}/{currentCandidates.length}
          </span>
        </div>
      </div>

      {/* Card stack */}
      <div className="flex-1 flex items-center justify-center px-6 py-4 relative">
        {/* Background card ghost */}
        {cardIndex < currentCandidates.length - 1 && (
          <div
            className="absolute opacity-40 scale-95"
            style={{ pointerEvents: "none" }}
          >
            <div
              className="bg-card rounded-3xl border border-border"
              style={{ width: "min(320px, 85vw)", aspectRatio: "3/4" }}
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

      {/* Actions */}
      <div className="px-6 pb-8 flex flex-col gap-3">
        {currentCandidates.length - cardIndex > 3 && (
          <button
            type="button"
            onClick={handleAcceptRemaining}
            className="bg-success py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-white hover:bg-success/90 transition-colors"
          >
            <CheckCircle size={20} />
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
        onClose={closeDetail}
      />
    </div>
  );
};
