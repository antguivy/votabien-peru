"use client";

import Image from "next/image";
import { HitoBasic } from "@/interfaces/hito";
import { cn } from "@/lib/utils";

interface SocialProofProps {
  hitos: HitoBasic[];
}

interface EventCardProps {
  label: string;
  description?: string | null;
  quote?: string | null;
  photoUrl?: string | null;
  date?: string | null;
}

const PLACEHOLDERS: EventCardProps[] = [
  {
    label: "Taller",
    description: "Próximo evento por anunciar",
    quote: null,
    photoUrl: null,
  },
  {
    label: "Conferencia",
    description: "Próximo evento por anunciar",
    quote: null,
    photoUrl: null,
  },
  {
    label: "Entrevista",
    description: "Próximo evento por anunciar",
    quote: null,
    photoUrl: null,
  },
];

function EventCard({
  photoUrl,
  description,
  quote,
  label,
  date,
}: EventCardProps) {
  const isPlaceholder = !photoUrl;

  return (
    // TARJETA: Fondo verde por defecto, blanco en hover. Usamos "group" para controlar los hijos.
    <div className="flex flex-col rounded-2xl overflow-hidden bg-[#2B4E46] hover:bg-white cursor-pointer shadow-md hover:shadow-xl transition-colors duration-300 group">
      {/* ── Contenedor de Imagen (Efecto Inverso) ── */}
      {/* Inicialmente p-0, en hover cambia a p-4 creando el efecto hacia adentro */}
      <div className="relative w-full aspect-[4/3] md:aspect-[3/2] p-0 group-hover:p-4 transition-all duration-300 ease-in-out">
        {/* El contenedor interno adapta su radio de borde de 0 a redondeado para acompañar el padding */}
        <div className="relative w-full h-full overflow-hidden rounded-none group-hover:rounded-xl bg-gray-100 transition-all duration-300 ease-in-out">
          {photoUrl ? (
            <>
              <Image
                src={photoUrl}
                alt={description ?? "Evento Institucional"}
                fill
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              {/* Badge: Se mantiene en su lugar flotando sobre la imagen */}
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 text-[#2B4E46] text-[11px] font-bold z-10 shadow-sm">
                {label}
              </span>
            </>
          ) : (
            /* Placeholder */
            <div className="w-full h-full flex items-center justify-center bg-[#1f3832] group-hover:bg-gray-100 transition-colors duration-300">
              <span className="text-4xl md:text-5xl font-black text-white/20 group-hover:text-gray-400 select-none transition-colors duration-300">
                {label[0]}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Contenedor de Texto ── */}
      <div className="flex-1 px-5 pb-6 md:px-6 md:pb-8 pt-4">
        <p
          className={cn(
            "text-lg md:text-xl text-white group-hover:text-gray-900 font-bold leading-tight line-clamp-3 md:line-clamp-none transition-colors duration-300",
          )}
        >
          {quote || description}
        </p>
        {date && (
          <p className="text-sm mt-3 line-clamp-1 text-white/70 group-hover:text-gray-500 font-medium transition-colors duration-300">
            {date}
          </p>
        )}
      </div>
    </div>
  );
}

export default function SocialProof({ hitos }: SocialProofProps) {
  const realPhotos = hitos.filter((h) => h.photo_url).slice(0, 3);

  const realCards = realPhotos.map((h) => ({
    id: String(h.id),
    photoUrl: h.photo_url,
    description: h.photo_description,
    quote: h.quote ?? null,
    label: h.label ?? "Evento",
    date: h.date ?? null,
  }));

  const placeholderCards = PLACEHOLDERS.slice(
    0,
    Math.max(0, 3 - realPhotos.length),
  ).map((p, index) => ({
    ...p,
    id: `ph-${index}`,
  }));

  const cards = [...realCards, ...placeholderCards];

  return (
    // Sección principal también con el fondo verde base
    <section className="w-full bg-[#2B4E46] px-6 md:px-10 lg:px-16 py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        {/* ── Header ── */}
        <div className="mb-10 md:mb-16 max-w-xl">
          <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3 md:mb-4">
            Eventos
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Últimos eventos
          </h2>
          <p className="text-sm md:text-base text-white/80 leading-relaxed mb-6 font-medium">
            Llevamos nuestras herramientas a universidades, medios y espacios
            públicos para acercar la información política a todos los
            ciudadanos.
          </p>
        </div>

        {/* ── Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {cards.map((card) => (
            <EventCard
              key={card.id}
              photoUrl={card.photoUrl}
              label={card.label}
              description={card.description}
              quote={card.quote}
              date={card.date}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
