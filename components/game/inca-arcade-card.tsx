"use client";

import { REGION_ASSETS } from "@/constants/game-assets";
import { RegionTheme } from "@/constants/regions-data";
import { TriviaQuestion } from "@/interfaces/game-types";
import { Check } from "lucide-react";
import Image from "next/image";

interface IncaArcadeCardProps {
  score: number;
  stars: 0 | 1 | 2 | 3;
  currentLevel: number | null;
  regionTheme: RegionTheme;
  featuredQuestion?: TriviaQuestion;
}

export function IncaArcadeCard({
  score,
  stars,
  currentLevel,
  regionTheme,
  featuredQuestion,
}: IncaArcadeCardProps) {
  const primaryColor = "#fbbf24";
  const accentColor = "#d97706";

  const avatarAsset = REGION_ASSETS[regionTheme.id]?.avatar;
  const correctOption = featuredQuestion?.options.find(
    (opt) => opt.option_id === featuredQuestion.correct_answer_id,
  );

  // Arcade font applied via CSS variable set in layout.tsx
  const arcade: React.CSSProperties = {
    fontFamily: "'Press Start 2P', var(--font-arcade, monospace)",
  };

  return (
    <div
      className="relative w-full shadow-2xl"
      style={{
        background: "#1c1917",
        borderRadius: 20,
        borderWidth: 5,
        borderStyle: "solid",
        borderColor: accentColor,
        padding: 3,
      }}
    >
      {/* Inner frame */}
      <div
        style={{
          background: "#0c0a09",
          borderRadius: 16,
          borderWidth: 3,
          borderStyle: "solid",
          borderColor: primaryColor,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 20, background: "#0c0a09" }}>
          {/* ── Header ── */}
          <div
            className="flex items-center justify-between pb-3 mb-4"
            style={{
              borderBottomWidth: 2,
              borderBottomStyle: "solid",
              borderBottomColor: "#292524",
            }}
          >
            {/* Avatar + name */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderWidth: 2,
                  borderStyle: "solid",
                  borderColor: primaryColor,
                }}
              >
                {avatarAsset ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarAsset}
                    alt={regionTheme.avatarName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-2xl">{regionTheme.avatarEmoji}</span>
                )}
              </div>
              <div>
                <p
                  style={{
                    ...arcade,
                    fontSize: 9,
                    color: primaryColor,
                    marginBottom: 3,
                  }}
                >
                  {regionTheme.avatarName}
                </p>
                <p style={{ fontSize: 10, color: "#78716c", fontWeight: 600 }}>
                  {regionTheme.name}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {/* Stars */}
              <div className="flex gap-1">
                {[1, 2, 3].map((s) => (
                  <svg
                    key={s}
                    viewBox="0 0 24 24"
                    className="w-5 h-5"
                    fill={s <= stars ? "#fbbf24" : "#333"}
                    stroke={s <= stars ? "#d97706" : "#555"}
                    strokeWidth="1.5"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <div className="flex flex-col items-center flex-1">
                <span
                  style={{
                    ...arcade,
                    fontSize: 7,
                    color: "#78716c",
                    marginBottom: 4,
                  }}
                >
                  NIVEL
                </span>
                <span style={{ ...arcade, fontSize: 10, color: primaryColor }}>
                  {currentLevel}
                </span>
              </div>
            </div>
          </div>

          {/* ── Featured question ── */}
          {featuredQuestion && (
            <div className="mb-4">
              {/* Category badge */}
              <div
                className="inline-block px-2.5 rounded mb-3"
                style={{ background: primaryColor }}
              >
                <span
                  style={{
                    ...arcade,
                    fontSize: 8,
                    color: "#000",
                    letterSpacing: 1,
                  }}
                >
                  {featuredQuestion.category}
                </span>
              </div>

              {/* Quote */}
              <div
                className="p-3.5 rounded-xl mb-3"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderLeftWidth: 4,
                  borderLeftStyle: "solid",
                  borderLeftColor: primaryColor,
                }}
              >
                <p
                  style={{
                    color: "#f5f5f4",
                    fontSize: 14,
                    fontWeight: 600,
                    fontStyle: "italic",
                    lineHeight: 1.55,
                  }}
                >
                  ❝{featuredQuestion.quote}❞
                </p>
              </div>

              {/* Answer block */}
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: "#1c1917",
                  borderWidth: 2,
                  borderStyle: "solid",
                  borderColor: "#292524",
                }}
              >
                {/* Header strip */}
                <div
                  className="flex items-center justify-center gap-1.5 py-2 px-3"
                  style={{ background: primaryColor }}
                >
                  <Check size={13} color="#000" strokeWidth={3} />
                  <span
                    style={{
                      ...arcade,
                      fontSize: 7,
                      color: "#000",
                      letterSpacing: 1,
                    }}
                  >
                    RESPUESTA CORRECTA
                  </span>
                </div>

                {/* Candidate row */}
                <div
                  className="flex items-center gap-3 p-3.5"
                  style={{ background: "rgba(251,191,36,0.08)" }}
                >
                  {correctOption?.image_url && (
                    <div
                      className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                      style={{ background: "#292524" }}
                    >
                      <Image
                        src={correctOption.image_url}
                        alt={correctOption.name}
                        className="w-full h-full object-contain"
                        width={30}
                        height={30}
                      />
                    </div>
                  )}
                  <p
                    style={{
                      color: primaryColor,
                      fontSize: 13,
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      flex: 1,
                    }}
                  >
                    {correctOption?.name}
                  </p>
                </div>

                {/* Explanation */}
                {featuredQuestion.explanation && (
                  <div
                    className="px-3.5 py-3"
                    style={{
                      background: "#292524",
                      borderTopWidth: 1,
                      borderTopStyle: "solid",
                      borderTopColor: "#44403c",
                    }}
                  >
                    <p
                      style={{
                        color: "#d6d3d1",
                        fontSize: 11,
                        lineHeight: 1.5,
                      }}
                    >
                      {featuredQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <div className="flex flex-col items-center pt-1">
            <div
              style={{
                width: 60,
                height: 2,
                background: "#44403c",
                marginBottom: 8,
              }}
            />
            <p
              style={{
                ...arcade,
                fontSize: 8,
                color: primaryColor,
                marginBottom: 6,
              }}
            >
              VOTABIENPERU.COM
            </p>
            <p style={{ color: "#d6d3d1", fontSize: 12, fontStyle: "italic" }}>
              Infórmate, tu voto importa. 🇵🇪
            </p>
          </div>
        </div>
      </div>

      {/* Decorative corners */}
      {[
        { top: -2, left: -2, borderTopLeftRadius: 20 },
        { top: -2, right: -2, borderTopRightRadius: 20 },
        { bottom: -2, left: -2, borderBottomLeftRadius: 20 },
        { bottom: -2, right: -2, borderBottomRightRadius: 20 },
      ].map((style, i) => (
        <div
          key={i}
          className="absolute w-5 h-5 pointer-events-none"
          style={{ ...style, background: "#78716c", opacity: 0.3 }}
        />
      ))}
    </div>
  );
}
