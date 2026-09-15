"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TriviaTopic, TriviaAudience } from "@/interfaces/trivia";
import { TriviaQuestion, GamePlayMode } from "@/interfaces/game-types";
import { useGameStore } from "@/store/game-store";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Map as MapIcon,
  Trophy,
  MapPin,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/components/ui/responsive-select";
import { getSavedUserLocation, saveUserLocation } from "@/lib/ubigeo-helpers";
import TriviaMapClient from "./trivia-map-client";
import { TriviaQuickQuizView } from "./trivia-quick-quiz-view";
import { getRegionByLevel } from "@/constants/regions-data";

export function TriviaHubClient({
  initialTopics,
  initialAudiences,
  initialQuestions,
  initialRegions = [],
}: {
  initialTopics: TriviaTopic[];
  initialAudiences: TriviaAudience[];
  initialQuestions: TriviaQuestion[];
  initialRegions?: { id: string; name: string; code: string }[];
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
    highestUnlockedLevel,
    getTopicProgress,
  } = useGameStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  // Filtrar para ERM 2026: excluir PERUANOS RESIDENTES EN EL EXTRANJERO / NACIONAL
  const availableRegions = useMemo(
    () =>
      initialRegions.filter(
        (r) =>
          r.code !== "PRE" &&
          !r.name.toUpperCase().includes("EXTRANJERO") &&
          !r.name.toUpperCase().includes("NACIONAL"),
      ),
    [initialRegions],
  );

  // Sincronizar con la ubicación guardada en la plataforma (compartida con /candidatos)
  useEffect(() => {
    const syncLocation = () => {
      const saved = getSavedUserLocation();
      if (saved?.department || saved?.departmentCode) {
        const match = availableRegions.find(
          (r) =>
            r.code === saved.departmentCode ||
            r.name.toUpperCase() === saved.department?.toUpperCase(),
        );
        if (match) {
          setSelectedRegionId(match.id);
        }
      }
    };

    syncLocation();

    if (typeof window !== "undefined") {
      window.addEventListener("votabien-location-changed", syncLocation);
      return () => {
        window.removeEventListener("votabien-location-changed", syncLocation);
      };
    }
  }, [availableRegions]);

  const selectedRegionObj = useMemo(
    () => availableRegions.find((r) => r.id === selectedRegionId),
    [availableRegions, selectedRegionId],
  );

  const handleRegionChange = (newRegionId: string) => {
    setSelectedRegionId(newRegionId);
    const regionObj = availableRegions.find((r) => r.id === newRegionId);
    if (regionObj) {
      saveUserLocation({
        department: regionObj.name,
        departmentCode: regionObj.code,
        districtId: regionObj.id,
        fullLabel: regionObj.name,
      });
    }
  };

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
          const baseList = initialQuestions.filter(
            (q) => q.topic_id === foundTopic.id,
          );
          const regionalList =
            foundTopic.is_regional && selectedRegionId
              ? baseList.filter(
                  (q) => q.electoral_district_id === selectedRegionId,
                )
              : [];
          const qList =
            regionalList.length > 0
              ? regionalList
              : baseList.length > 0
                ? baseList
                : initialQuestions;
          setQuestions(qList);
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
    selectedRegionId,
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
    const baseList = initialQuestions.filter((q) => q.topic_id === target.id);
    if (target.is_regional && selectedRegionId) {
      const regionalList = baseList.filter(
        (q) => q.electoral_district_id === selectedRegionId,
      );
      if (regionalList.length > 0) return regionalList;
    }
    return baseList;
  }, [initialQuestions, currentTopic, playableTopic, selectedRegionId]);

  const handleStartGame = (topic: TriviaTopic, mode: GamePlayMode) => {
    setCurrentTopic(topic);
    setMode(mode);
    const baseList = initialQuestions.filter((q) => q.topic_id === topic.id);
    let qList = baseList;
    if (topic.is_regional && selectedRegionId) {
      const regionalList = baseList.filter(
        (q) => q.electoral_district_id === selectedRegionId,
      );
      if (regionalList.length > 0) {
        qList = regionalList;
      }
    }
    setQuestions(qList.length > 0 ? qList : initialQuestions);
    setIsPlaying(true);
  };

  // Tema para el Desafío Regional Express (prioriza el eje regional o el tema jugable activo)
  const heroTopic = useMemo(() => {
    return (
      initialTopics.find((t) => t.is_regional) ||
      playableTopic ||
      initialTopics[0]
    );
  }, [initialTopics, playableTopic]);

  const currentTheme = useMemo(
    () => getRegionByLevel(highestUnlockedLevel || 1),
    [highestUnlockedLevel],
  );

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

  // --- VISTA INICIAL (EDITORIAL CÍVICO Y RETADOR) ---
  return (
    <div className="min-h-[calc(100vh-64px)] bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header con tipografía editorial y contraste */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.12] max-w-2xl">
              ¿Qué tanto conoces a quienes{" "}
              <span className="font-serif italic font-normal text-brand">
                quieren gobernar
              </span>{" "}
              tu región?
            </h1>

            {userXp > 0 && (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 font-mono font-bold text-xs shrink-0 self-start">
                <Trophy size={14} className="text-amber-500" />
                <span>{userXp} XP</span>
              </div>
            )}
          </div>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Preguntas reales basadas en debates oficiales, planes de gobierno y
            normas vigentes. Aprende qué facultades tienen tus autoridades y
            descubre qué proponen para tu territorio.
          </p>

          {/* Selector Territorial tipo pasaporte */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-1">
            <div className="relative inline-flex items-center w-full sm:w-auto">
              <ResponsiveSelect
                value={selectedRegionId || "ALL"}
                title="Selecciona tu región electoral"
                onValueChange={(val) => {
                  if (val === "ALL") {
                    setSelectedRegionId(null);
                  } else {
                    handleRegionChange(val);
                  }
                }}
              >
                <ResponsiveSelectTrigger className="h-10 sm:h-9 py-1.5 px-3.5 rounded-full border border-border/80 bg-card hover:bg-muted/40 text-xs shadow-2xs gap-2 transition-all cursor-pointer w-full sm:w-auto max-w-full select-none">
                  <MapPin className="h-3.5 w-3.5 text-brand shrink-0" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold shrink-0">
                    Región:
                  </span>
                  <span className="font-bold text-foreground truncate text-xs">
                    {selectedRegionObj
                      ? selectedRegionObj.name
                      : "Todas las regiones"}
                  </span>
                  <span className="text-muted-foreground/40 font-mono hidden sm:inline">
                    |
                  </span>
                  <span className="text-muted-foreground hover:text-foreground text-[11px] font-medium hidden sm:inline-flex items-center gap-1 shrink-0">
                    <RotateCcw className="h-3 w-3 text-muted-foreground" />
                    cambiar
                  </span>
                </ResponsiveSelectTrigger>
                <ResponsiveSelectContent>
                  <ResponsiveSelectItem value="ALL">
                    🇵🇪 Todas las regiones (Nacional)
                  </ResponsiveSelectItem>
                  {availableRegions.map((region) => (
                    <ResponsiveSelectItem key={region.id} value={region.id}>
                      {region.name}
                    </ResponsiveSelectItem>
                  ))}
                </ResponsiveSelectContent>
              </ResponsiveSelect>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Las preguntas se calibran con autoridades y temas de tu
              territorio.
            </span>
          </div>
        </div>

        {/* TARJETA HERO ASIMÉTRICA: DESAFÍO REGIONAL EXPRESS */}
        {heroTopic && (
          <div className="relative overflow-hidden rounded-3xl bg-[#181615] dark:bg-card border border-neutral-800 dark:border-border/80 p-6 sm:p-8 lg:p-10 text-white shadow-xl">
            {/* Filigrana número 5 en marca de agua de fondo */}
            <div
              aria-hidden="true"
              className="hidden sm:block absolute -right-2 -bottom-10 select-none pointer-events-none text-white/[0.04] dark:text-foreground/[0.04] font-serif font-black text-[170px] sm:text-[220px] leading-none"
            >
              5
            </div>

            <div className="relative z-10 space-y-4">
              {/* Eyebrow */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-400 dark:text-muted-foreground">
                  Desafío Cívico Rápido ·{" "}
                  <span className="text-amber-400 dark:text-brand font-black">
                    {selectedRegionObj ? selectedRegionObj.name : "Nacional"}
                  </span>
                </span>
              </div>

              {/* Titular */}
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight max-w-xl">
                Pon a prueba tu criterio electoral.{" "}
                <span className="font-serif italic font-normal text-amber-200/90 dark:text-amber-300/90 block sm:inline">
                  ¿Cuánto sabes de tus candidatos y autoridades?
                </span>
              </h2>

              {/* Subtítulo amigable */}
              <p className="text-xs sm:text-sm text-neutral-300/90 dark:text-neutral-400 max-w-xl leading-relaxed">
                Preguntas dinámicas con verificación oficial: competencias de
                alcaldes y gobernadores, propuestas reales y declaraciones en
                video.
              </p>

              {/* Fila de metadatos + Botón de acción */}
              <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-5 border-t border-white/10 dark:border-border/60">
                <div className="grid grid-cols-3 gap-3 sm:gap-8 divide-x divide-white/10 dark:divide-border/40">
                  <div>
                    <p className="text-sm sm:text-base font-black font-mono text-white tabular-nums">
                      ~2 MIN
                    </p>
                    <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 dark:text-muted-foreground">
                      Duración
                    </p>
                  </div>
                  <div className="pl-3 sm:pl-8">
                    <p className="text-sm sm:text-base font-black font-mono text-white">
                      V/F Y TEST
                    </p>
                    <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 dark:text-muted-foreground">
                      Formato
                    </p>
                  </div>
                  <div className="pl-3 sm:pl-8">
                    <p className="text-sm sm:text-base font-black font-mono text-white">
                      OFICIAL
                    </p>
                    <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 dark:text-muted-foreground">
                      Fuentes
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartGame(heroTopic, "QUICK_QUIZ")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl bg-white text-neutral-950 hover:bg-neutral-100 dark:bg-foreground dark:text-background active:scale-[0.98] font-black text-xs sm:text-sm transition-all shadow-md group cursor-pointer shrink-0"
                >
                  <span>Iniciar trivia rápida</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODO MAPA AVENTURA (CAMPAÑA 25 NIVELES) */}
        <button
          type="button"
          onClick={() => handleStartGame(playableTopic, "MAP")}
          className="w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 transition-all text-left group cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-muted/80 border border-border/60 flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:border-foreground/20 shrink-0 transition-colors">
              <MapIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-foreground">
                  Mapa Aventura Regional
                </p>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border/70 text-muted-foreground">
                  NIVEL {highestUnlockedLevel || 1} DE 25
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Recorre el Perú respondiendo sobre funciones públicas. Hito
                actual: {currentTheme?.name || "Costa"}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <span className="hidden sm:inline text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
              Explorar mapa
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
          </div>
        </button>

        {/* EJES TEMÁTICOS */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground font-semibold">
              Ejes temáticos · Retos cívicos
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {initialTopics.length} módulos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {initialTopics.map((topic, idx) => {
              const topicIndexStr = String(idx + 1).padStart(2, "0");
              const baseQuestions = initialQuestions.filter(
                (q) => q.topic_id === topic.id,
              );
              const regionalQuestions =
                topic.is_regional && selectedRegionId
                  ? baseQuestions.filter(
                      (q) => q.electoral_district_id === selectedRegionId,
                    )
                  : [];

              const hasQuestions =
                (topic.total_questions && topic.total_questions > 0) ||
                baseQuestions.length > 0;

              const questionCount =
                topic.is_regional && selectedRegionId
                  ? regionalQuestions.length
                  : baseQuestions.length || topic.total_questions || 0;

              const progress = getTopicProgress?.(topic.slug);
              const quizzesCompleted = progress?.quizzesCompleted || 0;
              const progressPercent = hasQuestions
                ? Math.min(
                    100,
                    Math.round(
                      (quizzesCompleted /
                        Math.max(1, Math.ceil(questionCount / 5))) *
                        100,
                    ),
                  )
                : 0;

              if (hasQuestions) {
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleStartGame(topic, "QUICK_QUIZ")}
                    className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:border-brand/50 hover:shadow-xs transition-all text-left flex flex-col justify-between cursor-pointer group space-y-4"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-brand">
                          {topicIndexStr}
                        </span>
                        {topic.is_regional && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4 border-brand/40 text-brand gap-0.5"
                          >
                            <MapPin size={9} />
                            Regional
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug group-hover:text-brand transition-colors">
                        {topic.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {topic.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/60">
                      <span className="font-mono text-[10px] uppercase text-muted-foreground font-semibold shrink-0">
                        {topic.is_regional && selectedRegionId
                          ? `${questionCount} en ${selectedRegionObj?.name || "región"}`
                          : `${questionCount} preguntas`}
                      </span>
                      <div className="h-1.5 flex-1 max-w-[120px] sm:max-w-[150px] bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(15, progressPercent)}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground tabular-nums shrink-0">
                        {progressPercent > 0 ? `${progressPercent}%` : "0%"}
                      </span>
                    </div>
                  </button>
                );
              }

              return (
                <div
                  key={topic.id}
                  className="p-4 sm:p-5 rounded-2xl border border-border/50 bg-muted/15 opacity-75 text-left flex flex-col justify-between space-y-4 select-none"
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        {topicIndexStr}
                      </span>
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-muted border border-border/60 text-muted-foreground uppercase tracking-wider">
                        Pronto
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-medium text-foreground/80 leading-snug">
                      {topic.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {topic.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/40">
                    <span className="font-mono text-[10px] uppercase text-muted-foreground/70 font-semibold shrink-0">
                      En preparación
                    </span>
                    <div className="h-1.5 flex-1 max-w-[120px] sm:max-w-[150px] rounded-full overflow-hidden bg-muted/70 opacity-60">
                      <div
                        className="h-full w-full"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(45deg, transparent, transparent 3px, currentColor 3px, currentColor 6px)",
                          color: "var(--muted-foreground)",
                        }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground/50 shrink-0">
                      —
                    </span>
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
