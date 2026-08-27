import { ContentLayout } from "@/components/admin/content-layout";
import { serverRequireReviewer } from "@/lib/auth-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  Pencil,
  ShieldAlert,
  Newspaper,
  Scale,
  Gavel,
  Link2,
} from "lucide-react";

export const metadata = {
  title: "Guía de Revisión | Admin VotaBien",
  description: "Cómo revisar y aprobar hallazgos de investigación IA",
};

export default async function GuiaVoluntariosPage() {
  await serverRequireReviewer();

  return (
    <ContentLayout title="Guía para Voluntarios">
      <div className="flex w-full flex-col gap-6 p-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Guía de Revisión de Hallazgos IA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tu trabajo es el puente entre lo que la IA encuentra en la web y lo
            que el público ve. Cada hallazgo que apruebes se publica
            inmediatamente: revisa con cuidado.
          </p>
        </div>

        {/* Flujo de trabajo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Flujo de trabajo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>
                Entra a <strong>Revisiones IA</strong> (menú Investigación).
                Verás las tarjetas pendientes organizadas por pestañas.
              </li>
              <li>
                Lee el <strong>resumen</strong> del hallazgo y haz click en{" "}
                <strong>Ver fuente original</strong> para confirmar que la
                noticia existe y dice lo que dice.
              </li>
              <li>
                Decide: <strong>Aprobar</strong> (se publica),{" "}
                <strong>Ignorar</strong> (se descarta) o{" "}
                <strong>Editar y Aprobar</strong> si el contenido es correcto
                pero necesita ajustes de redacción/datos.
              </li>
              <li>
                Usa los filtros de <strong>Región</strong> y{" "}
                <strong>Lote</strong> para trabajar por grupos de candidatos.
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Tipos de hallazgo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tipos de hallazgo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex gap-3">
              <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <Badge variant="destructive">
                  PENAL — Revisión Obligatoria
                </Badge>
                <p className="mt-1.5 text-muted-foreground">
                  Sentencias, investigaciones fiscales, órdenes de captura. Son
                  los más sensibles legalmente:{" "}
                  <strong>verifica SIEMPRE la fuente antes de aprobar</strong>.
                  Si tienes cualquier duda, recházalo o consúltalo con un
                  coordinador. Un error aquí puede tener consecuencias legales
                  serias.
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex gap-3">
              <Scale className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <Badge variant="secondary">
                  ÉTICA / ADMINISTRATIVO / CIVIL
                </Badge>
                <p className="mt-1.5 text-muted-foreground">
                  Sanciones del Jurado Nacional de Elecciones, infracciones
                  administrativas, juicios civiles. Verifica fuente y fecha.
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex gap-3">
              <Newspaper className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <Badge>NOTICIA / POSTURA</Badge>
                <p className="mt-1.5 text-muted-foreground">
                  Declaraciones, propuestas, trayectoria política. Menos
                  sensibles, pero igual confirma que la cita o hecho proviene
                  realmente de la fuente indicada.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Criterios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Criterios: ¿aprobar o rechazar?
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-semibold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Aproba si:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>La fuente existe y respalda el hallazgo</li>
                <li>La fecha y los datos son coherentes</li>
                <li>Habla del candidato correcto (cuidado con homónimos)</li>
                <li>El texto es objetivo, no editorializa</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-semibold flex items-center gap-1.5 text-red-500">
                <XCircle className="h-4 w-4" /> Rechaza si:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>No puedes verificar la fuente</li>
                <li>Es un rumor, opinión o contenido de dudosa procedencia</li>
                <li>Habla de otra persona con nombre similar</li>
                <li>Está duplicado o desactualizado sin contexto</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Herramientas útiles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Herramientas útiles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <Pencil className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span>
                <strong className="text-foreground">Editar y Aprobar:</strong>{" "}
                si el hallazgo es válido pero el título/resumen necesita
                corrección, edítalo antes de aprobar. Así se publica corregido.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Gavel className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span>
                <strong className="text-foreground">Diff:</strong> en las
                actualizaciones (ACTUALIZACIÓN) puedes comparar contra el dato
                actual del candidato antes de decidir.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Link2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span>
                <strong className="text-foreground">Porcentaje %:</strong> es la
                confianza de la IA. No es garantía — una fuente verificada por
                ti vale más que un 95%.
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6 text-sm">
            <p className="font-semibold mb-1">Regla de oro</p>
            <p className="text-muted-foreground">
              Ante la duda, <strong>rechaza</strong>. Es mejor perder un dato
              que publicar algo falso sobre una persona. Siempre puedes pedir
              que se vuelva a investigar al candidato; lo publicado en error es
              mucho más difícil de revertir.
            </p>
          </CardContent>
        </Card>
      </div>
    </ContentLayout>
  );
}
