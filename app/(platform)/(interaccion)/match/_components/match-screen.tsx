"use client";

import { MATCH_QUESTIONS } from "@/constants/match-questions";
import { useMatchmaking } from "@/hooks/use-matchmaking";
import { QuestionOption } from "@/interfaces/match";
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  Clock,
  Loader2,
} from "lucide-react";
import { useCallback } from "react";

import { DistrictSelect } from "@/components/match/district-select";
import { PartyExcludeSheet } from "@/components/match/party-excluded";
import { QuestionCard } from "@/components/match/question-card";
import { ResultsFlow } from "@/components/match/results-flow";
import { ElectoralDistrictBase } from "@/interfaces/electoral-district";

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
    toggleExcludedParty,
    nextStep,
    prevStep,
    submitMatch,
    resetMatch,
  } = useMatchmaking();

  const currentQuestionIndex = step - 1;
  const currentQuestion = MATCH_QUESTIONS[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === MATCH_QUESTIONS.length - 1;

  const handleDistrictSelect = useCallback(
    (id: string) => updateAnswer("electoral_district_id", id),
    [updateAnswer],
  );

  const handleAnswer = useCallback(
    (option: QuestionOption) => {
      if (option.paramKey) {
        updateAnswer(option.paramKey, option.value);
      }
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

  // ── Loading ───────────────────────────────────────────────────────────────
  // flex-1: ocupa todo el espacio vertical disponible en el padre flex
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

  // ── Step N+1: Resultados ──────────────────────────────────────────────────
  // ResultsFlow maneja su propio scroll interno con overflow-y-auto + pb-20
  if (step === MATCH_QUESTIONS.length + 1 && results) {
    return (
      <div className="flex flex-col min-h-0">
        <ResultsFlow results={results} onReset={resetMatch} />
      </div>
    );
  }

  // ── Step 0: Inicio ────────────────────────────────────────────────────────
  // Esta vista puede tener contenido largo → overflow-y-auto + pb-20
  if (step === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 pt-4 pb-20">
          {/* Hero */}
          <div className="pb-8">
            <h1 className="text-3xl font-black text-foreground tracking-tight leading-tight">
              Encuentra tu candidato ideal
            </h1>
            <div className="h-1.5 w-24 bg-primary rounded-full mt-4" />
            <p className="text-muted-foreground text-lg leading-7 mt-5">
              Responde algunas preguntas y descubre qué candidatos se alinean
              mejor con tus valores y propuestas.
            </p>
          </div>

          {/* Info card */}
          <div className="bg-card rounded-2xl border border-border p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-card-foreground font-semibold text-base mb-1">
                  Votación informada
                </p>
                <p className="text-muted-foreground text-sm leading-5">
                  Conoce su perfil antes de votar
                </p>
              </div>
              <div className="bg-success/10 px-3 py-1.5 rounded-xl flex flex-col items-center gap-1">
                <Clock size={14} className="text-success" />
                <span className="text-success font-semibold text-xs">
                  2-3 min.
                </span>
              </div>
            </div>
          </div>

          {/* Distrito */}
          <div className="pb-4">
            <h2 className="text-foreground font-bold text-lg mb-3">
              Selecciona tu distrito
            </h2>
            <DistrictSelect
              districts={districts}
              selectedId={formData.electoral_district_id}
              onSelect={handleDistrictSelect}
            />
          </div>

          {/* Partidos */}
          <div className="pb-6">
            <h2 className="text-foreground font-bold text-lg mb-3">
              Preferencias de partido
            </h2>
            <PartyExcludeSheet
              parties={parties}
              excludedIds={formData.excluded_party_ids ?? []}
              onToggle={toggleExcludedParty}
            />
          </div>

          {/* CTA */}
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
      </div>
    );
  }

  // ── Invalid question ──────────────────────────────────────────────────────
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

  // ── Steps 1..N: Preguntas ─────────────────────────────────────────────────
  // Layout rígido: progress bar arriba (shrink-0), pregunta en el medio
  // (flex-1 min-h-0), botón atrás abajo (shrink-0).
  return (
    <div className="flex-1 flex flex-col min-h-0 max-w-lg mx-auto w-full">
      {/* Progress bar — tamaño fijo, no se encoge */}
      <div className="px-6 pt-6 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground text-sm font-medium">
            Pregunta {step} de {MATCH_QUESTIONS.length}
          </span>
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
      </div>

      {/* Pregunta — crece para ocupar el espacio restante; puede scrollear si
          el contenido es muy largo en pantallas pequeñas */}
      <div className="flex min-h-0 overflow-y-auto">
        <QuestionCard question={currentQuestion} onAnswer={handleAnswer} />
      </div>

      {/* Botón atrás — siempre visible en la parte inferior, reserva pb-20
          para el bottom nav */}
      {step > 1 && (
        <div className="px-6 shrink-0">
          <button
            type="button"
            onClick={prevStep}
            className="w-full py-3 flex items-center justify-center gap-2 hover:opacity-70 transition-opacity"
          >
            <ChevronLeft size={20} className="text-muted-foreground" />
            <span className="text-muted-foreground font-medium text-base">
              Pregunta anterior
            </span>
          </button>
        </div>
      )}

      {/* Si no hay botón atrás (step 1), igual reservamos el espacio del nav */}
      {step === 1 && <div className="pb-20 shrink-0" />}
    </div>
  );
}
