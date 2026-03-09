"use client";

import { useState, useEffect, useRef } from "react";
import { X, Play } from "lucide-react";

type Platform = "youtube" | "youtube_short" | "tiktok" | "unknown";

function detectPlatform(url: string): Platform {
  if (url.includes("youtube.com/shorts/")) return "youtube_short";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("tiktok.com")) return "tiktok";
  return "unknown";
}

// NUEVO: Función para extraer y convertir el tiempo de YouTube a segundos
function parseYouTubeTime(t: string | null): string | null {
  if (!t) return null;
  // Si es solo un número (Ej: "510")
  if (/^\d+$/.test(t)) return t;
  // Si tiene una 's' al final (Ej: "510s")
  if (/^\d+s$/.test(t)) return t.replace("s", "");

  // Si tiene formato de horas/minutos (Ej: "1h2m30s")
  let totalSeconds = 0;
  const hMatch = t.match(/(\d+)h/);
  const mMatch = t.match(/(\d+)m/);
  const sMatch = t.match(/(\d+)s/);

  if (hMatch) totalSeconds += parseInt(hMatch[1], 10) * 3600;
  if (mMatch) totalSeconds += parseInt(mMatch[1], 10) * 60;
  if (sMatch) totalSeconds += parseInt(sMatch[1], 10);

  return totalSeconds > 0 ? totalSeconds.toString() : null;
}

function buildEmbedUrl(url: string, platform: Platform): string | null {
  if (platform === "youtube" || platform === "youtube_short") {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    if (!match) return null;

    // Buscar si hay un parámetro de tiempo (t=...)
    let startParam = null;
    try {
      const urlObj = new URL(url);
      const t = urlObj.searchParams.get("t");
      startParam = parseYouTubeTime(t);
    } catch (e) {
      // Fallback por si la URL falla al parsearse
      const tMatch = url.match(/[?&]t=([^&]+)/);
      if (tMatch) startParam = parseYouTubeTime(tMatch[1]);
    }

    const params = new URLSearchParams({
      autoplay: "1",
      rel: "0",
      modestbranding: "1",
      playsinline: "1", // Ayuda en móviles para que no salte a pantalla completa forzada
    });

    // Si encontramos un tiempo de inicio, se lo pasamos al iframe
    if (startParam) {
      params.append("start", startParam);
    }

    return `https://www.youtube.com/embed/${match[1]}?${params}`;
  }

  if (platform === "tiktok") {
    const match = url.match(/video\/(\d+)/);
    if (!match) return null;
    // Añadimos playsinline=1 para intentar forzar la lectura de metadata en móviles
    return `https://www.tiktok.com/player/v1/${match[1]}?autoplay=1&playsinline=1`;
  }

  return null;
}

interface VideoDialogProps {
  url: string;
  trigger?: React.ReactNode;
}

export function VideoDialog({ url, trigger }: VideoDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const platform = detectPlatform(url);
  const embedUrl = buildEmbedUrl(url, platform);

  if (platform === "unknown" || !embedUrl) return null;

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-primary hover:text-primary/80 transition-colors"
        >
          <Play size={13} className="fill-primary" />
          Ver video
        </button>
      )}

      {isOpen && (
        <VideoModal
          embedUrl={embedUrl}
          platform={platform}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

function VideoModal({
  embedUrl,
  platform,
  onClose,
}: {
  embedUrl: string;
  platform: Platform;
  onClose: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  useEffect(() => {
    if (platform !== "tiktok") return;

    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin === "https://www.tiktok.com" &&
        event.data?.["x-tiktok-player"] &&
        event.data?.type === "onPlayerReady"
      ) {
        iframeRef.current?.contentWindow?.postMessage(
          { type: "unMute", "x-tiktok-player": true },
          "*",
        );
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [platform]);

  const isShort = platform === "tiktok" || platform === "youtube_short";

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-2 animate-in fade-in duration-200 ${isShort ? "md:p-12" : ""}`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      <div
        className="relative animate-in zoom-in-95 duration-300 flex flex-col gap-2 w-full mx-auto"
        style={{
          width: isShort ? "90%" : "100%",
          maxWidth: isShort ? "420px" : "1024px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="self-end flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold transition-all backdrop-blur-sm"
          aria-label="Cerrar video"
        >
          <X size={14} />
          Cerrar
        </button>

        <div
          className="relative w-full bg-black rounded-xl overflow-hidden shadow-2xl"
          style={{ paddingTop: isShort ? "177.78%" : "56.25%" }}
        >
          <iframe
            ref={iframeRef}
            className="absolute inset-0 w-full h-full"
            src={embedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        <p className="md:hidden text-center text-white/50 text-xs">
          Toca fuera para cerrar
        </p>
      </div>
    </div>
  );
}
