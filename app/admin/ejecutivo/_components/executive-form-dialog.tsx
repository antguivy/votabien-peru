"use client";

import { useContext, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createExecutive, updateExecutive } from "../_lib/actions";
import { toast } from "sonner";
import { Loader2, Search, Trash2, User } from "lucide-react";
import { AdminExecutiveContext } from "@/components/context/admin-executive";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { CalendarDatePicker } from "@/components/date-picker";
import { ExecutiveRole } from "@/interfaces/politics";
import { PersonBasicInfo } from "@/interfaces/person";
import { PersonSelector } from "@/components/person-selector";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExecutiveFormValues, executiveSchema } from "../_lib/validation";
import { getExecutiveForEdit } from "../_lib/data";

const roleLabels: Record<ExecutiveRole, string> = {
  [ExecutiveRole.PRESIDENTE]: "Presidente",
  [ExecutiveRole.VICEPRESIDENTE]: "Vicepresidente",
  [ExecutiveRole.PRIMER_MINISTRO]: "Primer Ministro",
  [ExecutiveRole.MINISTRO]: "Ministro",
};

interface ExecutiveFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  executiveId?: string;
}

export function ExecutiveFormDialog({
  open,
  onOpenChange,
  mode = "create",
  executiveId,
}: ExecutiveFormDialogProps) {
  const { legislativePeriods } = useContext(AdminExecutiveContext);
  const [selectedPerson, setSelectedPerson] = useState<PersonBasicInfo | null>(
    null,
  );
  const [globalSearch, setGlobalSearch] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(false);

  const emptyValues: ExecutiveFormValues = {
    id: "",
    person_id: "",
    role: ExecutiveRole.MINISTRO,
    ministry: null,
    start_date: "",
    end_date: null,
    end_reason: null,
    legislative_period_id: null,
  };

  const form = useForm<ExecutiveFormValues>({
    resolver: zodResolver(executiveSchema),
    defaultValues: emptyValues,
  });

  const watchedRole = useWatch({
    control: form.control,
    name: "role",
    defaultValue: ExecutiveRole.MINISTRO,
  });

  const isMinister = watchedRole === ExecutiveRole.MINISTRO;

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset(emptyValues);
      setSelectedPerson(null);
      setGlobalSearch("");
    }
    onOpenChange(newOpen);
  };

  useEffect(() => {
    if (!open || mode !== "edit" || !executiveId) {
      return;
    }

    let isSubscribed = true;

    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const data = await getExecutiveForEdit(executiveId);
        if (!isSubscribed || !data) return;
        const { person, ...formValues } = data;
        form.reset(formValues);
        setSelectedPerson(person as PersonBasicInfo);
        setGlobalSearch("");
      } finally {
        if (isSubscribed) {
          setIsLoadingData(false);
        }
      }
    };

    fetchData();

    return () => {
      isSubscribed = false;
    };
  }, [open, mode, executiveId, form]);

  const handlePersonSelect = (person: PersonBasicInfo | null) => {
    setSelectedPerson(person);
    form.setValue("person_id", person?.id ?? "");
  };

  const handleRemovePerson = () => {
    setSelectedPerson(null);
    form.setValue("person_id", "");
  };

  const onSubmit = async (values: ExecutiveFormValues) => {
    try {
      const messageAction = mode === "edit" ? "actualizado" : "creado";

      await toast.promise(
        (mode === "edit"
          ? updateExecutive({ ...values, id: values.id! })
          : createExecutive(values)
        ).then((result) => {
          if (!result.success) {
            throw new Error(
              "error" in result ? result.error : "Error desconocido",
            );
          }
          return result;
        }),
        {
          loading: "Guardando miembro del ejecutivo...",
          success: `Miembro del ejecutivo ${messageAction} exitosamente`,
          error: (err) =>
            err.message || "Error al guardar miembro del ejecutivo",
        },
      );

      handleOpenChange(false);
    } catch (error) {
      console.error("Error al guardar ejecutivo:", error);
    }
  };

  return (
    <Credenza open={open} onOpenChange={handleOpenChange}>
      <CredenzaContent className="sm:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col">
        <CredenzaHeader>
          <CredenzaTitle>
            {mode === "create"
              ? "Nuevo Miembro del Ejecutivo"
              : "Editar Miembro del Ejecutivo"}
          </CredenzaTitle>
          <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={"Buscar persona..."}
              className="pl-9 bg-muted/30"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              autoFocus
            />
          </div>
        </CredenzaHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full overflow-hidden"
          >
            <CredenzaBody className="space-y-4 overflow-y-auto px-4 py-2 flex-1">
              <FormField
                control={form.control}
                name="person_id"
                render={() => (
                  <FormItem>
                    <FormControl>
                      {selectedPerson ? (
                        <Card className="flex flex-row items-center justify-between p-2 border-primary/50 bg-primary/5">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border bg-white">
                              <AvatarImage
                                src={selectedPerson.image_candidate_url || ""}
                              />
                              <AvatarFallback>
                                <User className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {selectedPerson.fullname}
                              </p>
                              {selectedPerson.profession && (
                                <p className="text-xs text-muted-foreground">
                                  {selectedPerson.profession}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleRemovePerson}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </Card>
                      ) : (
                        <PersonSelector
                          onSelect={handlePersonSelect}
                          enableSearch={false}
                          externalSearchTerm={globalSearch}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar cargo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ExecutiveRole).map((role) => (
                            <SelectItem key={role} value={role}>
                              {roleLabels[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isMinister && (
                  <FormField
                    control={form.control}
                    name="ministry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ministerio</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej. Economía y Finanzas"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value || null)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Inicio *</FormLabel>
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
                              form.setValue("start_date", from.toISOString());
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
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Fin</FormLabel>
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
                              form.setValue("end_date", from.toISOString());
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
              </div>

              <FormField
                control={form.control}
                name="legislative_period_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Periodo Legislativo</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "none" ? null : value)
                      }
                      value={field.value ?? "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar periodo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sin periodo</SelectItem>
                        {legislativePeriods?.map((period) => (
                          <SelectItem key={period.id} value={period.id}>
                            {period.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CredenzaBody>
            <CredenzaFooter className="px-4 py-4 mt-auto border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={form.formState.isSubmitting || isLoadingData}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || isLoadingData}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === "create" ? "Crear Miembro" : "Guardar Cambios"}
              </Button>
            </CredenzaFooter>
          </form>
        </Form>
      </CredenzaContent>
    </Credenza>
  );
}
