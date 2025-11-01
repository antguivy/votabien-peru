"use client";

import { useState, useEffect } from "react";
import { X, Play } from "lucide-react";

interface YouTubeVideoDialogProps {
  videoId: string;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  buttonClassName?: string;
  autoplay?: boolean;
}

export default function YouTubeVideoDialog({
  videoId,
  buttonText = "Ver Video",
  buttonIcon = <Play className="w-4 h-4" />,
  buttonClassName = "relative inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-warning to-warning/90 text-warning-foreground font-semibold hover:brightness-105 transition-shadow shadow-lg",
  autoplay = true,
}: YouTubeVideoDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Prevenir scroll cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Cerrar con tecla ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  const getYouTubeEmbedUrl = () => {
    const baseUrl = `https://www.youtube.com/embed/${videoId}`;
    const params = new URLSearchParams({
      autoplay: autoplay ? "1" : "0",
      rel: "0",
      modestbranding: "1",
    });
    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <>
      {/* Botón trigger */}
      <button onClick={() => setIsOpen(true)} className={buttonClassName}>
        {buttonText}
        {buttonIcon}
      </button>

      {/* Dialog/Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Modal Content */}
          <div
            className="relative w-full max-w-5xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-12 right-0 md:-right-12 md:top-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 z-10"
              aria-label="Cerrar video"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video Container */}
            <div className="relative w-full bg-black rounded-lg md:rounded-xl overflow-hidden shadow-2xl">
              <div className="relative pt-[56.25%]">
                {" "}
                {/* 16:9 Aspect Ratio */}
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={getYouTubeEmbedUrl()}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Mobile hint */}
            <div className="md:hidden text-center mt-4 text-white/60 text-sm">
              Toca fuera del video para cerrar
            </div>
          </div>
        </div>
      )}
    </>
  );
}
