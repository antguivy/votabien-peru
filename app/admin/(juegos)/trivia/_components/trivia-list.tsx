"use client";

import { useState } from "react";
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
  Edit,
  Trash2,
  Info,
  ExternalLink,
  Hash,
  CheckCircle2,
} from "lucide-react";
import { TriviaFormDialog } from "./trivia-form-dialog";
import { deleteTrivia } from "../_lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TriviaBasic, TriviaOption } from "@/interfaces/trivia";

interface TriviaListProps {
  trivias: TriviaBasic[];
  nextOrderIndex: number;
}

export function TriviaList({ trivias, nextOrderIndex }: TriviaListProps) {
  const [editingTrivia, setEditingTrivia] = useState<TriviaBasic | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const router = useRouter();

  const confirmDelete = async () => {
    if (!deleteId) return;

    toast.promise(deleteTrivia(deleteId), {
      loading: "Eliminando...",
      success: () => {
        setDeleteId(null);
        router.refresh();
        return "Trivia eliminada correctamente";
      },
      error: "Error al eliminar",
    });
  };

  if (trivias.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
        <p className="text-muted-foreground">No hay trivias creadas aún.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {trivias.map((trivia) => (
          <TriviaItem
            key={trivia.id}
            trivia={trivia}
            onEdit={() => setEditingTrivia(trivia)}
            onDelete={() => setDeleteId(trivia.id)}
          />
        ))}
      </div>

      {/* DIÁLOGO DE EDICIÓN */}
      <TriviaFormDialog
        open={!!editingTrivia}
        onOpenChange={(open) => !open && setEditingTrivia(null)}
        mode="edit"
        initialData={editingTrivia || undefined}
        nextOrderIndex={nextOrderIndex}
      />

      {/* DIÁLOGO DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la pregunta y sus
              estadísticas asociadas.
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
    </>
  );
}

// --- SUB-COMPONENTE: TARJETA INDIVIDUAL ---

function TriviaItem({
  trivia,
  onEdit,
  onDelete,
}: {
  trivia: TriviaBasic;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // Parsing seguro de opciones
  let options: TriviaOption[] = [];
  try {
    options =
      typeof trivia.options === "string"
        ? JSON.parse(trivia.options)
        : trivia.options || [];
  } catch (e) {
    console.error("Error parsing options", e);
  }

  const correctAnswerId = trivia.person_id || trivia.political_party_id;
  const letters = ["A", "B", "C", "D"];

  // Colores según dificultad
  const difficultyColor = {
    FACIL:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    MEDIO:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    DIFICIL:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  };

  return (
    <Card className="pt-0">
      {/* Indicador de Tipo (Borde superior de color) */}
      <CardHeader className={`pt-4 space-y-3`}>
        {/* Cabecera con Meta-data */}
        <div className="flex justify-between items-center">
          <Badge variant="outline" className="gap-1 font-mono text-xs">
            <Hash className="w-3 h-3 text-muted-foreground" />
            {trivia.global_index}
          </Badge>

          <div className="flex gap-2">
            <Badge
              className={`${difficultyColor[trivia.difficulty]} border hover:bg-opacity-80`}
            >
              {trivia.difficulty}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {trivia.category}
            </Badge>
          </div>
        </div>

        {/* La Pregunta/Frase */}
        <div className="min-h-[60px] flex items-center">
          <p className="font-serif italic text-lg leading-snug text-foreground/90 line-clamp-3">
            “{trivia.quote}”
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 bg-muted/10 py-3">
        {/* Lista de Opciones Compacta */}
        <div className="space-y-2">
          {options.slice(0, 4).map((opt, idx) => {
            const isCorrect = opt.option_id === correctAnswerId;
            return (
              <div
                key={opt.option_id}
                className={`
                  relative flex items-center p-2 rounded-md text-sm border transition-colors
                  ${
                    isCorrect
                      ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                      : "bg-background border-border text-muted-foreground"
                  }
                `}
              >
                {/* Letra A, B, C, D */}
                <span
                  className={`
                  w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold mr-3
                  ${isCorrect ? "bg-green-200 text-green-800" : "bg-muted text-muted-foreground"}
                `}
                >
                  {letters[idx]}
                </span>

                <span
                  className={`flex-1 truncate ${isCorrect ? "font-medium text-foreground" : ""}`}
                >
                  {opt.name}
                </span>

                {isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-green-600 ml-2" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      <CardFooter className="border-t flex justify-between items-center">
        {/* Iconos de Información Extra */}
        <div className="flex gap-1">
          {trivia.explanation && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-2 rounded-full hover:bg-muted text-muted-foreground cursor-help">
                    <Info className="w-4 h-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3">
                  <p className="font-semibold text-xs mb-1">Explicación:</p>
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
                    className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-blue-500"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver fuente original</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 w-8 p-0"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
