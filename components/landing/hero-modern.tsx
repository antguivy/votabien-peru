"use client";
import Image from "next/image";
import Link from "next/link";
// import { useEffect, useMemo, useState, useRef } from "react";

interface ElectoralProcess {
  election_date?: string;
}
interface HeroModernProps {
  proceso_electoral: ElectoralProcess;
}

// function calcDias(fecha: string) {
//   return Math.ceil(
//     (new Date(fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
//   );
// }

// function useCountdown(fechaElecciones?: string) {
//   const [dias, setDias] = useState(() =>
//     fechaElecciones ? calcDias(fechaElecciones) : 0,
//   );
//   useEffect(() => {
//     if (!fechaElecciones) return;
//     const t = setInterval(
//       () => setDias(calcDias(fechaElecciones)),
//       1000 * 60 * 60,
//     );
//     return () => clearInterval(t);
//   }, [fechaElecciones]);
//   const fechaFormateada = useMemo(
//     () =>
//       fechaElecciones
//         ? new Date(fechaElecciones).toLocaleDateString("es-PE", {
//             year: "numeric",
//             month: "long",
//             day: "numeric",
//           })
//         : "",
//     [fechaElecciones],
//   );
//   return { dias, fechaFormateada };
// }

// function AnimatedNumber({ value }: { value: number }) {
//   const [displayed, setDisplayed] = useState(0);
//   const prevRef = useRef(0);
//   useEffect(() => {
//     if (value === 0) return;
//     const start = prevRef.current;
//     const startTime = performance.now();
//     const tick = (now: number) => {
//       const p = Math.min((now - startTime) / 1400, 1);
//       const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
//       setDisplayed(Math.round(start + (value - start) * eased));
//       if (p < 1) requestAnimationFrame(tick);
//     };
//     requestAnimationFrame(tick);
//     prevRef.current = value;
//   }, [value]);
//   return <>{displayed}</>;
// }

export default function HeroModern({ proceso_electoral }: HeroModernProps) {
  // const { dias } = useCountdown(proceso_electoral.election_date);
  // const [mounted, setMounted] = useState(false);
  // useEffect(() => setMounted(true), []);

  return (
    <section className="w-full bg-background px-0 md:px-6 lg:px-8 pt-16 md:pt-6 pb-8 md:pb-12">
      {/* Ajustamos el borde redondeado: sin bordes en móvil (rounded-none), bordes redondeados en desktop (md:rounded-3xl) */}
      <div className="relative w-full rounded-none md:rounded-3xl overflow-hidden h-[62vh] md:h-[540px] lg:h-[580px]">
        <Image
          src="/images/hero-left.jpg"
          alt="Ciudadanos informándose para votar"
          fill
          className="object-cover object-center"
          priority
          sizes="(max-width: 768px) 100vw, 1400px"
        />

        {/* Gradiente direccional */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Contenido */}
        <div className="absolute inset-0 flex flex-col justify-end md:justify-center px-6 sm:px-10 md:px-14 lg:px-16 pb-12 md:pb-0">
          <div className="max-w-lg">
            <h1 className="font-bold text-white leading-[1.1] tracking-tight text-4xl sm:text-5xl lg:text-[3.25rem] mb-5">
              Infórmate,{" "}
              <span className="text-brand block mt-1">tu voto Importa</span>
            </h1>

            {/* Párrafo reescrito enfocado en ser una plataforma de información clara */}
            <p className="text-white/80 leading-relaxed text-sm md:text-base mb-8 max-w-md">
              VotaBien Perú es una plataforma ciudadana que promueve la
              transparencia, el acceso a información confiable y la
              participación de todos en los asuntos públicos. Buscamos acercar
              la política a las personas, fomentar la educación cívica y ayudar
              a que cada ciudadano pueda informarse, involucrarse y tomar
              decisiones conscientes para construir una sociedad más informada y
              participativa.
            </p>

            {/* Botones de acción */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/apoyanos"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-full border-2 border-white text-white text-sm font-semibold hover:bg-white/15 transition-colors duration-200"
              >
                Apóyanos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
