"use client";

import { IllustratedNode } from "@/components/game/illustrated-node";
import { LevelModal } from "@/components/game/level-game";
import { RegionTransitionModal } from "@/components/game/region-transition-modal";
import { TriviaGameView } from "./trivia-game-view";
import { REGION_ASSETS } from "@/constants/game-assets";
import {
  getRegionByLevel,
  REGION_START_LEVELS,
} from "@/constants/regions-data";
import { useGameStore } from "@/store/game-store";
import { GameLevel, GameRegion, TriviaQuestion } from "@/interfaces/game-types";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReadiness } from "@/store/readiness-store";
import { Microscope } from "lucide-react";

const NODE_SPACING = 160;
const MAP_WIDTH = 390;
const SCROLL_PADDING_TOP = 100;
const SCROLL_PADDING_BOTTOM = 200;
const MAP_MARGIN_TOP = 0;

// TEMPORAL
const MAX_LEVELS = 9;

export default function TriviaMapClient({
  initialQuestions,
}: {
  initialQuestions: TriviaQuestion[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(MAP_WIDTH);

  const { markTriviaRegion } = useReadiness();

  const {
    getLevels,
    userXp,
    highestUnlockedLevel,
    setQuestions,
    rawQuestions,
    levelsProgress,
  } = useGameStore();

  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions, setQuestions]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width || MAP_WIDTH);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // rawQuestions, highestUnlockedLevel y levelsProgress son las dependencias
  // reales — getLevels es una función estable de zustand que los consume internamente
  const levels = useMemo(
    () => getLevels().slice(0, MAX_LEVELS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawQuestions, highestUnlockedLevel, levelsProgress],
  );

  const currentTheme = getRegionByLevel(highestUnlockedLevel);

  // Calcula secciones de fondo por región — cada región ocupa su rango de niveles
  const regionSections = useMemo(() => {
    if (!levels.length) return [];

    const getNodeY = (i: number) => i * NODE_SPACING + 100;
    const mapHeight = levels.length * NODE_SPACING + 200;
    const totalH = SCROLL_PADDING_TOP + mapHeight + SCROLL_PADDING_BOTTOM;

    // Agrupar índices consecutivos por región
    type Section = { regionId: GameRegion; startIdx: number; endIdx: number };
    const sections: Section[] = [];
    let currentRegionId = levels[0].region as GameRegion;
    let startIdx = 0;

    for (let i = 0; i < levels.length; i++) {
      const regionId = levels[i].region as GameRegion;
      const isLast = i === levels.length - 1;

      if (regionId !== currentRegionId || isLast) {
        sections.push({
          regionId: currentRegionId,
          startIdx,
          endIdx: regionId !== currentRegionId ? i - 1 : i,
        });
        if (regionId !== currentRegionId) {
          currentRegionId = regionId;
          startIdx = i;
          if (isLast) {
            sections.push({ regionId, startIdx: i, endIdx: i });
          }
        }
      }
    }

    return sections.map(({ regionId, startIdx, endIdx }, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === sections.length - 1;

      // Pixel Y del primer y último nodo de la sección
      const firstY = SCROLL_PADDING_TOP + MAP_MARGIN_TOP + getNodeY(startIdx);
      const lastY = SCROLL_PADDING_TOP + MAP_MARGIN_TOP + getNodeY(endIdx);

      const top = isFirst ? 0 : firstY - NODE_SPACING / 2;
      const bottom = isLast ? totalH : lastY + NODE_SPACING / 2;

      return {
        regionId,
        top,
        height: bottom - top,
        theme: getRegionByLevel(levels[startIdx].id),
      };
    });
  }, [levels]);

  // Hint de primera visita — solo si nunca han jugado
  const [showHint, setShowHint] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("votabien_hint_dismissed");
  });

  const dismissHint = () => {
    localStorage.setItem("votabien_hint_dismissed", "1");
    setShowHint(false);
  };

  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null);
  const [activeLevelId, setActiveLevelId] = useState<number | null>(null);
  const [showRegionTransition, setShowRegionTransition] = useState(false);
  const prevHighest = useRef(highestUnlockedLevel);

  useEffect(() => {
    const prev = prevHighest.current;
    const curr = highestUnlockedLevel;
    if (curr !== prev && REGION_START_LEVELS.includes(curr)) {
      setShowRegionTransition(true);
    }
    prevHighest.current = curr;
  }, [highestUnlockedLevel]);

  useEffect(() => {
    if (!levels || levels.length === 0) return;
    const idx = levels.findIndex((l) => l.id === highestUnlockedLevel);
    if (idx < 0) return;
    const nodeY = idx * NODE_SPACING + 100;
    const scrollTarget = Math.max(0, nodeY - 300);
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollTarget, behavior: "smooth" });
    }, 400);
    return () => clearTimeout(t);
  }, [levels.length, highestUnlockedLevel]);

  // Bug fix: NO cerrar el juego aquí — solo trackear readiness.
  // El juego se cierra cuando el usuario presiona "Continuar" en ResultsScreen → onExit.
  const handleLevelComplete = () => {
    markTriviaRegion(currentTheme.id);
  };

  const getNodeX = (i: number) =>
    i % 2 === 0
      ? 100 + (i % 3) * 10
      : (containerWidth || MAP_WIDTH) - 100 - (i % 3) * 10;
  const getNodeY = (i: number) => i * NODE_SPACING + 100;

  if (!levels || levels.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-8 min-h-screen bg-background">
        <p className="text-foreground text-lg font-bold text-center">
          Preparando niveles...
        </p>
        <p className="text-foreground/60 text-sm text-center">
          {rawQuestions.length} preguntas cargadas
        </p>
      </div>
    );
  }

  const backgroundAsset = REGION_ASSETS[currentTheme.id]?.background;
  const avatarAsset = REGION_ASSETS[currentTheme.id]?.avatar;

  const mapHeight = levels.length * NODE_SPACING + 200;
  const totalScrollHeight =
    SCROLL_PADDING_TOP + mapHeight + SCROLL_PADDING_BOTTOM;

  return (
    <div className="relative flex flex-col h-[100dvh] lg:h-[calc(100dvh-56px)] overflow-hidden">
      {/* Color de fondo base — color top de la región actual */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: currentTheme.colors.backgroundTop }}
      />

      {/* Floating header */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center gap-3 bg-card border border-border rounded-full px-3 py-2 shadow-lg">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{ backgroundColor: currentTheme.colors.primary }}
        >
          {avatarAsset ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarAsset}
              alt="avatar"
              className="w-9 h-9 object-contain rounded-full"
            />
          ) : (
            <span className="text-2xl">{currentTheme.avatarEmoji}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm font-bold truncate">
            {currentTheme.name}
          </p>
          <p className="text-foreground/70 text-xs font-semibold">
            Nivel {highestUnlockedLevel}
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-full flex-shrink-0">
          <span className="text-amber-600 font-semibold text-xs">
            {Math.floor(userXp)} XP
          </span>
        </div>
      </div>

      {/* Scrollable map */}
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        <div
          className="absolute inset-x-0 top-0"
          ref={containerRef}
          style={{ height: totalScrollHeight, pointerEvents: "none" }}
        >
          {/* Fondos por sección de región — cada región muestra su propia imagen */}
          {regionSections.map(({ regionId, top, height, theme }) => {
            const bg = REGION_ASSETS[regionId]?.background;
            return (
              <div
                key={regionId}
                className="absolute inset-x-0 overflow-hidden"
                style={{ top, height }}
              >
                {bg && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={bg}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                {/* Gradiente sutil por región — más liviano que antes */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to bottom, ${theme.colors.backgroundTop}44, ${theme.colors.backgroundBottom}77)`,
                  }}
                />
              </div>
            );
          })}

          {/* Capa de oscurecimiento mínima — solo para legibilidad de los nodos */}
          <div
            className="absolute inset-0"
            style={{
              height: totalScrollHeight,
              backgroundColor: "rgba(0,0,0,0.08)",
            }}
          />
        </div>

        <div
          style={{
            position: "relative",
            paddingTop: SCROLL_PADDING_TOP,
            paddingBottom: SCROLL_PADDING_BOTTOM,
          }}
        >
          <div
            style={{
              position: "relative",
              height: mapHeight,
              marginTop: MAP_MARGIN_TOP,
            }}
          >
            {/* SVG paths */}
            <svg
              style={{ position: "absolute", inset: 0, overflow: "visible" }}
              width="100%"
              height="100%"
            >
              {levels.map((level, i) => {
                if (i >= levels.length - 1) return null;
                const nextLevel = levels[i + 1];
                const sx = getNodeX(i),
                  sy = getNodeY(i);
                const ex = getNodeX(i + 1),
                  ey = getNodeY(i + 1);
                const cx = (sx + ex) / 2 + (i % 2 === 0 ? -40 : 40);
                const cy = (sy + ey) / 2;
                const d = `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;
                const unlocked = nextLevel.status !== "locked";
                return (
                  <g key={`path-${level.id}`}>
                    <path
                      d={d}
                      stroke="rgba(0,0,0,0.15)"
                      strokeWidth="16"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d={d}
                      stroke="#fef3c7"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d={d}
                      stroke={unlocked ? "#d97706" : "#6b7280"}
                      strokeWidth="4"
                      strokeDasharray="10,10"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {levels.map((level, i) => {
              const levelRegionAssets =
                REGION_ASSETS[level.region as GameRegion];
              return (
                <div
                  key={level.id}
                  style={{
                    position: "absolute",
                    left: getNodeX(i) - 60,
                    top: getNodeY(i) - 40,
                  }}
                >
                  <IllustratedNode
                    level={level}
                    index={i}
                    onPress={(level) => {
                      if (showHint) dismissHint();
                      setSelectedLevel(level);
                    }}
                    isCurrent={level.id === highestUnlockedLevel}
                    avatarSrc={levelRegionAssets?.avatar ?? null}
                    avatarEmojiFallback={getRegionByLevel(level.id).avatarEmoji}
                  />
                </div>
              );
            })}
            {/* ── First-time hint ── */}
            {showHint &&
              levels.length > 0 &&
              highestUnlockedLevel === 1 &&
              (() => {
                const hintX = getNodeX(0);
                const hintY = getNodeY(0);
                return (
                  <div
                    style={{
                      position: "absolute",
                      left: hintX + 50,
                      top: hintY - 30,
                      zIndex: 20,
                      pointerEvents: "none",
                    }}
                  >
                    {/* Flecha + label */}
                    <div className="flex items-center gap-1.5 animate-bounce">
                      {/* Flecha SVG apuntando a la izquierda */}
                      <svg
                        width="28"
                        height="20"
                        viewBox="0 0 28 20"
                        fill="none"
                      >
                        <path
                          d="M27 10 L6 10 M6 10 L14 3 M6 10 L14 17"
                          stroke="#fbbf24"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div
                        className="bg-amber-400 text-black text-[11px] font-black uppercase tracking-wide px-3 py-1.5 rounded-full shadow-lg"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        ¡Empieza aquí!
                      </div>
                    </div>
                  </div>
                );
              })()}
            {/* TEMPORAL — Coming soon node */}
            {levels.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: getNodeX(levels.length) - 70,
                  top: getNodeY(levels.length) - 40,
                }}
              >
                <div className="flex flex-col items-center gap-2 opacity-80">
                  <div className="w-[60px] h-[60px] rounded-full bg-card border-2 border-dashed border-amber-400 flex items-center justify-center shadow-md">
                    <Microscope size={30} className="text-amber-600" />
                  </div>
                  <div className="bg-card/90 border border-amber-400/40 rounded-xl px-3 py-2 text-center max-w-[140px] shadow">
                    <p className="text-xs font-bold text-amber-600">
                      ¡Más niveles pronto!
                    </p>
                    <p className="text-[10px] text-foreground/60 mt-0.5">
                      Investigando más fuentes...
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Level select modal */}
      <LevelModal
        visible={!!selectedLevel}
        level={selectedLevel}
        onClose={() => setSelectedLevel(null)}
        onPlay={() => {
          if (!selectedLevel) return;
          setActiveLevelId(selectedLevel.id);
          setSelectedLevel(null);
        }}
      />

      {/* Game view */}
      {activeLevelId !== null && (
        <TriviaGameView
          levelId={activeLevelId}
          onExit={() => setActiveLevelId(null)}
          onComplete={handleLevelComplete}
        />
      )}

      <RegionTransitionModal
        visible={showRegionTransition}
        newRegion={currentTheme}
        avatarSrc={avatarAsset ?? null}
        onContinue={() => setShowRegionTransition(false)}
      />
    </div>
  );
}
