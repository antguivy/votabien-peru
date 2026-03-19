"use client";

import { MATCH_QUESTIONS } from "@/constants/match-questions";
import { useMatchmaking } from "@/hooks/use-matchmaking";
import { QuestionOption } from "@/interfaces/match";
import {
  AlertTriangle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
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

type View = "home" | "saved";

export default function MatchScreen({
  districts,
}: {
  districts: ElectoralDistrictBase[];
}) {
  const {
    parties,
    formData,
    results,
    loading,
    step,
    updateAnswer,
    setExcludedParties,
    nextStep,
    prevStep,
    submitMatch,
    resetMatch,
  } = useMatchmaking();
  const { savedResults } = useSavedResults();
  const [view, setView] = useState<View>("home");

  const currentQuestionIndex = step - 1;
  const currentQuestion = MATCH_QUESTIONS[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === MATCH_QUESTIONS.length - 1;

  const handleDistrictSelect = useCallback(
    (id: string) => updateAnswer("electoral_district_id", id),
    [updateAnswer],
  );

  const handleAnswer = useCallback(
    (option: QuestionOption) => {
      if (option.paramKey) updateAnswer(option.paramKey, option.value);
      if (isLastQuestion) {
        const finalOverride = option.paramKey
          ? { [option.paramKey]: option.value }
          : {};
        submitMatch(finalOverride);
      } else {
        nextStep();
      }
    },
    [isLastQuestion, updateAnswer, submitMatch, nextStep],
  );

  const handleRestartMatch = useCallback(() => {
    setView("home");
    resetMatch();
  }, [resetMatch]);

  const handleGoToSaved = useCallback(() => {
    setView("saved");
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center pb-20">
        <div className="bg-card rounded-3xl p-8 flex flex-col items-center shadow-lg border border-border">
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
  if (step === MATCH_QUESTIONS.length + 1 && results) {
    return <ResultsFlow results={results} onReset={resetMatch} />;
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
              Responde 9 preguntas sobre lo que te importa y te mostramos qué
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
              "Elige tu distrito electoral",
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
