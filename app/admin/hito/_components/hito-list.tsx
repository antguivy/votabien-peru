"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
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
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Image as ImageIcon,
  Quote,
  Tag,
  Hash,
} from "lucide-react";
import { HitoFormDialog } from "./hito-form-dialog";
import { deleteHito } from "../_lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { HitoBasic } from "@/interfaces/hito";

interface HitosListProps {
  hitos: HitoBasic[];
}

export function HitosList({ hitos }: HitosListProps) {
  const [editingItem, setEditingItem] = useState<HitoBasic | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const router = useRouter();

  const confirmDelete = async () => {
    if (!deleteId) return;
    toast.promise(deleteHito(deleteId), {
      loading: "Eliminando...",
      success: () => {
        setDeleteId(null);
        router.refresh();
        return "Foto eliminada correctamente";
      },
      error: "Error al eliminar",
    });
  };

  if (hitos.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
        <div className="flex justify-center mb-4">
          <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground">
          No hay fotos del equipo creadas aún.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {hitos.map((item) => (
          <TeamPhotoItem
            key={item.id}
            item={item}
            onEdit={() => setEditingItem(item)}
            onDelete={() => setDeleteId(item.id)}
          />
        ))}
      </div>

      {/* DIÁLOGO DE EDICIÓN */}
      <HitoFormDialog
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        mode="edit"
        initialData={editingItem || undefined}
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
              Esta acción no se puede deshacer. Se eliminará la foto{" "}
              <span className="font-bold text-foreground">
                {hitos.find((t) => t.id === deleteId)?.label ||
                  hitos.find((t) => t.id === deleteId)?.photo_description}
              </span>{" "}
              permanentemente.
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

function TeamPhotoItem({
  item,
  onEdit,
  onDelete,
}: {
  item: HitoBasic;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow overflow-hidden">
      {/* IMAGEN PREVIEW */}
      {item.photo_url ? (
        <div className="relative w-full aspect-video bg-muted overflow-hidden">
          <img
            src={item.photo_url}
            alt={item.photo_description || "Foto del equipo"}
            className="object-contain w-full h-full"
          />
          {item.index !== null && (
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Hash className="w-3 h-3" />
              {item.index}
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-full aspect-video bg-muted flex items-center justify-center">
          <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
          {item.index !== null && (
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Hash className="w-3 h-3" />
              {item.index}
            </div>
          )}
        </div>
      )}

      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-base flex items-center justify-between gap-2 flex-wrap">
          <span className="truncate">
            {item.label || item.photo_description || "Sin título"}
          </span>
          {item.label && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 h-5 gap-1 shrink-0"
            >
              <Tag className="w-3 h-3" />
              {item.label}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 py-1">
        {/* DESCRIPCIÓN */}
        {item.photo_description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.photo_description}
          </p>
        )}

        {/* CITA */}
        {item.quote && (
          <div className="relative pl-3 border-l-2 border-primary/20 italic text-sm text-muted-foreground/90">
            <Quote className="absolute -top-1 -left-2 w-3 h-3 text-primary/20 fill-current transform -scale-x-100" />
            &quot;{item.quote}&quot;
          </div>
        )}

        {/* METADATA */}
        <div className="space-y-1.5 text-sm pt-1">
          {item.date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>
                {new Date(item.date).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
          {item.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.location}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4 flex justify-end gap-2 bg-muted/5 mt-auto">
        <Button variant="outline" size="sm" onClick={onEdit} className="h-8">
          <Edit className="w-3.5 h-3.5 mr-1.5" />
          Editar
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
