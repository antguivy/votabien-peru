import Link from "next/link";
import { ExternalLink, Users, Building2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-background to-muted border-t border-border">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 pt-16">
        {/* Footer Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-12">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full" />
              Sobre el Proyecto
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Plataforma ciudadana de transparencia política. Información
              verificada y actualizada sobre el Congreso del Perú.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
            >
              <span>Conocer más</span>
              <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full" />
              Explora
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/legisladores"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 group"
                >
                  <Users className="w-4 h-4 text-primary" />
                  <span>Congresistas</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/partidos"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 group"
                >
                  <Building2 className="w-4 h-4 text-primary" />
                  <span>Partidos Políticos</span>
                </Link>
              </li>
              {/* <li>
                <Link 
                  href="/proyectos" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 group"
                >
                  <FileText className="w-4 h-4 text-primary" />
                  <span>Proyectos de Ley</span>
                </Link>
              </li> */}
            </ul>
          </div>

          {/* Data & Sources */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full" />
              Datos y Fuentes
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Información recopilada de portales oficiales (Congreso, JNE, ONPE,
              Contraloría) y medios periodísticos verificados. Datos públicos
              procesados para facilitar tu acceso.
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span>Actualizado frecuentemente</span>
              </div>
              <Link
                href="/fuentes"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors group"
              >
                <span>Ver fuentes completas</span>
                <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
