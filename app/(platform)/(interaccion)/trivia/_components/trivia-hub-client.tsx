"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TriviaTopic, TriviaAudience } from "@/interfaces/trivia";
import { TriviaQuestion, GamePlayMode } from "@/interfaces/game-types";
import { useGameStore } from "@/store/game-store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaDescription,
  CredenzaFooter,
} from "@/components/ui/credenza";
import {
  Compass,
  Sparkles,
  Trophy,
  ArrowRight,
  Play,
  Map as MapIcon,
  Zap,
} from "lucide-react";
import TriviaMapClient from "./trivia-map-client";
import { TriviaQuickQuizView } from "./trivia-quick-quiz-view";
import { renderTopicIcon, renderAudienceIcon } from "@/lib/trivia-icons";

export function TriviaHubClient({
  initialTopics,
  initialAudiences,
  initialQuestions,
}: {
  initialTopics: TriviaTopic[];
  initialAudiences: TriviaAudience[];
  initialQuestions: TriviaQuestion[];
}) {
  const searchParams = useSearchParams();
  const {
    currentTopic,
    currentAudience,
    currentMode,
    setCurrentTopic,
    setCurrentAudience,
    setMode,
    setQuestions,
    getTopicProgress,
    userXp,
  } = useGameStore();

  const [selectedAudienceSlug, setSelectedAudienceSlug] =
    useState<string>("all");
  const [activeModalTopic, setActiveModalTopic] = useState<TriviaTopic | null>(
    null,
  );
  const [isPlaying, setIsPlaying] = useState(false);

  // Manejo de Deep Links (ej. /trivia?topic=constitucion-derechos&mode=quick)
  useEffect(() => {
    const topicParam = searchParams.get("topic");
    const modeParam = searchParams.get("mode");
    const audienceParam = searchParams.get("audience");

    if (audienceParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedAudienceSlug(audienceParam);
      const foundAud = initialAudiences.find(
        (a) => a.slug === audienceParam || a.id === audienceParam,
      );
      if (foundAud) setCurrentAudience(foundAud);
    }

    if (topicParam) {
      const foundTopic = initialTopics.find(
        (t) => t.slug === topicParam || t.id === topicParam,
      );
      if (foundTopic) {
        setCurrentTopic(foundTopic);
        if (modeParam === "quick" || modeParam === "map") {
          setMode(modeParam === "quick" ? "QUICK_QUIZ" : "MAP");
          setIsPlaying(true);
        } else {
          setActiveModalTopic(foundTopic);
        }
      }
    }
  }, [
    searchParams,
    initialTopics,
    initialAudiences,
    setCurrentTopic,
    setCurrentAudience,
    setMode,
  ]);

  // Filtrado de Temas por Audiencia seleccionada
  const filteredTopics = useMemo(() => {
    if (selectedAudienceSlug === "all") return initialTopics;
    return initialTopics.filter((t) =>
      t.audiences?.some(
        (a) => a.slug === selectedAudienceSlug || a.id === selectedAudienceSlug,
      ),
    );
  }, [initialTopics, selectedAudienceSlug]);

  // Preguntas filtradas para la sesión activa
  const sessionQuestions = useMemo(() => {
    if (!currentTopic) return initialQuestions;
    return initialQuestions.filter((q) => q.topic_id === currentTopic.id);
  }, [initialQuestions, currentTopic]);

  const handleStartGame = (topic: TriviaTopic, mode: GamePlayMode) => {
    setCurrentTopic(topic);
    setMode(mode);
    setQuestions(sessionQuestions);
    setActiveModalTopic(null);
    setIsPlaying(true);
  };

  // --- VISTA DE JUEGO ACTIVA ---
  if (isPlaying && currentTopic) {
    if (currentMode === "QUICK_QUIZ") {
      const quizQuestions = sessionQuestions.slice(0, 10);
      return (
        <div className="min-h-screen bg-background pt-2 pb-12">
          <TriviaQuickQuizView
            questions={
              quizQuestions.length > 0
                ? quizQuestions
                : initialQuestions.slice(0, 10)
            }
            topic={currentTopic}
            audience={currentAudience}
            onExit={() => setIsPlaying(false)}
          />
        </div>
      );
    }

    // Modo Mapa Aventura
    return (
      <div className="flex justify-center bg-background h-dvh lg:h-[calc(100dvh-56px)]">
        <div className="w-full" style={{ maxWidth: 480 }}>
          <TriviaMapClient
            initialQuestions={
              sessionQuestions.length > 0 ? sessionQuestions : initialQuestions
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Hero Header */}
      <div className="border-b bg-gradient-to-b from-muted/60 to-background pt-8 pb-8 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge className="bg-amber-500 hover:bg-amber-600 text-black font-black text-[11px] gap-1 shadow-sm">
                  <Sparkles size={12} /> TRIVIA & EDUCACIÓN CÍVICA
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
                Aprende, desafía y conoce el Perú 🇵🇪
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mt-1">
                Elige tu público objetivo y el tema que deseas explorar. Juega
                la aventura por niveles o pon a prueba tu rapidez con el modo
                taller.
              </p>
            </div>

            {/* XP Total */}
            <div className="flex items-center gap-3 bg-card border rounded-2xl p-3 sm:p-4 shadow-sm self-start">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Trophy size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">
                  Tu Experiencia
                </p>
                <p className="text-lg font-black text-amber-600 dark:text-amber-400 leading-none">
                  {userXp} XP
                </p>
              </div>
            </div>
          </div>

          {/* Filtros de Audiencia (Píldoras) */}
          <div className="pt-3 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              ¿Quién eres o qué buscas hoy?
            </p>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              <button
                type="button"
                onClick={() => setSelectedAudienceSlug("all")}
                className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 select-none ${
                  selectedAudienceSlug === "all"
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30"
                    : "bg-card border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                {renderAudienceIcon("all", { size: 14 })}
                <span>Todos los Temas</span>
              </button>

              {initialAudiences.map((aud) => {
                const isSelected = selectedAudienceSlug === aud.slug;
                return (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => setSelectedAudienceSlug(aud.slug)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 select-none ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30"
                        : "bg-card border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {renderAudienceIcon(aud.icon || aud.slug, { size: 14 })}
                    <span>{aud.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Grilla de Temas */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTopics.map((topic) => {
            const progress = getTopicProgress(topic.slug);
            const questionsInTopic = initialQuestions.filter(
              (q) => q.topic_id === topic.id,
            );

            return (
              <Card
                key={topic.id}
                className="group relative flex flex-col justify-between overflow-hidden border hover:border-primary/50 transition-all hover:shadow-xl bg-card/70 backdrop-blur-sm"
              >
                {/* Franja de Color Superior */}
                <div
                  className="h-2 w-full transition-all group-hover:h-2.5"
                  style={{ backgroundColor: topic.badge_color || "#3b82f6" }}
                />

                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                      style={{
                        backgroundColor: topic.badge_color || "#3b82f6",
                      }}
                    >
                      {renderTopicIcon(topic.icon, { size: 20 })}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {progress.highestUnlockedLevel > 1 && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-bold"
                        >
                          Nivel {progress.highestUnlockedLevel}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono"
                      >
                        {(topic.total_questions ?? questionsInTopic.length) ||
                          0}{" "}
                        preguntas
                      </Badge>
                    </div>
                  </div>

                  <CardTitle className="text-lg font-bold leading-snug mt-3 text-foreground group-hover:text-primary transition-colors">
                    {topic.title}
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed line-clamp-2">
                    {topic.description ||
                      "Explora este eje temático y fortalece tu cultura cívica."}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-3 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {topic.audiences?.map((aud) => (
                      <span
                        key={aud.id}
                        className="text-[10px] font-semibold bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1"
                      >
                        {renderAudienceIcon(aud.icon || aud.slug, { size: 11 })}
                        <span>{aud.name.split("/")[0].trim()}</span>
                      </span>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t flex items-center justify-between bg-muted/20">
                  <span className="text-xs text-muted-foreground font-medium">
                    {progress.topicXp > 0
                      ? `${progress.topicXp} XP ganados`
                      : "Comienza ahora"}
                  </span>

                  <Button
                    onClick={() => setActiveModalTopic(topic)}
                    size="sm"
                    className="gap-1.5 font-bold text-xs rounded-xl shadow"
                    style={{ backgroundColor: topic.badge_color || undefined }}
                  >
                    <Play size={13} fill="currentColor" /> Jugar{" "}
                    <ArrowRight size={13} />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modal de Selección de Modo al elegir Tema */}
      {activeModalTopic && (
        <Credenza
          open={!!activeModalTopic}
          onOpenChange={(open) => !open && setActiveModalTopic(null)}
        >
          <CredenzaContent className="sm:max-w-md p-6">
            <CredenzaHeader className="pb-2 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-1">
                <Compass size={26} />
              </div>
              <CredenzaTitle className="text-xl font-black">
                {activeModalTopic.title}
              </CredenzaTitle>
              <CredenzaDescription className="text-xs">
                Selecciona cómo deseas jugar esta trivia:
              </CredenzaDescription>
            </CredenzaHeader>

            <div className="grid grid-cols-1 gap-3 py-4">
              {/* Opción 1: Modo Aventura (Mapa) */}
              <button
                type="button"
                onClick={() => handleStartGame(activeModalTopic, "MAP")}
                className="p-4 rounded-2xl border-2 border-border/80 hover:border-primary bg-card hover:bg-primary/5 text-left transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <MapIcon size={18} />
                    </div>
                    <span className="font-bold text-sm text-foreground group-hover:text-primary">
                      Modo Aventura (Mapa)
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    Recomendado
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-10">
                  Recorre el mapa por regiones (Costa, Sierra, Selva) avanzando
                  nivel por nivel a tu propio ritmo.
                </p>
              </button>

              {/* Opción 2: Modo Desafío Rápido (Taller) */}
              <button
                type="button"
                onClick={() => handleStartGame(activeModalTopic, "QUICK_QUIZ")}
                className="p-4 rounded-2xl border-2 border-border/80 hover:border-amber-500 bg-card hover:bg-amber-500/5 text-left transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Zap size={18} />
                    </div>
                    <span className="font-bold text-sm text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400">
                      Desafío Rápido (10 Preguntas)
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] text-amber-600 border-amber-500/30"
                  >
                    Talleres & Clases
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-10">
                  10 preguntas aleatorias con temporizador estricto, ideal para
                  dinámicas grupales y competir por puntaje.
                </p>
              </button>
            </div>

            <CredenzaFooter className="pt-2">
              <Button
                variant="ghost"
                onClick={() => setActiveModalTopic(null)}
                className="w-full"
              >
                Cancelar
              </Button>
            </CredenzaFooter>
          </CredenzaContent>
        </Credenza>
      )}
    </div>
  );
}
