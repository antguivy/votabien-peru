import React, { useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProAudioPlayerProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  compact?: boolean;
}

function useSimulatedWaveform(bars: number = 50) {
  const [waveform, setWaveform] = useState<number[]>(
    Array.from({ length: bars }, () => 30),
  );

  useEffect(() => {
    setWaveform(
      Array.from({ length: bars }, () =>
        Math.max(30, Math.floor(Math.random() * 100)),
      ),
    );
  }, [bars]);

  return waveform;
}

export function ProAudioPlayer({
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  isMuted,
  onToggleMute,
  compact = false,
}: ProAudioPlayerProps) {
  const waveform = useSimulatedWaveform(compact ? 30 : 50);

  // Validación robusta para la duración
  const validDuration =
    Number.isFinite(duration) && duration > 0 ? duration : 0;

  const progressPercent =
    validDuration > 0 ? (currentTime / validDuration) * 100 : 0;

  const handleWaveClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!validDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    onSeek(percentage * validDuration);
  };

  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time < 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 w-full transition-all select-none",
        compact ? "h-10" : "bg-muted/40 p-4 rounded-xl border border-border/50",
      )}
    >
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onTogglePlay();
        }}
        size="icon"
        className={cn(
          "shrink-0 rounded-full transition-all shadow-sm",
          compact ? "h-8 w-8" : "h-12 w-12",
        )}
      >
        {isPlaying ? (
          <Pause className={compact ? "w-3 h-3" : "w-5 h-5"} />
        ) : (
          <Play className={cn("ml-0.5", compact ? "w-3 h-3" : "w-5 h-5")} />
        )}
      </Button>

      <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
        {/* Barra de tiempo visible incluso en modo compact */}
        <div
          className={cn(
            "flex justify-between text-muted-foreground font-mono uppercase tracking-wider px-1",
            compact ? "text-[9px]" : "text-[10px]",
          )}
        >
          <span>{formatTime(currentTime)}</span>
          {!compact && (
            <div className="flex flex-col justify-center items-center">
              <span>Audio Análisis</span>
              <span>Seguridad, minería, salud, educación y economía</span>
            </div>
          )}
          <span>{formatTime(validDuration)}</span>
        </div>

        <div
          className="relative h-8 w-full flex items-center justify-between gap-[2px] cursor-pointer group touch-none"
          onClick={handleWaveClick}
        >
          {waveform.map((height, index) => {
            const barPercent = (index / waveform.length) * 100;
            const isPlayed = barPercent <= progressPercent;

            return (
              <div
                key={index}
                className={cn(
                  "w-full rounded-full transition-all duration-150 ease-out",
                  isPlayed ? "bg-primary" : "bg-muted-foreground/20",
                  "group-hover:scale-y-110",
                )}
                style={{
                  height: `${isPlayed ? height : height * 0.7}%`,
                  opacity: isPlayed ? 1 : 0.5,
                }}
              />
            );
          })}
          <div className="absolute inset-0 w-full h-full z-10" />
        </div>
      </div>

      {!compact && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleMute}
          className="shrink-0 text-muted-foreground hover:text-foreground hidden sm:flex"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </Button>
      )}
    </div>
  );
}
