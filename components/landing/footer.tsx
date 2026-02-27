"use client";
import Link from "next/link";
import { ExternalLink, Smartphone, Zap } from "lucide-react";

// Íconos SVG de redes sociales y stores como componentes simples
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const GooglePlayIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M3.18 23.76c.3.17.64.24.99.2l12.6-12.6-2.66-2.66-10.93 15.06zM20.47 10.2L17.6 8.54l-3.02 3.02 3.02 3.02 2.91-1.68c.83-.48.83-1.22-.04-1.7zM2.4.54C2.14.8 2 1.2 2 1.73V22.3c0 .52.14.92.41 1.18l.07.06 11.4-11.4v-.28L2.48.47 2.4.54zM13.88 7.97L3.18.24c-.35-.2-.7-.2-.99-.01l10.91 15.06 2.66-2.66-1.88-4.66z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="relative mt-16 border-t border-border bg-card pb-20 lg:pb-0">
      {/* Franja brand superior */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent" />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-6">
          {/* ── Columna 1: Sobre el proyecto ── */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
              <div className="w-1 h-4 bg-brand rounded-full" />
              VotaBien Perú
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Democratizamos el acceso a información política verificada para
              que cada peruano pueda votar con conocimiento en las elecciones
              2026.
            </p>
            <Link
              href="/equipo"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
            >
              <span>Conocer más</span>
              <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            {/* Redes sociales */}
            <div className="pt-2 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Síguenos
              </p>

              <div className="flex items-center gap-2">
                {[
                  {
                    href: "https://www.facebook.com/profile.php?id=61584547343222",
                    icon: <FacebookIcon />,
                    label: "Facebook",
                    brandColor: "#1877F2",
                  },
                  {
                    href: "https://www.instagram.com/votabienperu_oficial/",
                    icon: <InstagramIcon />,
                    label: "Instagram",
                    brandColor: "#E1306C",
                  },
                  {
                    href: "https://www.tiktok.com/@vota.bien.per",
                    icon: <TikTokIcon />,
                    label: "TikTok",
                    brandColor: "#69C9D0",
                  },
                  // {
                  //   href: "https://linkedin.com/company/votabienperu",
                  //   icon: <LinkedInIcon />,
                  //   label: "LinkedIn",
                  //   brandColor: "#0A66C2",
                  // },
                ].map(({ href, icon, label, brandColor }) => (
                  <Link
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={label}
                    style={
                      {
                        backgroundColor: brandColor,
                      } as React.CSSProperties
                    }
                    className="w-8 h-8 rounded-lg flex items-center justify-center 
                   text-white transition-all duration-200 
                   hover:opacity-80"
                  >
                    {icon}
                    <span className="sr-only">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── Columna 2: Fuentes ── */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
              <div className="w-1 h-4 bg-primary rounded-full" />
              Datos y Fuentes
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Información recopilada de portales oficiales: JNE, ONPE,
              Contraloría y medios periodísticos verificados. Datos públicos
              procesados para que tú decidas mejor.
            </p>
            {/* <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span>Actualizado frecuentemente</span>
            </div> */}
          </div>

          {/* ── Columna 3: App ── */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
              <div className="w-1 h-4 bg-brand rounded-full" />
              App Móvil
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Un espacio interactivo con match, trivia y simulaciones para que
              llegues listo el día de las elecciones.
            </p>

            {/* Badges de funciones */}
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-wide">
                <Zap className="w-3 h-3" />
                Match
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide">
                <Smartphone className="w-3 h-3" />
                Trivia
              </span>
            </div>

            {/* Botones deshabilitados — próximamente */}
            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-brand">
              Pronto
            </span>
            <div className="flex flex-row gap-2 pt-1">
              {[
                {
                  icon: <AppleIcon />,
                  store: "App Store",
                  platform: "Disponible en",
                },
                {
                  icon: <GooglePlayIcon />,
                  store: "Google Play",
                  platform: "Próximamente en",
                },
              ].map(({ icon, store, platform }) => (
                <div
                  key={store}
                  title="Próximamente"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-muted border border-border/50 text-muted-foreground cursor-not-allowed opacity-60 select-none"
                >
                  {icon}
                  <div className="flex flex-col leading-tight">
                    <span className="text-[10px] font-medium">{platform}</span>
                    <span className="text-sm font-bold">{store}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Separador ── */}
        <div className="h-px bg-border" />

        {/* ── Bottom bar minimalista ── */}
        <div className="pt-6 flex flex-col items-center gap-2">
          <p className="text-sm font-semibold text-muted-foreground/60 italic tracking-wide">
            ❝Infórmate, tu voto importa❞
          </p>
          <p className="text-xs text-muted-foreground/50">
            © {new Date().getFullYear()} VotaBien Perú
          </p>
        </div>
      </div>
    </footer>
  );
}
