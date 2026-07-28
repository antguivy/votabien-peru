"use client";

import { MATCH_QUESTIONS } from "@/constants/match-questions";
import { AI_INTERESTS } from "@/constants/interests";
import { useMatchmaking } from "@/hooks/use-matchmaking";
import { QuestionOption } from "@/interfaces/match";
import {
  AlertTriangle,
  Bookmark,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Loader2,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";

import { DistrictSelect } from "@/components/match/district-select";
import { PartyExcludeSheet } from "@/components/match/party-excluded";
import { QuestionCard } from "@/components/match/question-card";
import { ResultsFlow } from "@/components/match/results-flow";
import { SavedResultsView } from "@/components/match/saved-results";
import { ElectoralDistrictBase } from "@/interfaces/electoral-district";
import { useSavedResults } from "@/store/saved-match-results";
import { Button } from "@/components/ui/button";
import { AILoadingState } from "@/components/match/ai-loading-state";
import { PoliticalPartyBase } from "@/interfaces/political-party";

type View = "home" | "saved";

export default function MatchScreen({
  districts,
  parties,
}: {
  districts: ElectoralDistrictBase[];
  parties: PoliticalPartyBase[];
}) {
  const {
    parties: hookParties,
    formData,
    results,
    loading,
    isAILoading,
    aiStatusText,
    aiLiveThoughts,
    step,
    updateAnswer,
    setExcludedParties,
    nextStep,
    prevStep,
    applyAIFilter,
    submitMatch,
    resetMatch,
  } = useMatchmaking(districts, parties);
  const { savedResults } = useSavedResults();
  const [view, setView] = useState<View>("home");
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const currentQuestionIndex = step - 1;
  const currentQuestion = MATCH_QUESTIONS[currentQuestionIndex];
  const _isLastQuestion = currentQuestionIndex === MATCH_QUESTIONS.length - 1;

  const handleDistrictSelect = useCallback(
    (id: string) => updateAnswer("electoral_district_id", id),
    [updateAnswer],
  );

  const handleAnswer = useCallback(
    (option: QuestionOption) => {
      if (option.paramKey) updateAnswer(option.paramKey, option.value);
      nextStep();
    },
    [updateAnswer, nextStep],
  );

  const handleRestartMatch = useCallback(() => {
    setView("home");
    setShowAIOptions(false);
    setSelectedInterests([]);
    resetMatch();
  }, [resetMatch]);

  const handleGoToSaved = useCallback(() => {
    setView("saved");
  }, []);

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interestId)) {
        return prev.filter((id) => id !== interestId);
      }

      const optionToAdd = AI_INTERESTS.find((opt) => opt.id === interestId);
      const conflicts = optionToAdd?.conflictsWith || [];

      return [...prev.filter((id) => !conflicts.includes(id)), interestId];
    });
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading || isAILoading) {
    if (isAILoading) {
      return (
        <AILoadingState
          statusText={aiStatusText}
          liveThoughts={aiLiveThoughts}
        />
      );
    }

    return (
      <div className="flex-1 flex items-center justify-center pb-20 animate-in fade-in duration-300">
        <div className="bg-card rounded-3xl p-8 flex flex-col items-center shadow-lg border border-border text-center max-w-[280px]">
          <Loader2 size={48} className="text-primary animate-spin" />
          <p className="mt-6 text-foreground font-semibold text-base">
            Calculando compatibilidad
          </p>
          <p className="mt-2 text-muted-foreground text-sm">
            Esto tomará solo unos segundos...
          </p>
        </div>
      </div>
    );
  }

  // ── Results flow ───────────────────────────────────────────────────────────
  if (step === MATCH_QUESTIONS.length + 2 && results) {
    return <ResultsFlow results={results} onReset={resetMatch} />;
  }

  // ── PANTALLA DE DECISIÓN (Paso 11) ─────────────────────────────────────────
  // Reemplaza el bloque `if (step === MATCH_QUESTIONS.length + 1)` con este:

  if (step === MATCH_QUESTIONS.length + 1) {
    return (
      <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
        {!showAIOptions ? (
          /* ─── VISTA: Elegir camino ─── */
          <div className="flex-1 flex flex-col justify-center items-center text-center px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="mb-10">
              <div className="relative w-14 h-14 mx-auto mb-6">
                <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-md" />
                <div className="relative w-14 h-14 rounded-2xl bg-background border border-border flex items-center justify-center shadow-sm">
                  <Bookmark
                    className="text-primary"
                    size={22}
                    strokeWidth={1.75}
                  />
                </div>
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground mb-1.5">
                Respuestas guardadas
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-[260px] mx-auto">
                ¿Cómo quieres explorar a tus candidatos?
              </p>
            </div>

            <div className="w-full max-w-sm flex flex-col gap-2.5">
              <button
                onClick={() => submitMatch()}
                className="w-full bg-card border border-border hover:border-border hover:bg-muted/40 p-4 rounded-2xl flex items-center text-left transition-all duration-200 active:scale-[0.98] group"
              >
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center mr-3.5 shrink-0">
                  <ListFilter className="text-foreground/50" size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">
                    Resultados básicos
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    Filtro rápido con tus respuestas
                  </p>
                </div>
                <ChevronRight
                  size={15}
                  className="text-muted-foreground/50 ml-3 shrink-0"
                />
              </button>

              <button
                onClick={() => setShowAIOptions(true)}
                className="w-full bg-primary text-primary-foreground p-4 rounded-2xl flex items-center text-left transition-all duration-200 active:scale-[0.98] shadow-md shadow-primary/20"
              >
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mr-3.5 shrink-0">
                  <BrainCircuit size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Análisis con IA</p>
                  <p className="text-xs text-primary-foreground/60 mt-0.5 truncate">
                    Compara según tus temas prioritarios
                  </p>
                </div>
              </button>
            </div>

            <button
              onClick={prevStep}
              className="mt-10 text-muted-foreground/60 text-xs font-medium flex items-center gap-1 hover:text-muted-foreground transition-colors"
            >
              <ChevronLeft size={13} /> Volver a la última pregunta
            </button>
          </div>
        ) : (
          /* ─── VISTA: Filtro Inteligente ─── */
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 shrink-0">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => {
                    setShowAIOptions(false);
                    setSelectedInterests([]);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft size={18} />
                </button>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-foreground leading-none">
                    Filtro Inteligente
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecciona los temas que más te importan.
                  </p>
                  <p className="text-sm font-medium text-amber-600/90 dark:text-amber-500/90 mt-1.5 flex items-center gap-1">
                    Las posturas opuestas se reemplazarán automáticamente.
                  </p>
                </div>

                {selectedInterests.length > 0 && (
                  <div className="ml-auto flex items-center gap-2 animate-in fade-in duration-200">
                    <Button
                      variant={"outline"}
                      onClick={() => setSelectedInterests([])}
                    >
                      Limpiar
                    </Button>
                    <span className="inline-flex items-center bg-primary text-primary-foreground text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      {selectedInterests.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Barra de progreso de selección */}
              <div className="h-0.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.min((selectedInterests.length / 5) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Tags — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 pb-2 min-h-0">
              <div className="flex flex-col gap-1.5 py-1">
                {AI_INTERESTS.map((interest, i) => {
                  const isSelected = selectedInterests.includes(interest.id);
                  return (
                    <button
                      key={interest.id}
                      onClick={() => toggleInterest(interest.id)}
                      style={{ animationDelay: `${i * 25}ms` }}
                      className={`
                      animate-in fade-in slide-in-from-bottom-2
                      w-full px-4 py-3 rounded-xl text-sm font-medium text-left
                      border transition-all duration-150 active:scale-[0.99]
                      ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                          : "bg-muted/50 text-foreground/70 border-transparent hover:border-border hover:bg-muted hover:text-foreground"
                      }
                    `}
                    >
                      {interest.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pt-3 pb-6 shrink-0">
              <button
                onClick={() => applyAIFilter(selectedInterests)}
                disabled={selectedInterests.length === 0}
                className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 text-sm shadow-md shadow-primary/20 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <BrainCircuit size={16} />
                Analizar candidatos
                {selectedInterests.length > 0 && (
                  <span className="bg-white/15 text-[11px] font-bold px-1.5 py-0.5 rounded-md">
                    {selectedInterests.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Saved results view ─────────────────────────────────────────────────────
  if (step === 0 && view === "saved") {
    return (
      <SavedResultsView
        onClose={() => setView("home")}
        onRestartMatch={handleRestartMatch}
      />
    );
  }

  // ── Step 0: Home ───────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Hero */}
        <div className="pb-5">
          <h1 className="text-3xl font-black text-foreground tracking-tight leading-tight">
            ¿Por quién podrías votar?
          </h1>
          <div className="h-1.5 w-24 bg-primary rounded-full mb-4" />
          {savedResults.length > 0 ? (
            <button
              type="button"
              onClick={handleGoToSaved}
              className="w-full flex items-center gap-3 bg-primary/8 border border-primary/25 rounded-2xl px-4 py-3 hover:bg-primary/12 transition-colors group text-left"
            >
              <div className="bg-primary/15 rounded-xl w-9 h-9 flex items-center justify-center shrink-0">
                <Bookmark size={16} className="text-primary" />
              </div>

              {/* Saved results banner */}
              <div className="flex-1 min-w-0">
                <p className="text-primary font-bold text-sm">
                  {savedResults.length === 1
                    ? "Tienes 1 lista guardada"
                    : `Tienes ${savedResults.length} listas guardadas`}
                </p>
                <p className="text-primary/70 text-xs mt-0.5">
                  Toca para verlas o compartirlas
                </p>
              </div>
              <ChevronRight
                size={16}
                className="text-primary/60 group-hover:translate-x-0.5 transition-transform shrink-0"
              />
            </button>
          ) : (
            <p className="text-muted-foreground text-lg leading-7 mt-5">
              Responde 10 preguntas sobre lo que te importa y te mostramos qué
              candidatos coinciden contigo.
            </p>
          )}
        </div>

        {/* How it works */}
        <div className="flex-1">
          <p className="text-card-foreground font-bold text-base mb-2">
            ¿Cómo funciona?
          </p>
          <div className="flex flex-col gap-1.5">
            {[
              "Elige la región en la que votas",
              "Responde 9 preguntas rápidas",
              "Ve los candidatos que más te representan",
              "Guarda tu selección y compártela con tus amigos",
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-black flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <p className="text-muted-foreground text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 mt-6 shadow-sm">
          <div className="pb-4">
            <h2 className="text-foreground font-bold text-lg mb-3">
              ¿Cuál es la región en la que votas?
            </h2>
            <DistrictSelect
              districts={districts}
              selectedId={formData.electoral_district_id}
              onSelect={handleDistrictSelect}
            />
          </div>
          <div className="pb-6">
            <h2 className="text-foreground font-bold text-lg mb-3">
              ¿Hay partidos que quieres ignorar?
            </h2>
            <PartyExcludeSheet
              parties={parties}
              excludedIds={formData.excluded_party_ids ?? []}
              onConfirm={setExcludedParties}
            />
          </div>
          <div className="pt-2">
            <button
              type="button"
              disabled={!formData.electoral_district_id}
              onClick={nextStep}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-colors ${
                formData.electoral_district_id
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {formData.electoral_district_id
                ? "Comenzar test"
                : "Selecciona un distrito"}
            </button>
          </div>
        </div>

        <div className="pb-24" />
      </div>
    );
  }

  // ── Invalid question ───────────────────────────────────────────────────────
  if (!currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className="flex flex-col items-center">
          <div className="bg-destructive/10 rounded-full w-20 h-20 flex items-center justify-center mb-4">
            <AlertTriangle size={48} className="text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-destructive mb-2 text-center">
            Algo salió mal
          </h2>
          <p className="text-muted-foreground text-center mb-6">
            No pudimos cargar la pregunta
          </p>
          <button
            type="button"
            onClick={resetMatch}
            className="bg-primary py-4 px-8 rounded-2xl font-bold text-primary-foreground"
          >
            Reiniciar test
          </button>
        </div>
      </div>
    );
  }

  // ── Questions ──────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-h-0 max-w-lg mx-auto w-full">
      <div className=" pb-2 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <Button type="button" onClick={resetMatch}>
            <X size={16} />
            <span className="text-sm font-medium">Salir</span>
          </Button>
          <span className="text-primary text-sm font-bold">
            {Math.round((step / MATCH_QUESTIONS.length) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(step / MATCH_QUESTIONS.length) * 100}%` }}
          />
        </div>
        <p className="text-muted-foreground text-sm font-medium mt-2">
          Pregunta {step} de {MATCH_QUESTIONS.length}
        </p>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <QuestionCard question={currentQuestion} onAnswer={handleAnswer} />
      </div>
      {step > 1 && (
        <div className="px-6 pt-2 lg:mb-4 shrink-0">
          <Button
            type="button"
            variant={"outline"}
            onClick={prevStep}
            className="w-full"
          >
            <ChevronLeft size={20} className="text-muted-foreground" />
            <span className="text-muted-foreground font-medium text-base">
              Pregunta anterior
            </span>
          </Button>
        </div>
      )}
      {step === 1 && <div className="pb-20 shrink-0" />}
    </div>
  );
}
