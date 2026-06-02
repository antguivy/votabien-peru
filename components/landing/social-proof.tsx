"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { HitoBasic } from "@/interfaces/hito";
import { Calendar, MapPin, ArrowRight } from "lucide-react";

interface SocialProofProps {
  hitos: HitoBasic[];
}

function EventCard({
  event,
  isFuture,
}: {
  event: HitoBasic;
  isFuture: boolean;
}) {
  const dateStr = new Date(event.date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden bg-[#2B4E46] hover:bg-white cursor-pointer shadow-md hover:shadow-xl transition-colors duration-300 group h-full">
      {/* ── Contenedor de Imagen ── */}
      <div className="relative w-full aspect-[4/3] md:aspect-[3/2] p-0 group-hover:p-4 transition-all duration-300 ease-in-out">
        <div className="relative w-full h-full overflow-hidden rounded-none group-hover:rounded-xl bg-gray-100 transition-all duration-300 ease-in-out">
          {event.photo_url ? (
            <>
              <Image
                src={event.photo_url}
                alt={event.title}
                fill
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#1f3832] group-hover:bg-gray-100 transition-colors duration-300 p-6 text-center">
              <Calendar className="w-12 h-12 text-white/20 group-hover:text-gray-400 mb-2" />
              <span className="text-xl md:text-2xl font-bold text-white/20 group-hover:text-gray-400 select-none transition-colors duration-300">
                {event.label || "Evento"}
              </span>
            </div>
          )}

          {/* Badges Flotantes */}
          <div className="absolute top-3 left-3 flex gap-2 z-10">
            {event.label && (
              <span className="px-3 py-1 rounded-full bg-white/90 text-[#2B4E46] text-[11px] font-bold shadow-sm">
                {event.label}
              </span>
            )}
            {isFuture && (
              <span className="px-3 py-1 rounded-full bg-green-500 text-white text-[11px] font-bold shadow-sm animate-pulse">
                PRÓXIMO
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Contenedor de Texto ── */}
      <div className="flex flex-col flex-1 px-5 pb-6 md:px-6 md:pb-8 pt-4">
        <h3 className="text-lg md:text-xl text-white group-hover:text-gray-900 font-bold leading-tight mb-2 transition-colors duration-300">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-sm text-white/80 group-hover:text-gray-600 line-clamp-2 md:line-clamp-3 transition-colors duration-300 mb-4">
            {event.description}
          </p>
        )}

        <div className="mt-auto space-y-2 pt-2">
          <div className="flex items-center gap-2 text-xs text-white/70 group-hover:text-gray-500 transition-colors duration-300">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium">{dateStr}</span>
          </div>

          {event.location && (
            <div className="flex items-center gap-2 text-xs text-white/70 group-hover:text-gray-500 transition-colors duration-300">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {isFuture && event.registration_url && (
            <a
              href={event.registration_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-[#b4d241] group-hover:text-[#2B4E46] hover:underline transition-colors duration-300"
            >
              Inscribirse aquí
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SocialProof({ hitos }: SocialProofProps) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // Usamos setTimeout para que la actualización del estado no sea sincrónica
    // dentro del efecto, evitando la queja de "cascading renders".
    const timer = setTimeout(() => {
      setNow(Date.now());
    }, 1);
    return () => clearTimeout(timer);
  }, []);

  if (now === null) {
    // Renderizamos null en el servidor y en el primer frame del cliente
    // para evitar cualquier hidratación incorrecta o errores de pureza.
    return null;
  }

  const upcomingEvents = hitos.filter((h) => new Date(h.date).getTime() > now);
  const pastEvents = hitos
    .filter((h) => new Date(h.date).getTime() <= now)
    .reverse(); // Recientes primero

  // Mostramos máximo 6 en total para no saturar
  const displayEvents = [...upcomingEvents, ...pastEvents].slice(0, 6);

  if (displayEvents.length === 0) return null;

  return (
    <section className="w-full bg-[#2B4E46] px-6 md:px-10 lg:px-16 py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        {/* ── Header ── */}
        <div className="mb-10 md:mb-16 max-w-xl">
          <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3 md:mb-4">
            Cartelera
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Nuestros Eventos
          </h2>
          <p className="text-sm md:text-base text-white/80 leading-relaxed mb-6 font-medium">
            Llevamos nuestras herramientas a universidades, medios y espacios
            públicos para acercar la información política a todos los
            ciudadanos. ¡Únete a nuestras próximas actividades!
          </p>
        </div>

        {/* ── Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {displayEvents.map((event) => {
            const isFuture = new Date(event.date).getTime() > now;
            return (
              <EventCard key={event.id} event={event} isFuture={isFuture} />
            );
          })}
        </div>
      </div>
    </section>
  );
}
