"use client";

import { getRegionByLevel } from "@/constants/regions-data";
import { useGameStore } from "@/store/game-store";
import { TriviaOption, TriviaQuestion } from "@/interfaces/game-types";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Play,
  Share2,
  X,
  Zap,
} from "lucide-react";
import { IncaArcadeCard } from "@/components/game/inca-arcade-card";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { VideoDialog } from "@/components/video-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ── Constants ─────────────────────────────────────────────────────────────
const SECONDS_PER_QUESTION = 15;
const EXPLANATION_COLLAPSE_THRESHOLD = 120;

// ── Helpers ───────────────────────────────────────────────────────────────
function calcStars(correct: number, total: number): 0 | 1 | 2 | 3 {
  const r = correct / total;
  if (r === 1) return 3;
  if (r >= 0.75) return 2;
  if (r >= 0.5) return 1;
  return 0;
}
function calcXp(stars: number): number {
  return 50 + stars * 25;
}
function scoreForAnswer(timeLeft: number, correct: boolean): number {
  if (!correct) return 0;
  return 100 + Math.round((timeLeft / SECONDS_PER_QUESTION) * 100);
}

function TimerBar({ timeLeft, total }: { timeLeft: number; total: number }) {
  const pct = Math.max(0, (timeLeft / total) * 100);
  const color = pct > 60 ? "#22c55e" : pct > 30 ? "#f97316" : "#ef4444";
  return (
    <div className="h-2 w-full bg-black/25 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-linear"
        style={{
          width: `${pct}%`,
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}CC`,
        }}
      />
    </div>
  );
}

// ── Option card ───────────────────────────────────────────────────────────
function OptionCard({
  option,
  revealed,
  selectedId,
  correctId,
  onSelect,
}: {
  option: TriviaOption;
  revealed: boolean;
  selectedId: string | null;
  correctId: string;
  onSelect: (id: string) => void;
}) {
  const isSelected = selectedId === option.option_id;
  const isCorrect = option.option_id === correctId;

  let container = "border-white/40 bg-white/95";
  let nameClass = "text-gray-800";
  let photoRing = "";
  let badge: React.ReactNode = null;

  if (revealed) {
    if (isCorrect) {
      container = "border-emerald-400 bg-emerald-50";
      nameClass = "text-emerald-800 font-black";
      photoRing = "ring-2 ring-emerald-400";
      badge = (
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg ring-2 ring-white z-10">
          <svg viewBox="0 0 12 12" className="w-3.5 h-3.5" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      );
    } else if (isSelected) {
      container = "border-red-400 bg-red-50";
      nameClass = "text-red-800";
      photoRing = "ring-2 ring-red-400";
      badge = (
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg ring-2 ring-white z-10">
          <svg viewBox="0 0 12 12" className="w-4 h-4" fill="none">
            <path
              d="M3 3l6 6M9 3l-6 6"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
      );
    } else {
      container = "border-white/20 bg-white/40 opacity-50";
      nameClass = "text-gray-600";
    }
  }

  return (
    <button
      type="button"
      disabled={revealed}
      onClick={() => onSelect(option.option_id)}
      className={`relative flex flex-row items-center gap-2.5 px-2.5 py-2 rounded-2xl border-2 transition-all duration-200 select-none text-left
        ${container}
        ${!revealed ? "active:scale-[0.97] hover:bg-white hover:border-white/70 cursor-pointer shadow-md" : "cursor-default"}
      `}
    >
      {badge}
      <div
        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 transition-all ${photoRing}`}
      >
        {option.image_url ? (
          <img
            src={option.image_url}
            alt={option.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-xl">👤</span>
        )}
      </div>
      <p
        className={`text-[10px] sm:text-[11px] font-bold leading-tight uppercase tracking-wide line-clamp-3 flex-1 ${nameClass}`}
      >
        {option.name}
      </p>
    </button>
  );
}

// ── Collapsible explanation ───────────────────────────────────────────────
function Explanation({ text }: { text: string }) {
  const isLong = text.length > EXPLANATION_COLLAPSE_THRESHOLD;
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <p
        className={`text-foreground text-sm leading-relaxed transition-all ${isLong && !expanded ? "line-clamp-3" : ""}`}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp size={13} />
              Mostrar menos
            </>
          ) : (
            <>
              Ver más <ChevronDown size={13} />
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ── Results screen ────────────────────────────────────────────────────────
function ResultsScreen({
  correctCount,
  total,
  stars,
  xpGained,
  score,
  levelId,
  questions,
  regionColor,
  onExit,
}: {
  correctCount: number;
  total: number;
  stars: 0 | 1 | 2 | 3;
  xpGained: number;
  score: number;
  levelId: number;
  questions: TriviaQuestion[];
  regionColor: string;
  onExit: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  const isPerfect = stars === 3;

  // Pick a "featured" question — prefer one with an image
  const featuredQuestion = useMemo(() => {
    const withImg = questions.filter((q) => q.options.some((o) => o.image_url));
    return withImg[0] ?? questions[0];
  }, [questions]);

  // Detect mobile
  const isMobile =
    typeof navigator !== "undefined" &&
    /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setSharing(true);

    try {
      // 1. Volvemos a importar html-to-image
      const { toPng } = await import("html-to-image");

      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#1c1917",
        // 2. Restauramos el filtro
        filter: (node) => {
          // Excluir elementos <link> y <style> del documento principal
          // Esto evita que lea el CSS global donde están los colores no soportados
          if (node.tagName === "LINK" || node.tagName === "STYLE") return false;
          return true;
        },
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], "votabien-resultado.png", {
        type: "image/png",
      });

      const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);

      if (isMobile && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "¡Completé un nivel en VotaBien Perú!",
          text: `Obtuve ${score} puntos. ¿Sabes más que yo sobre política peruana? 🇵🇪`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "votabien-resultado.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Share error:", err);
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div
      className="flex flex-col h-full overflow-y-auto px-5 py-6 gap-5 animate-in fade-in duration-300"
      style={{ scrollbarWidth: "none" }}
    >
      {/* Arcade share card — always visible, share button disabled if not perfect */}
      <div className="flex flex-col gap-3 flex-shrink-0">
        <div
          style={{ width: "100%", display: "flex", justifyContent: "center" }}
        >
          <div ref={cardRef} style={{ width: 360 }}>
            <IncaArcadeCard
              score={score}
              stars={stars}
              currentLevel={levelId}
              regionTheme={getRegionByLevel(levelId)}
              featuredQuestion={featuredQuestion}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleShare}
          disabled={!isPerfect || sharing}
          className="w-auto py-3.5 rounded-2xl font-extrabold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#fbbf24", color: "#000" }}
        >
          <Share2 size={16} />
          {!isPerfect
            ? "Solo disponible con puntaje perfecto"
            : sharing
              ? "Preparando tarjeta..."
              : isMobile
                ? "Compartir resultado"
                : "Descargar imagen"}
        </button>
      </div>

      {/* Continue / back button */}
      <button
        type="button"
        onClick={onExit}
        className="w-full py-4 rounded-2xl font-extrabold text-white text-base uppercase tracking-widest shadow-md transition-all hover:opacity-90 active:scale-[0.98] flex-shrink-0"
        style={{ backgroundColor: regionColor }}
      >
        {stars >= 2 ? "¡Continuar!" : "Volver al mapa"}
      </button>

      <div className="h-2 flex-shrink-0" />
    </div>
  );
}

// ------
function VideoSourceLink({ url }: { url: string }) {
  const isVideo =
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("tiktok.com");

  if (isVideo) {
    return (
      <VideoDialog
        url={url}
        trigger={
          <Button type="button" className="relative group overflow-visible">
            <Play size={13} className="fill-primary animate-bounce" />
            Ver video
          </Button>
        }
      />
    );
  }

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 decoration-muted-foreground/40"
    >
      Ver fuente de la noticia
      <ExternalLink size={12} />
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────
interface TriviaGameViewProps {
  levelId: number;
  onExit: () => void;
  onComplete?: () => void;
}

export function TriviaGameView({
  levelId,
  onExit,
  onComplete,
}: TriviaGameViewProps) {
  const { getLevels, completeLevel, rawQuestions } = useGameStore();

  const level = useMemo(
    () => getLevels().find((l) => l.id === levelId) ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawQuestions, levelId],
  );

  const theme = getRegionByLevel(levelId);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [phase, setPhase] = useState<"question" | "results">("question");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLeftRef = useRef(SECONDS_PER_QUESTION);
  const revealedRef = useRef(false);

  const questions = level?.questions ?? [];
  const question: TriviaQuestion | undefined = questions[currentIdx];
  const isLastQ = currentIdx === questions.length - 1;

  // ── Timer ───────────────────────────────────────────────────────────────
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
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
    if (phase === "question") startTimer();
    return stopTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, phase]);

  // ── Reveal ───────────────────────────────────────────────────────────────
  const doReveal = (chosenId: string | null) => {
    stopTimer();
    const isCorrect =
      chosenId !== null && chosenId === question?.correct_answer_id;
    const gained = scoreForAnswer(timeLeftRef.current, isCorrect);
    setSelectedId(chosenId);
    setRevealed(true);
    setScore((s) => s + gained);
    setStreak((str) => (isCorrect ? str + 1 : 0));
    setAnswers((a) => [...a, isCorrect]);
  };

  const handleSelect = (id: string) => {
    if (revealed || revealedRef.current) return;
    revealedRef.current = true;
    doReveal(id);
  };

  const handleNext = () => {
    if (isLastQ) {
      const correct = answers.filter(Boolean).length;
      const stars = calcStars(correct, questions.length);
      const xp = calcXp(stars);
      completeLevel(levelId, stars, xp);
      onComplete?.();
      setPhase("results");
    } else {
      setCurrentIdx((i) => i + 1);
      setSelectedId(null);
      setRevealed(false);
    }
  };

  if (!level) {
    return (
      <div className="fixed inset-0 z-[60] bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Cargando nivel...</p>
      </div>
    );
  }

  const correctCount = answers.filter(Boolean).length;
  const isCorrectAns = selectedId === question?.correct_answer_id;
  const isTimeout = revealed && selectedId === null;
  const feedbackColor = isTimeout
    ? "#9ca3af"
    : isCorrectAns
      ? "#22c55e"
      : "#ef4444";
  const feedbackLabel = isTimeout
    ? "¡Se acabó el tiempo!"
    : isCorrectAns
      ? "¡Correcto!"
      : "Incorrecto";
  const feedbackTextClass = isTimeout
    ? "text-muted-foreground"
    : isCorrectAns
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div
      className={cn(
        // Mobile — full screen
        "fixed inset-0 z-20 flex flex-col",
        // Desktop — panel centrado respetando navbar
        "lg:inset-auto lg:top-14 lg:bottom-0 lg:left-1/2 lg:-translate-x-1/2 lg:w-[480px] lg:rounded-t-2xl lg:overflow-hidden",
      )}
      style={{
        background: `linear-gradient(160deg, ${theme.colors.backgroundTop} 0%, ${theme.colors.backgroundBottom} 100%)`,
      }}
    >
      {phase === "results" ? (
        <ResultsScreen
          correctCount={correctCount}
          total={questions.length}
          stars={calcStars(correctCount, questions.length)}
          xpGained={calcXp(calcStars(correctCount, questions.length))}
          score={score}
          levelId={levelId}
          questions={questions}
          regionColor={theme.colors.primary}
          onExit={onExit}
        />
      ) : (
        <div className="flex flex-col h-full">
          {/* ── Header ── */}
          <div
            className="flex-shrink-0 px-3 sm:px-4 flex flex-col gap-2"
            style={{ paddingTop: "max(0.875rem, env(safe-area-inset-top))" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onExit}
                  className="w-8 h-8 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center hover:bg-black/35 active:scale-90 transition-all"
                >
                  <X size={15} color="rgba(255,255,255,0.95)" />
                </button>
                <span
                  className="text-white text-xs font-black uppercase tracking-wider"
                  style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
                >
                  {currentIdx + 1} / {questions.length}
                </span>
                {streak >= 2 && (
                  <div className="flex items-center gap-1 bg-amber-500/25 border border-amber-400/40 px-2 py-0.5 rounded-full animate-in fade-in duration-200">
                    <Zap size={11} fill="#fbbf24" className="text-amber-400" />
                    <span className="text-amber-300 text-xs font-black">
                      {streak}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p
                  className="text-white/60 text-[9px] font-black uppercase tracking-widest"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
                >
                  Puntos
                </p>
                <p
                  className="text-white font-black text-lg leading-none tabular-nums"
                  style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
                >
                  {score}
                </p>
              </div>
            </div>
            <TimerBar timeLeft={timeLeft} total={SECONDS_PER_QUESTION} />
          </div>

          {/* ── Scrollable body ── */}
          <div
            className="flex-1 overflow-y-auto px-3 sm:px-4 pt-3 pb-2 flex flex-col gap-2.5 sm:gap-3"
            style={{ scrollbarWidth: "none" }}
          >
            {/* Question card */}
            <div className="bg-black/25 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-white/15 flex-shrink-0 shadow-lg">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white/90 text-[9px] font-black uppercase tracking-widest mb-2">
                {question?.category}
              </span>
              <p
                className="text-white font-semibold text-sm sm:text-[15px] leading-snug text-center"
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
              >
                ❝{question?.quote}❞
              </p>
            </div>

            {/* Options */}
            {question && (
              <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                {question.options.map((opt: TriviaOption) => (
                  <OptionCard
                    key={opt.option_id}
                    option={opt}
                    revealed={revealed}
                    selectedId={selectedId}
                    correctId={question.correct_answer_id}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}

            {/* Feedback panel */}
            {revealed && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/10 animate-in slide-in-from-bottom-3 duration-200 flex-shrink-0">
                <div
                  className="h-1 w-full"
                  style={{ backgroundColor: feedbackColor }}
                />
                <div className="p-3.5 sm:p-4 flex flex-col gap-3">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: feedbackColor }}
                      >
                        {isTimeout ? (
                          <span className="text-white text-sm font-black">
                            !
                          </span>
                        ) : isCorrectAns ? (
                          <Check className="text-white size-5" />
                        ) : (
                          <X className="text-white size-5" />
                        )}
                      </div>
                      <span
                        className={`font-black text-base ${feedbackTextClass}`}
                      >
                        {feedbackLabel}
                      </span>
                    </div>

                    {question?.source_url && (
                      <VideoSourceLink url={question.source_url} />
                    )}
                  </div>

                  {question?.explanation && (
                    <div className="bg-muted/70 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <BookOpen size={11} className="text-muted-foreground" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                          Contexto
                        </span>
                      </div>
                      <Explanation text={question.explanation} />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex-shrink-0 h-1" />
          </div>

          {/* ── Sticky next button ── */}
          {revealed && (
            <div
              className="flex-shrink-0 px-3 sm:px-4 pt-2 border-t border-white/10 bg-black/15 backdrop-blur-md animate-in slide-in-from-bottom-1 duration-150"
              style={{
                paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
              }}
            >
              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3.5 rounded-2xl font-extrabold text-white text-sm uppercase tracking-widest shadow-lg transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  backgroundColor: theme.colors.primary,
                  textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }}
              >
                {isLastQ ? "Ver resultados" : "Siguiente pregunta"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
