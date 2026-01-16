import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/ui/credenza";
import { ProAudioPlayer } from "./pro-audio-player";

interface PlanGobiernoProps {
  audio_url: string | null;
  government_plan_url: string | null;
  planes: {
    title: string;
    summary: string;
    tags: string[];
    proposals: string[];
    goals: { indicator: string }[];
  }[];
}

const getColorFromTag = (tags: string[]) => {
  const colorMap: Record<string, string> = {
    seguridad: "bg-red-600",
    extorsion: "bg-red-600",
    mineria_ilegal: "bg-amber-600",
    salud: "bg-emerald-600",
    educacion: "bg-blue-600",
    agua_saneamiento: "bg-cyan-600",
    empleo: "bg-purple-600",
    vivienda: "bg-orange-600",
    ambiente: "bg-green-600",
  };
  return colorMap[tags[0]] || "bg-slate-600";
};

const getCategoryLabel = (tags: string[]) => {
  const categoryMap: Record<string, string> = {
    seguridad: "Seguridad",
    extorsion: "Extorsión",
    mineria_ilegal: "Minería",
    salud: "Salud",
    educacion: "Educación",
    agua_saneamiento: "Agua y Saneamiento",
    empleo: "Empleo",
    vivienda: "Vivienda",
    ambiente: "Ambiente",
  };
  return categoryMap[tags[0]] || tags[0];
};

export function PlanGobiernoFlashcards({
  audio_url,
  government_plan_url,
  planes,
}: PlanGobiernoProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Swipe logic states
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Audio states
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
  }, [audio_url]);

  const updateDuration = () => {
    if (audioRef.current && Number.isFinite(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (!planes || planes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-6 h-6" />
            Plan de Gobierno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No se encontró</h3>
            <p className="text-sm text-muted-foreground">
              Este partido aún no ha publicado su plan de gobierno.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPlan = planes?.[currentIndex];

  if (!currentPlan) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          Error al cargar datos.
        </CardContent>
      </Card>
    );
  }

  const handleTouchStart = (e: React.TouchEvent) =>
    setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) =>
    setTouchEnd(e.targetTouches[0].clientX);

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50 && currentIndex < planes.length - 1) nextCard();
    if (distance < -50 && currentIndex > 0) prevCard();
    setTouchStart(0);
    setTouchEnd(0);
  };

  const nextCard = () => {
    if (currentIndex < planes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  return (
    <Card>
      {audio_url && (
        <audio
          ref={audioRef}
          src={audio_url}
          onTimeUpdate={handleAudioTimeUpdate}
          onLoadedMetadata={updateDuration}
          onDurationChange={updateDuration}
          onEnded={handleAudioEnded}
          preload="metadata"
          className="hidden"
        />
      )}

      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="w-6 h-6" />
          Plan de Gobierno
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {audio_url && (
          <div className="mb-4">
            <ProAudioPlayer
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              onTogglePlay={togglePlay}
              onSeek={handleSeek}
              isMuted={isMuted}
              onToggleMute={toggleMute}
              compact={false}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="text-2xl font-light">{planes.length}</div>
            <div className="text-xs text-muted-foreground">Ejes temáticos</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="text-2xl font-light">
              {planes.reduce((acc, p) => acc + p.proposals.length, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Propuestas</div>
          </div>
        </div>

        <div className="space-y-2">
          <Credenza>
            <CredenzaTrigger asChild>
              <Button className="w-full" variant="default">
                <FileText className="w-4 h-4 mr-2" />
                Explorar propuestas
              </Button>
            </CredenzaTrigger>
            <CredenzaContent className="overflow-hidden max-w-6xl px-0 py-4">
              <CredenzaHeader className="sm:p-4 border-b">
                <CredenzaTitle className="flex flex-col lg:flex-row items-center justify-center gap-4 p-0 w-full">
                  {audio_url && (
                    <div className="w-full lg:max-w-md">
                      <ProAudioPlayer
                        isPlaying={isPlaying}
                        currentTime={currentTime}
                        duration={duration}
                        onTogglePlay={togglePlay}
                        onSeek={handleSeek}
                        isMuted={isMuted}
                        onToggleMute={toggleMute}
                        compact={true}
                      />
                    </div>
                  )}
                </CredenzaTitle>
              </CredenzaHeader>

              <CredenzaBody className="overflow-y-auto p-0">
                <div className="max-w-5xl mx-auto p-4">
                  <div
                    className="relative w-full h-[55vh] cursor-pointer"
                    onClick={() => setIsFlipped(!isFlipped)}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div
                      className="w-full h-full transition-transform duration-500"
                      style={{
                        transformStyle: "preserve-3d",
                        transform: isFlipped
                          ? "rotateY(180deg)"
                          : "rotateY(0deg)",
                      }}
                    >
                      <div
                        className="absolute w-full h-full"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        <div className="h-full bg-card rounded-lg border border-border p-4 lg:p-8 flex flex-col justify-between shadow-sm">
                          <div>
                            <div
                              className={`inline-block px-3 py-1 rounded text-xs font-medium text-white mb-4 ${getColorFromTag(
                                currentPlan.tags,
                              )}`}
                            >
                              {getCategoryLabel(currentPlan.tags)}
                            </div>

                            <h2 className="text-2xl lg:text-4xl font-light mb-4 leading-tight">
                              {currentPlan.title}
                            </h2>
                            <p className="text-justify text-base lg:text-lg text-muted-foreground leading-relaxed font-light line-clamp-[8] lg:line-clamp-none">
                              {currentPlan.summary}
                            </p>
                          </div>
                          <div className="text-center pt-4">
                            <p className="text-muted-foreground text-sm font-medium animate-pulse">
                              Toca para ver detalles
                            </p>
                          </div>
                        </div>
                      </div>

                      <div
                        className="absolute w-full h-full"
                        style={{
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                        }}
                      >
                        <div className="h-full bg-card rounded-lg border border-border p-4 pb-0 overflow-y-auto shadow-sm">
                          <div
                            className={`inline-block px-3 py-1 rounded text-xs font-medium text-white mb-4 ${getColorFromTag(
                              currentPlan.tags,
                            )}`}
                          >
                            {getCategoryLabel(currentPlan.tags)}
                          </div>
                          <h3 className="text-xl lg:text-3xl font-light mb-6">
                            {currentPlan.title}
                          </h3>

                          <div className="mb-8">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                              Propuestas principales
                            </h4>
                            <div className="space-y-3">
                              {currentPlan.proposals.map((prop, i) => (
                                <div key={i} className="flex gap-3">
                                  <div
                                    className={`w-1.5 h-1.5 mt-1.5 rounded-full flex-shrink-0 ${getColorFromTag(
                                      currentPlan.tags,
                                    )}`}
                                  ></div>
                                  <p className="text-sm leading-relaxed text-justify">
                                    {prop}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {currentPlan.goals &&
                            currentPlan.goals.length > 0 && (
                              <div>
                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                                  Metas e indicadores
                                </h4>
                                <div className="grid grid-cols-1 gap-2">
                                  {currentPlan.goals.map((meta, i) => (
                                    <div
                                      key={i}
                                      className="bg-muted/30 px-4 py-3 rounded-md border border-border/50 text-sm"
                                    >
                                      {meta.indicator}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          <div className="text-center sticky bottom-0 bg-gradient-to-t from-card via-card to-transparent my-4 py-2">
                            <p className="text-muted-foreground text-xs">
                              Toca para volver
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CredenzaBody>
              <CredenzaFooter className="flex flex-row justify-center sm:justify-center w-full gap-5 sm:p-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevCard}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>

                <div className="text-center w-32">
                  <div className="text-sm font-medium mb-1">
                    {currentIndex + 1} de {planes.length}
                  </div>
                  <div className="text-xs text-muted-foreground truncate px-1">
                    Plan de Gobierno
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextCard}
                  disabled={currentIndex === planes.length - 1}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </CredenzaFooter>
            </CredenzaContent>
          </Credenza>

          {government_plan_url && (
            <Button variant="outline" className="w-full" asChild>
              <Link
                href={government_plan_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                Ver documento completo
                <ExternalLink className="w-3 h-3" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
