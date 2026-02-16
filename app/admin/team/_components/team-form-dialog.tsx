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
  FormDescription,
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
import { teamSchema, type TeamFormValues } from "../_lib/validation";
import { createTeam, updateTeam } from "../_lib/actions";
import { TeamBasic } from "@/interfaces/team";
import {
  Mail,
  Briefcase,
  Globe,
  Linkedin,
  Image as ImageIcon,
  MessageSquareQuote,
} from "lucide-react";

interface TeamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  initialData?: TeamBasic;
}

const defaultFormValues: TeamFormValues = {
  first_name: "",
  last_name: "",
  image_url: "", // Nuevo campo
  phrase: "", // Nuevo campo
  role: "",
  email: "",
  linkedin_url: "",
  portfolio_url: "",
  is_principal: false,
};

export function TeamFormDialog({
  open,
  onOpenChange,
  mode = "create",
  initialData,
}: TeamFormDialogProps) {
  const router = useRouter();

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        form.reset({
          first_name: initialData.first_name,
          last_name: initialData.last_name,
          image_url: initialData.image_url || "", // Mapeo
          phrase: initialData.phrase || "", // Mapeo
          role: initialData.role,
          email: initialData.email || "",
          linkedin_url: initialData.linkedin_url
            ? String(initialData.linkedin_url)
            : "",
          portfolio_url: initialData.portfolio_url || "",
          is_principal: initialData.is_principal,
        });
      } else {
        form.reset(defaultFormValues);
      }
    }
  }, [open, mode, initialData, form]);

  const onSubmit = async (values: TeamFormValues) => {
    const isEditing = mode === "edit";
    const promise = isEditing
      ? updateTeam(initialData!.id, values)
      : createTeam(values);

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
            {mode === "edit" ? "Editar Miembro" : "Nuevo Miembro del Equipo"}
          </CredenzaTitle>
        </CredenzaHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <CredenzaBody className="space-y-4 px-4 py-2 overflow-y-auto">
              {/* --- BLOQUE 1: INFORMACIÓN BÁSICA --- */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Juan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Pérez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* --- BLOQUE 2: ROL Y FOTO --- */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo / Rol</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Briefcase className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder="Ej: Frontend Developer"
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
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de Imagen (Avatar)</FormLabel>
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
              </div>

              {/* --- BLOQUE 3: FRASE (Nuevo) --- */}
              <FormField
                control={form.control}
                name="phrase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frase Personal</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MessageSquareQuote className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea
                          className="pl-9 min-h-[60px] resize-none"
                          placeholder="Una frase corta que defina al miembro..."
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- BLOQUE 4: CONTACTO --- */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Opcional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          placeholder="juan@ejemplo.com"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="linkedin_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn URL</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Linkedin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder="https://linkedin.com/..."
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
                  name="portfolio_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Portfolio URL</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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
              </div>

              {/* --- BLOQUE 5: SWITCH PRINCIPAL --- */}
              <FormField
                control={form.control}
                name="is_principal"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-2 mb-2">
                    <div className="space-y-0.5">
                      <FormLabel>Miembro Principal</FormLabel>
                      <FormDescription>
                        Aparecerá destacado o primero en la lista.
                      </FormDescription>
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
                {mode === "edit" ? "Guardar Cambios" : "Crear Miembro"}
              </Button>
            </CredenzaFooter>
          </form>
        </Form>
      </CredenzaContent>
    </Credenza>
  );
}
