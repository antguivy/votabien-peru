"use client";

import { Headphones, Radio, ExternalLink } from "lucide-react";

interface PodcastSectionProps {
  spotifyShowId: string;
}

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function AudioWaveform() {
  const bars = [3, 8, 14, 10, 18, 6, 12, 20, 9, 15, 5, 11, 17, 7, 13];
  return (
    <div className="flex items-center justify-center gap-[3px] h-6">
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-brand/40 animate-pulse"
          style={{
            height: `${h}px`,
            animationDelay: `${i * 80}ms`,
            animationDuration: "1.4s",
          }}
        />
      ))}
    </div>
  );
}

function openSpotify(showId: string) {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const webUrl = `https://open.spotify.com/show/${showId}`;
  if (isMobile) {
    window.location.href = `spotify://show/${showId}`;
    setTimeout(
      () => window.open(webUrl, "_blank", "noopener,noreferrer"),
      1500,
    );
  } else {
    window.open(webUrl, "_blank", "noopener,noreferrer");
  }
}

export default function PodcastSection({ spotifyShowId }: PodcastSectionProps) {
  return (
    <section className="relative w-full bg-background border-t border-border overflow-hidden px-5 md:px-8 py-16 md:py-20">
      {/* Decorative background blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-[0.04]"
        style={{ background: "var(--brand)", filter: "blur(60px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-[0.03]"
        style={{ background: "var(--brand)", filter: "blur(50px)" }}
      />

      <div className="relative max-w-lg mx-auto flex flex-col items-center text-center gap-8">
        {/* Icon + waveform */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative w-16 h-16 rounded-2xl flex items-center justify-center border border-border"
            style={{
              background: "color-mix(in oklch, var(--brand) 8%, var(--card))",
            }}
          >
            {/* Subtle ring */}
            <span
              className="absolute inset-0 rounded-2xl opacity-20 border-2"
              style={{ borderColor: "var(--brand)" }}
            />
            <Headphones
              className="size-7"
              style={{ color: "var(--brand)" }}
              strokeWidth={1.5}
            />
          </div>
          <AudioWaveform />
        </div>

        {/* Text */}
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-foreground tracking-tight leading-tight">
            Decisiones Informadas
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Escucha los principales temas de los planes de gobierno de cada
            partido, analizados por expertos.
          </p>
        </div>

        {/* Spotify Button */}
        <button
          onClick={() => openSpotify(spotifyShowId)}
          className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-150 hover:-translate-y-px active:scale-[0.97] hover:shadow-[0_8px_24px_rgba(29,185,84,0.25)]"
          style={{ background: "#1DB954", color: "#000" }}
        >
          <SpotifyIcon className="size-4 shrink-0" />
          Escuchar en Spotify
          <ExternalLink
            className="size-3.5 opacity-60 group-hover:opacity-100 transition-opacity"
            strokeWidth={2.5}
          />
        </button>

        {/* Footer note */}
        <p className="text-[11px] text-muted-foreground/60">
          Abre la app de Spotify o escucha desde el navegador
        </p>
      </div>
    </section>
  );
}
