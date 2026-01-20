import {
  Eye,
  FileText,
  CheckCircle2,
  Server,
  Database,
  Globe,
} from "lucide-react";

export default function FundingTransparency() {
  return (
    <section className="border-t border-border bg-muted/20">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            ¿En qué se utilizan las donaciones?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Cada contribución se destina íntegramente a la operación del
            proyecto. Operamos con total transparencia sobre el uso de recursos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Infraestructura Técnica */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Server className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Infraestructura y Hosting
                </h3>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Servidores y bases de datos</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>CDN y optimización web</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Dominio y certificados SSL</span>
              </li>
            </ul>
          </div>

          {/* Sistemas de Investigación */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[var(--brand)]/10 flex items-center justify-center flex-shrink-0">
                <Database className="w-6 h-6 text-[var(--brand)]" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Sistemas de Procesamiento
                </h3>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>APIs de inteligencia artificial</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Automatización de investigación</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Procesamiento y análisis de datos</span>
              </li>
            </ul>
          </div>

          {/* Desarrollo y Contenido */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm md:col-span-2 lg:col-span-1">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Desarrollo y Difusión
                </h3>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Mejoras de plataforma</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Creación de contenido educativo</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Difusión en redes sociales</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Principios */}
        <div className="bg-gradient-to-br from-primary/5 to-[var(--brand)]/5 border border-primary/20 rounded-xl p-8 mb-8">
          <h3 className="font-semibold text-xl mb-6 text-center">
            Nuestros Principios
          </h3>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Eye className="w-7 h-7 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Transparencia Total</h4>
              <p className="text-sm text-muted-foreground">
                Información clara sobre el uso de fondos y operación del
                proyecto
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Globe className="w-7 h-7 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Acceso Gratuito</h4>
              <p className="text-sm text-muted-foreground">
                La información siempre será libre y accesible para todos
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Sin Afiliaciones</h4>
              <p className="text-sm text-muted-foreground">
                Independientes de partidos políticos y organizaciones
              </p>
            </div>
          </div>
        </div>

        {/* Detalles adicionales del proyecto */}
        <div className="bg-muted/30 border border-border rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Más allá de la Plataforma Web
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            VotaBienPerú es más que solo una página web. Mantenemos una
            infraestructura técnica compleja que incluye sistemas automatizados
            de investigación con inteligencia artificial, que procesan y
            analizan información política en tiempo récord, una tarea que
            tomaría semanas hacerla manualmente.
          </p>
          <p className="text-sm text-muted-foreground">
            Además, nuestro equipo de creadores de contenido y especialistas en
            difusión trabaja constantemente en redes sociales para educar y
            mantener informada a la ciudadanía. Los costos incluyen APIs de IA,
            procesamiento computacional, almacenamiento de datos, y herramientas
            de análisis que permiten mantener la información actualizada y
            verificada.
          </p>
        </div>

        {/* Nota final */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Las donaciones son completamente voluntarias. Si no puedes
            contribuir económicamente, compartir esta plataforma con otros es
            una gran ayuda. Gracias por apoyar nuestro trabajo colaborativo
            hacia una política más transparente e informada.
          </p>
        </div>
      </div>
    </section>
  );
}
