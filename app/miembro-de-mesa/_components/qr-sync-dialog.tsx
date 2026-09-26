"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { useCopilotoStore } from "../_lib/store";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaDescription,
  CredenzaBody,
  CredenzaClose,
} from "@/components/ui/credenza";
import { Button } from "@/components/ui/button";
import { QrCode, Camera, Check, AlertCircle, X } from "lucide-react";

interface QrSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QrSyncDialog({ open, onOpenChange }: QrSyncDialogProps) {
  const [activeTab, setActiveTab] = useState<"show" | "scan">("show");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Store state to sync
  const completedTasks = useCopilotoStore((s) => s.completedTasks);
  const internalAgreements = useCopilotoStore((s) => s.internalAgreements);
  const votersTarget = useCopilotoStore((s) => s.votersTarget);
  const sheets = useCopilotoStore((s) => s.sheets);
  const syncStateFromQR = useCopilotoStore((s) => s.syncStateFromQR);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Generate QR code with compressed sync payload
  useEffect(() => {
    if (!open || activeTab !== "show") return;

    const payload = {
      type: "VOTABIEN_MESA_SYNC",
      version: 1,
      timestamp: Date.now(),
      completedTasks,
      internalAgreements,
      votersTarget,
      sheets,
    };

    const json = JSON.stringify(payload);
    QRCode.toDataURL(json, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 280,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Error generating QR:", err));
  }, [
    open,
    activeTab,
    completedTasks,
    internalAgreements,
    votersTarget,
    sheets,
  ]);

  // Scan QR from Camera using jsQR
  useEffect(() => {
    if (!open || activeTab !== "scan") {
      stopCamera();
      return;
    }

    let isScanning = true;

    async function startCamera() {
      try {
        setScanError(null);
        setScanSuccess(false);

        const constraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          await videoRef.current.play();
          scanFrame();
        }
      } catch (err: unknown) {
        console.error("Camera access error:", err);
        const error = err as { name?: string; message?: string };
        if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
        ) {
          setScanError(
            "Permiso de cámara denegado. Habilitalo en los ajustes.",
          );
        } else {
          setScanError("No se pudo iniciar la cámara en este dispositivo.");
        }
      }
    }

    function scanFrame() {
      if (!isScanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
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
                // Success! Apply sync
                isScanning = false;
                syncStateFromQR(parsed);
                setScanSuccess(true);
                stopCamera();

                if ("vibrate" in navigator) {
                  navigator.vibrate([100, 50, 100]);
                }

                setTimeout(() => {
                  onOpenChange(false);
                }, 1500);
                return;
              }
            } catch {
              // Not a valid JSON or not a VotaBien QR
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    }

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
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent
        noScroll
        showCloseButton={false}
        className="w-full sm:max-w-md mx-auto max-h-[90vh] bg-background border-border text-foreground p-0 overflow-hidden flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl"
      >
        <CredenzaHeader className="shrink-0 text-left px-5 pt-4 pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-brand">
              <QrCode className="h-4 w-4" />
              <CredenzaTitle className="text-base font-black tracking-tight text-foreground">
                Sincronizar Mesa (100% Offline)
              </CredenzaTitle>
            </div>
            <CredenzaClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </CredenzaClose>
          </div>
          <CredenzaDescription className="text-xs text-muted-foreground leading-relaxed pt-0.5">
            Pasa los acuerdos y el conteo de un teléfono a otro al instante
            mediante código QR, sin necesidad de internet.
          </CredenzaDescription>
        </CredenzaHeader>

        <CredenzaBody className="flex-1 min-h-0 overflow-y-auto px-5 py-3.5 space-y-3">
          {/* Tab Switcher: Mostrar mi QR vs Escanear QR */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-muted/40 rounded-xl border border-border/70">
            <button
              type="button"
              onClick={() => handleTabChange("show")}
              className={`py-2 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
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
              className={`py-2 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
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
                debe tocar <strong>Escanear QR</strong> para recibir tus
                acuerdos y conteo.
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
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                  />
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
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
