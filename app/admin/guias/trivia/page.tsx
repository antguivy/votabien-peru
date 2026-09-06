import { ContentLayout } from "@/components/admin/content-layout";
import { serverRequireReviewer } from "@/lib/auth-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Video,
  BookOpen,
  ExternalLink,
  Sparkles,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "Guía Operativa de Trivia | Admin VotaBien",
  description:
    "Flujo de trabajo, criterios de validación multimedia y carga de preguntas en /admin/trivia",
};

const DRIVE_DOC_URL =
  "https://docs.google.com/document/d/1aZ6qd3or9SJEDXoVAdrQoTxeFBF0nxYbVSyj_9ZzxtU/edit?tab=t.0";

export default async function GuiaTriviaPage() {
  await serverRequireReviewer();

  return (
    <ContentLayout title="Guía Operativa de Trivia">
      <div className="flex w-full flex-col gap-6 p-6 max-w-4xl">
        {/* Encabezado */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            Guía de Creación y Moderación de Trivia
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            La trivia de VotaBien enseña a la ciudadanía mediante el juego,
            vinculando propuestas, declaraciones y videos reales de candidatos
            para las Elecciones 2026. Conoce el flujo de trabajo y cómo cargar
            tus preguntas en la plataforma.
          </p>
        </div>

        {/* Banner Oficial Google Drive - Ejes Temáticos */}
        <Card className="border-primary/40 bg-gradient-to-br from-primary/5 via-background to-primary/[0.02] shadow-sm">
          <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-wider">
                  Documento Oficial del Equipo
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Google Docs
                </Badge>
              </div>
              <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
                Ejes Temáticos & Asignación de Investigación
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                El detalle conceptual de cada eje de investigación, metas
                semanales por voluntario y bancos de ejemplos se encuentran en
                el documento central de Google Drive.
              </p>
            </div>

            <Button
              asChild
              className="gap-2 shrink-0 font-bold text-xs shadow-md bg-primary hover:bg-primary/90"
            >
              <a href={DRIVE_DOC_URL} target="_blank" rel="noopener noreferrer">
                Abrir Documento en Drive
                <ExternalLink size={14} />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* 1. Flujo de Trabajo Operativo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              1. El Ciclo de Moderación: De la Redacción a Producción
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Paso 1 */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-primary uppercase tracking-wider">
                    Paso 1
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Voluntario
                  </Badge>
                </div>
                <p className="font-bold text-foreground text-xs sm:text-sm">
                  Investiga y Formula
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Ubica el video en TikTok o YouTube, redacta 1 respuesta
                  correcta indiscutible y 3 distractores verosímiles con su
                  explicación.
                </p>
              </div>

              {/* Paso 2 */}
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    Paso 2
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] text-amber-700 dark:text-amber-300"
                  >
                    Borrador
                  </Badge>
                </div>
                <p className="font-bold text-foreground text-xs sm:text-sm">
                  Carga en /admin/trivia
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Registra la pregunta con el switch en{" "}
                  <strong>&ldquo;Guardar como Borrador&rdquo;</strong> (o
                  mediante Carga Masiva JSON). Queda en estado pendiente.
                </p>
              </div>

              {/* Paso 3 */}
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    Paso 3
                  </span>
                  <Badge className="bg-emerald-600 text-white text-[10px]">
                    Validación
                  </Badge>
                </div>
                <p className="font-bold text-foreground text-xs sm:text-sm">
                  Revisión & Publicación
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  El equipo de moderación filtra por <em>Solo Borradores</em>,
                  valida la fuente y redacción, y aprueba las preguntas
                  seleccionadas con el botón{" "}
                  <strong>
                    &ldquo;Aprobar y Publicar Seleccionadas&rdquo;
                  </strong>
                  .
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Manual de Carga en /admin/trivia */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              2. Cómo Llenar el Formulario en /admin/trivia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs sm:text-sm">
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg border bg-muted/10 space-y-1">
                <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                  📝 Enunciado de la Pregunta:
                </p>
                <p className="text-muted-foreground text-xs">
                  Debe ser directo y formularse entre comillas o con signo de
                  interrogación. Ejemplo:{" "}
                  <em>
                    &ldquo;¿Qué candidato regional propuso crear un tren bala de
                    Tumbes a Tacna?&rdquo;
                  </em>
                </p>
              </div>

              <div className="p-3 rounded-lg border bg-muted/10 space-y-1">
                <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                  🎯 Eje Temático y Audiencia:
                </p>
                <p className="text-muted-foreground text-xs">
                  Selecciona uno de los 4 temas activos (
                  <em>¿Qué Hace Tu Autoridad?</em>,{" "}
                  <em>Detector de Promesas Falsas</em>,{" "}
                  <em>Reglas del Día de Votación</em> o{" "}
                  <em>Lo Dijo en Cámara</em>) y marca la audiencia recomendada (
                  <em>Ciudadanos / Votantes</em>).
                </p>
              </div>

              <div className="p-3 rounded-lg border bg-muted/10 space-y-1">
                <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                  ⚖️ Alternativas de Respuesta:
                </p>
                <p className="text-muted-foreground text-xs">
                  Ingresa exactamente 4 alternativas. Marca el círculo de la
                  opción que corresponde a la respuesta correcta. Arrastra las
                  opciones con el icono de agarre para reordenarlas.
                </p>
              </div>

              <div className="p-3 rounded-lg border bg-muted/10 space-y-1">
                <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                  💡 Explicación Educativa:
                </p>
                <p className="text-muted-foreground text-xs">
                  Redacta 1 párrafo explicando por qué es la alternativa
                  correcta, citando la ley (ej. Ley Orgánica de
                  Municipalidades), el organismo (JNE, ONPE) o el contexto del
                  debate.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Reglas Críticas para Enlaces de Video */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              3. Enlaces Multimedia: Videos de TikTok y YouTube
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs sm:text-sm">
            <p className="text-muted-foreground text-xs leading-relaxed">
              El reproductor integrado de VotaBien abre los videos directamente
              en pantalla cuando el ciudadano responde. Para que funcione sin
              fallas, usa siempre este formato:
            </p>

            <div className="space-y-2.5">
              {/* TikTok */}
              <div className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    📱 TikTok (Enlace Completo con ID)
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Reproductor Pop-up
                  </Badge>
                </div>
                <p className="text-xs font-mono bg-background p-2 rounded border text-muted-foreground break-all">
                  https://www.tiktok.com/@usuario/video/7329482938492834
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  ⚠️ <strong>Evitar enlaces cortos:</strong> Si compartes desde
                  el celular y el enlace dice <code>vt.tiktok.com/...</code> o{" "}
                  <code>vm.tiktok.com/...</code>, ábrelo primero en el navegador
                  y copia la URL expandida con <code>/video/ID_NUMÉRICO</code>.
                </p>
              </div>

              {/* YouTube */}
              <div className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    ▶️ YouTube & YouTube Shorts con Timestamp
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Inicia en el segundo exacto
                  </Badge>
                </div>
                <p className="text-xs font-mono bg-background p-2 rounded border text-muted-foreground break-all">
                  https://www.youtube.com/watch?v=VIDEO_ID&amp;t=1m25s
                </p>
                <p className="text-xs font-mono bg-background p-2 rounded border text-muted-foreground break-all">
                  https://www.youtube.com/shorts/AbCdEf12345
                </p>
                <p className="text-[11px] text-muted-foreground">
                  💡 Agrega <code>?t=45s</code> o <code>?t=1m20s</code> al final
                  del enlace para que el video empiece exactamente en la
                  declaración del candidato.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Criterios de Calidad y Buenas Prácticas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              4. Criterios de Calidad y Neutralidad
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="space-y-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.03] p-3.5">
              <p className="font-semibold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Buenas Prácticas:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs leading-relaxed">
                <li>
                  1 respuesta correcta indiscutible y 3 distractores
                  verosímiles.
                </li>
                <li>Incluir siempre el enlace de video de TikTok o YouTube.</li>
                <li>
                  Tono imparcial y objetivo, sin burlas ni adjetivos
                  descalificativos.
                </li>
                <li>
                  Explicación educativa que aporte contexto ciudadano o legal.
                </li>
              </ul>
            </div>

            <div className="space-y-2 rounded-lg border border-red-500/20 bg-red-500/[0.03] p-3.5">
              <p className="font-semibold flex items-center gap-1.5 text-red-500">
                <XCircle className="h-4 w-4" /> Qué Evitar:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs leading-relaxed">
                <li>
                  Preguntas sobre farándula o chismes sin valor electoral ni
                  cívico.
                </li>
                <li>
                  Opciones como &ldquo;Todas las anteriores&rdquo; o
                  &ldquo;Ninguna de las anteriores&rdquo;.
                </li>
                <li>
                  Preguntas con enunciados ambiguos o con más de una respuesta
                  válida.
                </li>
                <li>
                  Enlaces acortados de TikTok que no carguen en el reproductor.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Accesos directos inferiores */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Button
            variant="outline"
            asChild
            className="w-full sm:w-auto gap-2 text-xs"
          >
            <a href={DRIVE_DOC_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={13} />
              Ver Ejes en Google Drive
            </a>
          </Button>

          <Button
            asChild
            className="w-full sm:w-auto gap-2 text-xs font-bold shadow-sm"
          >
            <Link href="/admin/trivia">
              Ir al Gestor de Trivia (/admin/trivia)
              <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
      </div>
    </ContentLayout>
  );
}
