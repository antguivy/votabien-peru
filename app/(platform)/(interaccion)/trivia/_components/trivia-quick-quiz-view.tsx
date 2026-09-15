"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { TriviaOption, TriviaQuestion } from "@/interfaces/game-types";
import { TriviaTopic, TriviaAudience } from "@/interfaces/trivia";
import { useGameStore } from "@/store/game-store";
import { VideoDialog } from "@/components/video-dialog";
import { parseSourceUrls } from "@/lib/utils/url";
import {
  X,
  Zap,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  ArrowRight,
  Sparkles,
  MapPin,
  Play,
  ExternalLink,
  Award,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

const ACRONYMS = new Set([
  "PPC",
  "JNE",
  "ONPE",
  "RENIEC",
  "APRA",
  "TC",
  "PJ",
  "MP",
  "DNI",
  "ERM",
  "EG",
  "APP",
  "FP",
  "PL",
  "RP",
  "SP",
  "PM",
  "JP",
  "AV",
]);

function formatOptionText(text: string): string {
  if (!text) return "";
  const lettersOnly = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, "");
  if (lettersOnly.length > 3 && lettersOnly === lettersOnly.toUpperCase()) {
    const minorWords = new Set([
      "de",
      "del",
      "la",
      "las",
      "el",
      "los",
      "y",
      "en",
      "a",
      "por",
      "e",
      "o",
      "u",
      "al",
    ]);
    return text
      .toLowerCase()
      .split(/\s+/)
      .map((word, idx) => {
        const clean = word.replace(/[^a-zA-Z]/g, "").toUpperCase();
        if (ACRONYMS.has(clean)) return word.toUpperCase();
        if (idx > 0 && minorWords.has(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  }
  return text;
}

function getSources(rawSourceUrl?: string | null) {
  if (!rawSourceUrl) return [];
  const normalized = rawSourceUrl
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) =>
      s.startsWith("http://") || s.startsWith("https://") ? s : `https://${s}`,
    );
  return parseSourceUrls(normalized.join(", "));
}

function QuestionSourceLinks({
  sourceUrl,
  compact = false,
  isDebate = false,
}: {
  sourceUrl: string;
  compact?: boolean;
  isDebate?: boolean;
}) {
  const sources = getSources(sourceUrl);
  if (sources.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {sources.map((src, idx) => {
        const isVideo =
          src.url.includes("youtube.com") ||
          src.url.includes("youtu.be") ||
          src.url.includes("tiktok.com");

        if (isVideo) {
          return (
            <VideoDialog
              key={idx}
              url={src.url}
              trigger={
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white active:scale-[0.98] font-bold shadow-xs transition-all cursor-pointer group",
                    compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
                  )}
                >
                  <Play
                    size={compact ? 10 : 12}
                    className="fill-current text-white shrink-0 group-hover:scale-110 transition-transform"
                  />
                  <span>{isDebate ? "Ver debate" : "Ver video"}</span>
                </button>
              }
            />
          );
        }

        return (
          <Link
            key={idx}
            href={src.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background hover:bg-muted font-semibold text-muted-foreground hover:text-foreground transition-colors shadow-2xs",
              compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
            )}
          >
            <span>{src.label || "Fuente oficial"}</span>
            <ExternalLink size={compact ? 10 : 11} className="shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}

const SECONDS_PER_QUESTION = 20;

interface AnswerRecord {
  isCorrect: boolean;
  timeUsed: number;
  question: TriviaQuestion;
}

export function TriviaQuickQuizView({
  questions,
  topic,
  audience: _audience,
  onExit,
}: {
  questions: TriviaQuestion[];
  topic?: TriviaTopic | null;
  audience?: TriviaAudience | null;
  onExit: () => void;
}) {
  const { recordQuizResult } = useGameStore();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLeftRef = useRef(SECONDS_PER_QUESTION);
  const revealedRef = useRef(false);

  const question: TriviaQuestion | undefined = questions[currentIdx];
  const isLastQ = currentIdx === questions.length - 1;

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const doReveal = useCallback(
    (chosenId: string | null) => {
      stopTimer();
      if (!question) return;

      const isCorrect =
        chosenId !== null && chosenId === question.correct_answer_id;
      const timeUsed = SECONDS_PER_QUESTION - timeLeftRef.current;
      const speedBonus = isCorrect
        ? Math.round((timeLeftRef.current / SECONDS_PER_QUESTION) * 50)
        : 0;
      const streakBonus = isCorrect ? streak * 10 : 0;
      const pointsGained = isCorrect ? 100 + speedBonus + streakBonus : 0;

      setSelectedId(chosenId);
      setRevealed(true);
      setScore((s) => s + pointsGained);
      setStreak((str) => (isCorrect ? str + 1 : 0));
      setAnswers((prev) => [...prev, { isCorrect, timeUsed, question }]);

      if (isCorrect && streak >= 2) {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
    },
    [question, stopTimer, streak],
  );

  const startTimer = useCallback(() => {
    stopTimer();
    revealedRef.current = false;
    timeLeftRef.current = SECONDS_PER_QUESTION;
    setTimeLeft(SECONDS_PER_QUESTION);
    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        stopTimer();
        if (!revealedRef.current) {
          revealedRef.current = true;
          doReveal(null);
        }
      }
    }, 1000);
  }, [doReveal, stopTimer]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isFinished) startTimer();
    return stopTimer;
  }, [currentIdx, isFinished, startTimer, stopTimer]);

  const handleSelect = useCallback(
    (id: string) => {
      if (revealed || revealedRef.current) return;
      revealedRef.current = true;
      doReveal(id);
    },
    [revealed, doReveal],
  );

  const handleNext = useCallback(() => {
    if (isLastQ) {
      const correctCount = answers.filter((a) => a.isCorrect).length;
      recordQuizResult(score, correctCount, questions.length, topic?.slug);
      setIsFinished(true);
      if (correctCount >= questions.length * 0.7) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } else {
      setCurrentIdx((i) => i + 1);
      setSelectedId(null);
      setRevealed(false);
    }
  }, [
    isLastQ,
    answers,
    recordQuizResult,
    score,
    questions.length,
    topic?.slug,
  ]);

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedId(null);
    setRevealed(false);
    setScore(0);
    setStreak(0);
    setAnswers([]);
    setIsFinished(false);
  };

  // Keyboard navigation: 1-4 / A-D to answer, Space/Enter to advance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (!revealed) {
        const key = e.key.toUpperCase();
        const letterMap: Record<string, number> = {
          "1": 0,
          "2": 1,
          "3": 2,
          "4": 3,
          A: 0,
          B: 1,
          C: 2,
          D: 3,
        };
        if (key in letterMap) {
          const index = letterMap[key];
          if (question?.options && question.options[index]) {
            handleSelect(question.options[index].option_id);
          }
        }
      } else {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [revealed, question, handleSelect, handleNext]);

  if (!question && !isFinished) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
        <p className="text-muted-foreground text-sm">
          No hay preguntas disponibles para este eje temático.
        </p>
        <Button onClick={onExit} className="mt-4 rounded-xl">
          Volver a la Trivia
        </Button>
      </div>
    );
  }

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const accuracy =
    questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;

  // --- VISTA DE RESULTADOS FINALES (CERTIFICADO CÍVICO) ---
  if (isFinished) {
    const isMaster = accuracy >= 80;
    const isGood = accuracy >= 60;

    return (
      <div className="flex flex-col items-center justify-center min-h-[550px] p-4 max-w-xl mx-auto animate-in fade-in duration-300">
        <div className="w-full bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Sello de Evaluación */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shadow-inner">
              {isMaster ? (
                <Award size={36} className="text-brand" />
              ) : isGood ? (
                <Trophy size={36} className="text-amber-500" />
              ) : (
                <Sparkles size={36} className="text-primary" />
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground font-mono">
                {topic?.title || "Desafío Cívico Regional"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                {isMaster
                  ? "¡Criterio Cívico Sobresaliente!"
                  : isGood
                    ? "¡Buen Juicio Ciudadano!"
                    : "¡Fortaleciendo la Conciencia Cívica!"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                {isMaster
                  ? "Has demostrado un dominio ejemplar para contrastar hechos, declaraciones y propuestas políticas."
                  : isGood
                    ? "Tienes un criterio sólido para identificar la veracidad de las declaraciones. ¡Sigue profundizando!"
                    : "Conocer las declaraciones y antecedentes de cada postulante es el primer paso hacia un voto responsable."}
              </p>
            </div>
          </div>

          {/* Estadísticas en Bento */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-muted/40 border border-border/70 text-center">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground font-mono">
                Puntaje
              </p>
              <p className="text-2xl font-black text-brand tabular-nums">
                {score}
              </p>
              <span className="text-[10px] text-muted-foreground">pts</span>
            </div>
            <div className="border-x border-border/60">
              <p className="text-[10px] uppercase font-bold text-muted-foreground font-mono">
                Aciertos
              </p>
              <p className="text-2xl font-black text-foreground tabular-nums">
                {correctCount}
                <span className="text-xs font-normal text-muted-foreground">
                  /{questions.length}
                </span>
              </p>
              <span className="text-[10px] text-muted-foreground">
                preguntas
              </span>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground font-mono">
                Precisión
              </p>
              <p className="text-2xl font-black text-primary tabular-nums">
                {accuracy}%
              </p>
              <span className="text-[10px] text-muted-foreground">
                efectividad
              </span>
            </div>
          </div>

          {/* Desglose de Preguntas con acceso a Videos/Fuentes */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>Revisión de respuestas</span>
              <span className="text-[10px] font-normal text-muted-foreground">
                ({answers.length})
              </span>
            </h4>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {answers.map((ans, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-border/60 bg-card flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {ans.isCorrect ? (
                      <CheckCircle2
                        size={15}
                        className="text-emerald-500 shrink-0"
                      />
                    ) : (
                      <XCircle size={15} className="text-rose-500 shrink-0" />
                    )}
                    <p className="text-muted-foreground truncate font-medium">
                      <span className="text-foreground font-bold mr-1 font-mono">
                        #{idx + 1}
                      </span>
                      {ans.question.quote}
                    </p>
                  </div>

                  {ans.question.source_url && (
                    <div className="shrink-0">
                      <QuestionSourceLinks
                        sourceUrl={ans.question.source_url}
                        compact
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="space-y-2.5 pt-2">
            <Button
              onClick={handleRestart}
              className="w-full h-11 rounded-xl bg-brand hover:bg-brand/90 text-white font-bold gap-2 text-sm shadow-sm transition-all"
            >
              <RotateCcw size={15} /> Jugar de Nuevo este Eje
            </Button>
            <Button
              variant="outline"
              onClick={onExit}
              className="w-full h-10 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground border-border/80"
            >
              Volver al Menú de Trivias
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA DE PREGUNTA EN CURSO ---
  const isCorrectAns = selectedId === question?.correct_answer_id;
  const isTimeout = revealed && selectedId === null;

  return (
    <div className="flex flex-col h-full max-w-xl mx-auto px-4 py-4 space-y-4">
      {/* Barra de Encabezado */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={onExit}
            className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Salir de la trivia"
          >
            <X size={16} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground font-mono">
                Pregunta {currentIdx + 1} de {questions.length}
              </span>
              {topic && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-2 py-0 h-4 bg-muted font-semibold text-foreground/80"
                >
                  {topic.title}
                </Badge>
              )}
            </div>
            {question?.electoraldistrict && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium mt-0.5">
                <MapPin size={10} className="text-brand shrink-0" />
                <span>Región {question.electoraldistrict.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {streak >= 2 && (
            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 font-bold text-xs">
              <Zap size={12} fill="currentColor" /> {streak} Racha
            </Badge>
          )}
          <div className="text-right">
            <p className="text-[9px] uppercase font-bold text-muted-foreground font-mono">
              Puntos
            </p>
            <p className="text-sm font-black tabular-nums text-foreground">
              {score}
            </p>
          </div>
        </div>
      </div>

      {/* Temporizador */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[11px] font-mono text-muted-foreground">
          <span className="font-semibold uppercase text-[10px] tracking-wider">
            Tiempo
          </span>
          <span
            className={cn(
              "font-bold tabular-nums",
              timeLeft <= 5 &&
                "text-rose-600 dark:text-rose-400 animate-pulse font-black",
            )}
          >
            {timeLeft}s
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-linear",
              timeLeft > 10
                ? "bg-brand"
                : timeLeft > 5
                  ? "bg-amber-500"
                  : "bg-rose-500",
            )}
            style={{ width: `${(timeLeft / SECONDS_PER_QUESTION) * 100}%` }}
          />
        </div>
      </div>

      {/* Tarjeta de la Declaración / Pregunta */}
      <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden">
        {/* Cita en Serif Newsreader */}
        <div className="relative py-1">
          <h3 className="font-serif text-lg sm:text-xl font-normal leading-relaxed text-foreground italic">
            <span className="font-serif text-2xl sm:text-3xl text-brand/60 select-none mr-1.5 not-italic">
              «
            </span>
            {question?.quote}
            <span className="font-serif text-2xl sm:text-3xl text-brand/60 select-none ml-1.5 not-italic">
              »
            </span>
          </h3>
        </div>
      </div>

      {/* Opciones de Selección */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {question?.options.map((opt: TriviaOption, idx) => {
          const isSelected = selectedId === opt.option_id;
          const isCorrect = opt.option_id === question.correct_answer_id;

          let btnStateClasses =
            "border-border/80 bg-card hover:bg-muted/40 hover:border-border cursor-pointer";
          let letterBg =
            "bg-muted/80 text-muted-foreground border-border/70 group-hover:text-foreground";

          if (revealed) {
            if (isCorrect) {
              btnStateClasses =
                "border-2 border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 font-semibold shadow-xs";
              letterBg = "bg-emerald-500 text-white border-emerald-500";
            } else if (isSelected) {
              btnStateClasses =
                "border-2 border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-200 shadow-xs";
              letterBg = "bg-rose-500 text-white border-rose-500";
            } else {
              btnStateClasses =
                "opacity-35 border-border/50 bg-muted/15 cursor-not-allowed";
              letterBg =
                "bg-muted/40 text-muted-foreground/50 border-transparent";
            }
          }

          const formattedName = formatOptionText(opt.name);

          return (
            <button
              key={opt.option_id}
              type="button"
              disabled={revealed}
              onClick={() => handleSelect(opt.option_id)}
              className={cn(
                "p-3.5 sm:p-4 rounded-2xl border text-left transition-all select-none shadow-2xs flex items-center gap-3 group active:scale-[0.99]",
                btnStateClasses,
              )}
            >
              <span
                className={cn(
                  "w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 transition-colors",
                  letterBg,
                )}
              >
                {opt.letter || ["A", "B", "C", "D"][idx] || "•"}
              </span>

              <div className="flex-1 min-w-0">
                <span className="text-xs sm:text-sm font-medium leading-snug line-clamp-2 block text-foreground">
                  {formattedName}
                </span>
                {opt.subtitle && (
                  <span className="text-[11px] text-muted-foreground block truncate mt-0.5">
                    {opt.subtitle}
                  </span>
                )}
              </div>

              {revealed && isCorrect && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              )}
              {revealed && isSelected && !isCorrect && (
                <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Retroalimentación Pedagógica y Verificación (Momento de Revelación) */}
      {revealed && (
        <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-3.5 animate-in slide-in-from-bottom-2 duration-200">
          {/* Fila Superior: Veredicto + Enlaces de Video/Fuente */}
          <div className="flex items-center justify-between gap-2.5 flex-wrap">
            <div className="flex items-center gap-2">
              {isTimeout ? (
                <Badge
                  variant="outline"
                  className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold text-xs px-2.5 py-1"
                >
                  ⏰ ¡Tiempo agotado!
                </Badge>
              ) : isCorrectAns ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold text-xs px-2.5 py-1 gap-1.5"
                >
                  <CheckCircle2
                    size={13}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                  ¡Respuesta Correcta!
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold text-xs px-2.5 py-1 gap-1.5"
                >
                  <XCircle
                    size={13}
                    className="text-rose-600 dark:text-rose-400"
                  />
                  Respuesta Incorrecta
                </Badge>
              )}
            </div>

            {/* Ver video / Fuente oficial */}
            {question?.source_url && (
              <QuestionSourceLinks
                sourceUrl={question.source_url}
                isDebate={Boolean(
                  topic?.has_factcheck ||
                    (question.secondary_sources &&
                      question.secondary_sources.length > 0),
                )}
              />
            )}
          </div>

          {/* Explicación Pedagógica */}
          {question?.explanation && (
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-xs sm:text-sm leading-relaxed space-y-1">
              <p className="font-bold text-foreground">
                Contexto y verificación:
              </p>
              <p className="text-muted-foreground font-normal">
                {question.explanation}
              </p>
            </div>
          )}

          {/* Fuentes Secundarias de Fact-Checking */}
          {question?.secondary_sources &&
            question.secondary_sources.length > 0 && (
              <div className="p-3 rounded-xl border border-blue-500/25 bg-blue-500/10 dark:bg-blue-950/30 text-xs space-y-2">
                <div className="flex items-center gap-1.5">
                  <Scale
                    size={13}
                    className="text-blue-600 dark:text-blue-400 shrink-0"
                  />
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-300">
                    Fuentes de contrastación y verificación
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {question.secondary_sources.map((sec, idx) => {
                    const parsed = parseSourceUrls(sec.url)[0];
                    const displayLabel =
                      sec.label || parsed?.label || "Fuente oficial";

                    return (
                      <a
                        key={idx}
                        href={sec.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 hover:bg-white text-blue-700 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:text-blue-300 border border-blue-500/30 transition-all hover:scale-[1.02] shadow-2xs group"
                        title={sec.url}
                      >
                        <span>{displayLabel}</span>
                        <ExternalLink
                          size={10}
                          className="opacity-60 group-hover:opacity-100 transition-opacity shrink-0"
                        />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Botón Siguiente Pregunta */}
          <div className="pt-1">
            <Button
              onClick={handleNext}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm gap-2 shadow-xs transition-all active:scale-[0.99]"
            >
              <span>
                {isLastQ ? "Ver Resultados Finales" : "Siguiente Pregunta"}
              </span>
              <ArrowRight size={15} />
              <span className="hidden sm:inline text-[10px] font-mono font-normal opacity-60 ml-2 border border-white/20 rounded px-1.5 py-0.5">
                Espacio ↵
              </span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
