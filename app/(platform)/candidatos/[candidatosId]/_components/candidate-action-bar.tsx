"use client";

import Link from "next/link";
import { Share2, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface CandidateActionBarProps {
  candidateName: string;
  shareUrl: string;
}

export function CandidateActionBar({
  candidateName,
  shareUrl,
}: CandidateActionBarProps) {
  const [copied, setCopied] = useState(false);

  // Ocultar MobileBottomNav global mientras esta barra fija de acciones esté activa
  useEffect(() => {
    document.documentElement.classList.add("hide-mobile-bottom-nav");
    return () => {
      document.documentElement.classList.remove("hide-mobile-bottom-nav");
    };
  }, []);

  const handleShare = async () => {
    const shareData = {
      title: `Ficha cívica — ${candidateName}`,
      text: `Conoce los antecedentes, bienes y formación de ${candidateName} en VotaBien Perú.`,
      url: shareUrl,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Ignorar si el usuario canceló el share
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success("Enlace copiado al portapapeles");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("No se pudo copiar el enlace");
      }
    }
  };

  return (
    <aside
      className="fixed bottom-0 inset-x-0 z-50 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-background/95 backdrop-blur-md border-t border-border/70 lg:hidden shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.3)]"
      aria-label="Acciones de la ficha"
    >
      <div className="flex items-center gap-2 max-w-md mx-auto">
        <Link
          href="/candidatos"
          className="p-2.5 rounded-xl border border-border/80 bg-muted/30 text-foreground hover:bg-muted/60 transition-colors shrink-0 flex items-center justify-center"
          aria-label="Volver al listado de candidatos"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <button
          type="button"
          onClick={handleShare}
          className="flex-1 py-2.5 px-4 rounded-xl bg-brand text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Share2 className="w-3.5 h-3.5" />
          )}
          <span>{copied ? "¡Enlace copiado!" : "Compartir ficha"}</span>
        </button>
      </div>
    </aside>
  );
}
