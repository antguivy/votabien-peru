"use client";

import Link from "next/link";
import { FileCheck, FileText, Megaphone } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground overflow-hidden">
      {/* Decorative background elements - Optimizado para móvil */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 -left-20 md:left-0 w-64 h-64 md:w-96 md:h-96 bg-primary-foreground rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-20 md:right-0 w-64 h-64 md:w-96 md:h-96 bg-primary-foreground rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-64 h-64 md:w-96 md:h-96 bg-primary-foreground rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:32px_32px] md:bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)]"></div>

      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Main heading - Optimizado para lectura móvil */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight tracking-tight">
              Transparencia en el
              <span className="block mt-2 bg-gradient-to-r from-warning via-warning/90 to-warning/80 bg-clip-text text-transparent animate-gradient">
                Congreso de la República
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-primary-foreground/90 max-w-3xl mx-auto leading-relaxed px-4">
              Accede a información verificada sobre congresistas, expedientes,
              proyectos de ley y su desempeño parlamentario. Todo en un solo
              lugar.
            </p>
          </div>

          {/* CTA Buttons - Stack en móvil, row en desktop */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-12 md:mb-16 px-4">
            <Link
              href="/legisladores"
              className="group inline-flex items-center justify-center px-6 md:px-8 py-3.5 md:py-4 bg-primary-foreground text-primary font-semibold rounded-lg md:rounded-xl hover:bg-primary-foreground/95 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0"
            >
              <svg
                className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Ver Congresistas
            </Link>

            <Link
              href="/partidos"
              className="group inline-flex items-center justify-center px-6 md:px-8 py-3.5 md:py-4 bg-transparent border-2 border-primary-foreground/80 text-primary-foreground font-semibold rounded-lg md:rounded-xl hover:bg-primary-foreground hover:text-primary transition-all duration-300 backdrop-blur-sm"
            >
              <svg
                className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              Ver Partidos
            </Link>
          </div>

          {/* Features - Grid responsivo */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto px-4">
            <div className="group bg-primary-foreground/10 backdrop-blur-md rounded-xl md:rounded-2xl p-5 md:p-6 border border-primary-foreground/20 hover:bg-primary-foreground/15 hover:border-primary-foreground/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="w-11 h-11 md:w-12 md:h-12 bg-warning rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 mx-auto group-hover:scale-110 transition-transform shadow-lg">
                <FileText className="size-8" />
              </div>
              <h3 className="font-semibold text-base md:text-lg mb-2 text-center">
                Expedientes
              </h3>
            </div>

            <div className="group bg-primary-foreground/10 backdrop-blur-md rounded-xl md:rounded-2xl p-5 md:p-6 border border-primary-foreground/20 hover:bg-primary-foreground/15 hover:border-primary-foreground/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="w-11 h-11 md:w-12 md:h-12 bg-success rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 mx-auto group-hover:scale-110 transition-transform shadow-lg">
                <FileCheck className="size-8" />
              </div>
              <h3 className="font-semibold text-base md:text-lg mb-2 text-center">
                Asistencias
              </h3>
            </div>

            <div className="group bg-primary-foreground/10 backdrop-blur-md rounded-xl md:rounded-2xl p-5 md:p-6 border border-primary-foreground/20 hover:bg-primary-foreground/15 hover:border-primary-foreground/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
              <div className="w-11 h-11 md:w-12 md:h-12 bg-info rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-4 mx-auto group-hover:scale-110 transition-transform shadow-lg">
                <Megaphone className="size-8" />
              </div>
              <h3 className="font-semibold text-base md:text-lg mb-2 text-center">
                Proyectos
              </h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
