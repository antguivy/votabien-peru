"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  XCircle,
  CheckCircle2,
  RotateCcw,
  Share2,
  Zap,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { TriviaQuestion } from "../_lib/data";
import { toast } from "sonner";
import { TriviaShareCard, type HighlightedQuestion } from "./trivia-share-card";
import { toCanvas } from "html-to-image";

interface TriviaGameEngineProps {
  questions: TriviaQuestion[];
}

type GameState = "intro" | "playing" | "finished";

const GAME_MODES = [
  { label: "Rápido", count: 5, color: "bg-blue-500" },
  { label: "Estándar", count: 10, color: "bg-green-500" },
  { label: "Maratón", count: 20, color: "bg-purple-500" },
];

export function TriviaGameEngine({
  questions: allQuestions,
}: TriviaGameEngineProps) {
  const [gameState, setGameState] = useState<GameState>("intro");
  const [activeQuestions, setActiveQuestions] = useState<TriviaQuestion[]>([]);

  // --- Stats del Juego ---
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // --- Lógica de Ronda ---
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctlyAnsweredQuestions, setCorrectlyAnsweredQuestions] = useState<
    HighlightedQuestion[]
  >([]);

  // --- Refs para Compartir ---
  const shareCardRef = useRef<HTMLDivElement>(null);
  const gallitoRef = useRef<HTMLDivElement>(null);

  // Ref para el elemento de video (Gallito)
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const isProcessingRef = useRef(false);

  // ==========================================
  // PRE-CARGA DEL VIDEO
  // ==========================================
  useEffect(() => {
    const vid = document.createElement("video");
    vid.src = "/gallito-rocas.mp4"; // Ruta del video en public
    vid.crossOrigin = "anonymous";
    vid.preload = "auto";
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;

    // Lo guardamos en la ref para usarlo después
    videoElementRef.current = vid;

    const stored = localStorage.getItem("votabien_trivia_highscore");
    if (stored) setHighScore(parseInt(stored));
  }, []);

  // ==========================================
  // LÓGICA DEL JUEGO
  // ==========================================
  const startGame = (count: number) => {
    const shuffled = [...allQuestions]
      .sort(() => Math.random() - 0.5)
      .slice(0, count);
    setActiveQuestions(shuffled);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setCurrentQIndex(0);
    setTimeLeft(15);
    setIsAnswered(false);
    setSelectedOption(null);
    isProcessingRef.current = false;
    setCorrectlyAnsweredQuestions([]);
    setGameState("playing");
  };

  const finishGame = useCallback(() => {
    setGameState("finished");
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("votabien_trivia_highscore", score.toString());
      confetti({ particleCount: 150, spread: 100 });
    }
  }, [score, highScore]);

  const nextQuestion = useCallback(() => {
    if (currentQIndex + 1 >= activeQuestions.length) {
      finishGame();
    } else {
      setCurrentQIndex((prev) => prev + 1);
      setTimeLeft(15);
      setIsAnswered(false);
      setSelectedOption(null);
      isProcessingRef.current = false;
    }
  }, [currentQIndex, activeQuestions.length, finishGame]);

  const handleTimeOut = useCallback(() => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsAnswered(true);
    setStreak(0);
    if (typeof navigator !== "undefined") navigator.vibrate?.([50, 100, 50]);
    setTimeout(nextQuestion, 2000);
  }, [nextQuestion]);

  const handleAnswer = (optionId: string) => {
    if (isAnswered || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setSelectedOption(optionId);
    setIsAnswered(true);
    const currentQ = activeQuestions[currentQIndex];
    const isCorrect = optionId === currentQ.correct_answer_id;

    if (isCorrect) {
      const selectedOptionDetails = currentQ.options.find(
        (opt) => opt.option_id === optionId,
      );

      if (selectedOptionDetails) {
        setCorrectlyAnsweredQuestions((prev) => [
          ...prev,
          {
            quote: currentQ.quote ?? "",
            category: currentQ.category ?? "",
            answerName: selectedOptionDetails.name,
            answerImage: selectedOptionDetails.image_candidate_url ?? undefined,
          },
        ]);
      }

      const timeBonus = Math.floor(timeLeft * 10);
      const streakBonus = streak * 50;
      const points = 100 + timeBonus + streakBonus;
      setScore((prev) => prev + points);
      setCorrectCount((prev) => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      if (typeof navigator !== "undefined") navigator.vibrate?.(50);
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#22c55e", "#ffffff"],
      });
    } else {
      setStreak(0);
      if (typeof navigator !== "undefined") navigator.vibrate?.([100, 50, 100]);
    }
    setTimeout(nextQuestion, 2000);
  };

  useEffect(() => {
    if (gameState !== "playing" || isAnswered) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, isAnswered, handleTimeOut]);

  // --- RANGO Y PREGUNTA DESTACADA ---
  const getRank = () => {
    const total = activeQuestions.length || 1;
    const percentage = (correctCount / total) * 100;
    if (percentage >= 90)
      return { title: "CONGRESISTA VITALICIO", label: "RANGO MÁXIMO" };

    if (percentage >= 70)
      return { title: "LÍDER DE OPINIÓN", label: "MUY ALTO" };

    if (percentage >= 50)
      return { title: "ANALISTA DE TWITTER", label: "INTERMEDIO" };

    if (percentage >= 30)
      return { title: "CIUDADANO PROMEDIO", label: "REGULAR" };

    return { title: "TURISTA ELECTORAL", label: "NOVATO" };
  };

  const featuredQuestion = useMemo(() => {
    if (correctlyAnsweredQuestions.length === 0) return null;
    const randomIndex = Math.floor(
      Math.random() * correctlyAnsweredQuestions.length,
    );
    return correctlyAnsweredQuestions[randomIndex];
  }, [gameState, correctlyAnsweredQuestions]);

  // ==========================================
  // HANDLE SHARE OPTIMIZADO (NATIVO & RÁPIDO)
  // ==========================================
  const handleShare = async () => {
    if (
      !shareCardRef.current ||
      !gallitoRef.current ||
      !videoElementRef.current
    ) {
      toast.error("Error: Elementos no listos.");
      return;
    }
    if (isSharing) return;

    setIsSharing(true);
    const toastId = toast.loading("Generando video...", {
      description: "Sincronizando pasos prohibidos...",
    });

    try {
      const video = videoElementRef.current;
      video.currentTime = 0;
      await video.play();

      // 1. Capturamos la tarjeta base (con su fondo grid y textos)
      const canvas = await toCanvas(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 1.5,
        backgroundColor: "#090910",
        width: 360,
        height: 640,
        skipAutoScale: true,
      });

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("No context");

      // Calcula espacio del Gallito
      const cardRect = shareCardRef.current.getBoundingClientRect();
      const gallitoRect = gallitoRef.current.getBoundingClientRect();

      // Factor de escala por si el canvas es más grande (pixelRatio)
      const scaleX = canvas.width / cardRect.width;
      const scaleY = canvas.height / cardRect.height;

      const gX = (gallitoRect.left - cardRect.left) * scaleX;
      const gY = (gallitoRect.top - cardRect.top) * scaleY;
      const gW = gallitoRect.width * scaleX;
      const gH = gallitoRect.height * scaleY;

      // Grabadora
      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported("video/mp4")
        ? "video/mp4"
        : "video/webm;codecs=vp9";

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const baseCardImage = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // 4. Loop de Animación
      const drawFrame = () => {
        if (mediaRecorder.state === "inactive") return;

        // Restaurar la tarjeta completa (tapa el frame anterior del video)
        ctx.putImageData(baseCardImage, 0, 0);

        // Dibujar Video en memoria temporal para procesar transparencia
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = gW;
        tempCanvas.height = gH;
        const tempCtx = tempCanvas.getContext("2d");

        if (tempCtx) {
          // Dibujar video redimensionado
          tempCtx.drawImage(video, 0, 0, gW, gH);

          // PROCESAR TRANSPARENCIA (Chroma Key)
          const frameData = tempCtx.getImageData(0, 0, gW, gH);
          const data = frameData.data;
          const l = data.length;

          for (let i = 0; i < l; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // SI EL VIDEO TIENE FONDO BLANCO USAM,OS
            if (r > 230 && g > 230 && b > 230) {
              data[i + 3] = 0; // Hacer transparente
            }

            // SI TIENE FONDO NEGRO USAMOS
            // if (r < 20 && g < 20 && b < 20) {
            //    data[i + 3] = 0;
            // }
          }

          tempCtx.putImageData(frameData, 0, 0);

          // Pegamosel gallito
          ctx.drawImage(tempCanvas, gX, gY);
        }

        requestAnimationFrame(drawFrame);
      };

      mediaRecorder.start();
      drawFrame();

      await new Promise((resolve) => setTimeout(resolve, 3500)); // 3.5 segundos

      mediaRecorder.stop();
      video.pause();

      await new Promise((resolve) => {
        mediaRecorder.onstop = resolve;
      });

      const blob = new Blob(chunks, { type: mimeType });
      const ext = mimeType.includes("mp4") ? "mp4" : "webm";
      const file = new File([blob], `votabien-score.${ext}`, {
        type: mimeType,
      });

      toast.dismiss(toastId);

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "VotaBien Perú",
          text: `¡Mi puntaje en VotaBien: ${score}! 🇵🇪`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `votabien-score.${ext}`;
        a.click();
        toast.success("Video descargado");
      }
    } catch (error) {
      console.error(error);
      toast.dismiss(toastId);
      toast.error("Error generando video");
    } finally {
      setIsSharing(false);
    }
  };

  // --- RENDERIZADO ---
  if (!allQuestions || allQuestions.length === 0) {
    return <div className="text-center p-10">Sin preguntas disponibles.</div>;
  }

  const rank = getRank();

  return (
    <>
      {/* TARJETA OCULTA DE GENERACIÓN */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <TriviaShareCard
          ref={shareCardRef}
          gallitoRef={gallitoRef}
          score={score}
          rankTitle={rank.title}
          highlightedQuestion={featuredQuestion}
          captureMode={true}
        />
      </div>

      {/* VISTA: INTRO */}
      {gameState === "intro" && (
        <div className="flex flex-col items-center justify-center space-y-8 max-w-md mx-auto px-6 text-center animate-in zoom-in-95 duration-500">
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter italic">
              POLITI<span className="text-primary">QUIZ</span>
            </h1>
            <p className="text-muted-foreground font-medium">
              Selecciona tu desafío
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 w-full">
            {GAME_MODES.map((mode) => (
              <button
                key={mode.count}
                onClick={() => startGame(mode.count)}
                className="relative group flex items-center justify-between p-4 rounded-2xl border-2 border-border hover:border-primary bg-card transition-all active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                      mode.color,
                    )}
                  >
                    {mode.count}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg leading-none">
                      {mode.label}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Preguntas
                    </p>
                  </div>
                </div>
                <Zap className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
              </button>
            ))}
          </div>
          <div className="bg-secondary/30 px-6 py-3 rounded-full border border-border/50">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Récord:{" "}
              <span className="text-foreground text-lg ml-1">
                {highScore} pts
              </span>
            </p>
          </div>
        </div>
      )}

      {/* VISTA: PLAYING */}
      {gameState === "playing" && activeQuestions[currentQIndex] && (
        <div className="mx-auto max-w-md h-[100dvh] flex flex-col justify-between py-6 px-4 md:h-auto md:min-h-[700px] md:justify-center md:gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                  Pregunta {currentQIndex + 1}/{activeQuestions.length}
                </span>
                <div className="flex items-center gap-1.5 text-primary">
                  <Zap className="w-4 h-4 fill-primary" />
                  <span className="font-bold text-lg">{streak}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                  Puntos
                </span>
                <span className="font-black text-2xl">{score}</span>
              </div>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: `${(timeLeft / 15) * 100}%` }}
                transition={{ ease: "linear", duration: 1 }}
                className={cn(
                  "h-full rounded-full transition-colors duration-500",
                  timeLeft > 5 ? "bg-primary" : "bg-red-500",
                )}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-8 relative perspective-1000">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeQuestions[currentQIndex].id}
                initial={{ opacity: 0, x: 100, rotate: 5 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                exit={{ opacity: 0, x: -100, rotate: -5 }}
                className="w-full bg-card border border-border/50 shadow-2xl rounded-[2rem] p-8 text-center flex flex-col items-center justify-center gap-6 min-h-[280px] relative overflow-hidden"
              >
                <Badge
                  variant="secondary"
                  className="absolute top-4 right-4 text-[10px] font-bold tracking-widest uppercase opacity-70"
                >
                  {activeQuestions[currentQIndex].category}
                </Badge>
                <h3 className="text-2xl md:text-3xl font-bold leading-tight relative z-10">
                  “{activeQuestions[currentQIndex].quote}”
                </h3>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                  ¿Quién lo dijo?
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            {activeQuestions[currentQIndex].options.map((option) => {
              const isSelected = selectedOption === option.option_id;
              const isCorrect =
                option.option_id ===
                activeQuestions[currentQIndex].correct_answer_id;
              let cardStateClass =
                "bg-secondary/40 border-transparent hover:bg-secondary/70";

              if (isAnswered) {
                if (isCorrect)
                  cardStateClass = "bg-green-500 text-white border-green-600";
                else if (isSelected && !isCorrect)
                  cardStateClass =
                    "bg-red-500 text-white border-red-600 opacity-90";
                else cardStateClass = "opacity-40 grayscale";
              }

              return (
                <button
                  key={option.option_id}
                  disabled={isAnswered}
                  onClick={() => handleAnswer(option.option_id)}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 group h-36 active:scale-95",
                    cardStateClass,
                  )}
                >
                  {isAnswered && isCorrect && (
                    <div className="absolute top-2 right-2 bg-white/20 p-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <div className="absolute top-2 right-2 bg-white/20 p-1 rounded-full">
                      <XCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <Avatar
                    className={cn(
                      "w-14 h-14 border-2 border-background bg-white",
                      isAnswered && isCorrect && "border-white/50",
                    )}
                  >
                    <AvatarImage
                      src={option.image_candidate_url || ""}
                      className="object-contain"
                    />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "text-xs font-bold text-center uppercase",
                      isAnswered && (isCorrect || isSelected)
                        ? "text-white"
                        : "text-foreground",
                    )}
                  >
                    {option.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA: FINISHED */}
      {gameState === "finished" && (
        <div className="flex flex-col items-center justify-center space-y-6 max-w-md mx-auto px-6 text-center animate-in slide-in-from-bottom-10 duration-500 h-[100dvh]">
          <div className="space-y-1">
            <h2 className="text-4xl font-black uppercase italic">
              ¡Resultado!
            </h2>
            <p className="text-lg font-medium text-muted-foreground">
              {rank.title}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex flex-col items-center justify-center py-5">
              <span className="text-xs font-bold text-primary uppercase mb-1">
                Puntaje
              </span>
              <span className="text-4xl font-black">{score}</span>
            </div>
            <div className="bg-card border border-border p-4 rounded-2xl flex flex-col items-center justify-center py-5">
              <span className="text-xs font-bold text-muted-foreground uppercase mb-1">
                Aciertos
              </span>
              <span className="text-4xl font-black">
                {correctCount}/{activeQuestions.length}
              </span>
            </div>
          </div>

          <div className="flex flex-col w-full gap-3 mt-4">
            <Button
              onClick={handleShare}
              disabled={isSharing}
              className="h-14 rounded-xl text-lg font-bold w-full bg-black text-white hover:bg-zinc-800 shadow-xl"
            >
              {isSharing ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Share2 className="w-5 h-5 mr-2" />
              )}
              Compartir Resultado (Video)
            </Button>
            <p className="text-xs text-muted-foreground">
              Se generará en 3 segundos
            </p>

            <Button
              variant="outline"
              onClick={() => setGameState("intro")}
              className="h-14 rounded-xl text-lg font-bold w-full"
            >
              <RotateCcw className="mr-2 w-5 h-5" /> Jugar de Nuevo
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
