"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Users, Columns } from "lucide-react";
import { ProcesoElectoral } from "@/interfaces/politics";
import { calcularDiasRestantes, formatFechaPeru } from "@/lib/utils/date";

const useCountdown = (fechaElecciones?: string) => {
  const [diasRestantes, setDiasRestantes] = useState(() =>
    fechaElecciones ? calcularDiasRestantes(fechaElecciones) : 0,
  );

  useEffect(() => {
    if (!fechaElecciones) return;

    const intervalo = setInterval(
      () => {
        setDiasRestantes(calcularDiasRestantes(fechaElecciones));
      },
      1000 * 60 * 60 * 24,
    );

    return () => clearInterval(intervalo);
  }, [fechaElecciones]);

  const fechaFormateada = useMemo(
    () =>
      fechaElecciones
        ? formatFechaPeru(fechaElecciones)
        : "Fecha no disponible",
    [fechaElecciones],
  );

  return { diasRestantes, fechaFormateada };
};

export default function HeroDualSplit({
  proceso_electoral,
}: {
  proceso_electoral: ProcesoElectoral;
}) {
  const { diasRestantes, fechaFormateada } = useCountdown(
    proceso_electoral.fecha_elecciones,
  );

  return (
    // --- MEJORA: Sección principal es 'flex flex-col' y 'min-h-screen' ---
    // Esto ordena el Título (arriba) y los Paneles (abajo)
    <section className="relative w-full min-h-screen overflow-hidden rounded-md border border-border/40 flex flex-col">
      {/* <div className="absolute inset-0 bg-black/25 mix-blend-multiply z-[1] pointer-events-none" /> */}

      {/* === FONDO GLOBAL === */}
      {/* Se mantiene absoluto y se le da z-0 para estar detrás de todo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 mix-blend-multiply" />
        {/* Imagen izquierda */}
        <div className="absolute top-0 left-0 w-full h-1/2 md:w-1/2 md:h-full">
          <Image
            src="/images/hero-left.jpg"
            alt="Congreso actual"
            fill
            className="object-cover object-center grayscale-[1] brightness-[0.55] contrast-[1.1]"
            priority
          />
        </div>

        {/* Imagen derecha */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 md:top-0 md:left-1/2 md:w-1/2 md:h-full">
          <Image
            src="/images/hero-right.jpg"
            alt="Nuevo Congreso 2026"
            fill
            className="object-cover object-center saturate-[1.15] brightness-[0.65] contrast-[1.05]"
            priority
          />
        </div>

        {/* Gradiente de transición central (solo visible en desktop) */}
        <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-black/60 via-transparent to-black/60" />

        {/* Glow central */}
        <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 bg-white/5 blur-3xl rounded-full pointer-events-none" />
      </div>

      {/* === TÍTULO CENTRAL (Parte del flow) === */}
      {/* MEJORA: 
        - Es 'relative z-10' (en lugar de 'absolute z-20')
        - 'flex-1' hace que ocupe el espacio disponible
        - 'justify-center' centra el contenido verticalmente
        - Esto "empuja" los paneles hacia abajo de forma natural
      */}
      <motion.div
        className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 pt-24 pb-16 md:pt-32 md:pb-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-center bg-gradient-to-r from-primary via-white to-warning bg-clip-text text-transparent drop-shadow-2xl">
          2026: El Año del Cambio Democrático
        </h1>
        <p className="mt-4 text-base md:text-lg text-white/80 max-w-2xl mx-auto font-medium drop-shadow">
          Del Congreso Unicameral al nuevo Sistema Bicameral.
        </p>
        <p className="mt-2 text-sm text-white font-semibold">
          Elecciones el <span>{fechaFormateada}</span> —{" "}
          <span className="text-warning font-bold">{diasRestantes}</span> días
          restantes.
        </p>
      </motion.div>

      {/* === PANELES DE CONTENIDO (Parte del flow) === */}
      {/* MEJORA: 
        - Es 'relative z-10' (en lugar de 'z-30')
        - Ya no necesita 'absolute'. Sigue al Título.
      */}
      <div className="relative z-10 flex flex-col md:flex-row">
        {/* PANEL IZQUIERDO */}
        <motion.div
          className="relative w-full md:w-1/2 flex overflow-hidden group border-r border-white/10"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Overlay oscuro */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />

          {/* MEJORA: 
            - Reducimos el 'min-h' porque el título ya ocupa espacio.
            - Esto evita que la página sea excesivamente larga.
          */}
          <div className="relative z-10 flex flex-col justify-end w-full h-full text-white p-8 md:p-12 min-h-[60vh] md:min-h-[50vh]">
            <div className="md:max-w-md ml-auto text-center md:text-right flex flex-col items-center md:items-end">
              <div className="w-16 h-16 mb-6 rounded-2xl flex items-center justify-center bg-white/10 border border-white/20 backdrop-blur-sm">
                <Users className="w-8 h-8 text-white" />
              </div>

              <span className="inline-flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-xs font-bold text-white/80 mb-4">
                ACTUAL
              </span>

              <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Congreso 2021-2026
              </h3>
              <p className="text-lg text-white/80 mb-6">Sistema Unicameral</p>

              <div className="w-full max-w-sm space-y-3 mb-8">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm">
                  <span className="text-sm text-white/90">Cámara Única</span>
                  <span className="text-2xl font-bold text-white">130</span>
                </div>
              </div>

              <Link
                href="/legisladores"
                className="relative inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition-shadow shadow-lg"
              >
                Ver Congresistas Actuales
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* PANEL DERECHO */}
        <motion.div
          className="relative w-full md:w-1/2 flex overflow-hidden group"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          {/* Overlay tintado */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-primary/30 to-transparent" />

          <div className="relative z-10 flex flex-col justify-end w-full h-full text-white p-8 md:p-12 min-h-[60vh] md:min-h-[50vh]">
            <div className="md:max-w-md mr-auto text-center md:text-left flex flex-col items-center md:items-start">
              <div className="w-16 h-16 mb-6 rounded-2xl flex items-center justify-center bg-warning/20 border border-warning/30 backdrop-blur-sm">
                <Columns className="w-8 h-8 text-warning" />
              </div>

              <span className="inline-flex items-center bg-warning/20 backdrop-blur-sm border border-warning/30 rounded-full px-3 py-1 text-xs font-bold text-warning mb-4">
                DESDE 2026
              </span>

              <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Nuevo Congreso 2026
              </h3>
              <p className="text-lg text-warning mb-6">Sistema Bicameral</p>

              <div className="w-full max-w-sm space-y-3 mb-8">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm">
                  <div className="text-sm font-semibold">
                    <span className="text-info">60 Senadores</span>
                    <span className="text-white/80"> + </span>
                    <span className="text-warning">130 Diputados</span>
                  </div>
                  <span className="text-2xl font-bold text-white">190</span>
                </div>
              </div>

              <Link
                href="#sistema-bicameral"
                className="relative inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-warning to-warning/90 text-warning-foreground font-semibold hover:brightness-105 transition-shadow shadow-lg"
              >
                Entiende el Cambio
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* MEJORA: 
        - Eliminado el gradiente inferior 'absolute'.
        - Los gradientes 'from-black/90' dentro de cada panel ya hacen ese trabajo.
        - Esto simplifica el DOM.
      */}
    </section>
  );
}
