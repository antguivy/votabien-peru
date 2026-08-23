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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Edit, Plus, Trash2 } from "lucide-react";
import { topicSchema, type TopicFormValues } from "../_lib/validation";
import { createTopic, updateTopic, deleteTopic } from "../_lib/actions";
import { TriviaTopic, TriviaAudience } from "@/interfaces/trivia";
import {
  TOPIC_ICON_OPTIONS,
  renderTopicIcon,
  renderAudienceIcon,
} from "@/lib/trivia-icons";

export function TopicManagement({
  topics,
  audiences,
}: {
  topics: TriviaTopic[];
  audiences: TriviaAudience[];
}) {
  const [editingTopic, setEditingTopic] = useState<TriviaTopic | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();

  const confirmDelete = async () => {
    if (!deleteId) return;
    toast.promise(deleteTopic(deleteId), {
      loading: "Eliminando tema...",
      success: () => {
        setDeleteId(null);
        router.refresh();
        return "Tema eliminado correctamente";
      },
      error: "Error al eliminar tema",
    });
  };

  const nextOrderIndex =
    topics.length > 0
      ? Math.max(...topics.map((t) => t.order_index ?? 0)) + 1
      : 1;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-card/60 border p-4 rounded-xl shadow-sm">
        <div>
          <h2 className="text-base font-bold text-foreground">
            Ejes Temáticos
          </h2>
          <p className="text-xs text-muted-foreground">
            Categorías cívicas y electorales por las que se agrupan las
            preguntas
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="gap-1.5 font-bold text-xs h-9"
        >
          <Plus size={15} /> Nuevo Tema
        </Button>
      </div>

      {/* Grilla de Temas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map((topic) => (
          <Card
            key={topic.id}
            className={`flex flex-col justify-between overflow-hidden shadow-sm transition-all hover:shadow-md ${
              !topic.is_active ? "opacity-60 border-dashed" : ""
            }`}
          >
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: topic.badge_color || "#3b82f6" }}
            />
            <CardHeader className="pb-2 space-y-2">
              <div className="flex items-center justify-between">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: topic.badge_color || "#3b82f6" }}
                >
                  {renderTopicIcon(topic.icon, { size: 18 })}
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    #{topic.order_index}
                  </Badge>
                  <Badge
                    variant={topic.is_active ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {topic.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>

              <CardTitle className="text-base font-bold leading-snug">
                {topic.title}
              </CardTitle>
              <CardDescription className="text-xs line-clamp-2">
                {topic.description || "Sin descripción"}
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-3 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {topic.audiences && topic.audiences.length > 0 ? (
                  topic.audiences.map((aud) => (
                    <Badge
                      key={aud.id}
                      variant="outline"
                      className="text-[10px] font-semibold flex items-center gap-1"
                      style={{ borderColor: aud.color || undefined }}
                    >
                      {renderAudienceIcon(aud.icon || aud.slug, { size: 11 })}
                      <span>{aud.name.split("/")[0].trim()}</span>
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Para todo público
                  </span>
                )}
              </div>
            </CardContent>

            <CardFooter className="pt-2 border-t flex justify-between items-center bg-muted/10">
              <span className="text-[10px] text-muted-foreground font-mono">
                slug: {topic.slug}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingTopic(topic)}
                  className="h-7 w-7 p-0"
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteId(topic.id)}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Diálogo de Crear / Editar Tema */}
      {(isCreating || !!editingTopic) && (
        <TopicFormDialog
          open={isCreating || !!editingTopic}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreating(false);
              setEditingTopic(null);
            }
          }}
          initialData={editingTopic}
          audiences={audiences}
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
            <AlertDialogTitle>¿Eliminar este tema?</AlertDialogTitle>
            <AlertDialogDescription>
              Las preguntas asignadas a este tema quedarán sin tema asignado
              pero no se eliminarán.
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

// --- DIÁLOGO DE FORMULARIO DE TEMA ---

function TopicFormDialog({
  open,
  onOpenChange,
  initialData,
  audiences,
  nextOrderIndex,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: TriviaTopic | null;
  audiences: TriviaAudience[];
  nextOrderIndex: number;
}) {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      slug: initialData?.slug || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
      icon: initialData?.icon || "Scale",
      badge_color: initialData?.badge_color || "#d97706",
      order_index: initialData?.order_index ?? nextOrderIndex,
      is_active: initialData?.is_active ?? true,
      audience_ids:
        initialData?.audiences?.map((a) => a.id) || audiences.map((a) => a.id),
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedAudiences = form.watch("audience_ids") || [];
  const selectedIcon = form.watch("icon") || "Scale";

  const onSubmit = async (values: TopicFormValues) => {
    const isEditing = !!initialData;
    const promise = isEditing
      ? updateTopic(initialData.id, values)
      : createTopic(values);

    toast.promise(promise, {
      loading: isEditing ? "Guardando cambios..." : "Creando tema...",
      success: (res) => {
        if (!res.success) throw new Error(res.error);
        onOpenChange(false);
        router.refresh();
        return res.message;
      },
      error: (err) => err.message || "Error al procesar tema",
    });
  };

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
        <CredenzaHeader className="border-b pb-3">
          <CredenzaTitle className="text-base font-bold">
            {initialData
              ? `Editar Tema: ${initialData.title}`
              : "Crear Nuevo Eje Temático"}
          </CredenzaTitle>
        </CredenzaHeader>

        <CredenzaBody className="overflow-y-auto py-3 space-y-4 flex-1">
          <Form {...form}>
            <form
              id="topic-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">
                        Título del Tema
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ej. Constitución y Derechos"
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
                          placeholder="ej. constitucion-derechos"
                          className="h-9 text-xs font-mono"
                          {...field}
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
                        placeholder="Explica de forma clara qué temas y conceptos aprenderán los usuarios..."
                        className="resize-none h-20 text-xs"
                        {...field}
                        value={field.value || ""}
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1.5 border rounded-xl">
                  {TOPIC_ICON_OPTIONS.map((item) => {
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

              {/* Color & Orden */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <FormField
                  control={form.control}
                  name="badge_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">
                        Color del tema
                      </FormLabel>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={field.value || "#3b82f6"}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="h-8 w-12 rounded cursor-pointer border p-0.5"
                        />
                        <Input
                          placeholder="#3b82f6"
                          className="h-8 text-xs font-mono"
                          {...field}
                          value={field.value || ""}
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

              {/* Audiencias asignadas */}
              {audiences.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-xs font-bold text-muted-foreground">
                    Público recomendado
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {audiences.map((aud) => {
                      const isChecked = selectedAudiences.includes(aud.id);
                      return (
                        <label
                          key={aud.id}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? "border-primary bg-primary/5 font-semibold text-foreground"
                              : "border-border text-muted-foreground hover:bg-muted/30"
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                form.setValue("audience_ids", [
                                  ...selectedAudiences,
                                  aud.id,
                                ]);
                              } else {
                                form.setValue(
                                  "audience_ids",
                                  selectedAudiences.filter(
                                    (id: string) => id !== aud.id,
                                  ),
                                );
                              }
                            }}
                          />
                          <span className="flex items-center gap-1.5">
                            {renderAudienceIcon(aud.icon || aud.slug, {
                              size: 14,
                            })}
                            <span>{aud.name}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Toggle Activo */}
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-xl border p-3">
                    <div>
                      <FormLabel className="text-xs font-bold">
                        Visible para los usuarios
                      </FormLabel>
                      <p className="text-[11px] text-muted-foreground">
                        Si está activo, aparecerá en el menú de temas de la
                        trivia
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
          <Button type="submit" form="topic-form" className="font-bold">
            {initialData ? "Guardar Cambios" : "Crear Tema"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
