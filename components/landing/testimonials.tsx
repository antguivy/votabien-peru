"use client";

import { cn } from "@/lib/utils";

// Los del equipo son citas reales con nombre
// Los de redes son comentarios reales — cuando los tengas, reemplaza el texto
const TEAM_QUOTES = [
  {
    text: "Empezamos porque no encontrábamos información clara sobre los candidatos. No es un problema de falta de datos, es un problema de comunicación.",
    name: "Brida Cabrera",
  },
  {
    text: "El problema no es la política, es cómo se comunica. Por eso cada dato que publicamos lo pensamos para que cualquiera lo entienda.",
    name: "Paula Fernández",
  },
  {
    text: "Queremos que votar bien sea tan fácil como pedir comida por delivery. Para eso, cada detalle de nuestra plataforma está pensado en la experiencia del usuario.",
    name: "Anthony Villazana",
  },
];

// Comentarios de redes — pon los reales cuando los tengas
const SOCIAL_COMMENTS = [
  {
    text: `
        Dicen que es mejor llevar tu propio lapicero y al marcar no salirte del recuadro a elegir. 
        Juntos haremos el verdadero cambio con nuestro voto a conciencia que nosotros y país merece.💪🙌👏
    `,
    platform: "instagram" as const,
  },
  {
    text: `
        por favor evitar el voto en blanco, en el peor de los casos y no quieren votar por nadie
        entonces pinten su cédula y así no darán opción a nadie más a llenarla.
     `,
    platform: "tiktok" as const,
  },
  {
    text: "Excelente trabajo en momentos de confusión y grave opacidad informativa. ¡Feleicitaciones!",
    platform: "instagram" as const,
  },
  {
    text: `
        por favor AYUDEN y ORIENTEN a sus familiares cómo votar y no desperdiciar votos
        hagan simulacros en casa o
        lleven anotado lo q van a marcar
        es deber d TODOS evitar otra crisis política 🙄
    `,
    platform: "tiktok" as const,
  },
];

const PLATFORM_STYLES = {
  instagram: { color: "#E1306C", label: "Instagram" },
  tiktok: { color: "#69C9D0", label: "TikTok" },
};

export default function Testimonials() {
  return (
    <section className="py-16 md:py-24 bg-muted/20 border-y border-border">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* ── Bloque 1: Citas del equipo fundador ── */}
        {/* Sin título "Lo que dicen" — el contexto lo da la estructura */}
        <div className="mb-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand mb-10">
            Quiénes lo hacen y por qué
          </p>

          {/* Las tres citas en una sola fila visual, separadas por línea */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
            {TEAM_QUOTES.map((q, i) => (
              <div
                key={i}
                className="px-0 md:px-8 py-6 md:py-0 first:pl-0 last:pr-0 flex flex-col gap-4"
              >
                <p className="text-base text-foreground leading-relaxed font-medium">
                  ❝{q.text}❞
                </p>
                <div className="flex items-center gap-3 mt-auto pt-4">
                  <p className="text-sm font-bold text-foreground leading-tight">
                    {q.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Separador con texto ── */}
        <div className="flex items-center gap-4 mb-12">
          <div className="h-px flex-1 bg-border" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/50 whitespace-nowrap">
            Lo que dice la gente
          </p>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* ── Bloque 2: Comentarios de redes — sin cards, flujo de texto ── */}
        {/* Estilo "stream" — como si los estuvieras leyendo en vivo */}
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
          {SOCIAL_COMMENTS.map((comment, i) => {
            const platform = PLATFORM_STYLES[comment.platform];
            return (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-4 py-4 border-b border-border/40 last:border-0",
                  "animate-in fade-in slide-in-from-bottom-2 duration-500",
                )}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Punto de color de plataforma */}
                <div
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: platform.color }}
                />
                <p className="text-base text-muted-foreground leading-relaxed flex-1">
                  {comment.text}
                </p>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider flex-shrink-0 mt-1.5"
                  style={{ color: platform.color }}
                >
                  {platform.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Nota honesta al pie */}
        <p className="mt-10 text-xs text-muted-foreground/40 italic text-center">
          Cuando tengamos más comentarios reales, los ponemos aquí.
        </p>
      </div>
    </section>
  );
}
