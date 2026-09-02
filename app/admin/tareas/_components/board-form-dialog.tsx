"use client";

import React, { useState, useTransition } from "react";
import { ProjectArea } from "../_lib/types";
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
import { createBoard } from "../_lib/actions";
import { toast } from "sonner";
import { FolderKanban, Plus } from "lucide-react";

interface BoardFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBoardCreated?: (boardId: string) => void;
}

export function BoardFormDialog({
  isOpen,
  onClose,
  onBoardCreated,
}: BoardFormDialogProps) {
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState<ProjectArea>("GENERAL");
  const [color, setColor] = useState("indigo");
  const [columnsInput, setColumnsInput] = useState(
    "Por Iniciar, En Proceso, Revisión, Completado",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("El nombre del tablero es obligatorio");
      return;
    }

    const columns = columnsInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    startTransition(async () => {
      try {
        const res = await createBoard({
          title,
          description,
          area,
          color,
          columns: columns.length > 0 ? columns : undefined,
        });

        toast.success("Nuevo tablero creado con éxito");
        setTitle("");
        setDescription("");
        onClose();
        if (res.boardId) {
          onBoardCreated?.(res.boardId);
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Error al crear el tablero";
        toast.error(msg);
      }
    });
  };

  return (
    <Credenza open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <CredenzaContent
        noScroll
        className="sm:max-w-xl p-0 overflow-hidden flex flex-col h-[90vh] sm:h-auto"
      >
        <CredenzaHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FolderKanban className="h-5 w-5" />
            </div>
            <CredenzaTitle className="text-lg font-bold">
              Crear Nuevo Tablero de Proyecto
            </CredenzaTitle>
          </div>
        </CredenzaHeader>

        <CredenzaBody className="overflow-y-auto">
          <form
            id="create-board-form"
            onSubmit={handleSubmit}
            className="space-y-4 py-2"
          >
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Nombre del Tablero / Proyecto{" "}
                <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Ej. Redes Sociales Septiembre o Convocatoria Voluntarios"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Área de Trabajo
                </label>
                <Select
                  value={area}
                  onValueChange={(val: ProjectArea) => setArea(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INVESTIGACION">Investigación</SelectItem>
                    <SelectItem value="CONTENIDO">Contenido & Redes</SelectItem>
                    <SelectItem value="RECLUTAMIENTO">Reclutamiento</SelectItem>
                    <SelectItem value="LEGAL">Legal & Fact-Checking</SelectItem>
                    <SelectItem value="DESARROLLO">Desarrollo Web</SelectItem>
                    <SelectItem value="GENERAL">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Color de Tema
                </label>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indigo">Índigo</SelectItem>
                    <SelectItem value="blue">Azul</SelectItem>
                    <SelectItem value="purple">Morado</SelectItem>
                    <SelectItem value="pink">Rosa</SelectItem>
                    <SelectItem value="emerald">Esmeralda</SelectItem>
                    <SelectItem value="amber">Ámbar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Descripción & Propósito
              </label>
              <Textarea
                placeholder="¿Qué objetivo tiene este tablero y quiénes participan?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs min-h-[60px] resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Fases / Columnas (separadas por coma)
              </label>
              <Input
                value={columnsInput}
                onChange={(e) => setColumnsInput(e.target.value)}
                className="text-xs"
                placeholder="Por Iniciar, En Proceso, Revisión, Completado"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                La última columna se marcará automáticamente como la meta de
                éxito completada.
              </p>
            </div>
          </form>
        </CredenzaBody>
        <CredenzaFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="create-board-form"
            disabled={isPending}
            className="text-xs gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {isPending ? "Creando..." : "Crear Tablero"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
