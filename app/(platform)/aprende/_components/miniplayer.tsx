import { Video } from "@/interfaces/aprende";
import { Maximize2, Volume2, VolumeX, X } from "lucide-react";

export default function MiniPlayer({
  video,
  isMuted,
  onToggleMute,
  onMaximize,
  onClose,
}: {
  video: Video;
  isMuted: boolean;
  onToggleMute: () => void;
  onMaximize: () => void;
  onClose: (e?: React.MouseEvent) => void;
}) {
  const isShort = video.category === "shorts";

  // Construir la URL del embed con autoplay para el mini player
  const embedUrl = video.embed_url?.includes("?")
    ? `${video.embed_url}&autoplay=1`
    : `${video.embed_url}?autoplay=1`;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 md:w-96 shadow-2xl rounded-xl overflow-hidden border-2 border-brand">
      <div className="relative bg-card">
        <div className={isShort ? "aspect-[9/16]" : "aspect-video"}>
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={video.title}
          />
        </div>

        <div className="absolute top-2 right-2 flex gap-2">
          {/* Solo mostrar botón de mute para TikTok */}
          {video.platform === "tiktok" && (
            <button
              onClick={onToggleMute}
              className="w-8 h-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center transition-colors"
              aria-label={isMuted ? "Activar sonido" : "Silenciar"}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-foreground" />
              ) : (
                <Volume2 className="w-4 h-4 text-foreground" />
              )}
            </button>
          )}
          <button
            onClick={onMaximize}
            className="w-8 h-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center transition-colors"
            aria-label="Maximizar"
          >
            <Maximize2 className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        <div className="p-3 bg-muted">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-background text-foreground uppercase">
              {video.platform}
            </span>
          </div>
          <h3 className="text-sm font-bold text-foreground line-clamp-1">
            {video.title}
          </h3>
        </div>
      </div>
    </div>
  );
}
