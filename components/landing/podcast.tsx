"use client";

import { Headphones, ExternalLink } from "lucide-react";

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
  const bars = [4, 8, 12, 8, 16, 6, 10, 18, 9, 14, 5, 10, 15, 7, 12];
  return (
    <div className="flex items-center gap-[3px] h-6">
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-brand/60 animate-pulse"
          style={{
            height: `${h}px`,
            animationDelay: `${i * 120}ms`,
            animationDuration: "1.5s",
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
    <section className="w-full bg-background border-t border-border px-5 md:px-8 py-16 md:py-24">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12 bg-card border border-border rounded-2xl p-6 md:p-10 shadow-sm transition-all duration-300 hover:shadow-md">
        {/* Left side: Icon + Waveform */}
        <div className="flex-shrink-0 flex flex-col items-center gap-4">
          <div className="relative w-20 h-20 rounded-xl bg-muted/50 border border-border flex items-center justify-center">
            <Headphones className="size-8 text-foreground" strokeWidth={1.5} />
            {/* Subtle glow behind icon */}
            <div className="absolute inset-0 bg-brand/10 blur-xl rounded-full pointer-events-none" />
          </div>
          <AudioWaveform />
        </div>

        {/* Right side: Text and Button */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4 flex-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <SpotifyIcon className="size-4 text-[#1DB954]" />
            <span>VotaBien Podcast</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight tracking-tight max-w-sm">
            Análisis profundo de los planes de gobierno
          </h2>

          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-md">
            Escucha nuestro podcast donde desglosamos las propuestas clave,
            entrevistamos a expertos y analizamos el panorama político con total
            neutralidad.
          </p>

          <button
            onClick={() => openSpotify(spotifyShowId)}
            className="group mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-background hover:bg-muted font-semibold text-sm text-foreground transition-all active:scale-[0.98]"
          >
            Escuchar episodio más reciente
            <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </div>
      </div>
    </section>
  );
}
