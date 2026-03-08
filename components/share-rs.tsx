"use client";

import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAnalytics } from "@/hooks/use-analytics";
import Link from "next/link";

interface ShareButtonProps {
  title: string;
  text?: string;
  url: string;
  className?: string;
  trackingId: string;
  trackingType: "candidato" | "partido" | "resultado";
  whatsappText?: string;
}

export function ShareButton({
  title,
  text,
  url,
  className,
  trackingId,
  trackingType,
  whatsappText,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const { trackCompartir, trackCompartirExitoso, trackCompartirCancelado } =
    useAnalytics();
  const shareText =
    text ?? `Conoce más sobre ${title} en Vota Bien Perú antes de votar.`;

  const handleShare = async () => {
    trackCompartir(trackingType, trackingId);

    // Mobile: Web Share API → panel nativo
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url });
        trackCompartirExitoso(trackingType, trackingId);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          trackCompartirCancelado(trackingType, trackingId);
        }
      }
      return;
    }

    // Desktop: fallback popover con copia de enlace
    setOpen(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // fallback Safari antiguo
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className={cn(
            "gap-2 rounded-full h-9 px-4 text-sm mt-4 font-medium border-border/60 hover:border-primary/40 transition-all cursor-pointer",
            className,
          )}
        >
          <Share2 className="w-4 h-4" />
          Compartir
        </Button>
      </PopoverTrigger>

      {/* Solo se muestra en desktop (isMobile hace early return antes de setOpen) */}
      <PopoverContent className="w-72 p-3" align="end" sideOffset={8}>
        {whatsappText && (
          <Link
            href={`https://wa.me/?text=${encodeURIComponent(`${whatsappText} ${url}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] font-bold text-xs hover:bg-[#25D366]/15 transition-colors mb-2"
          >
            {/* WhatsApp SVG */}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967..." />
            </svg>
            Compartir por WhatsApp
          </Link>
        )}
        <p className="text-xs font-semibold text-foreground mb-2">
          Copiar enlace
        </p>
        <div className="flex gap-2">
          <Input
            readOnly
            value={url}
            className="h-9 text-xs font-mono bg-muted border-border/50 truncate"
            onFocus={(e) => e.target.select()}
          />
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 shrink-0"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
        {copied && (
          <p className="text-[11px] text-green-600 mt-1.5 font-medium">
            ¡Enlace copiado!
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
