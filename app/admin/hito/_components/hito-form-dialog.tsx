"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { hitoSchema, type HitoFormValues } from "../_lib/validation";
import { createTeamPhoto, updateTeamPhoto } from "../_lib/actions";
import { HitoBasic } from "@/interfaces/hito";
import {
  MapPin,
  Tag,
  Hash,
  AlignLeft,
  Link as LinkIcon,
  Type,
} from "lucide-react";
import { CalendarDatePicker } from "@/components/date-picker";
import { ImageUploader } from "./image-uploader";

interface HitoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  initialData?: HitoBasic;
}

const defaultFormValues: HitoFormValues = {
  title: "",
  date: new Date(),
  location: "",
  photo_url: "",
  description: "",
  registration_url: "",
  is_published: false,
  index: 0,
  label: "",
};

export function HitoFormDialog({
  open,
  onOpenChange,
  mode = "create",
  initialData,
}: HitoFormDialogProps) {
  const router = useRouter();

  const form = useForm<HitoFormValues>({
    resolver: zodResolver(hitoSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        form.reset({
          title: initialData.title || "",
          date: initialData.date ? new Date(initialData.date) : new Date(),
          location: initialData.location || "",
          photo_url: initialData.photo_url || "",
          description: initialData.description || "",
          registration_url: initialData.registration_url || "",
          is_published: initialData.is_published ?? false,
          index: initialData.index ?? 0,
          label: initialData.label || "",
        });
      } else {
        form.reset(defaultFormValues);
      }
    }
  }, [open, mode, initialData, form]);

  const onSubmit = async (values: HitoFormValues) => {
    const isEditing = mode === "edit";
    const promise = isEditing
      ? updateTeamPhoto(initialData!.id, values)
      : createTeamPhoto(values);

    toast.promise(promise, {
      loading: isEditing ? "Actualizando..." : "Creando...",
      success: (data) => {
        if (!data.success) throw new Error(data.error);
        onOpenChange(false);
        router.refresh();
        return data.message;
      },
      error: (err) => err.message,
    });
  };

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
        <CredenzaHeader>
          <CredenzaTitle>
            {mode === "edit" ? "Editar Evento" : "Nuevo Evento"}
          </CredenzaTitle>
        </CredenzaHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <CredenzaBody className="space-y-5 px-4 py-2 overflow-y-auto">
              {/* --- BLOQUE 0: IMAGEN DRAG AND DROP --- */}
              <FormField
                control={form.control}
                name="photo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foto del Evento o Flyer (Opcional)</FormLabel>
                    <FormControl>
                      <ImageUploader
                        value={field.value || null}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- BLOQUE 1: TÍTULO --- */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título del Evento</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Type className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          placeholder="Ej: Taller en la UNMSM"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- BLOQUE 2: DESCRIPCIÓN --- */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <AlignLeft className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea
                          className="pl-9 min-h-[70px] resize-none"
                          placeholder="Breve descripción del evento..."
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- BLOQUE 3: URL DE REGISTRO --- */}
              <FormField
                control={form.control}
                name="registration_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      URL de Registro (Opcional para próximos eventos)
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          placeholder="https://luma.com/..."
                          {...field}
                          value={field.value || ""}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- BLOQUE 4: FECHA Y UBICACIÓN --- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha</FormLabel>
                      <FormControl>
                        <CalendarDatePicker
                          date={{
                            from: field.value
                              ? new Date(field.value)
                              : undefined,
                            to: field.value ? new Date(field.value) : undefined,
                          }}
                          onDateSelect={({ from }) => {
                            if (from) {
                              form.setValue("date", from);
                            }
                          }}
                          variant="outline"
                          numberOfMonths={1}
                          withoutdropdown
                          closeOnSelect
                          yearsRange={13}
                          centerCurrentYear
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder="Ej: Lima, Perú"
                            {...field}
                            value={field.value || ""}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* --- BLOQUE 5: ETIQUETA E ÍNDICE --- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etiqueta / Tipo</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder="Ej: Conferencia, Taller"
                            {...field}
                            value={field.value || ""}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="index"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orden / Índice</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            className="pl-9"
                            placeholder="0"
                            {...field}
                            value={field.value || 0}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* --- BLOQUE 6: PUBLICAR --- */}
              <FormField
                control={form.control}
                name="is_published"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Publicado</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Mostrar este evento públicamente en la web
                      </div>
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
            </CredenzaBody>

            <CredenzaFooter className="flex justify-end gap-2 px-4 pb-4 border-t pt-4 bg-background">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {mode === "edit" ? "Guardar Cambios" : "Crear Evento"}
              </Button>
            </CredenzaFooter>
          </form>
        </Form>
      </CredenzaContent>
    </Credenza>
  );
}
