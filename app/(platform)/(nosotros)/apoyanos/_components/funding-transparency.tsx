import {
  Eye,
  FileText,
  CheckCircle2,
  Server,
  Globe,
  BookOpen,
  Gamepad2,
  Building2,
} from "lucide-react";

export default function FundingTransparency() {
  return (
    <section className="bg-background text-foreground py-20 md:py-32">
      <div className="container mx-auto px-6 max-w-5xl">
        {/* ── LÍNEAS DE ACCIÓN (Lista limpia, sin tarjetas) ── */}
        <div className="mb-12">
          <div className="border-b border-border/60 pb-6 mb-8 flex items-end justify-between">
            <h3 className="text-2xl md:text-3xl font-bold">
              Destino de los fondos
            </h3>
            <span className="hidden sm:inline-block text-sm text-muted-foreground uppercase tracking-wider font-semibold">
              03 Áreas de impacto
            </span>
          </div>

          <div className="flex flex-col">
            {/* Área 1: Educación */}
            <div className="grid md:grid-cols-[60px_1fr_1fr] gap-6 md:gap-12 py-10 border-b border-border/40 group hover:bg-muted/10 transition-colors -mx-6 px-6">
              <div className="hidden md:block pt-1">
                <BookOpen className="w-8 h-8 text-foreground/40 group-hover:text-foreground transition-colors" />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">Educación Cívica</h4>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Impacto en el mundo real mediante el contacto directo con
                  jóvenes y estudiantes.
                </p>
              </div>
              <ul className="space-y-3 mt-4 md:mt-0">
                <li className="flex items-start gap-3 text-foreground font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                  <span>Charlas y talleres en colegios y universidades</span>
                </li>
                <li className="flex items-start gap-3 text-foreground font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                  <span>Impresión de material didáctico y logísitica</span>
                </li>
              </ul>
            </div>

            {/* Área 2: Innovación */}
            <div className="grid md:grid-cols-[60px_1fr_1fr] gap-6 md:gap-12 py-10 border-b border-border/40 group hover:bg-muted/10 transition-colors -mx-6 px-6">
              <div className="hidden md:block pt-1">
                <Gamepad2 className="w-8 h-8 text-foreground/40 group-hover:text-foreground transition-colors" />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">
                  Innovación y Difusión
                </h4>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Desarrollo de nuevas formas de aprendizaje interactivo y
                  cultura digital.
                </p>
              </div>
              <ul className="space-y-3 mt-4 md:mt-0">
                <li className="flex items-start gap-3 text-foreground font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                  <span>Desarrollo de juegos cívicos (Trivia Electoral)</span>
                </li>
                <li className="flex items-start gap-3 text-foreground font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                  <span>Producción de contenido educativo para redes</span>
                </li>
              </ul>
            </div>

            {/* Área 3: Tecnología */}
            <div className="grid md:grid-cols-[60px_1fr_1fr] gap-6 md:gap-12 py-10 border-b border-border/40 group hover:bg-muted/10 transition-colors -mx-6 px-6">
              <div className="hidden md:block pt-1">
                <Server className="w-8 h-8 text-foreground/40 group-hover:text-foreground transition-colors" />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">
                  Infraestructura Tecnológica
                </h4>
                <p className="text-sm text-muted-foreground max-w-sm">
                  El motor que mantiene nuestra plataforma web rápida, segura y
                  actualizada.
                </p>
              </div>
              <ul className="space-y-3 mt-4 md:mt-0">
                <li className="flex items-start gap-3 text-foreground font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                  <span>Hosting, servidores y seguridad de datos</span>
                </li>
                <li className="flex items-start gap-3 text-foreground font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                  <span>
                    Consumo de APIs (Inteligencia artificial y procesamiento)
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── PRINCIPIOS RECTORES (Estilo Manifiesto) ── */}
        <div className="bg-muted/40 rounded-[2rem] p-8 md:p-16">
          <div className="text-center mb-16">
            <Building2 className="w-10 h-10 mx-auto text-muted-foreground/50 mb-6" />
            <h3 className="text-2xl md:text-3xl font-bold">
              Principios Institucionales
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-12 md:gap-8 lg:gap-16">
            <div className="text-center">
              <Eye className="w-6 h-6 mx-auto mb-5 text-foreground" />
              <h4 className="font-bold text-lg mb-3 uppercase tracking-wide">
                Transparencia
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                Rendimos cuentas de forma clara y auditable sobre el uso de cada
                donación y la operación general del proyecto.
              </p>
            </div>

            <div className="text-center relative">
              {/* Separadores visuales sutiles para desktop */}
              <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-24 bg-border" />
              <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-24 bg-border" />

              <Globe className="w-6 h-6 mx-auto mb-5 text-foreground" />
              <h4 className="font-bold text-lg mb-3 uppercase tracking-wide">
                Acceso Público
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                Nuestra plataforma y herramientas de investigación siempre serán
                gratuitas y de acceso libre para cualquier ciudadano.
              </p>
            </div>

            <div className="text-center">
              <FileText className="w-6 h-6 mx-auto mb-5 text-foreground" />
              <h4 className="font-bold text-lg mb-3 uppercase tracking-wide">
                Independencia
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                Somos una iniciativa estrictamente apartidista. No aceptamos
                financiamiento condicionado de organizaciones políticas.
              </p>
            </div>
          </div>
        </div>

        {/* ── NOTA FINAL ── */}
        <div className="mt-20 pt-10 border-t border-border/40 text-center">
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Las donaciones son completamente voluntarias. Si no puedes
            contribuir económicamente, compartir nuestra plataforma en tus redes
            o recomendarla en tu entorno es un apoyo invaluable.{" "}
            <strong className="text-foreground">
              Gracias por apostar por la educación cívica del Perú.
            </strong>
          </p>
        </div>
      </div>
    </section>
  );
}
