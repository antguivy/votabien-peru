"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  User,
  Filter,
  X,
  GraduationCap,
  TrendingUp,
  Podcast,
  VolumeX,
  Volume2,
  MinusSquare,
  ChevronRight,
} from "lucide-react";
import { Category, Video } from "@/interfaces/aprende";
import MiniPlayer from "./miniplayer";
import Image from "next/image";

export default function VisualLearn({ videos }: { videos: Video[] }) {
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">(
    "all",
  );
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const activeVideoRef = useRef<HTMLDivElement>(null);

  const featuredVideo = videos.find((v) => v.is_featured);
  const playingVideo = videos.find((v) => v.id === playingVideoId);

  const filteredVideos = videos.filter(
    (v) =>
      !v.is_featured &&
      (selectedCategory === "all" || v.category === selectedCategory),
  );

  const categories = [
    { id: "all", label: "Todo", icon: Filter },
    { id: "conceptos", label: "Conceptos", icon: GraduationCap },
    { id: "academico", label: "Académico", icon: User },
    { id: "shorts", label: "Shorts", icon: TrendingUp },
    { id: "podcasts", label: "Podcasts", icon: Podcast },
  ];

  const handlePlayVideo = (videoId: string) => {
    setPlayingVideoId(videoId);
    setIsMinimized(false);
  };

  const handleStopVideo = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPlayingVideoId(null);
    setIsMinimized(false);
  };

  const handleMinimize = (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    const video = videos.find((v) => v.id === videoId);
    if (video?.category === "shorts") return;
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
    setTimeout(() => {
      activeVideoRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && playingVideoId) {
        handleStopVideo();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [playingVideoId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background text-foreground">
      {/* HERO DESTACADO */}
      {featuredVideo && (
        <section className="relative pt-16 md:pt-20 pb-8 md:pb-16 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-brand/10 via-transparent to-background" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-brand/5 blur-3xl rounded-full" />

          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="text-center mb-6 md:mb-8">
              <h1 className="text-3xl md:text-5xl font-black mb-3 md:mb-4 bg-gradient-to-r from-brand via-primary to-info bg-clip-text text-transparent px-4">
                Entiende el Sistema Bicameral
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto px-4">
                Aprende con videos educativos verificados sobre las Elecciones
                Generales 2026
              </p>
            </div>

            <div
              className="relative group"
              ref={
                playingVideoId === featuredVideo.id && !isMinimized
                  ? activeVideoRef
                  : null
              }
            >
              {playingVideoId === featuredVideo.id && !isMinimized ? (
                <VideoPlayer
                  video={featuredVideo}
                  onClose={handleStopVideo}
                  onMinimize={(e) => handleMinimize(e, featuredVideo.id)}
                  isMuted={isMuted}
                  onToggleMute={() => setIsMuted(!isMuted)}
                />
              ) : (
                <VideoThumbnail
                  video={featuredVideo}
                  onPlay={() => handlePlayVideo(featuredVideo.id)}
                  isFeatured
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* FILTROS STICKY */}
      <section className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() =>
                    setSelectedCategory(cat.id as Category | "all")
                  }
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full font-semibold text-xs md:text-sm whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-brand text-brand-foreground shadow-lg scale-105"
                      : "bg-muted text-foreground hover:bg-muted/80 hover:scale-105"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span
                    className={`${isActive ? "inline" : "hidden sm:inline"}`}
                  >
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* GRID DE VIDEOS */}
      <section className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Sección de Shorts */}
        {(selectedCategory === "all" || selectedCategory === "shorts") &&
          filteredVideos.some((v) => v.category === "shorts") && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-brand" />
                  Videos Cortos
                </h2>
                {selectedCategory === "all" && (
                  <button
                    onClick={() => setSelectedCategory("shorts")}
                    className="text-sm text-brand hover:text-brand/80 flex items-center gap-1 transition-colors"
                  >
                    Ver todos <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Vista "Todos": Scroll horizontal en desktop y mobile */}
              {selectedCategory === "all" && (
                <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                  {filteredVideos
                    .filter((v) => v.category === "shorts")
                    .slice(0, 6)
                    .map((video) => (
                      <div
                        key={video.id}
                        className="flex-shrink-0 w-[200px] sm:w-[220px] md:w-[240px] snap-center"
                        ref={
                          playingVideoId === video.id && !isMinimized
                            ? activeVideoRef
                            : null
                        }
                      >
                        {playingVideoId === video.id && !isMinimized ? (
                          <VideoPlayer
                            video={video}
                            onClose={handleStopVideo}
                            onMinimize={(e) => handleMinimize(e, video.id)}
                            isMuted={isMuted}
                            onToggleMute={() => setIsMuted(!isMuted)}
                            isShort
                          />
                        ) : (
                          <VideoThumbnail
                            video={video}
                            onPlay={() => handlePlayVideo(video.id)}
                            isShort
                          />
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* Vista "Shorts": Grid en desktop, vertical en mobile */}
              {selectedCategory === "shorts" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {filteredVideos
                    .filter((v) => v.category === "shorts")
                    .map((video) => (
                      <div
                        key={video.id}
                        className="mx-auto w-full max-w-[360px] md:max-w-none"
                        ref={
                          playingVideoId === video.id && !isMinimized
                            ? activeVideoRef
                            : null
                        }
                      >
                        {playingVideoId === video.id && !isMinimized ? (
                          <VideoPlayer
                            video={video}
                            onClose={handleStopVideo}
                            onMinimize={(e) => handleMinimize(e, video.id)}
                            isMuted={isMuted}
                            onToggleMute={() => setIsMuted(!isMuted)}
                            isShort
                          />
                        ) : (
                          <VideoThumbnail
                            video={video}
                            onPlay={() => handlePlayVideo(video.id)}
                            isShort
                          />
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

        {/* Grid de videos regulares */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredVideos
            .filter((v) => v.category !== "shorts")
            .map((video) => (
              <div
                key={video.id}
                className="group"
                ref={
                  playingVideoId === video.id && !isMinimized
                    ? activeVideoRef
                    : null
                }
              >
                {playingVideoId === video.id && !isMinimized ? (
                  <VideoPlayer
                    video={video}
                    onClose={handleStopVideo}
                    onMinimize={(e) => handleMinimize(e, video.id)}
                    isMuted={isMuted}
                    onToggleMute={() => setIsMuted(!isMuted)}
                  />
                ) : (
                  <VideoThumbnail
                    video={video}
                    onPlay={() => handlePlayVideo(video.id)}
                  />
                )}
              </div>
            ))}
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-16">
            <div className="text-muted-foreground text-lg mb-2">
              No hay videos en esta categoría
            </div>
            <button
              onClick={() => setSelectedCategory("all")}
              className="text-brand hover:text-brand/80 text-sm transition-colors"
            >
              Ver todos los videos
            </button>
          </div>
        )}
      </section>

      {/* MINI PLAYER FLOTANTE */}
      {isMinimized && playingVideo && (
        <MiniPlayer
          video={playingVideo}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(!isMuted)}
          onMaximize={handleMaximize}
          onClose={handleStopVideo}
        />
      )}
    </div>
  );
}

// ============= VIDEO PLAYER =============
interface VideoPlayerProps {
  video: Video;
  onClose: (e?: React.MouseEvent) => void;
  onMinimize: (e: React.MouseEvent) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isShort?: boolean;
}

function VideoPlayer({
  video,
  onClose,
  onMinimize,
  isMuted,
  onToggleMute,
  isShort = false,
}: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Solo autoplay, sin parámetros de mute que causen doble audio
  const embedUrl = (() => {
    const baseUrl = video.embed_url || "";
    return baseUrl.includes("?")
      ? `${baseUrl}&autoplay=1`
      : `${baseUrl}?autoplay=1`;
  })();

  // Control de mute solo para TikTok
  useEffect(() => {
    if (video.platform !== "tiktok") return;

    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin === "https://www.tiktok.com" &&
        event.data.type === "onPlayerReady"
      ) {
        if (!isMuted) {
          iframeRef.current?.contentWindow?.postMessage(
            { type: "unMute", "x-tiktok-player": true },
            "*",
          );
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [video.platform, isMuted]);

  useEffect(() => {
    if (video.platform !== "tiktok") return;

    const messageType = isMuted ? "mute" : "unMute";
    iframeRef.current?.contentWindow?.postMessage(
      { type: messageType, "x-tiktok-player": true },
      "*",
    );
  }, [isMuted, video.platform]);

  return (
    <div
      className={`relative rounded-xl overflow-hidden border-2 border-brand bg-card shadow-xl shadow-brand/20 ${isShort ? "aspect-[9/16]" : ""}`}
    >
      <div className={isShort ? "h-full" : "relative aspect-video"}>
        <iframe
          ref={iframeRef}
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={video.title}
        />
      </div>

      {/* Controles superiores */}
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        {/* Solo mostrar control de mute para TikTok */}
        {video.platform === "tiktok" && (
          <button
            onClick={onToggleMute}
            className="w-9 h-9 rounded-full bg-background/80 hover:bg-background flex items-center justify-center transition-colors group backdrop-blur-sm"
            aria-label={isMuted ? "Activar sonido" : "Silenciar"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-foreground group-hover:text-brand transition-colors" />
            ) : (
              <Volume2 className="w-4 h-4 text-foreground group-hover:text-brand transition-colors" />
            )}
          </button>
        )}

        {/* Botón minimizar solo para videos horizontales */}
        {!isShort && (
          <button
            onClick={onMinimize}
            className="w-9 h-9 rounded-full bg-background/80 hover:bg-background flex items-center justify-center transition-colors group backdrop-blur-sm"
            aria-label="Minimizar"
          >
            <MinusSquare className="w-4 h-4 text-foreground group-hover:text-brand transition-colors" />
          </button>
        )}

        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-background/80 hover:bg-background flex items-center justify-center transition-colors group backdrop-blur-sm"
          aria-label="Cerrar video"
        >
          <X className="w-5 h-5 text-foreground group-hover:text-brand transition-colors" />
        </button>
      </div>

      {/* Info del video */}
      <div
        className={`${isShort ? "absolute bottom-0 left-0 right-0" : ""} p-4 bg-gradient-to-t from-background via-background/95 to-transparent`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`px-2 py-1 rounded text-xs font-bold ${
              video.creator_type === "oficial"
                ? "bg-brand/20 text-brand"
                : video.creator_type === "academico"
                  ? "bg-info/20 text-info"
                  : "bg-success/20 text-success"
            }`}
          >
            {video.creator_name}
          </span>
          <span className="px-2 py-1 rounded text-xs font-bold bg-muted text-muted-foreground uppercase">
            {video.platform}
          </span>
        </div>
        <h3 className="font-bold text-foreground text-sm md:text-base line-clamp-2">
          {video.title}
        </h3>
      </div>
    </div>
  );
}

// ============= VIDEO THUMBNAIL =============
function VideoThumbnail({
  video,
  onPlay,
  isFeatured = false,
  isShort = false,
}: {
  video: Video;
  onPlay: () => void;
  isFeatured?: boolean;
  isShort?: boolean;
}) {
  return (
    <div
      className="cursor-pointer group"
      onClick={onPlay}
      role="button"
      tabIndex={0}
      aria-label={`Reproducir ${video.title}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPlay();
        }
      }}
    >
      <div
        className={`relative rounded-xl overflow-hidden ${
          isFeatured
            ? "border-2 border-brand/40 shadow-2xl shadow-brand/20 hover:border-brand/60 hover:shadow-brand/30"
            : "border border-border bg-card hover:border-brand/50 hover:shadow-xl hover:shadow-brand/10"
        } transition-all`}
      >
        <div
          className={`relative ${isShort ? "aspect-[9/16]" : "aspect-video"}`}
        >
          <Image
            src={video.thumbnail || "/api/placeholder/400/225"}
            alt=""
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            fill
            unoptimized={video.thumbnail?.includes("tiktokcdn")}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={isFeatured}
          />
          <div className="absolute inset-0" />

          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div
              className={`${isFeatured ? "w-20 h-20 md:w-24 md:h-24" : "w-14 h-14 md:w-16 md:h-16"} rounded-full bg-brand/90 group-hover:bg-brand flex items-center justify-center shadow-2xl transition-all group-hover:scale-110`}
            >
              <Play
                className={`${isFeatured ? "w-10 h-10 md:w-12 md:h-12" : "w-7 h-7 md:w-8 md:h-8"} text-brand-foreground fill-brand-foreground ml-1`}
              />
            </div>
          </div>

          {/* Badge de plataforma */}
          <div className="absolute top-3 right-3 px-2 py-1 rounded bg-background/80 text-foreground text-xs font-bold uppercase">
            {video.platform}
          </div>
        </div>

        {/* Info de la card */}
        <div className={`${isFeatured ? "p-4 md:p-6" : "p-3 md:p-4"}`}>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className={`px-2 py-0.5 md:px-3 md:py-1 rounded text-xs font-bold ${
                video.creator_type === "oficial"
                  ? "bg-brand/20 text-brand"
                  : video.creator_type === "academico"
                    ? "bg-info/20 text-info"
                    : "bg-success/20 text-success"
              }`}
            >
              {video.creator_name}
            </span>
          </div>
          <h3
            className={`font-bold text-foreground mb-1 line-clamp-2 group-hover:text-brand transition-colors ${
              isFeatured ? "text-xl md:text-2xl mb-2" : "text-sm md:text-base"
            }`}
          >
            {video.title}
          </h3>
          {!isShort && (
            <p
              className={`text-muted-foreground text-xs md:text-sm line-clamp-2 ${isFeatured ? "mb-0" : "mb-2"}`}
            >
              {video.description.split(/\r?\n/).map((line, i) => (
                <span key={i}>
                  {line}
                  {i < video.description.split(/\r?\n/).length - 1 && <br />}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
