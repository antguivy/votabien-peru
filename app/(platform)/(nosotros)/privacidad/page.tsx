import Link from "next/link";
import { ContentPlatformLayout } from "@/components/navbar/content-layout";
import Footer from "@/components/landing/footer";

const LAST_UPDATED = "marzo de 2025";

const SECTIONS = [
  {
    title: "1. Responsable del tratamiento",
    content: (
      <p>
        El responsable del tratamiento de datos personales es{" "}
        <strong>VotaBien Perú</strong>, iniciativa cívica independiente y no
        partidista. Para cualquier consulta relacionada con esta política, puede
        contactarnos en{" "}
        <a href="mailto:contacto@votabienperu.com">contacto@votabienperu.com</a>
        .
      </p>
    ),
  },
  {
    title: "2. Información que recopilamos",
    content: (
      <>
        <p>
          VotaBien Perú es principalmente una plataforma de consulta pública.{" "}
          <strong>No requerimos cuenta ni registro</strong> para acceder a la
          información de los candidatos. Recopilamos únicamente lo siguiente:
        </p>
        <ul>
          <li>
            <strong>Formulario de reporte:</strong> correo electrónico
            (opcional), descripción del error o sugerencia, e imagen adjunta si
            decide incluirla. Estos datos son proporcionados voluntariamente por
            usted.
          </li>
          <li>
            <strong>Datos de navegación anónimos:</strong> recopilamos de forma
            agregada y anónima información técnica (páginas visitadas, tiempo de
            sesión, tipo de navegador y dispositivo) para mejorar la
            experiencia. Estos datos no permiten identificarle personalmente.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "3. Finalidad del tratamiento",
    content: (
      <>
        <p>La información recopilada se utiliza exclusivamente para:</p>
        <ul>
          <li>
            Verificar y corregir la información pública de los candidatos.
          </li>
          <li>
            Mejorar el funcionamiento técnico y la experiencia de la plataforma.
          </li>
          <li>
            Contactarle en caso de que su reporte requiera validación adicional
            (solo si proporcionó su correo electrónico).
          </li>
          <li>
            Analizar el uso agregado de la plataforma para priorizar mejoras.
          </li>
        </ul>
        <p>
          <strong>
            No vendemos, cedemos ni compartimos sus datos personales con
            terceros
          </strong>
          , salvo obligación legal expresa.
        </p>
      </>
    ),
  },
  {
    title: "4. Transparencia de datos públicos",
    content: (
      <p>
        Toda la información sobre candidatos políticos mostrada en VotaBien Perú
        es de carácter <strong>público</strong> y ha sido recopilada de fuentes
        oficiales del Estado Peruano — JNE, ONPE, Contraloría General — bajo la{" "}
        <strong>
          Ley de Transparencia y Acceso a la Información Pública (Ley N° 27806)
        </strong>
        . No modificamos hojas de vida; únicamente facilitamos su visualización
        estructurada para el ciudadano.
      </p>
    ),
  },
  {
    title: "5. Cookies",
    content: (
      <p>
        Utilizamos únicamente cookies funcionales estrictamente necesarias para
        recordar su preferencia de tema (oscuro/claro) entre visitas. No
        empleamos cookies de seguimiento publicitario, de perfilado ni de redes
        sociales. Puede configurar su navegador para rechazar o eliminar
        cookies, aunque la preferencia de tema podría no conservarse.
      </p>
    ),
  },
  {
    title: "6. Retención de datos",
    content: (
      <p>
        Los datos del formulario de reporte (correo, descripción, imagen) se
        conservan el tiempo necesario para gestionar la solicitud. Una vez
        procesados, son eliminados o anonimizados salvo que exista obligación
        legal de conservación. Los datos de navegación son anónimos desde su
        recopilación y no están sujetos a derechos de eliminación individual.
      </p>
    ),
  },
  {
    title: "7. Sus derechos (ARCO)",
    content: (
      <>
        <p>
          De acuerdo con la{" "}
          <strong>
            Ley de Protección de Datos Personales del Perú (Ley N° 29733)
          </strong>
          , usted tiene derecho a:
        </p>
        <ul>
          <li>
            <strong>Acceso:</strong> conocer qué datos personales suyos tenemos.
          </li>
          <li>
            <strong>Rectificación:</strong> solicitar la corrección de datos
            inexactos.
          </li>
          <li>
            <strong>Cancelación:</strong> solicitar la eliminación de sus datos.
          </li>
          <li>
            <strong>Oposición:</strong> oponerse al tratamiento de sus datos en
            determinadas circunstancias.
          </li>
        </ul>
        <p>
          Para ejercer estos derechos, escríbanos a{" "}
          <a href="mailto:contacto@votabienperu.com">
            contacto@votabienperu.com
          </a>
          . Responderemos en un plazo máximo de 20 días hábiles conforme a ley.
        </p>
      </>
    ),
  },
  {
    title: "8. Cambios a esta política",
    content: (
      <p>
        Podemos actualizar esta política ocasionalmente. Cualquier cambio
        significativo será notificado en la plataforma con al menos 15 días de
        anticipación. La fecha de última actualización siempre estará visible en
        la parte superior de esta página.
      </p>
    ),
  },
];

export default function PrivacidadPage() {
  return (
    <ContentPlatformLayout>
      <div className="container mx-auto px-4 pt-4 max-w-2xl">
        <div className="mb-4">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Política de Privacidad
          </h1>
          {/* <p className="text-xs text-muted-foreground">
              Última actualización: {LAST_UPDATED}
            </p> */}
        </div>

        <p className="text-muted-foreground leading-relaxed mb-10 mt-8">
          En <strong className="text-foreground">VotaBien Perú</strong>{" "}
          respetamos su privacidad y estamos comprometidos con la protección de
          sus datos personales. Esta política explica qué información
          recopilamos, con qué finalidad y cómo la protegemos cuando utiliza
          nuestra plataforma.
        </p>

        <div className="space-y-8">
          {SECTIONS.map(({ title, content }) => (
            <div key={title}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1 h-4 bg-brand rounded-full shrink-0" />
                <h2 className="font-semibold text-foreground">{title}</h2>
              </div>
              <div className="pl-4 text-sm text-muted-foreground leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-foreground [&_a]:text-primary [&_a]:hover:underline">
                {content}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-4 rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground">
          ¿Tienes preguntas sobre esta política?{" "}
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
