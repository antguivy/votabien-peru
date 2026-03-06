"use client";

// components/game/RegionTransitionModal.tsx
// CSS animations replace the Animated.sequence chain from RN.

import { RegionTheme } from "@/constants/regions-data";
import { useEffect, useRef } from "react";

interface RegionTransitionModalProps {
  visible: boolean;
  newRegion: RegionTheme;
  onContinue: () => void;
  avatarSrc?: string | null;
}

function getRegionWelcomeText(regionId: string): string {
  const texts: Record<string, string> = {
    sierra:
      "Las montañas guardan los secretos más profundos del poder político. ¿Estás listo para escalarlas?",
    selva:
      "En lo más profundo de la Amazonía, la verdad florece. Cada pregunta es un nuevo árbol.",
    hanan_pacha:
      "Has llegado al mundo de arriba. Solo los más sabios alcanzan este nivel.",
  };
  return texts[regionId] ?? "Una nueva aventura te espera.";
}

export function RegionTransitionModal({
  visible,
  newRegion,
  onContinue,
  avatarSrc,
}: RegionTransitionModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center fade-in-region"
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${newRegion.colors.backgroundTop}, ${newRegion.colors.backgroundBottom})`,
        }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/35" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-8 py-10 gap-4 max-w-sm w-full text-center">
        {/* Badge */}
        <div
          className="px-4 py-1.5 rounded-full mb-2"
          style={{ backgroundColor: newRegion.colors.primary }}
        >
          <span className="text-white text-[10px] font-extrabold tracking-widest uppercase">
            ✨ Nueva Región Desbloqueada
          </span>
        </div>

        {/* Avatar — spring animation via CSS */}
        <div
          className="avatar-spring"
          style={{
            width: 130,
            height: 130,
            borderRadius: 65,
            backgroundColor: "rgba(255,255,255,0.15)",
            border: `4px solid ${newRegion.colors.primary}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSrc}
              alt={newRegion.avatarName}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                objectFit: "contain",
              }}
            />
          ) : (
            <span style={{ fontSize: 64 }}>{newRegion.avatarEmoji}</span>
          )}
        </div>

        {/* Avatar name */}
        <p
          className="slide-up font-bold uppercase tracking-[3px] text-sm"
          style={{ color: newRegion.colors.accent, animationDelay: "0.3s" }}
        >
          {newRegion.avatarName}
        </p>

        {/* Region name */}
        <p
          className="slide-up text-white/85 text-lg"
          style={{ animationDelay: "0.35s" }}
        >
          ¡Bienvenido a la
        </p>
        <p
          className="slide-up text-4xl font-black leading-tight -mt-2"
          style={{ color: newRegion.colors.primary, animationDelay: "0.4s" }}
        >
          {newRegion.name}
        </p>

        {/* Description */}
        <p
          className="slide-up text-white/80 text-sm leading-5 mt-1 mb-4"
          style={{ animationDelay: "0.45s" }}
        >
          {getRegionWelcomeText(newRegion.id)}
        </p>

        {/* CTA */}
        <button
          type="button"
          onClick={onContinue}
          className="slide-up w-full py-4 rounded-2xl font-extrabold text-white text-base transition-opacity hover:opacity-90 active:scale-95"
          style={{
            backgroundColor: newRegion.colors.primary,
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            animationDelay: "0.5s",
          }}
        >
          ¡Explorar {newRegion.name}!
        </button>
      </div>
    </div>
  );
}
