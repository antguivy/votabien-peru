"use client";
import Link from "next/link";
import Image from "next/image";
import {
  ExternalLink,
  AlertCircle,
  Heart,
  HelpCircle,
  Scale,
  Vote,
  ArrowUp,
} from "lucide-react";

// Iconos SVG (mantenemos los tuyos pero los usaremos con un estilo diferente)
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

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
  </svg>
);

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full bg-white text-zinc-800 pt-16 pb-8 border-t border-zinc-200">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* ── SECCIÓN SUPERIOR: Logo y Columnas ── */}
        <div className="flex flex-col lg:flex-row justify-between gap-12 mb-16">
          {/* Logo Brand (Izquierda) */}
          <div className="lg:w-1/4 flex flex-row lg:flex-col justify-between items-center">
            <Link href="/">
              <Image
                src="/logo_completo.png"
                alt="VotaBien Perú"
                width={130}
                height={44}
                className="drop-shadow-sm"
              />
            </Link>
            {/* Redes (Estilo outline circular tipo Swiss Solidarity) */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <span className="text-sm font-bold text-zinc-900">Síguenos</span>
              <div className="flex gap-3">
                {[
                  {
                    href: "https://www.facebook.com/profile.php?id=61584547343222",
                    icon: <FacebookIcon />,
                    label: "Facebook",
                  },
                  {
                    href: "https://www.instagram.com/votabienperu_oficial/",
                    icon: <InstagramIcon />,
                    label: "Instagram",
                  },
                  {
                    href: "https://www.tiktok.com/@vota.bien.per",
                    icon: <TikTokIcon />,
                    label: "TikTok",
                  },
                ].map(({ href, icon, label }) => (
                  <Link
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 transition-colors"
                  >
                    {icon}
                    <span className="sr-only">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Columnas de Enlaces (Derecha) */}
          {/* Columnas de Enlaces (Derecha) */}
          <div className="lg:w-3/4 grid grid-cols-1 md:grid-cols-4 gap-8 mx-auto">
            {/* Columna 1 */}
            <div className="space-y-4 text-center md:text-left">
              <h3 className="font-bold text-sm text-zinc-900">El Proyecto</h3>
              <ul className="space-y-3 text-sm text-zinc-600">
                <li>
                  <Link
                    href="/equipo"
                    className="hover:text-red-600 transition-colors"
                  >
                    Conocer más
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mision"
                    className="hover:text-red-600 transition-colors"
                  >
                    Nuestra misión
                  </Link>
                </li>
              </ul>
            </div>

            {/* Columna 2 */}
            <div className="space-y-4 text-center md:text-left">
              <h3 className="font-bold text-sm text-zinc-900">Fuentes</h3>
              <ul className="space-y-3 text-sm text-zinc-600">
                <li>
                  <span className="hover:text-zinc-900 transition-colors cursor-default">
                    Medios de investigación
                  </span>
                </li>
                <li>
                  <span className="hover:text-zinc-900 transition-colors cursor-default">
                    Medios periodísticos
                  </span>
                </li>
                <li>
                  <span className="hover:text-zinc-900 transition-colors cursor-default">
                    Medios oficiales del estado
                  </span>
                </li>
              </ul>
            </div>

            {/* Columna 3 */}
            <div className="space-y-4 text-center md:text-left">
              <h3 className="font-bold text-sm text-zinc-900">Herramientas</h3>
              <ul className="space-y-3 text-sm text-zinc-600">
                <li>
                  <Link
                    href="/trivia"
                    className="flex items-center justify-center md:justify-start gap-1.5 hover:text-red-600 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Trivia
                  </Link>
                </li>

                <li>
                  <Link
                    href="/simulador"
                    className="flex items-center justify-center md:justify-start gap-1.5 hover:text-red-600 transition-colors"
                  >
                    <Vote className="w-3.5 h-3.5" />
                    Simulador
                  </Link>
                </li>
              </ul>
            </div>

            {/* Columna 4 */}
            <div className="space-y-4 text-center md:text-left">
              <h3 className="font-bold text-sm text-zinc-900">Soporte</h3>
              <ul className="space-y-3 text-sm text-zinc-600">
                <li>
                  <Link
                    href="/contacto"
                    className="hover:text-red-600 transition-colors"
                  >
                    Contacto
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="hover:text-red-600 transition-colors"
                  >
                    Sugerencias
                  </Link>
                </li>
                <li>
                  <Link
                    href="/reportar"
                    className="flex items-center justify-center md:justify-start gap-1.5 text-zinc-600 hover:text-orange-600 transition-colors"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Reportar error
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── SECCIÓN INFERIOR: Legal y Copyright ── */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <div>© {new Date().getFullYear()} VotaBien Perú</div>

          <div className="flex gap-4">
            <Link
              href="/terminos"
              className="hover:text-zinc-900 transition-colors"
            >
              Condiciones Generales
            </Link>
            <Link
              href="/privacidad"
              className="hover:text-zinc-900 transition-colors"
            >
              Política de Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
