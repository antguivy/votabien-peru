"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
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
import { Switch } from "@/components/ui/switch";
import { Edit, Plus, Trash2 } from "lucide-react";
import { audienceSchema, type AudienceFormValues } from "../_lib/validation";
import {
  createAudience,
  updateAudience,
  deleteAudience,
} from "../_lib/actions";
import { TriviaAudience } from "@/interfaces/trivia";
import { AUDIENCE_ICON_OPTIONS, renderAudienceIcon } from "@/lib/trivia-icons";
import { Label } from "@/components/ui/label";

export function AudienceManagement({
  audiences,
}: {
  audiences: TriviaAudience[];
}) {
  const [editingAudience, setEditingAudience] = useState<TriviaAudience | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();

  const confirmDelete = async () => {
    if (!deleteId) return;
    toast.promise(deleteAudience(deleteId), {
      loading: "Eliminando audiencia...",
      success: () => {
        setDeleteId(null);
        router.refresh();
        return "Audiencia eliminada correctamente";
      },
      error: "Error al eliminar audiencia",
    });
  };

  const nextOrderIndex =
    audiences.length > 0
      ? Math.max(...audiences.map((a) => a.order_index ?? 0)) + 1
      : 1;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-card/60 border p-4 rounded-xl shadow-sm">
        <div>
          <h2 className="text-base font-bold text-foreground">
            Públicos / Audiencias
          </h2>
          <p className="text-xs text-muted-foreground">
            Segmentos de usuarios a los que se dirigen los contenidos cívicos
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="gap-1.5 font-bold text-xs h-9"
        >
          <Plus size={15} /> Nueva Audiencia
        </Button>
      </div>

      {/* Grilla de Audiencias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {audiences.map((aud) => (
          <Card
            key={aud.id}
            className={`flex flex-col justify-between overflow-hidden shadow-sm transition-all hover:shadow-md ${
              !aud.is_active ? "opacity-60 border-dashed" : ""
            }`}
          >
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: aud.color || "#3b82f6" }}
            />
            <CardHeader className="pb-2 space-y-2">
              <div className="flex items-center justify-between">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: aud.color || "#3b82f6" }}
                >
                  {renderAudienceIcon(aud.icon || aud.slug, { size: 18 })}
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    #{aud.order_index}
                  </Badge>
                  <Badge
                    variant={aud.is_active ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {aud.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>

              <CardTitle className="text-base font-bold leading-snug mt-1 flex items-center gap-2">
                <span>{aud.name}</span>
              </CardTitle>
              <CardDescription className="text-xs line-clamp-2">
                {aud.description || "Sin descripción"}
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-2">
              <div className="text-[10px] text-muted-foreground font-mono">
                slug: {aud.slug}
              </div>
            </CardContent>

            <CardFooter className="pt-2 border-t flex justify-between items-center bg-muted/10">
              <span className="text-[10px] text-muted-foreground">
                Orden: {aud.order_index}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingAudience(aud)}
                  className="h-7 w-7 p-0"
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteId(aud.id)}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Diálogo de Crear / Editar Audiencia */}
      {(isCreating || !!editingAudience) && (
        <AudienceFormDialog
          open={isCreating || !!editingAudience}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreating(false);
              setEditingAudience(null);
            }
          }}
          initialData={editingAudience}
          nextOrderIndex={nextOrderIndex}
        />
      )}

      {/* Diálogo de Confirmación de Eliminación */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta audiencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desvinculará esta audiencia de los temas y preguntas
              asociadas.
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

// --- DIÁLOGO DE FORMULARIO DE AUDIENCIA ---

function AudienceFormDialog({
  open,
  onOpenChange,
  initialData,
  nextOrderIndex,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: TriviaAudience | null;
  nextOrderIndex: number;
}) {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(audienceSchema),
    defaultValues: {
      slug: initialData?.slug || "",
      name: initialData?.name || "",
      description: initialData?.description || "",
      emoji: initialData?.emoji || "",
      icon: initialData?.icon || "Users",
      color: initialData?.color || "#3b82f6",
      order_index: initialData?.order_index ?? nextOrderIndex,
      is_active: initialData?.is_active ?? true,
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedIcon = form.watch("icon") || "Users";

  const onSubmit = async (values: AudienceFormValues) => {
    const isEditing = !!initialData;
    const promise = isEditing
      ? updateAudience(initialData.id, values)
      : createAudience(values);

    toast.promise(promise, {
      loading: isEditing ? "Guardando audiencia..." : "Creando audiencia...",
      success: (res) => {
        if (!res.success) throw new Error(res.error);
        onOpenChange(false);
        router.refresh();
        return res.message;
      },
      error: (err) => err.message || "Error al procesar audiencia",
    });
  };

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <CredenzaHeader className="border-b pb-3">
          <CredenzaTitle className="text-base font-bold">
            {initialData
              ? `Editar Audiencia: ${initialData.name}`
              : "Crear Nueva Audiencia"}
          </CredenzaTitle>
        </CredenzaHeader>

        <CredenzaBody className="overflow-y-auto py-3 space-y-4 flex-1">
          <Form {...form}>
            <form
              id="audience-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">
                      Nombre del Público *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ej. Escolares / Colegios"
                        className="h-9 text-xs"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (!initialData) {
                            const autoSlug = e.target.value
                              .toLowerCase()
                              .normalize("NFD")
                              .replace(/[\u0300-\u036f]/g, "")
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/(^-|-$)+/g, "");
                            form.setValue("slug", autoSlug);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">
                      Identificador (slug) *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ej. escolares"
                        className="h-9 text-xs font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Selector de Ícono */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">
                  Ícono representativo
                </Label>
                <div className="grid grid-cols-2 gap-2 p-1.5 border rounded-xl max-h-36 overflow-y-auto">
                  {AUDIENCE_ICON_OPTIONS.map((item) => {
                    const IconComponent = item.icon;
                    const isSelected = selectedIcon === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => form.setValue("icon", item.value)}
                        className={`p-2 rounded-lg border flex items-center gap-2 text-left text-xs transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/10 font-bold text-primary shadow-sm"
                            : "border-border text-muted-foreground hover:bg-muted/30"
                        }`}
                      >
                        <IconComponent size={16} className="flex-shrink-0" />
                        <span className="truncate text-[11px]">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">
                        Color de la etiqueta
                      </FormLabel>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          className="w-10 h-8 p-0.5 rounded border cursor-pointer"
                          {...field}
                          value={field.value || "#3b82f6"}
                        />
                        <Input
                          className="h-8 text-xs font-mono"
                          {...field}
                          value={field.value || "#3b82f6"}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="order_index"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">
                        Orden en la lista
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="h-8 text-xs"
                          value={(field.value as number) ?? 0}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">
                      Descripción
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="ej. Contenido adaptado para estudiantes de nivel secundaria..."
                        className="resize-none h-16 text-xs"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-xl border p-3">
                    <div>
                      <FormLabel className="text-xs font-bold">
                        Público activo
                      </FormLabel>
                      <p className="text-[11px] text-muted-foreground">
                        Permite a los usuarios ver y filtrar preguntas para este
                        grupo
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CredenzaBody>

        <CredenzaFooter className="border-t pt-3 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" form="audience-form" className="font-bold">
            {initialData ? "Guardar Cambios" : "Crear Audiencia"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
