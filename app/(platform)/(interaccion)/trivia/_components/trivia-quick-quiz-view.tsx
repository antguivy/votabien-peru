"use client";

import { useState, useEffect, useRef } from "react";
import { TriviaOption, TriviaQuestion } from "@/interfaces/game-types";
import { TriviaTopic, TriviaAudience } from "@/interfaces/trivia";
import { useGameStore } from "@/store/game-store";
import {
  X,
  Zap,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

const SECONDS_PER_QUESTION = 20;

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
  const [answers, setAnswers] = useState<
    { isCorrect: boolean; timeUsed: number }[]
  >([]);
  const [isFinished, setIsFinished] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLeftRef = useRef(SECONDS_PER_QUESTION);
  const revealedRef = useRef(false);

  const question: TriviaQuestion | undefined = questions[currentIdx];
  const isLastQ = currentIdx === questions.length - 1;

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const doReveal = (chosenId: string | null) => {
    stopTimer();
    const isCorrect =
      chosenId !== null && chosenId === question?.correct_answer_id;
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
    setAnswers((prev) => [...prev, { isCorrect, timeUsed }]);

    if (isCorrect && streak >= 2) {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  };

  const startTimer = () => {
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
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isFinished) startTimer();
    return stopTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, isFinished]);

  const handleSelect = (id: string) => {
    if (revealed || revealedRef.current) return;
    revealedRef.current = true;
    doReveal(id);
  };

  const handleNext = () => {
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
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedId(null);
    setRevealed(false);
    setScore(0);
    setStreak(0);
    setAnswers([]);
    setIsFinished(false);
  };

  if (!question && !isFinished) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
        <p className="text-muted-foreground text-sm">
          No hay preguntas disponibles.
        </p>
        <Button onClick={onExit} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const accuracy =
    questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;

  // --- VISTA DE RESULTADOS FINALES ---
  if (isFinished) {
    const isMaster = accuracy >= 90;
    const isGood = accuracy >= 60;

    return (
      <div className="flex flex-col items-center justify-center min-h-[550px] p-6 max-w-lg mx-auto animate-in fade-in duration-300">
        <div className="w-full bg-card border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
          {/* Insignia / Trofeo */}
          <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
            {isMaster ? <Sparkles size={40} /> : <Trophy size={40} />}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              {isMaster
                ? "¡Excelente Desempeño!"
                : isGood
                  ? "¡Buen Trabajo!"
                  : "¡Sigue Aprendiendo!"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {topic?.title || "Desafío de Educación Cívica"}
            </p>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-muted/40 border">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                Puntos
              </p>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400">
                {score}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                Aciertos
              </p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {correctCount}/{questions.length}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">
                Precisión
              </p>
              <p className="text-xl font-black text-primary">{accuracy}%</p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="space-y-2.5 pt-2">
            <Button
              onClick={handleRestart}
              className="w-full h-12 rounded-xl font-bold gap-2 text-sm shadow-md"
            >
              <RotateCcw size={16} /> Jugar de Nuevo
            </Button>
            <Button
              variant="outline"
              onClick={onExit}
              className="w-full h-11 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Volver al Menú de Temas
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
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onExit}
            className="h-8 w-8 rounded-full"
          >
            <X size={16} />
          </Button>
          <div>
            <span className="text-xs font-bold text-muted-foreground">
              Pregunta {currentIdx + 1} de {questions.length}
            </span>
            {topic && (
              <p className="text-[11px] font-semibold text-primary truncate max-w-[200px]">
                {topic.title}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {streak >= 2 && (
            <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 font-black text-xs">
              <Zap size={12} fill="currentColor" /> {streak} Racha
            </Badge>
          )}
          <div className="text-right">
            <p className="text-[9px] uppercase font-bold text-muted-foreground">
              Puntos
            </p>
            <p className="text-sm font-black tabular-nums">{score}</p>
          </div>
        </div>
      </div>

      {/* Temporizador */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
          <span>Tiempo</span>
          <span
            className={
              timeLeft <= 5 ? "text-rose-500 font-black animate-pulse" : ""
            }
          >
            {timeLeft}s
          </span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-linear",
              timeLeft > 10
                ? "bg-emerald-500"
                : timeLeft > 5
                  ? "bg-amber-500"
                  : "bg-rose-500",
            )}
            style={{ width: `${(timeLeft / SECONDS_PER_QUESTION) * 100}%` }}
          />
        </div>
      </div>

      {/* Tarjeta de Pregunta */}
      <div className="p-5 rounded-2xl bg-card border shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className="text-[10px] font-bold uppercase"
          >
            {question?.category || "CÍVICA"}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {question?.difficulty}
          </Badge>
        </div>
        <h3 className="text-base sm:text-lg font-bold leading-snug text-foreground">
          ❝{question?.quote}❞
        </h3>
      </div>

      {/* Opciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {question?.options.map((opt: TriviaOption) => {
          const isSelected = selectedId === opt.option_id;
          const isCorrect = opt.option_id === question.correct_answer_id;

          let btnClass =
            "border-border bg-card hover:bg-muted/50 hover:border-border/80";
          if (revealed) {
            if (isCorrect) {
              btnClass =
                "border-emerald-500 bg-emerald-500/15 text-emerald-950 dark:text-emerald-200 font-bold";
            } else if (isSelected) {
              btnClass =
                "border-rose-500 bg-rose-500/15 text-rose-950 dark:text-rose-200";
            } else {
              btnClass = "opacity-40 border-border bg-muted/20";
            }
          }

          return (
            <button
              key={opt.option_id}
              disabled={revealed}
              onClick={() => handleSelect(opt.option_id)}
              className={cn(
                "p-3.5 rounded-xl border-2 flex items-center gap-3 text-left transition-all select-none shadow-sm",
                btnClass,
              )}
            >
              <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-black flex-shrink-0">
                {opt.letter || "•"}
              </span>
              <span className="text-xs sm:text-sm font-semibold flex-1 leading-snug line-clamp-3">
                {opt.name}
              </span>
              {revealed && isCorrect && (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              )}
              {revealed && isSelected && !isCorrect && (
                <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Explicación y Retroalimentación */}
      {revealed && (
        <div className="p-4 rounded-xl border bg-muted/40 space-y-2 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2">
            {isTimeout ? (
              <Badge variant="secondary">¡Tiempo agotado!</Badge>
            ) : isCorrectAns ? (
              <Badge className="bg-emerald-500 text-white font-bold">
                ¡Correcto!
              </Badge>
            ) : (
              <Badge className="bg-rose-500 text-white font-bold">
                Incorrecto
              </Badge>
            )}
          </div>
          {question?.explanation && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Explicación:</strong>{" "}
              {question.explanation}
            </p>
          )}
          <div className="pt-2">
            <Button onClick={handleNext} className="w-full gap-1.5 font-bold">
              {isLastQ ? "Ver Resultados Finales" : "Siguiente Pregunta"}{" "}
              <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
