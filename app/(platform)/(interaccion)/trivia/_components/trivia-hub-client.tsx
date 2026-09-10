"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TriviaTopic, TriviaAudience } from "@/interfaces/trivia";
import { TriviaQuestion, GamePlayMode } from "@/interfaces/game-types";
import { useGameStore } from "@/store/game-store";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Map as MapIcon, Zap, Trophy, Lock } from "lucide-react";
import TriviaMapClient from "./trivia-map-client";
import { TriviaQuickQuizView } from "./trivia-quick-quiz-view";
import { renderTopicIcon } from "@/lib/trivia-icons";

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
    userXp,
  } = useGameStore();

  const [isPlaying, setIsPlaying] = useState(false);

  // Manejo de Deep Links (ej. /trivia?topic=que-hace-tu-autoridad&mode=quick)
  useEffect(() => {
    const topicParam = searchParams.get("topic");
    const modeParam = searchParams.get("mode");
    const audienceParam = searchParams.get("audience");

    if (audienceParam) {
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
          const mode = modeParam === "quick" ? "QUICK_QUIZ" : "MAP";
          setMode(mode);
          const qList = initialQuestions.filter(
            (q) => q.topic_id === foundTopic.id,
          );
          setQuestions(qList.length > 0 ? qList : initialQuestions);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setIsPlaying(true);
        }
      }
    }
  }, [
    searchParams,
    initialTopics,
    initialAudiences,
    initialQuestions,
    setCurrentTopic,
    setCurrentAudience,
    setMode,
    setQuestions,
  ]);

  // Tema activo principal (con preguntas disponibles)
  const playableTopic = useMemo(() => {
    return (
      initialTopics.find(
        (t) =>
          (t.total_questions && t.total_questions > 0) ||
          initialQuestions.some((q) => q.topic_id === t.id),
      ) || initialTopics[0]
    );
  }, [initialTopics, initialQuestions]);

  // Preguntas para la sesión activa
  const sessionQuestions = useMemo(() => {
    const target = currentTopic || playableTopic;
    if (!target) return initialQuestions;
    return initialQuestions.filter((q) => q.topic_id === target.id);
  }, [initialQuestions, currentTopic, playableTopic]);

  const handleStartGame = (topic: TriviaTopic, mode: GamePlayMode) => {
    setCurrentTopic(topic);
    setMode(mode);
    const qList = initialQuestions.filter((q) => q.topic_id === topic.id);
    setQuestions(qList.length > 0 ? qList : initialQuestions);
    setIsPlaying(true);
  };

  // --- VISTA DE JUEGO ACTIVA ---
  if (isPlaying && (currentTopic || playableTopic)) {
    const active = currentTopic || playableTopic;

    if (currentMode === "QUICK_QUIZ") {
      const quizQuestions =
        sessionQuestions.length > 0
          ? sessionQuestions.slice(0, 10)
          : initialQuestions.slice(0, 10);

      return (
        <div className="min-h-screen bg-background pt-2 pb-12">
          <TriviaQuickQuizView
            questions={quizQuestions}
            topic={active}
            audience={currentAudience}
            onExit={() => setIsPlaying(false)}
          />
        </div>
      );
    }

    // Modo Mapa Aventura
    return (
      <div className="flex justify-center bg-background h-dvh lg:h-[calc(100dvh-56px)]">
        <div className="w-full relative" style={{ maxWidth: 480 }}>
          <TriviaMapClient
            initialQuestions={
              sessionQuestions.length > 0 ? sessionQuestions : initialQuestions
            }
            onExit={() => setIsPlaying(false)}
          />
        </div>
      </div>
    );
  }

  // --- VISTA INICIAL (LOBBY MINIMALISTA Y DIRECTO) ---
  return (
    <div className="min-h-[calc(100vh-64px)] bg-background text-foreground py-6 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header simple y directo */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Trivia Cívica 2026
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Pon a prueba si sabes qué puede hacer tu alcalde o gobernador.
            </p>
          </div>

          {userXp > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs shrink-0">
              <Trophy size={14} />
              <span>{userXp} XP</span>
            </div>
          )}
        </div>

        {/* ACCIONES PRINCIPALES (Visible inmediatamente en mobile) */}
        {playableTopic && (
          <div className="space-y-3">
            {/* Botón 1: Desafío Express (Principal) */}
            <button
              type="button"
              onClick={() => handleStartGame(playableTopic, "QUICK_QUIZ")}
              className="w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-sm group cursor-pointer"
            >
              <div className="flex items-center gap-3.5 text-left">
                <div className="w-11 h-11 rounded-xl bg-primary-foreground/15 flex items-center justify-center text-primary-foreground shrink-0">
                  <Zap size={22} className="fill-current" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-black leading-tight">
                    Desafío Rápido
                  </div>
                  <div className="text-xs opacity-90 mt-0.5">
                    10 preguntas directas · 2 minutos
                  </div>
                </div>
              </div>
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform shrink-0"
              />
            </button>

            {/* Botón 2: Modo Mapa */}
            <button
              type="button"
              onClick={() => handleStartGame(playableTopic, "MAP")}
              className="w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl border border-border bg-card hover:bg-muted/40 text-foreground transition-all group cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-3.5 text-left">
                <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:text-foreground shrink-0">
                  <MapIcon size={20} />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold leading-tight">
                    Modo Mapa Aventura
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Avanza nivel por nivel por regiones del Perú
                  </div>
                </div>
              </div>
              <ArrowRight
                size={18}
                className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all shrink-0"
              />
            </button>
          </div>
        )}

        {/* LISTADO COMPACTO DE EJES */}
        <div className="space-y-3 pt-4 border-t border-border/70">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Ejes temáticos
            </h2>
            <span className="text-[11px] text-muted-foreground">4 módulos</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {initialTopics.map((topic) => {
              const hasQuestions =
                (topic.total_questions && topic.total_questions > 0) ||
                initialQuestions.some((q) => q.topic_id === topic.id);

              if (hasQuestions) {
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleStartGame(topic, "QUICK_QUIZ")}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 text-xs font-bold"
                        style={{
                          backgroundColor: topic.badge_color || "#0284c7",
                        }}
                      >
                        {renderTopicIcon(topic.icon, { size: 16 })}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {topic.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {topic.description}
                        </p>
                      </div>
                    </div>

                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 text-[10px] font-bold shrink-0 ml-2">
                      14 preguntas
                    </Badge>
                  </button>
                );
              }

              return (
                <div
                  key={topic.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 opacity-60 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 text-xs"
                      style={{
                        backgroundColor: topic.badge_color || "#6b7280",
                      }}
                    >
                      {renderTopicIcon(topic.icon, { size: 16 })}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {topic.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {topic.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground shrink-0 ml-2">
                    <Lock size={11} />
                    <span>Pronto</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
