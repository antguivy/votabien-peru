import Link from "next/link";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import Footer from "@/components/landing/footer";

const LAST_UPDATED = "marzo de 2025";

const SECTIONS = [
  {
    title: "1. Naturaleza de la plataforma",
    content: (
      <p>
        VotaBien Perú es una iniciativa cívica, independiente y no partidista.{" "}
        <strong>
          No apoyamos, financiamos ni promocionamos a ningún candidato o partido
          político.
        </strong>{" "}
        La plataforma no tiene fines comerciales ni recibe financiamiento de
        ninguna organización política.
      </p>
    ),
  },
  {
    title: "2. Precisión de la información",
    content: (
      <p>
        Hacemos nuestro mayor esfuerzo por mantener la información actualizada
        desde fuentes oficiales (JNE, ONPE, Contraloría). VotaBien Perú no se
        hace responsable por errores de origen o retrasos en la publicación de
        datos por parte del Estado. Si identifica un error, use nuestro{" "}
        <Link href="/reportar" className="text-primary hover:underline">
          formulario de reporte
        </Link>
        .
      </p>
    ),
  },
  {
    title: "3. Uso aceptable",
    content: (
      <>
        <p>Queda prohibido:</p>
        <ul>
          <li>
            Scraping masivo con fines comerciales sin autorización previa.
          </li>
          <li>
            Redistribuir contenido atribuyendo posturas a candidatos de forma
            diferente a la fuente oficial.
          </li>
          <li>Usar la plataforma para difundir desinformación electoral.</li>
        </ul>
      </>
    ),
  },
  {
    title: "4. Propiedad intelectual",
    content: (
      <p>
        El diseño, código, logotipos y funcionalidades propias de la plataforma
        (como Match Electoral y Trivia) son propiedad exclusiva de VotaBien
        Perú. Los datos públicos de candidatos pertenecen al dominio público
        conforme a la Ley N° 27806 y no son objeto de apropiación por nuestra
        parte.
      </p>
    ),
  },
  {
    title: "5. Limitación de responsabilidad",
    content: (
      <p>
        VotaBien Perú actúa como intermediario de información pública y no
        garantiza exhaustividad ni actualización en tiempo real. No será
        responsable por decisiones de usuarios basadas en la información
        presentada, ni por interrupciones del servicio causadas por factores
        ajenos a nuestro control (fallas de infraestructura, cambios en fuentes
        oficiales, etc.).
      </p>
    ),
  },
  {
    title: "6. Contenido de terceros",
    content: (
      <p>
        La plataforma puede contener enlaces a sitios externos (JNE, medios de
        comunicación, documentos oficiales). VotaBien Perú no controla su
        contenido ni asume responsabilidad por su disponibilidad, exactitud o
        políticas de privacidad propias.
      </p>
    ),
  },
  {
    title: "7. Modificaciones",
    content: (
      <p>
        Podemos modificar estos términos en cualquier momento. Los cambios
        entran en vigor a los 15 días de su publicación en esta página. El uso
        continuado de la plataforma tras ese plazo implica la aceptación de los
        nuevos términos.
      </p>
    ),
  },
  {
    title: "8. Ley aplicable",
    content: (
      <p>
        Estos términos se rigen por la legislación de la República del Perú.
        Cualquier controversia será sometida a los tribunales competentes de
        Lima, renunciando expresamente a cualquier otro fuero que pudiera
        corresponder.
      </p>
    ),
  },
];

export default function TerminosPage() {
  return (
    <ContentPlatformLayout>
      <div className="container mx-auto px-4 pt-4 max-w-2xl">
        <div className="mb-4">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Términos y Condiciones
          </h1>
          {/* <p className="text-xs text-muted-foreground">
              Última actualización: {LAST_UPDATED}
            </p> */}
        </div>

        <p className="text-muted-foreground leading-relaxed mb-10 mt-8">
          Bienvenido a{" "}
          <strong className="text-foreground">VotaBien Perú</strong>. Al acceder
          y utilizar nuestra plataforma, usted acepta los siguientes términos y
          condiciones de uso.
        </p>

        <div className="space-y-8">
          {SECTIONS.map(({ title, content }) => (
            <div key={title}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1 h-4 bg-primary rounded-full shrink-0" />
                <h2 className="font-semibold text-foreground">{title}</h2>
              </div>
              <div className="pl-4 text-sm text-muted-foreground leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-foreground [&_a]:text-primary [&_a]:hover:underline">
                {content}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-4 rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground">
          ¿Tienes preguntas?{" "}
          <Link
            href="/contacto"
            className="text-primary hover:underline font-medium"
          >
            Contáctanos
          </Link>
          .
        </div>
      </div>
      <Footer />
    </ContentPlatformLayout>
  );
}
