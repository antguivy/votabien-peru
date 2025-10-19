"use client";

import Image from "next/image";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { BackButton } from "@/components/auth/back-button";


interface CardWrapperProps {
  children: React.ReactNode;
  headerLabel: string;
  welcomeMessage?: string;
  backButtonLabel: string;
  backButtonHref: string;
  singleColumn: boolean;
}

export const CardWrapper = ({
  children,
  headerLabel,
  welcomeMessage,
  backButtonLabel,
  backButtonHref,
  singleColumn = false
}: CardWrapperProps) => {
    if (singleColumn) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-6 md:p-8">
            {/* Header con título */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-center mb-2">
                {headerLabel}
              </h1>
              {welcomeMessage && (
                <p className="text-gray-600 text-center text-sm">
                  {welcomeMessage}
                </p>
              )}
            </div>

            {/* Contenido (children) */}
            <div className="mb-6">
              {children}
            </div>

            {/* Back Button */}
            <BackButton href={backButtonHref} label={backButtonLabel} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl overflow-hidden shadow-lg p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Columna izquierda - Formulario */}
          <div className="flex flex-col p-6 md:p-8">
            {/* Header con título */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-center mb-2">
                {headerLabel}
              </h1>
              {welcomeMessage && (
                <p className="text-gray-600 text-center text-sm">
                  {welcomeMessage}
                </p>
              )}
            </div>

            {/* Formulario (children) */}
            <div className="flex-1">
              {children}
            </div>

            {/* Back Button */}
            <div className="mt-6">
              <BackButton href={backButtonHref} label={backButtonLabel} />
            </div>
          </div>

          {/* Columna derecha - Imagen */}
          <div className="relative hidden md:block">
            {/* Logo discreto en esquina superior izquierda */}
            {/* <div className="absolute top-4 left-4 z-10 w-20 h-12">
              <Image
                src={main_logo}
                alt="Logo"
                fill
                priority
                className="object-contain drop-shadow-lg filter invert brightness-0"
              />
            </div> */}

            {/* Imagen de fondo */}
            <Image
              src="/images/ascending.jpg"
              alt="Background"
              fill
              className="h-full w-full object-cover"
            />
            
            {/* Overlay oscuro opcional para mejor contraste del logo */}
            {/* <div className="absolute inset-0 bg-black/20" /> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};