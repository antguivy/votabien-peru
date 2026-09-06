import { ContentLayout } from "@/components/admin/content-layout";
import { serverRequireReviewer } from "@/lib/auth-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Pencil,
  ShieldAlert,
  Newspaper,
  Scale,
  GitCompare,
  BrainCircuit,
  Clock,
  AlertTriangle,
  FileCheck,
  CheckCheck,
  History,
  ArrowRight,
  Filter,
} from "lucide-react";

export const metadata = {
  title: "Guía de Fact Checking & Moderación IA | Admin VotaBien",
  description:
    "Criterios metodológicos para la revisión ágil, verificación de fuentes y construcción del historial cívico",
};

export default async function GuiaRevisionIAPage() {
  await serverRequireReviewer();

  return (
    <ContentLayout title="Guía de Fact Checking & Revisión IA">
      <div className="flex w-full flex-col gap-6 p-6 max-w-4xl">
        {/* Encabezado */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <FileCheck className="h-8 w-8 text-primary" />
            Guía de Fact Checking & Moderación IA
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Tu rol es fundamental para garantizar que la ciudadanía acceda a
            información veraz, neutral y respaldada por evidencia. En VotaBien
            no emitimos opiniones ni juicios morales:{" "}
            <strong>
              somos un observatorio de verificación factual y registro histórico
            </strong>
            .
          </p>
        </div>

        {/* 1. Principio Fundamental: Fact Checking vs Opinión */}
        <Card className="border-primary/30 bg-primary/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <History className="h-5 w-5" />
              1. Principio de Registro Histórico y Neutralidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5 text-sm leading-relaxed text-muted-foreground">
            <div className="p-3.5 rounded-lg border border-primary/20 bg-background space-y-2">
              <p className="font-semibold text-foreground text-sm flex items-center gap-2">
                🏛️ La información de interés público NO caduca
              </p>
              <p className="text-xs sm:text-sm">
                Un candidato a gobernador o alcalde asume una responsabilidad
                pública de primer nivel. Por ello, toda su trayectoria política,
                gestión previa, declaraciones e investigaciones forman parte de
                su <strong>hoja de vida cívica</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5">
                <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 shrink-0" />
                  ¿Se rechaza un caso de hace 5 o 10 años?
                </p>
                <p className="text-muted-foreground">
                  <strong>NO. Nunca se rechaza por antigüedad.</strong> Los
                  hechos del pasado son valiosos para que el votante evalúe
                  experiencia, coherencia o antecedentes.
                </p>
              </div>

              <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 space-y-1.5">
                <p className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <Scale className="h-4 w-4 shrink-0" />
                  ¿Qué pasa si prescribió o fue archivado?
                </p>
                <p className="text-muted-foreground">
                  <strong>Sigue siendo un hecho real.</strong> No debatimos si
                  es inocente o culpable: registramos el estado fáctico (ej.{" "}
                  <em>ARCHIVADO</em> o <em>PRESCRITO</em>) respaldado por la
                  fuente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Metodología de Triaje Rápido (Semáforo de Riesgo) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              2. Metodología de Triaje Rápido (Filtro Semáforo)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-xs text-muted-foreground">
              La IA ya analizó y filtró miles de notas de medios serios con alta
              precisión. No necesitas demorarte 5 minutos por cada tarjeta.
              Aplica la velocidad según el nivel de riesgo:
            </p>

            {/* Rojo */}
            <div className="flex gap-3 p-3 rounded-lg border border-red-500/20 bg-red-500/5">
              <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-[11px]">
                    🔴 ALTO RIESGO — PENAL / SENTENCIAS
                  </Badge>
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                    Revisión 1 a 1 rigurosa
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sentencias firmes, investigaciones fiscales en curso o
                  detenciones.
                </p>
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5 pt-1">
                  <li>
                    <strong>Verifica homónimos:</strong> Asegúrate de que el
                    DNI, la región y la foto coincidan con el candidato.
                  </li>
                  <li>
                    Abre el enlace para validar que provenga de una fiscalía,
                    Poder Judicial o medio formal.
                  </li>
                </ul>
              </div>
            </div>

            {/* Amarillo */}
            <div className="flex gap-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
              <Scale className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[11px]">
                    🟡 RIESGO MEDIO — ÉTICO / ADMINISTRATIVO
                  </Badge>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Verificación de entidad y estado
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sanciones de SERVIR, Contraloría General de la República o
                  resoluciones del Jurado Nacional de Elecciones (JNE).
                </p>
                <p className="text-xs text-muted-foreground">
                  Confirma que se detalle si la sanción está firme o en proceso
                  de apelación.
                </p>
              </div>
            </div>

            {/* Verde */}
            <div className="flex gap-3 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
              <Newspaper className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600 text-white text-[11px]">
                    🟢 FAST-TRACK — NOTICIAS, POSTURAS Y TRAYECTORIA
                  </Badge>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Aprobación ágil (85% del volumen)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Entrevistas, propuestas de campaña, trayectoria académica y
                  política previa.
                </p>
                <div className="p-2.5 rounded bg-background border border-emerald-500/30 text-xs space-y-1 mt-1.5">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Protocolo Ágil (Aprobación Masiva permitida):
                  </p>
                  <p className="text-muted-foreground">
                    Si proviene de un medio reconocido (El Comercio, RPP, La
                    República, Andina, Correo, El Búho, etc.) y la redacción es
                    coherente, <strong>aprueba de inmediato</strong>. Puedes
                    usar los checkboxes y la barra inferior para aprobar en
                    lotes de 10 o 20 items.
                  </p>
                  <p className="text-[11px] text-muted-foreground italic">
                    💡 Realiza un <strong>muestreo aleatorio</strong> abriendo 1
                    de cada 5 enlaces para comprobar la salud del lote.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Criterios de Aprobación vs Rechazo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              3. Matriz de Decisión: ¿Cuándo Aprobar y Cuándo Rechazar?
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.03] p-3.5">
              <p className="font-semibold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm">
                <CheckCircle2 className="h-4 w-4" /> Aprueba si:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground leading-relaxed">
                <li>El medio o entidad que publica es reconocible y formal.</li>
                <li>
                  El texto es objetivo y descriptivo, sin adjetivos ofensivos ni
                  sesgos de opinión.
                </li>
                <li>
                  La fecha y el cargo corresponden al contexto del candidato.
                </li>
                <li>
                  El caso ya concluyó, prescribió o se archivó pero ocurrió de
                  forma verificable.
                </li>
              </ul>
            </div>

            <div className="space-y-2 rounded-lg border border-red-500/20 bg-red-500/[0.03] p-3.5">
              <p className="font-semibold flex items-center gap-1.5 text-red-500 text-sm">
                <XCircle className="h-4 w-4" /> Rechaza si:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground leading-relaxed">
                <li>
                  <strong>Fuente trucha:</strong> Blogs anónimos de Blogspot,
                  fanpages de memes o portales de guerra sucia electoral.
                </li>
                <li>
                  <strong>Enlace caído:</strong> Error 404, página no disponible
                  o pantalla en blanco.
                </li>
                <li>
                  <strong>Homónimo no resuelto:</strong> La noticia pertenece a
                  otra persona con el mismo nombre en otra región o ámbito.
                </li>
                <li>
                  El contenido es pura especulación o chisme sin sustento
                  periodístico mínimo.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 4. Herramientas Rápidas en la Bandeja */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              4. Manual de Operación en /admin/candidatos/revisiones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs sm:text-sm text-muted-foreground">
            <div className="p-3 rounded-lg border bg-muted/10 space-y-1">
              <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-primary" />
                Paso 1: Filtra por tu Departamento asignado
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                En el selector de región, elige exclusivamente los departamentos
                que te corresponden según la asignación de equipo (ej. Raiza:
                Puno, Cusco... / Blanca: Lima, Arequipa... / Ariana: La
                Libertad, Piura... / Rafael: Cajamarca, Ancash...).
              </p>
            </div>

            <div className="p-3 rounded-lg border bg-muted/10 space-y-1">
              <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                Paso 2: Aprobación Masiva para tarjetas Verdes (85% del volumen)
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Para propuestas, noticias y entrevistas de medios serios (El
                Comercio, RPP, La República, Andina, Correo), selecciona las
                filas con el checkbox principal y haz click en{" "}
                <strong>&ldquo;Aprobar Seleccionados&rdquo;</strong>.
              </p>
            </div>

            <div className="p-3 rounded-lg border bg-muted/10 space-y-1">
              <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                <Pencil className="h-3.5 w-3.5 text-primary" />
                Paso 3: Editar y Aprobar (cuando hay pequeños errores de forma)
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Si el contenido es verídico pero el resumen tiene una falta
                ortográfica, haz click en el lápiz, corrige el texto en el modal
                y presiona <strong>&ldquo;Guardar y Aprobar&rdquo;</strong>.
              </p>
            </div>

            <div className="p-3 rounded-lg border bg-muted/10 space-y-1">
              <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                <GitCompare className="h-3.5 w-3.5 text-primary" />
                Paso 4: Comparador de Cambios
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Si la tarjeta indica &ldquo;ACTUALIZACIÓN&rdquo;, usa este botón
                para verificar qué dato puntual está cambiando respecto a la
                ficha actual del candidato.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cierre / Regla de Oro */}
        <Card className="border-primary/40 bg-primary/10">
          <CardContent className="pt-6 text-sm">
            <p className="font-semibold mb-1 text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              Regla de Oro del Moderador VotaBien
            </p>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              <strong>Agilidad con sentido común:</strong> No te detengas a
              debatir si una noticia favorece o perjudica al candidato; nuestra
              labor es única y exclusivamente corroborar si el hecho ocurrió y
              si la fuente es fidedigna. Confiemos en el pipeline de IA para
              noticias masivas, y concentremos la mayor atención en los casos
              judiciales delicados.
            </p>
          </CardContent>
        </Card>

        {/* Botón directo de acción */}
        <div className="flex justify-end pt-2">
          <Button
            asChild
            className="w-full sm:w-auto gap-2 text-xs font-bold shadow-sm"
          >
            <Link href="/admin/candidatos/revisiones">
              Ir a la Bandeja de Moderación (/admin/candidatos/revisiones)
              <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
      </div>
    </ContentLayout>
  );
}
