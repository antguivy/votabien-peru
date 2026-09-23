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
  Compass,
  Zap,
  Clock,
} from "lucide-react";
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaBody,
} from "@/components/ui/credenza";
import {
  RegionSelectorCredenza,
  formatRegionLabel,
  isAllowedTriviaRegion,
} from "./region-selector-credenza";
import { getSavedUserLocation, saveUserLocation } from "@/lib/ubigeo-helpers";
import TriviaMapClient from "./trivia-map-client";
import { TriviaGameView } from "./trivia-game-view";
import {
  getRegionByLevel,
  getNaturalRegionByDepartment,
} from "@/constants/regions-data";
import { buildStratifiedMapQuestions } from "@/lib/level-hydrator";

export { formatRegionLabel };

function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Arma un set balanceado y barajado de 10 preguntas para el Desafío Cívico Express (ERM 2026).
 * Si hay región seleccionada:
 *   - Toma hasta 5 preguntas regionales de esa región (debates, candidatos, funciones).
 *   - Completa hasta 10 preguntas con preguntas de cultura y conocimiento cívico general.
 *   - Las mezcla aleatoriamente con Fisher-Yates para una experiencia dinámica.
 * Si no hay región seleccionada (Nacional):
 *   - Toma 10 preguntas generales barajadas.
 */
function buildExpressQuizQuestions(
  questions: TriviaQuestion[],
  topics: TriviaTopic[],
  selectedRegionId?: string | null,
): TriviaQuestion[] {
  const regionalTopicIds = new Set(
    topics.filter((t) => t.is_regional).map((t) => t.id),
  );

  // Preguntas de cultura cívica general (no regionales)
  const generalPool = questions.filter(
    (q) => !regionalTopicIds.has(q.topic_id || "") && !q.electoral_district_id,
  );

  // Preguntas territoriales de la región activa
  const regionalPool = selectedRegionId
    ? questions.filter((q) => q.electoral_district_id === selectedRegionId)
    : [];

  const shuffledGeneral = shuffleArray(generalPool);
  const shuffledRegional = shuffleArray(regionalPool);

  if (selectedRegionId && shuffledRegional.length > 0) {
    const regionalCount = Math.min(5, shuffledRegional.length);
    const selectedRegional = shuffledRegional.slice(0, regionalCount);

    const generalNeeded = Math.max(0, 10 - regionalCount);
    const selectedGeneral = shuffledGeneral.slice(0, generalNeeded);

    const combined = [...selectedRegional, ...selectedGeneral];
    if (combined.length < 10 && shuffledRegional.length > regionalCount) {
      const extraNeeded = 10 - combined.length;
      combined.push(
        ...shuffledRegional.slice(regionalCount, regionalCount + extraNeeded),
      );
    }

    return shuffleArray(combined);
  }

  // Modo Nacional sin región: 10 preguntas generales barajadas
  if (shuffledGeneral.length >= 10) {
    return shuffledGeneral.slice(0, 10);
  }

  return shuffleArray(questions).slice(0, 10);
}

/**
 * Arma un set de 10 preguntas barajadas para un eje temático específico
 */
function buildTopicQuizQuestions(
  topic: TriviaTopic,
  allQuestions: TriviaQuestion[],
  selectedRegionId?: string | null,
): TriviaQuestion[] {
  const baseList = allQuestions.filter((q) => q.topic_id === topic.id);
  let qList = baseList;
  if (topic.is_regional && selectedRegionId) {
    const regionalList = baseList.filter(
      (q) => q.electoral_district_id === selectedRegionId,
    );
    if (regionalList.length > 0) {
      qList = regionalList;
    }
  }
  const pool = qList.length > 0 ? qList : allQuestions;
  return shuffleArray(pool).slice(0, 10);
}

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
  const [isRegionCredenzaOpen, setIsRegionCredenzaOpen] = useState(false);
  const [showMapRouteModal, setShowMapRouteModal] = useState(false);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<
    TriviaQuestion[]
  >([]);
  const [activeQuizTopic, setActiveQuizTopic] = useState<TriviaTopic | null>(
    null,
  );

  // Filtrar para ERM 2026: acotar a las 13 regiones autorizadas
  const availableRegions = useMemo(
    () =>
      initialRegions
        .filter(
          (r) =>
            r.code !== "PRE" &&
            !r.name.toUpperCase().includes("EXTRANJERO") &&
            !r.name.toUpperCase().includes("NACIONAL") &&
            isAllowedTriviaRegion(r),
        )
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
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
          return;
        }
      }

      // Si no hay ubicación previa guardada ni en deep links, mostrar credenza de selección la primera vez
      if (
        typeof window !== "undefined" &&
        !localStorage.getItem("votabien_trivia_onboarding_shown")
      ) {
        const topicParam = searchParams.get("topic");
        if (!topicParam) {
          setIsRegionCredenzaOpen(true);
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
  }, [availableRegions, searchParams]);

  // Ocultar MobileBottomNav en móviles mientras el usuario está en partida o mapa
  useEffect(() => {
    if (isPlaying) {
      document.documentElement.classList.add("hide-mobile-bottom-nav");
      return () => {
        document.documentElement.classList.remove("hide-mobile-bottom-nav");
      };
    }
  }, [isPlaying]);

  const selectedRegionObj = useMemo(
    () => availableRegions.find((r) => r.id === selectedRegionId),
    [availableRegions, selectedRegionId],
  );

  const overrideRegion = useMemo(
    () => getNaturalRegionByDepartment(selectedRegionObj?.name),
    [selectedRegionObj?.name],
  );

  // Preguntas estratificadas para el Mapa Aventura (Slot 1: Eje 1, Slot 2: Eje 3, Slot 3: Debate Territorial)
  const mapQuestions = useMemo(() => {
    return buildStratifiedMapQuestions(
      initialQuestions,
      initialTopics,
      selectedRegionId,
    );
  }, [initialQuestions, initialTopics, selectedRegionId]);

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveQuizTopic(foundTopic);
        if (modeParam === "quick" || modeParam === "map") {
          const mode = modeParam === "quick" ? "QUICK_QUIZ" : "MAP";
          setMode(mode);
          if (mode === "QUICK_QUIZ") {
            const topicQs = buildTopicQuizQuestions(
              foundTopic,
              initialQuestions,
              selectedRegionId,
            );
            setActiveQuizQuestions(topicQs);
            setQuestions(topicQs);
          } else {
            setQuestions(mapQuestions);
          }
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
    mapQuestions,
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

  const handleStartExpressGame = () => {
    const expressQuestions = buildExpressQuizQuestions(
      initialQuestions,
      initialTopics,
      selectedRegionId,
    );
    const expressTopic: TriviaTopic = {
      id: "express-erm-2026",
      slug: "desafio-express-2026",
      title: selectedRegionObj
        ? `Desafío Cívico · ${selectedRegionObj.name}`
        : "Desafío Cívico Nacional",
      description:
        "Preguntas dinámicas sobre competencias de autoridades y propuestas para tu territorio.",
      is_active: true,
      order_index: 0,
      is_regional: Boolean(selectedRegionId),
    };

    setCurrentTopic(expressTopic);
    setActiveQuizTopic(expressTopic);
    setActiveQuizQuestions(expressQuestions);
    setMode("QUICK_QUIZ");
    setQuestions(expressQuestions);
    setIsPlaying(true);
  };

  const handleStartTopicGame = (topic: TriviaTopic, mode: GamePlayMode) => {
    setCurrentTopic(topic);
    setActiveQuizTopic(topic);
    setMode(mode);

    if (mode === "QUICK_QUIZ") {
      const topicQuestions = buildTopicQuizQuestions(
        topic,
        initialQuestions,
        selectedRegionId,
      );
      setActiveQuizQuestions(topicQuestions);
      setQuestions(topicQuestions);
    } else {
      setQuestions(mapQuestions);
    }

    setIsPlaying(true);
  };

  const handleExitGame = () => {
    setIsPlaying(false);
    setActiveQuizQuestions([]);
    setActiveQuizTopic(null);
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
    () => getRegionByLevel(highestUnlockedLevel || 1, overrideRegion),
    [highestUnlockedLevel, overrideRegion],
  );

  const totalMapLevels = useMemo(() => {
    return Math.max(1, Math.ceil(mapQuestions.length / 3));
  }, [mapQuestions.length]);

  // --- VISTA DE JUEGO ACTIVA ---
  if (isPlaying && (currentTopic || playableTopic || activeQuizTopic)) {
    const active = activeQuizTopic || currentTopic || playableTopic;

    if (currentMode === "QUICK_QUIZ") {
      const quizQuestions =
        activeQuizQuestions.length > 0
          ? activeQuizQuestions
          : sessionQuestions.slice(0, 10);

      return (
        <div className="flex justify-center bg-background h-dvh lg:h-[calc(100dvh-56px)]">
          <div className="w-full relative" style={{ maxWidth: 480 }}>
            <TriviaGameView
              mode="QUICK_QUIZ"
              questions={quizQuestions}
              topic={active}
              overrideRegion={overrideRegion}
              onExit={handleExitGame}
            />
          </div>
        </div>
      );
    }

    // Modo Mapa Aventura
    return (
      <div className="flex justify-center bg-background h-dvh lg:h-[calc(100dvh-56px)]">
        <div className="w-full relative" style={{ maxWidth: 480 }}>
          <TriviaMapClient
            initialQuestions={mapQuestions}
            selectedRegionName={selectedRegionObj?.name}
            onExit={handleExitGame}
          />
        </div>
      </div>
    );
  }

  // --- VISTA INICIAL (EDITORIAL CÍVICO Y RETADOR) ---
  return (
    <div className="min-h-[calc(100vh-64px)] bg-background text-foreground pt-6 sm:pt-8 pb-28 sm:pb-20 lg:pb-12 px-4 sm:px-6 lg:px-8">
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
        </div>

        {/* TARJETA DE CONTEXTO TERRITORIAL DESTACADA (PASAPORTE CÍVICO) */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                  selectedRegionObj
                    ? "bg-brand/10 border-brand/25 text-brand"
                    : "bg-amber-500/10 border-amber-500/25 text-amber-500"
                }`}
              >
                {selectedRegionObj ? (
                  <MapPin className="h-5 w-5" />
                ) : (
                  <Compass className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] tracking-wider uppercase font-bold text-muted-foreground">
                    Territorio electoral:
                  </span>
                  <Badge
                    variant={selectedRegionObj ? "default" : "secondary"}
                    className="text-[11px] font-bold px-2 py-0.5"
                  >
                    {selectedRegionObj
                      ? formatRegionLabel(selectedRegionObj)
                      : "Modo Nacional"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {selectedRegionObj
                    ? `Preguntas de autoridades, debates oficiales y candidatos de ${selectedRegionObj.name}.`
                    : "Preguntas de cobertura nacional. Puedes acotar los retos eligiendo entre las 13 regiones autorizadas."}
                </p>
              </div>
            </div>

            <div className="shrink-0 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setIsRegionCredenzaOpen(true)}
                className="h-9 py-1.5 px-3.5 rounded-xl border border-border/80 bg-muted/60 hover:bg-muted text-xs font-semibold shadow-2xs gap-2 transition-all cursor-pointer inline-flex items-center select-none"
              >
                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {selectedRegionObj ? "Cambiar región" : "Seleccionar región"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* TARJETA HERO: DESAFÍO REGIONAL EXPRESS */}
        {heroTopic && (
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/30 p-6 sm:p-8 lg:p-9 shadow-xs">
            <div className="relative z-10 space-y-4">
              {/* Eyebrow */}
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                <span className="font-mono text-[10px] sm:text-[11px] tracking-wider uppercase font-bold text-muted-foreground">
                  Desafío Cívico Rápido ·{" "}
                  <span className="text-foreground font-black">
                    {selectedRegionObj ? selectedRegionObj.name : "Nacional"}
                  </span>
                </span>
              </div>

              {/* Titular */}
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight max-w-xl">
                10 preguntas para poner a prueba tu voto.
              </h2>

              {/* Subtítulo */}
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
                Mide qué tanto recuerdas de las propuestas, videos de debates y
                competencias de tus autoridades en tu territorio.
              </p>

              {/* Chips informativos + Botón de acción */}
              <div className="pt-2 sm:pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/70 border border-border/70 text-foreground font-mono text-xs font-semibold">
                    <Zap
                      size={13}
                      className="text-amber-500 fill-amber-500/20 shrink-0"
                    />
                    <span>10 preguntas</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold">
                    <Trophy size={13} className="text-amber-500 shrink-0" />
                    <span>+100 XP</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/40 border border-border/60 text-muted-foreground font-mono text-xs font-medium">
                    <Clock size={13} className="shrink-0" />
                    <span>~3 min</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleStartExpressGame}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand hover:bg-brand/90 text-brand-foreground active:scale-[0.98] font-bold text-xs sm:text-sm transition-all shadow-xs group cursor-pointer shrink-0"
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
          onClick={() => {
            if (!selectedRegionId) {
              setShowMapRouteModal(true);
            } else {
              handleStartTopicGame(playableTopic, "MAP");
            }
          }}
          className="w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 transition-all text-left group cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-muted/80 border border-border/60 flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:border-foreground/20 shrink-0 transition-colors">
              <MapIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-foreground">
                  {selectedRegionObj
                    ? `Mapa Aventura · ${selectedRegionObj.name}`
                    : "Mapa Aventura Regional"}
                </p>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border/70 text-muted-foreground uppercase">
                  NIVEL {Math.min(highestUnlockedLevel || 1, totalMapLevels)} DE{" "}
                  {totalMapLevels}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {selectedRegionObj
                  ? `Aventura personalizada para ${selectedRegionObj.name}. Hito actual: ${currentTheme?.name || "Sierra"}.`
                  : `Recorre el Perú respondiendo sobre funciones públicas. Hito actual: ${currentTheme?.name || "Costa"}.`}
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
                    onClick={() => handleStartTopicGame(topic, "QUICK_QUIZ")}
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
                    <div className="h-1.5 flex-1 max-w-[120px] sm:max-w-[150px] rounded-full bg-muted/60" />
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

      {/* MODAL RUTA DE MAPA HECHO EN CREDENZA */}
      <Credenza open={showMapRouteModal} onOpenChange={setShowMapRouteModal}>
        <CredenzaContent className="sm:max-w-md p-0 overflow-hidden flex flex-col">
          <CredenzaHeader className="px-5 py-4 border-b bg-muted/20 shrink-0 text-left">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                <MapIcon className="h-4 w-4" />
              </div>
              <CredenzaTitle className="text-base sm:text-lg font-bold">
                ¿Cómo deseas recorrer el mapa?
              </CredenzaTitle>
            </div>
            <CredenzaDescription className="text-xs text-muted-foreground leading-relaxed">
              Actualmente estás en el Modo Nacional. Puedes elegir recorrer todo
              el país o enfocarte en las autoridades y debates de tu
              departamento.
            </CredenzaDescription>
          </CredenzaHeader>

          <CredenzaBody className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => {
                setShowMapRouteModal(false);
                handleStartTopicGame(playableTopic, "MAP");
              }}
              className="w-full p-4 rounded-xl border border-border/80 bg-muted/30 hover:bg-muted/60 transition-all text-left flex items-start gap-3.5 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center shrink-0 mt-0.5">
                <Compass className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground group-hover:text-brand transition-colors">
                  Ruta Nacional
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Recorre Costa, Sierra y Selva nivel por nivel con preguntas de
                  cultura cívica de cobertura general.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowMapRouteModal(false);
                setIsRegionCredenzaOpen(true);
              }}
              className="w-full p-4 rounded-xl border border-brand/30 bg-brand/5 hover:bg-brand/10 transition-all text-left flex items-start gap-3.5 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0 mt-0.5">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground group-hover:text-brand transition-colors">
                  Aventura Regional (13 plazas electorales)
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Elige tu región para jugar el mapa con candidatos, propuestas
                  y debates de tu realidad territorial.
                </p>
              </div>
            </button>
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>

      {/* CREDENZA DE SELECCIÓN DE REGIÓN */}
      <RegionSelectorCredenza
        open={isRegionCredenzaOpen}
        onOpenChange={(open) => {
          setIsRegionCredenzaOpen(open);
          if (!open) {
            localStorage.setItem("votabien_trivia_onboarding_shown", "1");
          }
        }}
        selectedRegionId={selectedRegionId}
        regions={availableRegions}
        onSelectRegion={(newId) => {
          if (newId === null) {
            setSelectedRegionId(null);
          } else {
            handleRegionChange(newId);
          }
          localStorage.setItem("votabien_trivia_onboarding_shown", "1");
        }}
      />
    </div>
  );
}
