"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
import { hitoSchema, type HitoFormValues } from "../_lib/validation";
import { createTeamPhoto, updateTeamPhoto } from "../_lib/actions";
import { HitoBasic } from "@/interfaces/hito";
import {
  MapPin,
  Calendar,
  Image as ImageIcon,
  Quote,
  Tag,
  Hash,
  AlignLeft,
} from "lucide-react";

interface HitoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  initialData?: HitoBasic;
}

const defaultFormValues: HitoFormValues = {
  date: "",
  location: "",
  photo_url: "",
  photo_description: "",
  index: 0,
  quote: "",
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
          date: initialData.date || "",
          location: initialData.location || "",
          photo_url: initialData.photo_url || "",
          photo_description: initialData.photo_description || "",
          index: initialData.index ?? 0,
          quote: initialData.quote || "",
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
      <CredenzaContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <CredenzaHeader>
          <CredenzaTitle>
            {mode === "edit" ? "Editar Foto" : "Nueva Foto del Equipo"}
          </CredenzaTitle>
        </CredenzaHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <CredenzaBody className="space-y-4 px-4 py-2 overflow-y-auto">
              {/* --- BLOQUE 1: URL DE LA FOTO --- */}
              <FormField
                control={form.control}
                name="photo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de la Foto</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          placeholder="https://..."
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
                name="photo_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <AlignLeft className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea
                          className="pl-9 min-h-[70px] resize-none"
                          placeholder="Describe el momento o evento..."
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- BLOQUE 3: CITA --- */}
              <FormField
                control={form.control}
                name="quote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cita / Quote</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Quote className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea
                          className="pl-9 min-h-[60px] resize-none"
                          placeholder="Una frase memorable del momento..."
                          {...field}
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
                        <div className="relative">
                          <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input type="month" className="pl-9" {...field} />
                        </div>
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
                      <FormLabel>Etiqueta (Opcional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder="Ej: Hackathon 2024"
                            {...field}
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
                {mode === "edit" ? "Guardar Cambios" : "Crear Foto"}
              </Button>
            </CredenzaFooter>
          </form>
        </Form>
      </CredenzaContent>
    </Credenza>
  );
}
