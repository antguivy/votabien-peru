"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Edit,
  Trash2,
  Info,
  ExternalLink,
  Hash,
  CheckCircle2,
  Search,
  Filter,
  Copy,
  Download,
  Eye,
  EyeOff,
} from "lucide-react";
import { TriviaFormDialog } from "./trivia-form-dialog";
import {
  deleteTrivia,
  duplicateTrivia,
  togglePublishTrivia,
} from "../_lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  TriviaBasic,
  TriviaOption,
  TriviaTopic,
  TriviaAudience,
} from "@/interfaces/trivia";
import { renderTopicIcon, renderAudienceIcon } from "@/lib/trivia-icons";

interface TriviaListProps {
  trivias: TriviaBasic[];
  nextOrderIndex: number;
  topics: TriviaTopic[];
  audiences: TriviaAudience[];
}

export function TriviaList({
  trivias,
  nextOrderIndex,
  topics,
  audiences,
}: TriviaListProps) {
  const [editingTrivia, setEditingTrivia] = useState<TriviaBasic | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedAudience, setSelectedAudience] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const router = useRouter();

  const confirmDelete = async () => {
    if (!deleteId) return;

    toast.promise(deleteTrivia(deleteId), {
      loading: "Eliminando pregunta...",
      success: () => {
        setDeleteId(null);
        router.refresh();
        return "Pregunta eliminada correctamente";
      },
      error: "Error al eliminar",
    });
  };

  const handleDuplicate = async (id: number) => {
    toast.promise(duplicateTrivia(id), {
      loading: "Duplicando pregunta...",
      success: (data) => {
        if (!data.success) throw new Error(data.error);
        router.refresh();
        return data.message;
      },
      error: (err) => err.message || "Error al duplicar",
    });
  };

  const handleTogglePublish = async (id: number, currentStatus: boolean) => {
    toast.promise(togglePublishTrivia(id, !currentStatus), {
      loading: "Actualizando estado...",
      success: (data) => {
        if (!data.success) throw new Error(data.error);
        router.refresh();
        return data.message;
      },
      error: (err) => err.message || "Error al actualizar estado",
    });
  };

  const filteredTrivias = useMemo(() => {
    return trivias.filter((t) => {
      // Búsqueda por texto
      if (
        searchTerm &&
        !t.quote.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !t.explanation?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Filtro por tema
      if (selectedTopic !== "all" && t.topic_id !== selectedTopic) {
        return false;
      }

      // Filtro por dificultad
      if (selectedDifficulty !== "all" && t.difficulty !== selectedDifficulty) {
        return false;
      }

      // Filtro por audiencia
      if (
        selectedAudience !== "all" &&
        !t.audiences?.some(
          (a) => a.id === selectedAudience || a.slug === selectedAudience,
        )
      ) {
        return false;
      }

      return true;
    });
  }, [
    trivias,
    searchTerm,
    selectedTopic,
    selectedDifficulty,
    selectedAudience,
  ]);

  const handleExportJson = () => {
    const dataStr = JSON.stringify(filteredTrivias, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `votabien-trivia-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Se exportaron ${filteredTrivias.length} preguntas en JSON`);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros y Acciones */}
      <div className="p-4 rounded-xl border bg-card/60 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por enunciado o explicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background h-9 text-xs"
            />
          </div>

          {/* Filtro Tema */}
          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
            <SelectTrigger className="w-full sm:w-[220px] h-9 text-xs bg-background">
              <Filter className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Todos los temas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los temas</SelectItem>
              {topics.map((top) => (
                <SelectItem key={top.id} value={top.id}>
                  {top.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro Audiencia */}
          <Select value={selectedAudience} onValueChange={setSelectedAudience}>
            <SelectTrigger className="w-full sm:w-[190px] h-9 text-xs bg-background">
              <SelectValue placeholder="Todas las audiencias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las audiencias</SelectItem>
              {audiences.map((aud) => (
                <SelectItem key={aud.id} value={aud.id}>
                  <div className="flex items-center gap-1.5">
                    {renderAudienceIcon(aud.icon || aud.slug, { size: 12 })}
                    <span>{aud.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro Dificultad */}
          <Select
            value={selectedDifficulty}
            onValueChange={setSelectedDifficulty}
          >
            <SelectTrigger className="w-full sm:w-[130px] h-9 text-xs bg-background">
              <SelectValue placeholder="Dificultad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="FACIL">Fácil</SelectItem>
              <SelectItem value="MEDIO">Medio</SelectItem>
              <SelectItem value="DIFICIL">Difícil</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs text-muted-foreground pt-1 border-t">
          <div className="flex items-center gap-2">
            <span>
              Mostrando {filteredTrivias.length} de {trivias.length} preguntas
            </span>
            {(searchTerm ||
              selectedTopic !== "all" ||
              selectedAudience !== "all" ||
              selectedDifficulty !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedTopic("all");
                  setSelectedAudience("all");
                  setSelectedDifficulty("all");
                }}
                className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
              >
                Limpiar filtros
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJson}
            disabled={filteredTrivias.length === 0}
            className="h-7 text-xs gap-1.5 self-start sm:self-auto"
          >
            <Download size={13} /> Exportar JSON ({filteredTrivias.length})
          </Button>
        </div>
      </div>

      {/* Grid de Preguntas */}
      {filteredTrivias.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
          <p className="text-muted-foreground text-sm font-medium">
            No se encontraron preguntas con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTrivias.map((trivia) => (
            <TriviaItem
              key={trivia.id}
              trivia={trivia}
              onEdit={() => setEditingTrivia(trivia)}
              onDelete={() => setDeleteId(trivia.id)}
              onDuplicate={() => handleDuplicate(trivia.id)}
              onTogglePublish={() =>
                handleTogglePublish(trivia.id, trivia.is_published)
              }
            />
          ))}
        </div>
      )}

      {/* DIÁLOGO DE EDICIÓN */}
      <TriviaFormDialog
        open={!!editingTrivia}
        onOpenChange={(open) => !open && setEditingTrivia(null)}
        mode="edit"
        initialData={editingTrivia || undefined}
        nextOrderIndex={nextOrderIndex}
        topics={topics}
        audiences={audiences}
      />

      {/* DIÁLOGO DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar esta pregunta de trivia?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la pregunta del
              banco y de los juegos activos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- SUB-COMPONENTE: TARJETA INDIVIDUAL ---

function TriviaItem({
  trivia,
  onEdit,
  onDelete,
  onDuplicate,
  onTogglePublish,
}: {
  trivia: TriviaBasic;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onTogglePublish: () => void;
}) {
  let options: TriviaOption[] = [];
  try {
    options =
      typeof trivia.options === "string"
        ? JSON.parse(trivia.options)
        : trivia.options || [];
  } catch (e) {
    console.error("Error parsing options", e);
  }

  const correctAnswerId = trivia.correct_answer_id;
  const letters = ["A", "B", "C", "D"];

  const difficultyColor = {
    FACIL:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300",
    MEDIO:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300",
    DIFICIL:
      "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300",
  };

  return (
    <Card
      className={`flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
        !trivia.is_published ? "opacity-70 border-dashed" : ""
      }`}
    >
      <CardHeader className="pt-4 pb-2 space-y-2.5">
        {/* Meta / Badges */}
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="gap-0.5 font-mono text-[11px] px-1.5 py-0.5"
            >
              <Hash className="w-3 h-3 text-muted-foreground" />
              {trivia.global_index}
            </Badge>
            {trivia.topic && (
              <Badge
                variant="secondary"
                className="text-[10px] truncate max-w-[150px] flex items-center gap-1"
                style={{
                  borderLeftColor: trivia.topic.badge_color || undefined,
                  borderLeftWidth: trivia.topic.badge_color ? 3 : undefined,
                }}
              >
                {renderTopicIcon(trivia.topic.icon, { size: 11 })}
                <span className="truncate">{trivia.topic.title}</span>
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Badge
              className={`${difficultyColor[trivia.difficulty]} border text-[10px] px-1.5`}
            >
              {trivia.difficulty}
            </Badge>
            <Badge variant="secondary" className="text-[10px] px-1.5">
              {trivia.category}
            </Badge>
          </div>
        </div>

        {/* Audiencias asociadas */}
        {trivia.audiences && trivia.audiences.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {trivia.audiences.map((aud) => (
              <span
                key={aud.id}
                className="text-[10px] font-medium bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded flex items-center gap-1"
              >
                {renderAudienceIcon(aud.icon || aud.slug, { size: 10 })}
                <span>{aud.name.split("/")[0].trim()}</span>
              </span>
            ))}
          </div>
        )}

        {/* La Pregunta */}
        <div className="min-h-[50px] flex items-center pt-1">
          <p className="font-semibold text-sm leading-snug text-foreground line-clamp-3">
            “{trivia.quote}”
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-2 bg-muted/10 py-3">
        {/* Opciones */}
        <div className="space-y-1.5">
          {options.slice(0, 4).map((opt, idx) => {
            const isCorrect = opt.option_id === correctAnswerId;
            return (
              <div
                key={opt.option_id || idx}
                className={`
                  relative flex items-center p-2 rounded-lg text-xs border transition-colors
                  ${
                    isCorrect
                      ? "bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-medium"
                      : "bg-background border-border text-muted-foreground"
                  }
                `}
              >
                <span
                  className={`
                    w-4 h-4 flex items-center justify-center rounded text-[9px] font-black mr-2 flex-shrink-0
                    ${isCorrect ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}
                  `}
                >
                  {letters[idx]}
                </span>

                <span className="flex-1 truncate">{opt.name}</span>

                {isCorrect && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ml-1.5 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      <CardFooter className="border-t flex justify-between items-center py-2 px-3 bg-card">
        {/* Iconos de Información y Estado */}
        <div className="flex items-center gap-1">
          {trivia.explanation && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-1.5 rounded-md hover:bg-muted text-muted-foreground cursor-help">
                    <Info className="w-3.5 h-3.5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3">
                  <p className="font-bold text-xs mb-1">
                    Explicación educativa:
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {trivia.explanation}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {trivia.source_url && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={trivia.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-blue-500"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver fuente de verificación</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Toggle Publicado */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onTogglePublish}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                >
                  {trivia.is_published ? (
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {trivia.is_published
                    ? "Pregunta publicada (activa)"
                    : "Borrador (oculta)"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Acciones */}
        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDuplicate}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Duplicar como borrador</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-7 w-7 p-0"
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
