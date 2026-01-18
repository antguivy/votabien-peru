import Link from "next/link";
import {
  Search,
  Database,
  Shield,
  CheckCircle2,
  Scale,
  Users,
  FileText,
  TrendingUp,
  UserX,
  AlertTriangle,
} from "lucide-react";
import TeamList from "@/app/(platform)/nosotros/[nosotrosId]/_components/team-list";
import { getTeam, type TeamMember } from "@/queries/public/team";

export default async function AboutPage() {
  let team: TeamMember[] = [];
  try {
    team = await getTeam();
  } catch (error) {
    console.error("Error al obtener el equipo:", error);
  }
  const sources = [
    "Andina",
    "BBC",
    "Canal N",
    "CNN",
    "Congreso",
    "Contraloría",
    "Convoca",
    "El Comercio",
    "El Foco",
    "El País",
    "El Peruano",
    "Epicentro TV",
    "Gestión",
    "Hildebrandt en sus trece",
    "IDL-Reporteros",
    "Infobae",
    "Infogob",
    "JNE",
    "La Encerrona",
    "La Mula",
    "La República",
    "Latina",
    "Ministerio Público",
    "Ojo Público",
    "ONPE",
    "PCM",
    "Perú21",
    "Poder Judicial",
    "RPP",
    "Salud con Lupa",
    "Sunat",
    "LP Derechos",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Proyecto Independiente
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Sobre VotaBienPerú
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Plataforma independiente de información verificable sobre
              congresistas, partidos políticos y candidatos en el Perú.
            </p>
          </div>
        </div>
      </header>

      {/* Introducción */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              ¿Qué es VotaBienPerú?
            </h2>

            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              <p>
                VotaBienPerú es una plataforma que centraliza y presenta
                información verificable sobre el panorama político peruano.
                Reunimos datos de fuentes oficiales y periodísticas reconocidas
                para facilitar el acceso ciudadano a información política
                confiable.
              </p>

              <p>
                La plataforma incluye perfiles detallados de congresistas con
                métricas de desempeño legislativo, información sobre partidos
                políticos, y próximamente candidatos a elecciones. Todo
                respaldado con referencias verificables.
              </p>
            </div>

            <div className="bg-muted border-l-4 border-primary p-6 my-8">
              <p className="text-foreground font-semibold text-lg mb-0">
                Objetivo: Democratizar el acceso a información política mediante
                datos verificables y presentación clara, contribuyendo a una
                ciudadanía mejor informada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Qué información tenemos */}
      <section className="py-12 md:py-16 border-y border-border bg-muted/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Alcance de la Plataforma
          </h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4 pb-6 border-b border-border">
              <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Congresistas
                </h3>
                <p className="text-muted-foreground mb-3">
                  Perfiles completos de los 130 congresistas con información
                  verificada sobre trayectoria política, académica y laboral.
                </p>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">
                      Proyectos de ley presentados
                    </span>
                  </div>
                  {/* <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Asistencias y votaciones</span>
                  </div> */}
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">
                      Historial de transfuguismo
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">
                      Antecedentes verificados
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 pb-6 border-b border-border">
              <Scale className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Partidos Políticos
                </h3>
                <p className="text-muted-foreground">
                  Información sobre organizaciones políticas activas, su
                  historia, composición y representación actual en el Congreso.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 pb-6 border-b border-border">
              <TrendingUp className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Herramientas de Comparación
                </h3>
                <p className="text-muted-foreground">
                  Comparador que permite analizar y contrastar métricas entre
                  congresistas: productividad legislativa, asistencia, cambios
                  de bancada y antecedentes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Database className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Candidatos{" "}
                  <span className="text-sm text-muted-foreground font-normal">
                    (próximamente)
                  </span>
                </h3>
                <p className="text-muted-foreground">
                  Información sobre candidatos a elecciones generales 2026.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metodología */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Metodología
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Recopilación y Procesamiento de Datos
              </h3>
              <div className="pl-7 space-y-3 text-muted-foreground">
                <p>
                  Utilizamos un sistema semi-automatizado de investigación que
                  combina herramientas de inteligencia artificial para búsqueda
                  y análisis de fuentes, con verificación humana rigurosa.
                </p>
                <p>
                  Los investigadores trabajan con plantillas estructuradas que
                  garantizan consistencia en la recopilación de información.
                  Cada dato debe incluir su fuente verificable antes de ser
                  incorporado a la plataforma.
                </p>
                <p>
                  Para proyectos de ley y métricas legislativas, implementamos
                  procesos automatizados de extracción semanal desde fuentes
                  oficiales del Congreso, con validación de calidad antes de
                  publicación.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Verificación y Control de Calidad
              </h3>
              <div className="pl-7 space-y-3 text-muted-foreground">
                <p>
                  Cada pieza de información pasa por múltiples capas de
                  verificación:
                </p>
                <ul className="space-y-2 list-none">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      Validación automática de URLs de fuentes para garantizar
                      accesibilidad
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      Revisión de consistencia y formato en datos estructurados
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      Priorización de fuentes primarias (documentos oficiales)
                      sobre secundarias
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      Contraste con múltiples fuentes cuando es posible
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Actualización Continua
              </h3>
              <div className="pl-7 space-y-3 text-muted-foreground">
                <p>
                  La plataforma se actualiza mediante pipelines automatizados
                  que procesan nuevos datos semanalmente:
                </p>
                <ul className="space-y-2 list-none">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      Proyectos de ley: extracción semanal de nuevas
                      presentaciones y cambios de estado
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Métricas legislativas: actualización semanal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      Información biográfica: revisión continua con nuevos
                      hallazgos verificados
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Procesamiento de Información Legislativa
              </h3>
              <div className="pl-7 space-y-3 text-muted-foreground">
                <p>
                  Los proyectos de ley son procesados con tecnología de lenguaje
                  natural para generar títulos comprensibles para el ciudadano
                  común, facilitando el entendimiento de propuestas técnicas o
                  complejas.
                </p>
                <p>
                  Este procesamiento mantiene la fidelidad al contenido original
                  mientras mejora la accesibilidad de la información.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                Neutralidad Editorial
              </h3>
              <div className="pl-7 space-y-3 text-muted-foreground">
                <p>
                  Presentamos información sin interpretaciones políticas ni
                  sesgos editoriales. Las métricas son objetivas y basadas en
                  datos verificables. No realizamos valoraciones sobre el
                  desempeño de legisladores más allá de las cifras documentadas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fuentes */}
      <section className="py-12 md:py-16 border-y border-border bg-muted/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Fuentes de Información
          </h2>

          <p className="text-muted-foreground mb-8 text-lg">
            Consultamos regularmente las siguientes fuentes oficiales y medios
            periodísticos reconocidos:
          </p>

          <div className="flex flex-wrap gap-3">
            {sources.map((source, idx) => (
              <div
                key={idx}
                className="text-sm text-muted-foreground py-2 px-3 bg-card border border-border rounded hover:border-primary/50 transition-colors"
              >
                {source}
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-muted border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Nota:</strong> Todas las
              referencias incluyen enlaces directos a la fuente original.
              Priorizamos fuentes primarias sobre reportes secundarios.
            </p>
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Equipo y Desarrollo
          </h2>

          <div className="mb-12">
            <h3 className="text-2xl font-bold text-foreground mb-6">
              Nuestro Equipo
            </h3>
            <TeamList members={team} />
          </div>
        </div>
      </section>

      {/* Principios */}
      <section className="py-12 md:py-16 border-t border-border bg-muted/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Principios
          </h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Scale className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Neutralidad Política
                </h3>
                <p className="text-muted-foreground">
                  Sin sesgos políticos ni editorializaciones. Presentamos
                  información verificable sin interpretaciones partidarias.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Transparencia Total
                </h3>
                <p className="text-muted-foreground">
                  Todas las fuentes son verificables. Cada dato incluye la
                  referencia específica a su origen.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Verificabilidad
                </h3>
                <p className="text-muted-foreground">
                  Priorizamos fuentes primarias y oficiales. Contrastamos
                  información cuando es posible.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Independencia
                </h3>
                <p className="text-muted-foreground">
                  Proyecto ciudadano sin afiliaciones políticas ni conflictos de
                  interés económicos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-16 border-t border-border">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Explora la Información
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Accede a datos verificables sobre congresistas, partidos políticos y
            más.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              <Search className="w-5 h-5" />
              Ver Congresistas
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground font-semibold rounded-lg hover:bg-muted transition-colors"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
