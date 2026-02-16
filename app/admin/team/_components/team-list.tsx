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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Edit,
  Trash2,
  Linkedin,
  Globe,
  Mail,
  User,
  Star,
  Quote,
} from "lucide-react";
import { TeamFormDialog } from "./team-form-dialog";
import { deleteTeam } from "../_lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TeamBasic } from "@/interfaces/team";

interface TeamListProps {
  team: TeamBasic[];
}

export function TeamList({ team }: TeamListProps) {
  const [editingTeam, setEditingTeam] = useState<TeamBasic | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();

  const confirmDelete = async () => {
    if (!deleteId) return;

    toast.promise(deleteTeam(deleteId), {
      loading: "Eliminando...",
      success: () => {
        setDeleteId(null);
        router.refresh();
        return "Miembro eliminado correctamente";
      },
      error: "Error al eliminar",
    });
  };

  if (team.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
        <div className="flex justify-center mb-4">
          <User className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground">
          No hay integrantes del equipo creados aún.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {team.map((colab) => (
          <TeamItem
            key={colab.id}
            colab={colab}
            onEdit={() => setEditingTeam(colab)}
            onDelete={() => setDeleteId(colab.id)}
          />
        ))}
      </div>

      {/* DIÁLOGO DE EDICIÓN */}
      <TeamFormDialog
        open={!!editingTeam}
        onOpenChange={(open) => !open && setEditingTeam(null)}
        mode="edit"
        initialData={editingTeam || undefined}
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
              Esta acción no se puede deshacer. Se eliminará a{" "}
              <span className="font-bold text-foreground">
                {team.find((t) => t.id === deleteId)?.first_name}
              </span>{" "}
              del equipo.
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

function TeamItem({
  colab,
  onEdit,
  onDelete,
}: {
  colab: TeamBasic;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow overflow-hidden">
      <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1 flex-1 pr-2">
          <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
            {colab.first_name} {colab.last_name}
            {colab.is_principal && (
              <Badge variant="default" className="text-[10px] px-1.5 h-5 gap-1">
                <Star className="w-3 h-3 fill-current" />
                Principal
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {colab.role}
          </p>
        </div>

        {/* AVATAR DE IMAGEN O FALLBACK */}
        <Avatar className="h-12 w-12 border bg-muted">
          <AvatarImage
            src={colab.image_url || ""}
            alt={colab.first_name}
            className="object-cover"
          />
          <AvatarFallback className="bg-muted text-muted-foreground">
            <User className="w-6 h-6" />
          </AvatarFallback>
        </Avatar>
      </CardHeader>

      <CardContent className="flex-1 space-y-4 py-2">
        {/* FRASE PERSONAL (SI EXISTE) */}
        {colab.phrase && (
          <div className="relative pl-3 border-l-2 border-primary/20 italic text-sm text-muted-foreground/90 my-2">
            <Quote className="absolute -top-1 -left-2 w-3 h-3 text-primary/20 fill-current transform -scale-x-100" />
            &quot;{colab.phrase}&quot;
          </div>
        )}

        <div className="space-y-2 text-sm pt-1">
          {colab.email && (
            <div className="flex items-center gap-2 text-muted-foreground truncate">
              <Mail className="w-4 h-4 shrink-0" />
              <span className="truncate">{colab.email}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-3 pt-2">
            {colab.linkedin_url && (
              <a
                href={String(colab.linkedin_url)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 transition-colors text-xs font-medium"
              >
                <Linkedin className="w-3.5 h-3.5" />
                LinkedIn
              </a>
            )}
            {colab.portfolio_url && (
              <a
                href={colab.portfolio_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 transition-colors text-xs font-medium"
              >
                <Globe className="w-3.5 h-3.5" />
                Portfolio
              </a>
            )}
          </div>
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
