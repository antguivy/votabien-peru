"use client";

import { forwardRef } from "react";
import { Quote } from "lucide-react";

export interface HighlightedQuestion {
  quote: string;
  answerName: string;
  answerImage?: string | null;
  category: string;
}

interface TriviaShareCardProps {
  score: number;
  highlightedQuestion: HighlightedQuestion | null;
  rankTitle: string;
  captureMode?: boolean;
  gallitoRef?: React.RefObject<HTMLDivElement | null>;
}

export const TriviaShareCard = forwardRef<HTMLDivElement, TriviaShareCardProps>(
  (
    { score, highlightedQuestion, rankTitle, captureMode = false, gallitoRef },
    ref,
  ) => {
    const COLORS = {
      bg: "#090910",
      primary: "#FF0055",
      secondary: "#00E5FF",
      accent: "#FFE600",
      text: "#FFFFFF",
      cardBg: "rgba(20, 20, 35, 0.95)",
    };

    return (
      <div
        ref={ref}
        id="trivia-share-card"
        style={{
          width: "360px",
          height: "640px",
          backgroundColor: COLORS.bg,
          color: COLORS.text,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: '"Press Start 2P", "Courier New", monospace',
        }}
      >
        {/* IMPORTAR FUENTE */}
        <style>
          {`@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');`}
        </style>

        {/* 1. FONDO GLOBAL (Grid + Gradiente) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            opacity: 0.5,
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "100%",
              background:
                "radial-gradient(circle at 50% 0%, #1a1a40 0%, #090910 80%)",
            }}
          />
        </div>

        {/* 2. CONTENEDOR PRINCIPAL */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "24px",
            justifyContent: "space-between",
          }}
        >
          {/* HEADER */}
          <div style={{ textAlign: "center" }}>
            <h2
              style={{
                color: COLORS.accent,
                fontSize: "20px",
                lineHeight: "1.4",
                textShadow: `3px 3px 0px ${COLORS.primary}`,
                margin: 0,
              }}
            >
              VOTABIEN
              <br />
              PERÚ
            </h2>
          </div>

          {/* CUERPO */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              justifyContent: "center",
              flex: 1,
            }}
          >
            {highlightedQuestion ? (
              <>
                <div
                  style={{
                    backgroundColor: COLORS.cardBg,
                    border: `2px solid ${COLORS.primary}`,
                    boxShadow: `4px 4px 0px ${COLORS.primary}`,
                    padding: "16px",
                    position: "relative",
                  }}
                >
                  <Quote
                    size={24}
                    color={COLORS.primary}
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "10px",
                      backgroundColor: COLORS.bg,
                      padding: "0 4px",
                    }}
                  />
                  <p
                    style={{
                      fontSize: "11px",
                      lineHeight: "1.8",
                      textAlign: "center",
                    }}
                  >
                    “{highlightedQuestion.quote}”
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: COLORS.cardBg,
                    border: `2px solid ${COLORS.secondary}`,
                    boxShadow: `-4px 4px 0px ${COLORS.secondary}`,
                    padding: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      border: "2px solid white",
                      backgroundColor: "#000",
                      flexShrink: 0,
                    }}
                  >
                    {highlightedQuestion.answerImage && (
                      <img
                        src={highlightedQuestion.answerImage}
                        alt="Candidato"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        crossOrigin="anonymous"
                      />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "8px",
                        color: COLORS.secondary,
                        marginBottom: "4px",
                      }}
                    >
                      RESPUESTA:
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        textTransform: "uppercase",
                        lineHeight: "1.2",
                      }}
                    >
                      {highlightedQuestion.answerName}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* FOOTER: STATS Y GALLITO */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              zIndex: 20,
            }}
          >
            {/* "NIVEL ALCANZADO" */}
            <div
              style={{
                fontSize: "7px",
                color: COLORS.secondary,
                letterSpacing: "2px",
                fontWeight: "bold",
                textTransform: "uppercase",
                background: "rgba(0,0,0,0.6)",
                padding: "2px 6px",
                borderRadius: "4px",
                marginBottom: "2px",
              }}
            >
              NIVEL DESBLOQUEADO
            </div>
            {/* RANGO */}
            <div
              style={{
                backgroundColor: COLORS.accent,
                color: "#000",
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: "900",
                transform: "skew(-10deg)",
                border: `2px solid #fff`,
                boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
                marginBottom: "5px",
                textAlign: "center",
                lineHeight: "1.2",
              }}
            >
              {rankTitle}
            </div>

            {/* --- ZONA DEL GALLITO --- */}

            <div
              ref={gallitoRef}
              style={{
                width: "140px",
                height: "140px",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
              }}
            >
              {!captureMode && (
                <div
                  style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)" }}
                >
                  (Video aquí)
                </div>
              )}
            </div>

            <div
              style={{ textAlign: "center", marginTop: "-15px", zIndex: 20 }}
            >
              <div
                style={{
                  fontSize: "10px",
                  color: "#888",
                  marginBottom: "4px",
                }}
              >
                PUNTAJE FINAL
              </div>
              <div
                style={{
                  fontSize: "32px",
                  color: "#fff",
                  textShadow: "0 0 10px rgba(255,255,255,0.5)",
                }}
              >
                {score}
              </div>
            </div>

            <div
              style={{
                fontSize: "8px",
                color: COLORS.secondary,
                opacity: 0.8,
                marginTop: "8px",
              }}
            >
              votabienperu.com/trivia
            </div>
          </div>
        </div>
      </div>
    );
  },
);

TriviaShareCard.displayName = "TriviaShareCard";
