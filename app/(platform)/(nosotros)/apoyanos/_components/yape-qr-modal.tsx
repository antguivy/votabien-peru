"use client";

import { useState } from "react";
import { Copy, Check, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";

interface YapeQrModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function YapeQrModal({ open, onOpenChange }: YapeQrModalProps) {
  const [copied, setCopied] = useState(false);
  const phoneNumber = process.env.NEXT_PUBLIC_YAPE_PHONE || "";
  const yapeImage = process.env.NEXT_PUBLIC_YAPE_QR_IMAGE || "";

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(phoneNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error al copiar:", error);
    }
  };

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-md">
        <CredenzaHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#722C8E]/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-[#722C8E]" />
            </div>
            <CredenzaTitle className="text-2xl">Donar con Yape</CredenzaTitle>
          </div>
          <CredenzaDescription>
            Escanea el código QR o usa el número de teléfono para realizar tu
            donación.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          {/* QR Code */}
          <div className="flex justify-center py-6">
            <div className="relative w-64 h-64 rounded-2xl overflow-hidden border-4 border-[#722C8E]/20 shadow-lg">
              {/* Placeholder - Reemplaza con tu QR real */}
              <div className="w-full h-full bg-gradient-to-br from-[#722C8E]/10 to-[#722C8E]/5 flex items-center justify-center">
                {yapeImage ? (
                  <div className="text-center p-6">
                    <Smartphone className="w-16 h-16 text-[#722C8E] mx-auto mb-4" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Imagen QR
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Usar: https://...
                    </p>
                  </div>
                ) : (
                  <Image
                    src={yapeImage}
                    alt="QR Yape"
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Número de teléfono */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              O envía directamente al número:
            </label>
            <div className="flex gap-2 items-center">
              <div className="flex-1 px-4 py-3 rounded-lg border border-border bg-muted/50 font-mono text-lg font-semibold text-center">
                {phoneNumber}
              </div>
              <Button
                onClick={handleCopyPhone}
                variant="outline"
                size="icon"
                className="flex-shrink-0 "
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          {/* EVALUAR SI VA O NO VA */}
          {/* Nota */}
          {/* <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Nota:</span> Por
              favor, incluye tu nombre o correo en la descripción del Yape si
              deseas un agradecimiento público.
            </p>
          </div> */}

          {/* NOTA DE AGRADECIMIENTO */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Nota:</span> Las
              donaciones por Yape se reciben a nombre de uno de los
              coordinadores del proyecto, ya que somos un equipo colaborativo
              sin personería jurídica.
            </p>
          </div>
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
