import {
  Target,
  Eye,
  Scale,
  Database,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import Footer from "@/components/landing/footer";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";

export default function MissionPage() {
  return (
    <ContentPlatformLayout>
      <section className="pt-4 container mx-auto pb-20 lg:pb-0">
        {/* <header className="relative border-b border-border bg-background overflow-hidden pt-20 pb-16 md:pt-24 md:pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.1]" />

        <div className="container mx-auto px-4 max-w-5xl relative">
          <div className="flex flex-col items-center text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground text-balance">
              Información que construye <br />
              <span className="text-muted-foreground">ciudadanía.</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty">
              Transformamos datos legislativos complejos en herramientas claras
              para que tú decidas el futuro del Perú.
            </p>
          </div>
        </div>
      </header> */}

        <section className="py-20 md:py-28 bg-muted/20 border-b border-border">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-serif italic text-foreground/80 leading-snug mb-8">
              “No queremos un país donde la desinformación decida el rumbo.
              Queremos electores que conozcan a quién votan, qué hicieron y qué
              proponen.”
            </h2>
            <p className="text-base text-muted-foreground uppercase tracking-widest font-semibold">
              — El equipo de Vota Bien
            </p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">
              {/* Misión */}
              <div className="space-y-6 group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">
                  Nuestra Misión
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Centralizar, verificar y democratizar el acceso a la
                  información política. Existimos para eliminar la barrera
                  técnica entre los datos del Congreso y el ciudadano de a pie.
                </p>
                <ul className="space-y-3 pt-2">
                  <CheckItem text="Verificación rigurosa con fuentes primarias" />
                  <CheckItem text="Neutralidad política absoluta" />
                  <CheckItem text="Tecnología de código abierto" />
                </ul>
              </div>

              {/* Visión */}
              <div className="space-y-6 group">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Eye className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">
                  Nuestra Visión
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Ser el estándar de referencia para la transparencia electoral
                  en Latinoamérica. Visualizamos un 2026 donde el debate público
                  se base en métricas de desempeño y hechos, no en ruido
                  mediático.
                </p>
                <ul className="space-y-3 pt-2">
                  <CheckItem text="Ciudadanía digitalmente activa" />
                  <CheckItem text="Voto basado en evidencia" />
                  <CheckItem text="Reducción de la brecha informativa" />
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-card border-y border-border">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Ejes de Acción 2026
              </h2>
              <div className="h-1 w-20 bg-primary rounded-full" />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <FeatureCard
                icon={<Database className="w-5 h-5" />}
                title="Radiografía del Candidato"
                description="Perfiles exhaustivos que cruzan antecedentes penales, formación académica y trayectoria partidaria. Sin filtros, solo datos."
              />
              <FeatureCard
                icon={<TrendingUp className="w-5 h-5" />}
                title="Métricas Legislativas"
                description="Para quienes buscan reelección: analizamos asistencia, producción de leyes y sentido de votación en temas clave."
              />
              <FeatureCard
                icon={<Scale className="w-5 h-5" />}
                title="Imparcialidad Algorítmica"
                description="Nuestros algoritmos no opinan. Presentan la información cruda y ordenada para evitar cualquier sesgo editorial."
              />
              <FeatureCard
                icon={<CheckCircle2 className="w-5 h-5" />}
                title="Verificación en Tiempo Real"
                description="Un sistema vivo que se actualiza semanalmente conforme avanza la campaña y surgen nuevas alianzas o denuncias."
              />
            </div>
          </div>
        </section>

        <Footer />
      </section>
    </ContentPlatformLayout>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3 text-muted-foreground">
      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
      <span className="text-sm md:text-base">{text}</span>
    </li>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group p-6 rounded-xl border border-border bg-background hover:border-primary/30 hover:shadow-md transition-all duration-300">
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-foreground mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
