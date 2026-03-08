"use client";

// CAMBIO: Se agrega markTriviaLevel al completar cada nivel en TriviaGameView.
// El patrón es: TriviaMapClient pasa onLevelComplete a TriviaGameView,
// que lo invoca cuando el juego termina con éxito (resultado "passed" / XP ganado).

import { IllustratedNode } from "@/components/game/illustrated-node";
import { LevelModal } from "@/components/game/level-game";
import { RegionTransitionModal } from "@/components/game/region-transition-modal";
import { TriviaGameView } from "./trivia-game-view";
import { REGION_ASSETS } from "@/constants/game-assets";
import { getRegionByLevel } from "@/constants/regions-data";
import { useGameStore } from "@/store/game-store";
import { GameLevel, TriviaQuestion } from "@/interfaces/game-types";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReadiness } from "@/store/readiness-store";

const NODE_SPACING = 160;
const REGION_START_LEVELS = [11, 21, 31];
const MAP_WIDTH = 390;

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

  const levels = useMemo(
    () => getLevels(),
    [rawQuestions, highestUnlockedLevel, levelsProgress, getLevels],
  );
  const currentTheme = getRegionByLevel(highestUnlockedLevel);

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

  // Called by TriviaGameView when the user passes a level
  const handleLevelComplete = () => {
    markTriviaRegion(currentTheme.id);
    setActiveLevelId(null);
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
  const scrollPaddingTop = 100;
  const scrollPaddingBottom = 200;
  const totalScrollHeight = scrollPaddingTop + mapHeight + scrollPaddingBottom;

  return (
    <div
      className="relative flex flex-col"
      style={{ height: "100dvh", overflow: "hidden" }}
    >
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
        className="absolute inset-0 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: "none" }}
      >
        <div
          className="absolute inset-x-0 top-0"
          ref={containerRef}
          style={{ height: totalScrollHeight, pointerEvents: "none" }}
        >
          {backgroundAsset && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={backgroundAsset}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ height: totalScrollHeight }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              height: totalScrollHeight,
              background: `linear-gradient(to bottom, ${currentTheme.colors.backgroundTop}99, ${currentTheme.colors.backgroundBottom}CC)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              height: totalScrollHeight,
              backgroundColor: "rgba(0,0,0,0.12)",
            }}
          />
        </div>

        <div
          style={{
            position: "relative",
            paddingTop: scrollPaddingTop,
            paddingBottom: scrollPaddingBottom,
          }}
        >
          <div
            style={{ position: "relative", height: mapHeight, marginTop: 20 }}
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
            {levels.map((level, i) => (
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
                  onPress={setSelectedLevel}
                  isCurrent={level.id === highestUnlockedLevel}
                  avatarSrc={avatarAsset ?? null}
                  avatarEmojiFallback={currentTheme.avatarEmoji}
                />
              </div>
            ))}
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

      {/* Game view — pasa onComplete para trackear readiness */}
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
