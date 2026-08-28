import { ContentLayout } from "@/components/admin/content-layout";
import { serverRequireReviewer } from "@/lib/auth-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Video,
  Users,
  BookOpen,
} from "lucide-react";

export const metadata = {
  title: "Guía de Trivia | Admin VotaBien",
  description:
    "Criterios, audiencias y formatos multimedia para crear preguntas de trivia",
};

export default async function GuiaTriviaPage() {
  await serverRequireReviewer();

  return (
    <ContentLayout title="Guía de Trivia">
      <div className="flex w-full flex-col gap-6 p-6 max-w-4xl">
        {/* Encabezado */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            Guía de Creación de Preguntas de Trivia
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aprende a formular y catalogar preguntas cívicas y electorales. En
            VotaBien la trivia enseña a través del juego, vinculando propuestas,
            declaraciones y videos reales de candidatos.
          </p>
        </div>

        {/* 1. Estilo de Preguntas y Formato Estrella */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              1. Estilo y Formato de las Preguntas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              El objetivo es que la ciudadanía aprenda jugando sobre las
              propuestas y declaraciones de los candidatos. El formato principal
              que mejor conecta con los usuarios es:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="rounded-lg border border-border/80 bg-muted/40 p-3">
                <p className="font-semibold text-foreground text-xs mb-1">
                  💡 Preguntas de Propuestas y Frases:
                </p>
                <p className="text-xs italic">
                  &ldquo;¿Quién propuso construir un tren bala de Tumbes a
                  Tacna?&rdquo;
                </p>
              </div>
              <div className="rounded-lg border border-border/80 bg-muted/40 p-3">
                <p className="font-semibold text-foreground text-xs mb-1">
                  🏛️ Preguntas Cívicas e Institucionales:
                </p>
                <p className="text-xs italic">
                  &ldquo;¿Qué función NO le corresponde a un Alcalde
                  Distrital?&rdquo;
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Audiencias y Temas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              2. Audiencias y Ejes Temáticos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="outline" className="font-semibold">
                  Audiencias (¿A quién le hablamos?)
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Permite segmentar las preguntas según el perfil del votante.
                Puedes marcar una o varias audiencias por pregunta:
              </p>
              <ul className="list-disc list-inside text-xs text-muted-foreground mt-1.5 space-y-1">
                <li>
                  <strong className="text-foreground">
                    Jóvenes / Primeros Votantes:
                  </strong>{" "}
                  Preguntas dinámicas con videos de TikTok/Shorts sobre temas
                  laborales, educación y propuestas virales.
                </li>
                <li>
                  <strong className="text-foreground">Público General:</strong>{" "}
                  Preguntas clave sobre planes de gobierno regional, seguridad
                  ciudadana y transporte.
                </li>
                <li>
                  <strong className="text-foreground">
                    Voto Informado / Universitarios:
                  </strong>{" "}
                  Preguntas sobre funciones del Estado, presupuesto y leyes.
                </li>
              </ul>
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="secondary" className="font-semibold">
                  Temas (Eje temático)
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Asigna la pregunta a un tema específico (ej.{" "}
                <em>Propuestas de Campaña</em>, <em>Seguridad y Justicia</em>,{" "}
                <em>Medio Ambiente</em>, <em>Constitución y Estado</em>) para
                que aparezca en los retos temáticos del mapa de trivia.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. Fuentes Soportadas y Videos (TikTok y YouTube) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              3. Fuentes Multimedia: Videos de TikTok y YouTube
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5 text-sm">
            <p className="text-muted-foreground text-xs leading-relaxed">
              La plataforma cuenta con un <strong>reproductor integrado</strong>{" "}
              que muestra el video directamente en la pantalla al responder. Usa
              los siguientes formatos de URL en el campo{" "}
              <strong>Fuente (URL)</strong>:
            </p>

            <div className="space-y-2.5">
              {/* TikTok */}
              <div className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    📱 TikTok (Enlace directo al video)
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Soporta Reproductor
                  </Badge>
                </div>
                <p className="text-xs font-mono bg-background p-1.5 rounded border border-border/60 text-muted-foreground break-all">
                  https://www.tiktok.com/@usuario/video/7329482938492834
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  ⚠️ <strong>Importante con TikTok:</strong> Si compartes desde
                  el celular y el link es corto (ej.{" "}
                  <code>vt.tiktok.com/...</code> o{" "}
                  <code>vm.tiktok.com/...</code>
                  ), ábrelo primero en el navegador y copia la URL completa que
                  contiene <code>/video/ID_NUMÉRICO</code>.
                </p>
              </div>

              {/* YouTube */}
              <div className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    ▶️ YouTube & YouTube Shorts
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Soporta Timestamp
                  </Badge>
                </div>
                <p className="text-xs font-mono bg-background p-1.5 rounded border border-border/60 text-muted-foreground break-all">
                  https://www.youtube.com/shorts/AbCdEf12345
                </p>
                <p className="text-xs font-mono bg-background p-1.5 rounded border border-border/60 text-muted-foreground break-all">
                  https://www.youtube.com/watch?v=VIDEO_ID&amp;t=1m25s
                </p>
                <p className="text-[11px] text-muted-foreground">
                  💡 Puedes agregar <code>?t=45s</code> o <code>?t=1m20s</code>{" "}
                  al final del link de YouTube para que el video empiece
                  exactamente en la declaración del candidato.
                </p>
              </div>

              {/* Web / Prensa */}
              <div className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    🌐 Prensa / Fuentes Oficiales (JNE, Leyes)
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    Enlace Externo
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cualquier URL web estándar (ej. El Comercio, RPP, diario El
                  Peruano). Al responder, se mostrará el botón{" "}
                  <em>&ldquo;Ver fuente oficial&rdquo;</em> con icono de enlace
                  externo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Ejemplo Práctico Paso a Paso */}
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <BookOpen className="h-4 w-4 text-primary" />
              4. Ejemplo Práctico de Creación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border border-border bg-card p-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 border-b border-border/60">
                <div>
                  <span className="text-muted-foreground font-medium block">
                    Pregunta / Enunciado:
                  </span>
                  <span className="font-semibold text-foreground text-sm">
                    &ldquo;¿Quién propuso crear un serenazgo regional integrado
                    con patrullaje aéreo en La Libertad?&rdquo;
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium block">
                    Tema y Audiencias:
                  </span>
                  <span className="text-foreground">
                    Tema: <em>Seguridad Ciudadana</em> | Audiencia:{" "}
                    <em>Jóvenes, General</em>
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-muted-foreground font-medium block">
                  Opciones (Tipo: CANDIDATO / PERSON):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="border border-emerald-500/30 bg-emerald-500/10 p-2 rounded flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      A) [Candidato A] — Partido X
                    </span>
                    <Badge className="bg-emerald-600 text-white text-[10px]">
                      CORRECTA
                    </Badge>
                  </div>
                  <div className="border border-border/60 bg-muted/30 p-2 rounded text-muted-foreground">
                    B) [Candidato B] — Partido Y
                  </div>
                  <div className="border border-border/60 bg-muted/30 p-2 rounded text-muted-foreground">
                    C) [Candidato C] — Partido Z
                  </div>
                  <div className="border border-border/60 bg-muted/30 p-2 rounded text-muted-foreground">
                    D) [Candidato D] — Partido W
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
                <div>
                  <span className="text-muted-foreground font-medium block">
                    Fuente Multimedia:
                  </span>
                  <span className="font-mono text-[11px] text-primary">
                    https://www.tiktok.com/@noticias/video/7392819283748291029
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium block">
                    Explicación Educativa:
                  </span>
                  <span className="text-muted-foreground">
                    El candidato presentó esta propuesta durante el debate
                    regional organizado por la Cámara de Comercio.
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Criterios de Calidad */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              5. Criterios de Calidad y Neutralidad
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-semibold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Buenas Prácticas:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs leading-relaxed">
                <li>
                  1 respuesta correcta indiscutible y 3 distractores
                  verosímiles.
                </li>
                <li>Incluir siempre el enlace de video de TikTok o YouTube.</li>
                <li>Tono imparcial y objetivo, sin burlas ni sesgos.</li>
                <li>Explicación educativa que aporte contexto cívico.</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-semibold flex items-center gap-1.5 text-red-500">
                <XCircle className="h-4 w-4" /> Evitar:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs leading-relaxed">
                <li>
                  Preguntas sobre farándula o chismes sin valor electoral.
                </li>
                <li>
                  Opciones como &ldquo;Todas las anteriores&rdquo; o
                  &ldquo;Ninguna&rdquo;.
                </li>
                <li>
                  Preguntas con ambigüedad o múltiples respuestas posibles.
                </li>
                <li>
                  Enlaces de TikTok acortados que no carguen en el reproductor.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Regla de Oro */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6 text-sm">
            <p className="font-semibold mb-1 text-foreground">
              Regla de oro de la Trivia
            </p>
            <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
              <strong>Educar con evidencia:</strong> Cada pregunta debe tener
              una fuente real verificable (video o prensa). El objetivo no es
              ridiculizar a ningún candidato, sino contrastar sus propuestas
              reales y enseñar a la ciudadanía a votar con memoria informada.
            </p>
          </CardContent>
        </Card>
      </div>
    </ContentLayout>
  );
}
