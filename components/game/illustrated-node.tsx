"use client";

// components/game/IllustratedNode.tsx

import { GameLevel } from "@/interfaces/game-types";
import { Crown, Lock, Star, Swords } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// ── Color palettes (same as RN version) ───────────────────────────────────
const COLORS = {
  costa: {
    normal: ["#f59e0b", "#ea580c", "#0891b2"],
    boss: "#dc2626",
    locked: "#9ca3af",
    border: ["#d97706", "#c2410c", "#0e7490"],
    bossBorder: "#991b1b",
    lockedBorder: "#6b7280",
  },
  sierra: {
    normal: ["#16a34a", "#be123c", "#7c3aed"],
    boss: "#9f1239",
    locked: "#9ca3af",
    border: ["#15803d", "#9f1239", "#6d28d9"],
    bossBorder: "#881337",
    lockedBorder: "#6b7280",
  },
  selva: {
    normal: ["#0d9488", "#16a34a", "#d97706"],
    boss: "#7e22ce",
    locked: "#9ca3af",
    border: ["#0f766e", "#15803d", "#b45309"],
    bossBorder: "#6b21a8",
    lockedBorder: "#6b7280",
  },
  hanan_pacha: {
    normal: ["#7c3aed", "#c026d3", "#0ea5e9"],
    boss: "#ffd700",
    locked: "#9ca3af",
    border: ["#6d28d9", "#a21caf", "#0284c7"],
    bossBorder: "#b45309",
    lockedBorder: "#6b7280",
  },
} as const;

const EMOJIS = {
  costa: ["🌊", "🐚", "☀️"],
  sierra: ["⛰️", "🌿", "🦙"],
  selva: ["🌿", "🐊", "💧"],
  hanan_pacha: ["⭐", "🌙", "🦅"],
} as const;

function regionOf(id: number): keyof typeof COLORS {
  if (id >= 31) return "hanan_pacha";
  if (id >= 21) return "selva";
  if (id >= 11) return "sierra";
  return "costa";
}

// ── Props ─────────────────────────────────────────────────────────────────
interface IllustratedNodeProps {
  level: GameLevel;
  onPress: (level: GameLevel) => void;
  index: number;
  isCurrent: boolean;
  avatarSrc?: string | null; // web: string URL from REGION_ASSETS
  avatarEmojiFallback?: string;
  animationTrigger?: "bounce" | "shake" | null;
}

export function IllustratedNode({
  level,
  onPress,
  isCurrent,
  avatarSrc,
  avatarEmojiFallback = "🐦",
  animationTrigger,
}: IllustratedNodeProps) {
  const isLocked = level.status === "locked";
  const isBoss = level.id % 5 === 0;
  const rk = regionOf(level.id);
  const pal = COLORS[rk];
  const v = level.id % 3;

  const bg = isLocked ? pal.locked : isBoss ? pal.boss : pal.normal[v];
  const border = isLocked
    ? pal.lockedBorder
    : isBoss
      ? pal.bossBorder
      : pal.border[v];
  const size = isBoss ? 100 : 80;

  // ── Animation state ────────────────────────────────────────────────────
  const [animClass, setAnimClass] = useState("");
  const isCurrentPrev = useRef(false);

  // Bounce in when this node becomes current
  useEffect(() => {
    if (isCurrent && !isCurrentPrev.current) {
      setAnimClass("node-bounce-in");
      const t = setTimeout(() => setAnimClass("node-pulse"), 600);
      isCurrentPrev.current = true;
      return () => clearTimeout(t);
    }
    if (!isCurrent) {
      isCurrentPrev.current = false;
      setAnimClass("");
    }
  }, [isCurrent]);

  // External animation trigger from parent (correct/wrong answer)
  useEffect(() => {
    if (!animationTrigger) return;
    const cls = animationTrigger === "bounce" ? "node-bounce-ok" : "node-shake";
    setAnimClass(cls);
    const t = setTimeout(
      () => setAnimClass(isCurrent ? "node-pulse" : ""),
      500,
    );
    return () => clearTimeout(t);
  }, [animationTrigger, isCurrent]);

  const handleClick = () => {
    if (!isLocked) onPress(level);
  };

  return (
    <div
      className="flex flex-col items-center"
      style={{ width: 120, position: "relative" }}
    >
      {/* ── "AQUÍ" avatar bubble ── */}
      {isCurrent && (
        <div
          className="absolute flex flex-col items-center z-5"
          style={{ top: -size - 10 }}
        >
          <div
            className="bg-white px-2 py-1 rounded-xl mb-1 shadow"
            style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}
          >
            AQUÍ
          </div>
          <div
            className="flex items-center justify-center overflow-hidden border-[3px] shadow-lg"
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: "#fff",
              borderColor: bg,
            }}
          >
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt="avatar"
                width={54}
                height={54}
                className="object-contain rounded-full"
              />
            ) : (
              <span style={{ fontSize: 30 }}>{avatarEmojiFallback}</span>
            )}
          </div>
        </div>
      )}

      {/* ── Node button ── */}
      <div className={animClass} style={{ display: "flex" }}>
        <button
          type="button"
          disabled={isLocked}
          onClick={handleClick}
          className="flex items-center justify-center relative select-none transition-transform active:scale-95"
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bg,
            border: `${isBoss ? 4 : 3}px solid ${border}`,
            borderBottomWidth: isBoss ? 8 : 5,
            borderBottomColor: "rgba(0,0,0,0.25)",
            boxShadow: isCurrent
              ? `0 0 0 4px ${bg}40, 0 4px 12px ${bg}60`
              : "0 4px 8px rgba(0,0,0,0.25)",
            cursor: isLocked ? "not-allowed" : "pointer",
          }}
        >
          {/* Shine */}
          <div
            className="absolute"
            style={{
              top: 5,
              left: "22%",
              width: "55%",
              height: "22%",
              borderRadius: size / 2,
              background: "rgba(255,255,255,0.35)",
              pointerEvents: "none",
            }}
          />

          {isLocked ? (
            <Lock size={isBoss ? 32 : 22} color="#fff" strokeWidth={2.5} />
          ) : isBoss ? (
            <Swords size={32} color="#fff" strokeWidth={2} />
          ) : (
            <span
              style={{
                fontSize: size * 0.4,
                fontWeight: 900,
                color: "rgba(255,255,255,0.95)",
                textShadow: "0 2px 6px rgba(0,0,0,0.25)",
                lineHeight: 1,
                letterSpacing: -1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {level.id}
            </span>
          )}

          {/* Crown for boss */}
          {!isLocked && isBoss && (
            <Crown
              size={18}
              color="#fbbf24"
              fill="#fbbf24"
              className="absolute"
              style={{ top: -10 }}
            />
          )}

          {/* Stars */}
          {!isLocked && (
            <div
              className="absolute flex gap-0.5 items-center border"
              style={{
                bottom: -13,
                backgroundColor: "#fff",
                borderRadius: 12,
                paddingLeft: 6,
                paddingRight: 6,
                paddingTop: 3,
                paddingBottom: 3,
                borderColor: "#f3f4f6",
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
              }}
            >
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  size={10}
                  fill={s <= level.stars ? "#fbbf24" : "#e5e7eb"}
                  color={s <= level.stars ? "#d97706" : "#d1d5db"}
                />
              ))}
            </div>
          )}
        </button>
      </div>

      {/* ── Level title ── */}
      {/* {!isLocked && (
        <div
          className="mt-4 px-2 py-0.5 rounded-lg text-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.92)",
            maxWidth: 110,
          }}
        >
          <span
            className="font-bold text-center"
            style={{ fontSize: 9, color: "#374151", lineHeight: 1.2 }}
          >
            {isBoss ? "⚔️ JEFE" : level.title}
          </span>
        </div>
      )} */}
    </div>
  );
}
