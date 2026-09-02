"use client";

import React, { useState, useTransition, useEffect } from "react";
import { ProjectArea, KanbanBoard } from "../_lib/types";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaBody,
  CredenzaFooter,
} from "@/components/ui/credenza";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBoard, updateBoard, deleteBoard } from "../_lib/actions";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  FolderKanban,
  Plus,
  Trash2,
  Video,
  UserCheck,
  Search,
  Scale,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BoardColumnDraft {
  id?: string;
  title: string;
  color: string;
  is_completed: boolean;
}

interface BoardFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBoardSaved?: (boardId: string) => void;
  onBoardDeleted?: (boardId: string) => void;
  mode?: "create" | "edit";
  initialBoard?: KanbanBoard | null;
}

const COLOR_OPTIONS = [
  { value: "slate", label: "Gris", dot: "bg-slate-400" },
  { value: "blue", label: "Azul", dot: "bg-blue-500" },
  { value: "indigo", label: "Índigo", dot: "bg-indigo-500" },
  { value: "amber", label: "Ámbar", dot: "bg-amber-500" },
  { value: "pink", label: "Rosa", dot: "bg-pink-500" },
  { value: "purple", label: "Morado", dot: "bg-purple-500" },
  { value: "cyan", label: "Cian", dot: "bg-cyan-500" },
  { value: "emerald", label: "Esmeralda", dot: "bg-emerald-500" },
  { value: "rose", label: "Rojo", dot: "bg-rose-500" },
];

const PRESET_SUGGESTIONS = [
  { title: "En Revisión", color: "amber" },
  { title: "Bloqueado", color: "rose" },
  { title: "Control de Calidad", color: "purple" },
  { title: "Grabación / Diseño", color: "pink" },
  { title: "Publicado / Entregado", color: "emerald", is_completed: true },
];

export function BoardFormDialog({
  isOpen,
  onClose,
  onBoardSaved,
  onBoardDeleted,
  mode = "create",
  initialBoard,
}: BoardFormDialogProps) {
  const [isPending, startTransition] = useTransition();

  const isEdit = mode === "edit" && initialBoard != null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState<ProjectArea>("GENERAL");
  const [color, setColor] = useState("indigo");
  const [columns, setColumns] = useState<BoardColumnDraft[]>([
    { title: "Por Iniciar", color: "slate", is_completed: false },
    { title: "En Proceso", color: "blue", is_completed: false },
    { title: "Revisión", color: "amber", is_completed: false },
    { title: "Completado", color: "emerald", is_completed: true },
  ]);

  const [newColTitle, setNewColTitle] = useState("");
  const [newColColor, setNewColColor] = useState("slate");

  // Sincronizar estado inicial al abrir o cambiar de modo
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) {
      if (isEdit && initialBoard) {
        setTitle(initialBoard.title || "");
        setDescription(initialBoard.description || "");
        setArea(initialBoard.area || "GENERAL");
        setColor(initialBoard.color || "indigo");
        setColumns(
          initialBoard.columns.map((c) => ({
            id: c.id,
            title: c.title,
            color: c.color || "slate",
            is_completed: c.is_completed,
          })),
        );
      } else {
        setTitle("");
        setDescription("");
        setArea("GENERAL");
        setColor("indigo");
        setColumns([
          { title: "Por Iniciar", color: "slate", is_completed: false },
          { title: "En Proceso", color: "blue", is_completed: false },
          { title: "Revisión", color: "amber", is_completed: false },
          { title: "Completado", color: "emerald", is_completed: true },
        ]);
      }
      setNewColTitle("");
    }
  }, [isOpen, isEdit, initialBoard]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Manejadores de columnas
  const handleAddColumn = (
    titleToAdd: string,
    colorToAdd = "slate",
    isCompleted = false,
  ) => {
    const cleanTitle = titleToAdd.trim();
    if (!cleanTitle) return;

    if (
      columns.some((c) => c.title.toLowerCase() === cleanTitle.toLowerCase())
    ) {
      toast.error(`Ya existe una fase llamada "${cleanTitle}"`);
      return;
    }

    setColumns([
      ...columns,
      {
        title: cleanTitle,
        color: colorToAdd,
        is_completed: isCompleted,
      },
    ]);
    setNewColTitle("");
  };

  const handleUpdateColTitle = (index: number, val: string) => {
    setColumns((prev) =>
      prev.map((c, i) => (i === index ? { ...c, title: val } : c)),
    );
  };

  const handleUpdateColColor = (index: number, val: string) => {
    setColumns((prev) =>
      prev.map((c, i) => (i === index ? { ...c, color: val } : c)),
    );
  };

  const handleToggleGoal = (index: number) => {
    setColumns((prev) =>
      prev.map((c, i) => ({
        ...c,
        is_completed: i === index ? !c.is_completed : c.is_completed,
      })),
    );
  };

  const handleMoveCol = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= columns.length) return;

    setColumns((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  const handleRemoveCol = (index: number) => {
    if (columns.length <= 1) {
      toast.error("El tablero debe tener al menos una fase");
      return;
    }
    setColumns((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("El nombre del tablero es obligatorio");
      return;
    }

    if (columns.length === 0 || columns.some((c) => !c.title.trim())) {
      toast.error("Todas las fases deben tener un nombre válido");
      return;
    }

    startTransition(async () => {
      try {
        if (isEdit && initialBoard) {
          await updateBoard({
            boardId: initialBoard.id,
            title: title.trim(),
            description: description.trim() || null,
            area,
            color,
            columns: columns.map((c, idx) => ({
              id: c.id,
              title: c.title.trim(),
              color: c.color,
              is_completed:
                c.is_completed ||
                (idx === columns.length - 1 &&
                  !columns.some((x) => x.is_completed)),
            })),
          });

          toast.success("Tablero y fases actualizados con éxito");
          onClose();
          onBoardSaved?.(initialBoard.id);
        } else {
          const res = await createBoard({
            title: title.trim(),
            description: description.trim() || undefined,
            area,
            color,
            columns: columns.map((c, idx) => ({
              title: c.title.trim(),
              color: c.color,
              is_completed:
                c.is_completed ||
                (idx === columns.length - 1 &&
                  !columns.some((x) => x.is_completed)),
            })),
          });

          toast.success("Nuevo tablero creado con éxito");
          onClose();
          if (res.boardId) {
            onBoardSaved?.(res.boardId);
          }
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Error al guardar el tablero";
        toast.error(msg);
      }
    });
  };

  const handleDeleteBoard = () => {
    if (!initialBoard) return;
    if (initialBoard.is_default) {
      toast.error(
        "No se puede eliminar el tablero predeterminado del sistema.",
      );
      return;
    }

    if (
      !confirm(
        `¿Estás seguro de eliminar el tablero "${initialBoard.title}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteBoard(initialBoard.id);
        toast.success("Tablero eliminado correctamente");
        onClose();
        onBoardDeleted?.(initialBoard.id);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Error al eliminar el tablero";
        toast.error(msg);
      }
    });
  };

  const getAreaIcon = (a: ProjectArea) => {
    switch (a) {
      case "INVESTIGACION":
        return <Search className="h-4 w-4" />;
      case "CONTENIDO":
        return <Video className="h-4 w-4" />;
      case "RECLUTAMIENTO":
        return <UserCheck className="h-4 w-4" />;
      case "LEGAL":
        return <Scale className="h-4 w-4" />;
      case "DESARROLLO":
        return <Code className="h-4 w-4" />;
      default:
        return <FolderKanban className="h-4 w-4" />;
    }
  };

  return (
    <Credenza open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <CredenzaContent
        noScroll
        className="sm:max-w-2xl p-0 overflow-hidden flex flex-col h-[88dvh] max-h-[88dvh] rounded-2xl border bg-background shadow-2xl"
      >
        <CredenzaHeader className="px-6 py-4 border-b bg-muted/30 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                {getAreaIcon(area)}
              </div>
              <div>
                <CredenzaTitle className="text-base sm:text-lg font-bold">
                  {isEdit
                    ? "Configurar Tablero y Fases"
                    : "Crear Nuevo Tablero de Proyecto"}
                </CredenzaTitle>
                <p className="text-xs text-muted-foreground">
                  {isEdit
                    ? "Modifica nombre, área y personaliza las fases de trabajo del equipo."
                    : "Define los objetivos y la estructura de fases para organizar tareas."}
                </p>
              </div>
            </div>

            {isEdit && !initialBoard?.is_default && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDeleteBoard}
                disabled={isPending}
                className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5 cursor-pointer"
                title="Eliminar este tablero"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Eliminar</span>
              </Button>
            )}
          </div>
        </CredenzaHeader>

        <CredenzaBody className="overflow-y-auto px-6 py-4 flex-1 space-y-5">
          <form id="board-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Título */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Nombre del Tablero / Proyecto{" "}
                <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Ej. Redes Sociales Septiembre o Convocatoria Voluntarios"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm font-medium h-9 rounded-lg"
                required
              />
            </div>

            {/* Área y Color de Tema */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Área del Proyecto
                </label>
                <Select
                  value={area}
                  onValueChange={(val: ProjectArea) => setArea(val)}
                >
                  <SelectTrigger className="h-9 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">
                      <div className="flex items-center gap-2">
                        <FolderKanban className="h-3.5 w-3.5 text-primary" />
                        <span>General / Multidisciplinario</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="INVESTIGACION">
                      <div className="flex items-center gap-2">
                        <Search className="h-3.5 w-3.5 text-blue-500" />
                        <span>Investigación Electoral</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="CONTENIDO">
                      <div className="flex items-center gap-2">
                        <Video className="h-3.5 w-3.5 text-purple-500" />
                        <span>Contenido & Redes</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="RECLUTAMIENTO">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Voluntariado & Equipo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="LEGAL">
                      <div className="flex items-center gap-2">
                        <Scale className="h-3.5 w-3.5 text-amber-500" />
                        <span>Legal & Normativo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="DESARROLLO">
                      <div className="flex items-center gap-2">
                        <Code className="h-3.5 w-3.5 text-cyan-500" />
                        <span>Tecnología & Producto</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Color Temático
                </label>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger className="h-9 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn("h-2.5 w-2.5 rounded-full", c.dot)}
                          />
                          <span>{c.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Descripción / Propósito (Opcional)
              </label>
              <Textarea
                placeholder="Explica qué se gestiona en este tablero y cuál es la meta del equipo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs min-h-[65px] resize-none rounded-lg"
              />
            </div>

            {/* GESTIÓN VISUAL DE FASES / COLUMNAS */}
            <div className="space-y-2.5 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-foreground block">
                    Fases del Tablero ({columns.length})
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Personaliza el orden, colores y marca qué fase representa la
                    meta cumplida.
                  </span>
                </div>
              </div>

              {/* Lista interactiva de Fases como Cards/Botones */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {columns.map((col, index) => {
                  return (
                    <div
                      key={col.id || `col-${index}`}
                      className="flex items-center gap-2 p-2 rounded-xl border bg-card shadow-2xs hover:border-primary/40 transition-all"
                    >
                      {/* Color Picker Dropdown */}
                      <Select
                        value={col.color || "slate"}
                        onValueChange={(v) => handleUpdateColColor(index, v)}
                      >
                        <SelectTrigger className="h-7 w-9 p-0 px-2 rounded-lg border-border shrink-0">
                          <span
                            className={cn(
                              "h-3 w-3 rounded-full",
                              COLOR_OPTIONS.find((c) => c.value === col.color)
                                ?.dot || "bg-slate-400",
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {COLOR_OPTIONS.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "h-2.5 w-2.5 rounded-full",
                                    c.dot,
                                  )}
                                />
                                <span>{c.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Input de Título de la Fase */}
                      <Input
                        value={col.title}
                        onChange={(e) =>
                          handleUpdateColTitle(index, e.target.value)
                        }
                        placeholder="Nombre de la fase..."
                        className="h-7 text-xs font-semibold flex-1 rounded-lg"
                      />

                      {/* Toggle Meta de Éxito / Entrega */}
                      <button
                        type="button"
                        onClick={() => handleToggleGoal(index)}
                        className={cn(
                          "inline-flex items-center gap-1 h-7 px-2 rounded-lg text-[10px] font-bold border shrink-0 transition-colors cursor-pointer",
                          col.is_completed
                            ? "bg-emerald-500/15 text-emerald-600 border-emerald-300 dark:border-emerald-800"
                            : "bg-secondary text-muted-foreground border-transparent hover:bg-secondary/80",
                        )}
                        title="Marcar si las tareas en esta columna cuentan como terminadas"
                      >
                        <CheckCircle2
                          className={cn(
                            "h-3 w-3",
                            col.is_completed
                              ? "text-emerald-500"
                              : "text-muted-foreground/60",
                          )}
                        />
                        <span className="hidden sm:inline">
                          {col.is_completed ? "Meta de éxito" : "Paso regular"}
                        </span>
                      </button>

                      {/* Botones de Reordenamiento */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={index === 0}
                          onClick={() => handleMoveCol(index, -1)}
                          className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30"
                          title="Mover arriba"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={index === columns.length - 1}
                          onClick={() => handleMoveCol(index, 1)}
                          className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30"
                          title="Mover abajo"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Botón Eliminar Columna */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={columns.length <= 1}
                        onClick={() => handleRemoveCol(index)}
                        className="h-6 w-6 text-muted-foreground hover:text-rose-500 cursor-pointer disabled:opacity-30"
                        title="Eliminar fase"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Agregar nueva fase manualmente */}
              <div className="flex items-center gap-2 pt-1">
                <Select value={newColColor} onValueChange={setNewColColor}>
                  <SelectTrigger className="h-8 w-9 p-0 px-2 rounded-lg shrink-0">
                    <span
                      className={cn(
                        "h-3 w-3 rounded-full",
                        COLOR_OPTIONS.find((c) => c.value === newColColor)
                          ?.dot || "bg-slate-400",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn("h-2.5 w-2.5 rounded-full", c.dot)}
                          />
                          <span>{c.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Nueva fase (ej. En Diseño, Publicado)..."
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddColumn(newColTitle, newColColor);
                    }
                  }}
                  className="h-8 text-xs flex-1 rounded-lg"
                />

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleAddColumn(newColTitle, newColColor)}
                  disabled={!newColTitle.trim()}
                  className="h-8 text-xs gap-1 shrink-0 font-semibold cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Añadir
                </Button>
              </div>

              {/* Sugerencias rápidas de 1 toque */}
              <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mr-1">
                  Sugerencias:
                </span>
                {PRESET_SUGGESTIONS.map((sug) => {
                  const alreadyExists = columns.some(
                    (c) => c.title.toLowerCase() === sug.title.toLowerCase(),
                  );
                  if (alreadyExists) return null;

                  return (
                    <button
                      key={sug.title}
                      type="button"
                      onClick={() =>
                        handleAddColumn(sug.title, sug.color, sug.is_completed)
                      }
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-secondary/40 hover:bg-secondary text-[11px] text-foreground font-medium transition-colors cursor-pointer"
                    >
                      <Plus className="h-2.5 w-2.5 text-primary" /> {sug.title}
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        </CredenzaBody>

        <CredenzaFooter className="px-6 py-3 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          {isEdit && initialBoard && !initialBoard.is_default ? (
            <Button
              type="button"
              variant="ghost"
              onClick={handleDeleteBoard}
              disabled={isPending}
              className="w-full sm:w-auto text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Eliminar Tablero</span>
            </Button>
          ) : (
            <div className="hidden sm:block" />
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto text-xs cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="board-form"
              disabled={isPending}
              className="w-full sm:w-auto text-xs gap-1.5 font-semibold cursor-pointer"
            >
              {isPending
                ? isEdit
                  ? "Guardando..."
                  : "Creando..."
                : isEdit
                  ? "Guardar Cambios"
                  : "Crear Tablero"}
            </Button>
          </div>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
