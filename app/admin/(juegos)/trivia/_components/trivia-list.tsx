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
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
  ResponsiveSelectValue,
} from "@/components/ui/responsive-select";
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
  X,
  CheckCheck,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { TriviaFormDialog } from "./trivia-form-dialog";
import {
  deleteTrivia,
  duplicateTrivia,
  togglePublishTrivia,
  bulkPublishTrivias,
  bulkUnpublishTrivias,
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
  canPublishDirectly?: boolean;
}

export function TriviaList({
  trivias,
  nextOrderIndex,
  topics,
  audiences,
  canPublishDirectly = false,
}: TriviaListProps) {
  const [editingTrivia, setEditingTrivia] = useState<TriviaBasic | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedAudience, setSelectedAudience] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const router = useRouter();

  // Solo audiencias activas para filtrar preguntas
  const activeAudiences = useMemo(
    () => audiences.filter((a) => a.is_active),
    [audiences],
  );

  const confirmDelete = async () => {
    if (!deleteId) return;

    toast.promise(deleteTrivia(deleteId), {
      loading: "Eliminando pregunta...",
      success: () => {
        setDeleteId(null);
        setSelectedIds((prev) => prev.filter((id) => id !== deleteId));
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

  const handleBulkPublish = async () => {
    if (selectedIds.length === 0) return;
    toast.promise(bulkPublishTrivias(selectedIds), {
      loading: `Publicando ${selectedIds.length} preguntas...`,
      success: (data) => {
        if (!data.success) throw new Error(data.error);
        setSelectedIds([]);
        router.refresh();
        return data.message;
      },
      error: (err) => err.message || "Error al publicar",
    });
  };

  const handleBulkUnpublish = async () => {
    if (selectedIds.length === 0) return;
    toast.promise(bulkUnpublishTrivias(selectedIds), {
      loading: `Moviendo ${selectedIds.length} preguntas a borrador...`,
      success: (data) => {
        if (!data.success) throw new Error(data.error);
        setSelectedIds([]);
        router.refresh();
        return data.message;
      },
      error: (err) => err.message || "Error al actualizar",
    });
  };

  const filteredTrivias = useMemo(() => {
    return trivias.filter((t) => {
      // Filtro por estado de publicación
      if (selectedStatus === "published" && !t.is_published) {
        return false;
      }
      if (selectedStatus === "draft" && t.is_published) {
        return false;
      }

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
    selectedStatus,
    selectedTopic,
    selectedDifficulty,
    selectedAudience,
  ]);

  const isAllSelected =
    filteredTrivias.length > 0 &&
    filteredTrivias.every((t) => selectedIds.includes(t.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTrivias.map((t) => t.id));
    }
  };

  const handleToggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

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
      <div className="p-3 sm:p-4 rounded-xl border bg-card/60 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por enunciado o explicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-8 bg-background h-9 text-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Filtro Estado de Publicación */}
            <ResponsiveSelect
              title="Filtrar por Estado"
              value={selectedStatus}
              onValueChange={setSelectedStatus}
            >
              <ResponsiveSelectTrigger className="w-full h-9 text-xs bg-background">
                <ResponsiveSelectValue placeholder="Estado" />
              </ResponsiveSelectTrigger>
              <ResponsiveSelectContent>
                <ResponsiveSelectItem value="all">
                  Todos los estados
                </ResponsiveSelectItem>
                <ResponsiveSelectItem value="published">
                  🟢 Publicadas (Activas)
                </ResponsiveSelectItem>
                <ResponsiveSelectItem value="draft">
                  🟡 Borradores (Pendientes)
                </ResponsiveSelectItem>
              </ResponsiveSelectContent>
            </ResponsiveSelect>

            {/* Filtro Tema */}
            <ResponsiveSelect
              title="Filtrar por Tema"
              value={selectedTopic}
              onValueChange={setSelectedTopic}
            >
              <ResponsiveSelectTrigger className="w-full h-9 text-xs bg-background">
                <Filter className="w-3.5 h-3.5 mr-1 text-muted-foreground shrink-0" />
                <ResponsiveSelectValue placeholder="Todos los temas" />
              </ResponsiveSelectTrigger>
              <ResponsiveSelectContent>
                <ResponsiveSelectItem value="all">
                  Todos los temas
                </ResponsiveSelectItem>
                {topics.map((top) => (
                  <ResponsiveSelectItem key={top.id} value={top.id}>
                    {top.title}
                  </ResponsiveSelectItem>
                ))}
              </ResponsiveSelectContent>
            </ResponsiveSelect>

            {/* Filtro Audiencia (Solo activas) */}
            <ResponsiveSelect
              title="Filtrar por Audiencia"
              value={selectedAudience}
              onValueChange={setSelectedAudience}
            >
              <ResponsiveSelectTrigger className="w-full h-9 text-xs bg-background">
                <ResponsiveSelectValue placeholder="Audiencias activas" />
              </ResponsiveSelectTrigger>
              <ResponsiveSelectContent>
                <ResponsiveSelectItem value="all">
                  Todas las audiencias
                </ResponsiveSelectItem>
                {activeAudiences.map((aud) => (
                  <ResponsiveSelectItem key={aud.id} value={aud.id}>
                    <div className="flex items-center gap-1.5">
                      {renderAudienceIcon(aud.icon || aud.slug, { size: 12 })}
                      <span>{aud.name}</span>
                    </div>
                  </ResponsiveSelectItem>
                ))}
              </ResponsiveSelectContent>
            </ResponsiveSelect>

            {/* Filtro Dificultad */}
            <ResponsiveSelect
              title="Filtrar por Dificultad"
              value={selectedDifficulty}
              onValueChange={setSelectedDifficulty}
            >
              <ResponsiveSelectTrigger className="w-full h-9 text-xs bg-background">
                <ResponsiveSelectValue placeholder="Dificultad" />
              </ResponsiveSelectTrigger>
              <ResponsiveSelectContent>
                <ResponsiveSelectItem value="all">
                  Todas dif.
                </ResponsiveSelectItem>
                <ResponsiveSelectItem value="FACIL">Fácil</ResponsiveSelectItem>
                <ResponsiveSelectItem value="MEDIO">Medio</ResponsiveSelectItem>
                <ResponsiveSelectItem value="DIFICIL">
                  Difícil
                </ResponsiveSelectItem>
              </ResponsiveSelectContent>
            </ResponsiveSelect>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-3 flex-wrap">
            {canPublishDirectly && filteredTrivias.length > 0 && (
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-foreground font-medium">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleToggleSelectAll}
                  className="h-4 w-4 rounded"
                />
                <span className="text-xs">
                  Seleccionar todo ({filteredTrivias.length})
                </span>
              </label>
            )}

            <span>
              Mostrando{" "}
              <strong className="text-foreground">
                {filteredTrivias.length}
              </strong>{" "}
              de {trivias.length} preguntas
              {selectedIds.length > 0 && (
                <span className="text-primary font-bold ml-1">
                  ({selectedIds.length} seleccionadas)
                </span>
              )}
            </span>

            {(searchTerm ||
              selectedStatus !== "all" ||
              selectedTopic !== "all" ||
              selectedAudience !== "all" ||
              selectedDifficulty !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedStatus("all");
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
            className="h-7 text-xs gap-1.5 self-end sm:self-auto bg-background"
          >
            <Download size={13} /> Exportar JSON ({filteredTrivias.length})
          </Button>
        </div>
      </div>

      {/* BARRA FLOTANTE DE ACCIONES MASIVAS */}
      {canPublishDirectly && selectedIds.length > 0 && (
        <div className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-2.5 p-3 bg-card border border-primary/40 rounded-2xl shadow-lg ring-1 ring-primary/20 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Badge
              variant="default"
              className="text-xs font-bold px-2 py-0.5 bg-primary text-primary-foreground"
            >
              {selectedIds.length} seleccionadas
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Acciones de moderación:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleBulkPublish}
              className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <CheckCheck size={14} /> Aprobar y Publicar ({selectedIds.length})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkUnpublish}
              className="h-8 gap-1.5 text-xs border-amber-500/50 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            >
              <EyeOff size={14} /> Mover a Borrador ({selectedIds.length})
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              className="h-8 text-xs text-muted-foreground hover:text-foreground px-2"
              title="Deseleccionar todas"
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Grid de Preguntas */}
      {filteredTrivias.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
          <p className="text-muted-foreground text-sm font-medium">
            No se encontraron preguntas con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4.5">
          {filteredTrivias.map((trivia) => (
            <TriviaItem
              key={trivia.id}
              trivia={trivia}
              isSelected={selectedIds.includes(trivia.id)}
              canPublishDirectly={canPublishDirectly}
              onToggleSelect={
                canPublishDirectly
                  ? () => handleToggleSelectOne(trivia.id)
                  : undefined
              }
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
        canPublishDirectly={canPublishDirectly}
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
  isSelected = false,
  canPublishDirectly = false,
  onToggleSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onTogglePublish,
}: {
  trivia: TriviaBasic;
  isSelected?: boolean;
  canPublishDirectly?: boolean;
  onToggleSelect?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onTogglePublish: () => void;
}) {
  const [showExplanation, setShowExplanation] = useState(false);

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
      className={`relative flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md transition-all rounded-2xl ${
        isSelected
          ? "border-primary ring-2 ring-primary/40 bg-primary/[0.02]"
          : !trivia.is_published
            ? "opacity-85 border-dashed border-amber-500/40 bg-amber-500/[0.02]"
            : ""
      }`}
    >
      <CardHeader className="pt-3.5 pb-2 px-3.5 sm:px-4 space-y-2">
        {/* Meta / Badges */}
        <div className="flex justify-between items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0">
            {onToggleSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onToggleSelect}
                className="h-4 w-4 rounded border-muted-foreground/60 data-[state=checked]:bg-primary shrink-0"
                aria-label={`Seleccionar pregunta ${trivia.global_index}`}
              />
            )}
            <Badge
              variant="outline"
              className="gap-0.5 font-mono text-[10px] px-1.5 py-0.5 shrink-0"
            >
              <Hash className="w-3 h-3 text-muted-foreground" />
              {trivia.global_index}
            </Badge>
            {!trivia.is_published && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shrink-0 font-bold"
              >
                Borrador
              </Badge>
            )}
            {trivia.topic && (
              <Badge
                variant="secondary"
                className="text-[10px] truncate max-w-[130px] flex items-center gap-1 shrink-0"
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

          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              className={`${difficultyColor[trivia.difficulty]} border text-[10px] px-1.5 py-0`}
            >
              {trivia.difficulty}
            </Badge>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
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
                className="text-[10px] font-medium bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded-md flex items-center gap-1"
              >
                {renderAudienceIcon(aud.icon || aud.slug, { size: 10 })}
                <span>{aud.name.split("/")[0].trim()}</span>
              </span>
            ))}
          </div>
        )}

        {/* La Pregunta */}
        <div className="min-h-[44px] flex items-center pt-0.5">
          <p className="font-semibold text-xs sm:text-sm leading-snug text-foreground line-clamp-3">
            “{trivia.quote}”
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-2 bg-muted/10 py-3 px-3.5 sm:px-4">
        {/* Opciones */}
        <div className="space-y-1.5">
          {options.slice(0, 4).map((opt, idx) => {
            const isCorrect = opt.option_id === correctAnswerId;
            return (
              <div
                key={opt.option_id || idx}
                className={`
                  relative flex items-start sm:items-center p-2 rounded-lg text-xs border transition-colors
                  ${
                    isCorrect
                      ? "bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-medium"
                      : "bg-background border-border/70 text-muted-foreground"
                  }
                `}
              >
                <span
                  className={`
                    w-4 h-4 flex items-center justify-center rounded text-[9px] font-black mr-2 flex-shrink-0 mt-0.5 sm:mt-0
                    ${isCorrect ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}
                  `}
                >
                  {letters[idx]}
                </span>

                <span className="flex-1 leading-snug break-words whitespace-normal text-xs">
                  {opt.name}
                </span>

                {isCorrect && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ml-1.5 flex-shrink-0 mt-0.5 sm:mt-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Explicación expandible en 1 toque (móvil y desktop) */}
        {showExplanation && trivia.explanation && (
          <div className="mt-2 p-2.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 text-xs text-blue-900 dark:text-blue-200 space-y-1 animate-in fade-in zoom-in-95 duration-150">
            <p className="font-bold text-[11px] flex items-center gap-1 text-blue-800 dark:text-blue-300">
              <Info className="w-3.5 h-3.5" />
              Explicación educativa:
            </p>
            <p className="text-[11px] leading-relaxed text-blue-950/80 dark:text-blue-200/90">
              {trivia.explanation}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t flex justify-between items-center py-2 px-3 bg-card">
        {/* Iconos de Información y Estado */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {trivia.explanation && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setShowExplanation((prev) => !prev)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      showExplanation
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                    title="Ver explicación educativa"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3 hidden sm:block">
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
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-blue-500 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver fuente de verificación</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Toggle Publicado */}
          {canPublishDirectly ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onTogglePublish}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                  >
                    {trivia.is_published ? (
                      <Eye className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-amber-600" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {trivia.is_published
                      ? "Pregunta publicada (activa). Clic para despublicar."
                      : "Borrador (oculta). Clic para aprobar y publicar."}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="p-1.5 rounded-lg text-muted-foreground/60 cursor-default inline-flex">
                    {trivia.is_published ? (
                      <Eye className="w-4 h-4 text-emerald-600/70" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-amber-600/70" />
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {trivia.is_published
                      ? "Pregunta publicada (activa)"
                      : "Borrador (Pendiente de ser revisado y aprobado)"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDuplicate}
                  className="h-8 w-8 sm:h-7 sm:w-7 p-0 text-muted-foreground hover:text-foreground"
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
            className="h-8 w-8 sm:h-7 sm:w-7 p-0"
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 sm:h-7 sm:w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
