import { ContentLayout } from "@/components/admin/content-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  BookOpen,
  FileCheck,
  Trophy,
  FileSpreadsheet,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Centro de Guías | Admin VotaBien",
  description:
    "Manuales operativos, guías metodológicas y recursos de investigación para el equipo VotaBien",
};

const DRIVE_DOC_URL =
  "https://docs.google.com/document/d/1aZ6qd3or9SJEDXoVAdrQoTxeFBF0nxYbVSyj_9ZzxtU/edit?tab=t.0";

export default function GuiasIndexPage() {
  return (
    <ContentLayout title="Centro de Guías & Documentación">
      <div className="flex w-full flex-col gap-6 p-6 max-w-5xl">
        {/* Encabezado */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Centro de Guías & Recursos Operativos
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-2xl">
            Bienvenido al repositorio de metodologías, manuales de plataforma y
            documentos oficiales de investigación para el equipo de voluntarios
            y moderadores de VotaBien Perú.
          </p>
        </div>

        {/* Grilla de Guías Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Fact Checking */}
          <Card className="flex flex-col justify-between border hover:border-primary/50 transition-all shadow-xs hover:shadow-md rounded-2xl group">
            <CardHeader className="space-y-2 pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FileCheck size={22} />
                </div>
                <Badge variant="secondary" className="text-[10px] font-bold">
                  Moderación
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                Fact Checking & Revisión IA
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Metodología del Semáforo de Riesgo (Rojo/Amarillo/Verde),
                principio de no caducidad de antecedentes y manual de aprobación
                masiva en la bandeja de candidatos.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Button
                asChild
                variant="outline"
                className="w-full justify-between text-xs font-semibold"
              >
                <Link href="/admin/guias/revision-ia">
                  <span>Abrir Guía de Moderación</span>
                  <ArrowRight size={14} />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Trivia */}
          <Card className="flex flex-col justify-between border hover:border-primary/50 transition-all shadow-xs hover:shadow-md rounded-2xl group">
            <CardHeader className="space-y-2 pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Trophy size={22} />
                </div>
                <Badge variant="secondary" className="text-[10px] font-bold">
                  Educación Cívica
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                Trivia Cívica & Formulación de Preguntas
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Flujo operativo de borrador a publicación, integración de videos
                de TikTok y YouTube con timestamp, y criterios de calidad para
                crear preguntas pedagógicas.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Button
                asChild
                variant="outline"
                className="w-full justify-between text-xs font-semibold"
              >
                <Link href="/admin/guias/trivia">
                  <span>Abrir Guía de Trivia</span>
                  <ArrowRight size={14} />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Card Destacado: Documento Google Drive */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/[0.02] shadow-sm rounded-2xl">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary text-primary-foreground font-bold text-[10px]">
                  Documento Oficial
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Google Drive
                </Badge>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
                Plan de Ejes Temáticos & Asignación de Equipo
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Consulta los 4 ejes de investigación detallados, metas de
                preguntas semanales por voluntario, cronograma del voluntariado
                y matrices de contraste cívico.
              </p>
            </div>

            <Button
              asChild
              className="gap-2 shrink-0 font-bold text-xs shadow-md bg-primary hover:bg-primary/90"
            >
              <a href={DRIVE_DOC_URL} target="_blank" rel="noopener noreferrer">
                Abrir en Google Drive
                <ExternalLink size={14} />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </ContentLayout>
  );
}
