"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { useCopilotoStore } from "../_lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { QrCode, Camera, Check, AlertCircle } from "lucide-react";

interface QrSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QrSyncDialog({ open, onOpenChange }: QrSyncDialogProps) {
  const [activeTab, setActiveTab] = useState<"show" | "scan">("show");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Store state
  const internalAgreements = useCopilotoStore((s) => s.internalAgreements);
  const votersTarget = useCopilotoStore((s) => s.votersTarget);
  const completedTasks = useCopilotoStore((s) => s.completedTasks);
  const sheets = useCopilotoStore((s) => s.sheets);
  const sealedEnvelopes = useCopilotoStore((s) => s.sealedEnvelopes);
  const syncStateFromQR = useCopilotoStore((s) => s.syncStateFromQR);

  // Video & Canvas references for scanning
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Generate QR Code when dialog opens on "show" tab
  useEffect(() => {
    if (!open || activeTab !== "show") return;

    const payload = {
      type: "VOTABIEN_MESA_SYNC",
      v: 1,
      internalAgreements,
      votersTarget,
      completedTasks,
      sheets,
      sealedEnvelopes,
    };

    const serialized = JSON.stringify(payload);
    QRCode.toDataURL(serialized, {
      width: 280,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err: unknown) => console.error("Error generating QR", err));
  }, [
    open,
    activeTab,
    internalAgreements,
    votersTarget,
    completedTasks,
    sheets,
    sealedEnvelopes,
  ]);

  // Handle Camera Scanning
  useEffect(() => {
    if (!open || activeTab !== "scan") {
      stopCamera();
      return;
    }

    let isScanning = true;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          if (isScanning) {
            setScanError("Tu navegador no soporta acceso a la cámara.");
          }
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        streamRef.current = stream;

        if (videoRef.current && isScanning) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          await videoRef.current.play();
          scanFrame();
        }
      } catch (err: unknown) {
        console.error("Camera access error:", err);
        if (isScanning) {
          setScanError(
            "No se pudo acceder a la cámara. Revisa los permisos de tu navegador.",
          );
        }
      }
    };

    const scanFrame = () => {
      if (!isScanning) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameId.current = requestAnimationFrame(scanFrame);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        try {
          const parsed = JSON.parse(code.data);
          if (parsed.type === "VOTABIEN_MESA_SYNC") {
            if ("vibrate" in navigator) {
              try {
                navigator.vibrate([40, 60, 40]);
              } catch {}
            }

            syncStateFromQR(parsed);
            setScanSuccess(true);
            stopCamera();

            setTimeout(() => {
              onOpenChange(false);
            }, 1200);
            return;
          }
        } catch {
          // Not a valid Copiloto sync QR, keep scanning
        }
      }

      animationFrameId.current = requestAnimationFrame(scanFrame);
    };

    startCamera();

    return () => {
      isScanning = false;
      stopCamera();
    };
  }, [open, activeTab, syncStateFromQR, onOpenChange, stopCamera]);

  const handleTabChange = (tab: "show" | "scan") => {
    setScanSuccess(false);
    setScanError(null);
    setActiveTab(tab);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[92vh] overflow-y-auto bg-background border-border p-4 text-foreground">
        <DialogHeader className="text-left pb-2 border-b border-border/60">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-black tracking-tight flex items-center gap-2">
              <QrCode className="h-4 w-4 text-brand" />
              <span>Sincronizar Mesa (100% Offline)</span>
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Pasa los datos de la mesa de un teléfono a otro al instante mediante
            código QR, sin necesidad de internet.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher: Mostrar mi QR vs Escanear QR */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-muted/40 rounded-xl border border-border/70 my-2">
          <button
            type="button"
            onClick={() => handleTabChange("show")}
            className={`py-1.5 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "show"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>Mostrar mi QR</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("scan")}
            className={`py-1.5 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "scan"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Escanear QR</span>
          </button>
        </div>

        {/* Tab 1: Mostrar QR */}
        {activeTab === "show" && (
          <div className="flex flex-col items-center justify-center space-y-3 py-2">
            <div className="p-3 bg-white rounded-2xl border-2 border-border shadow-xs">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="Código QR de sincronización de mesa"
                  className="w-56 h-56 object-contain"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-xs text-muted-foreground font-mono">
                  Generando QR...
                </div>
              )}
            </div>

            <p className="text-[11.5px] text-muted-foreground text-center leading-relaxed max-w-xs">
              Mostrale este código al otro miembro de mesa. Desde su Copiloto
              debe tocar <strong>Escanear QR</strong> para recibir tus acuerdos
              y conteo.
            </p>
          </div>
        )}

        {/* Tab 2: Escanear QR */}
        {activeTab === "scan" && (
          <div className="space-y-3 py-2">
            {scanSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-500/15 border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Check className="h-6 w-6 stroke-[3]" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-tight">
                  ¡Mesa Sincronizada!
                </h4>
                <p className="text-xs text-muted-foreground">
                  Se actualizaron los acuerdos y los datos de la mesa en tu
                  dispositivo.
                </p>
              </div>
            ) : scanError ? (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Error de Cámara</span>
                </div>
                <p>{scanError}</p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-border aspect-square bg-black flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />

                {/* Target overlay scan box */}
                <div className="absolute inset-0 border-2 border-brand/50 m-12 rounded-2xl pointer-events-none animate-pulse flex items-center justify-center">
                  <span className="text-[10px] font-mono font-bold text-white bg-black/60 px-2 py-0.5 rounded">
                    Apuntá al QR del otro miembro
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
