"use client";

import { useState, useEffect } from "react";
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
  Tag,
  Hash,
  Link as LinkIcon,
  EyeOff,
} from "lucide-react";
import { HitoFormDialog } from "./hito-form-dialog";
import { deleteHito } from "../_lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { HitoBasic } from "@/interfaces/hito";
import Image from "next/image";

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
        return "Evento eliminado correctamente";
      },
      error: "Error al eliminar",
    });
  };

  if (hitos.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
        <div className="flex justify-center mb-4">
          <Calendar className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground">No hay eventos creados aún.</p>
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
              Esta acción no se puede deshacer. Se eliminará el evento{" "}
              <span className="font-bold text-foreground">
                {hitos.find((t) => t.id === deleteId)?.title}
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
  const [isFuture, setIsFuture] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFuture(new Date(item.date).getTime() > Date.now());
    }, 1);
    return () => clearTimeout(timer);
  }, [item.date]);

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow overflow-hidden pt-0">
      <CardHeader className="p-0 relative">
        {/* IMAGEN PREVIEW */}
        {item.photo_url ? (
          <div className="relative w-full aspect-video bg-muted overflow-hidden">
            <Image
              src={item.photo_url}
              alt={item.title || "Evento"}
              className="object-cover"
              fill
            />
            {item.index !== null && (
              <div className="absolute top-2 right-2 bg-black/80 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
                <Hash className="w-3 h-3" />
                {item.index}
              </div>
            )}
            {!item.is_published && (
              <div className="absolute top-2 left-2 bg-yellow-500/90 text-black text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
                <EyeOff className="w-3 h-3" />
                Oculto
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
            {!item.is_published && (
              <div className="absolute top-2 left-2 bg-yellow-500/90 text-black text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
                <EyeOff className="w-3 h-3" />
                Oculto
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
          {isFuture && (
            <Badge
              variant="default"
              className="shrink-0 text-[10px] uppercase font-bold tracking-wider bg-green-600 hover:bg-green-700"
            >
              Próximo
            </Badge>
          )}
        </div>

        {item.label && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 h-5 gap-1 inline-flex"
          >
            <Tag className="w-3 h-3" />
            {item.label}
          </Badge>
        )}

        {/* DESCRIPCIÓN */}
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}

        {/* METADATA */}
        <div className="space-y-1.5 text-sm pt-2 border-t border-dashed mt-3">
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
          {item.registration_url && (
            <div className="flex items-center gap-2 text-blue-600">
              <LinkIcon className="w-4 h-4 shrink-0" />
              <a
                href={item.registration_url}
                target="_blank"
                rel="noreferrer"
                className="truncate hover:underline"
              >
                {item.registration_url}
              </a>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t flex justify-end gap-2 bg-muted/5 h-12">
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
