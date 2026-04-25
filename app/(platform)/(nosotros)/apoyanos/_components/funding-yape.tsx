"use client";

import { useState } from "react";
import Image from "next/image";
import { Smartphone, Copy, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function FundingYape() {
  const [copied, setCopied] = useState(false);

  // OJO: Asegúrate de tener estas variables en tu .env.local
  const phoneNumber = process.env.NEXT_PUBLIC_YAPE_PHONE || "999 999 999";
  const yapeImage = process.env.NEXT_PUBLIC_YAPE_QR_IMAGE || "";
  // const yapeImage =  "";

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(phoneNumber.replace(/\s/g, "")); // Copia sin espacios
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error al copiar:", error);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto overflow-hidden shadow-sm border-border/60 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row">
        {/* Lado Izquierdo: Información y Copiar */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-center bg-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#722C8E]/10 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-[#722C8E]" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Donar con Yape</h3>
              <p className="text-sm text-muted-foreground">Apoyo directo</p>
            </div>
          </div>

          <p className="text-muted-foreground mb-6 leading-relaxed">
            Tu contribución nos permite mantener VotaBien Perú independiente,
            sin publicidad y accesible para todos los ciudadanos.
          </p>

          <div className="space-y-3 mb-6">
            <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Número oficial
            </label>
            <div className="flex gap-2 items-stretch">
              <div className="flex-1 flex items-center justify-center px-4 py-3 rounded-xl border-2 border-border bg-muted/30 font-mono text-xl tracking-widest font-bold text-foreground">
                {phoneNumber}
              </div>
              <Button
                onClick={handleCopyPhone}
                variant="outline"
                className="h-auto w-14 rounded-xl border-2 hover:bg-muted/50 hover:text-foreground transition-colors"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-tight">
              A nombre de{" "}
              <span className="font-bold">Asociación Civil VotaBien Perú</span>.
              ¡Gracias por tu respaldo institucional!
            </p>
          </div>
        </div>

        {/* Lado Derecho: Código QR */}
        <div className="md:w-[320px] bg-gradient-to-br from-[#722C8E]/5 to-transparent p-2 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-border/60">
          {yapeImage ? (
            <div className="relative w-full h-full rounded-2xl overflow-hidden">
              <Image
                src={yapeImage}
                alt="Código QR de Yape para donar"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 192px, 224px"
              />
            </div>
          ) : (
            // Placeholder en caso de que no haya imagen en el .env
            <div className="w-full h-full bg-muted/50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-border text-center p-4">
              <Smartphone className="w-10 h-10 text-[#722C8E]/40 mb-2" />
              <span className="text-xs font-semibold text-muted-foreground">
                Código QR no configurado
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
