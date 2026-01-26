"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CandidacyType, CandidacyStatus } from "@/interfaces/politics";
import { createCandidatePeriod, updateCandidatePeriod } from "../_lib/actions";
import { toast } from "sonner";
import { Loader2, Info } from "lucide-react";
import { PersonSelector } from "./person-selector";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { AdminCandidate } from "@/interfaces/candidate";
import { PersonBasicInfo } from "@/interfaces/person";
import { AdminCandidateContext } from "@/components/context/admin-candidate";
import { Badge } from "@/components/ui/badge";

const candidateSchema = z.object({
  id: z.string().optional(),
  person_id: z.string().min(1, "Debe seleccionar una persona"),
  type: z.enum(CandidacyType),
  status: z.enum(CandidacyStatus),
  political_party_id: z.string().min(1, "Seleccione un partido"),
  electoral_district_id: z.string().nullable().optional(),
  electoral_process_id: z.string().min(1, "Seleccione proceso electoral"),
  list_number: z.number().nullable(),
  active: z.boolean().optional(),
});

type CandidateFormValues = z.infer<typeof candidateSchema>;

interface CandidateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  initialData?: Partial<AdminCandidate>;
}

export function CandidateFormDialog({
  open,
  onOpenChange,
  mode = "create",
  initialData,
}: CandidateFormDialogProps) {
  const { districts, parties, active_process } = useContext(
    AdminCandidateContext,
  );
  const router = useRouter();

  const [selectedPerson, setSelectedPerson] = useState<PersonBasicInfo | null>(
    null,
  );

  const [senatorDistricType, setSenatorDistricType] = useState<
    "UNICO" | "MULTIPLE" | null
  >(null);

  const defaultValues = useMemo<CandidateFormValues>(() => {
    if (mode === "edit" && initialData) {
      return {
        ...initialData,
        id: initialData.id,
        person_id: initialData.person_id ?? "",
        type: initialData.type ?? CandidacyType.DIPUTADO,
        status: initialData.status ?? CandidacyStatus.INSCRITO,
        political_party_id: initialData.political_party_id ?? "",
        electoral_district_id: initialData.electoral_district_id ?? null,
        electoral_process_id: initialData.electoral_process_id ?? "",
        list_number: initialData.list_number ?? null,
        active: initialData.active ?? true,
      };
    }
    return {
      id: "",
      person_id: "",
      type: CandidacyType.DIPUTADO,
      status: CandidacyStatus.INSCRITO,
      political_party_id: "",
      electoral_district_id: "",
      electoral_process_id: active_process[0].id,
      list_number: null,
      active: true,
    };
  }, [mode, initialData]);

  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues,
  });

  const watchedType = form.watch("type");

  const nationalDistrictId = useMemo(() => {
    return (
      districts?.find((d) => d.name.toUpperCase().includes("NACIONAL"))?.id ||
      ""
    );
  }, [districts]);

  // --- LÓGICA DE NEGOCIO ---
  useEffect(() => {
    const currentDistrit = form.getValues("electoral_district_id");

    const typeStr = watchedType?.toString() || "";
    const isPresidential =
      typeStr === "PRESIDENTE" || typeStr.includes("VICEPRESIDENTE");

    if (isPresidential && nationalDistrictId) {
      if (currentDistrit !== nationalDistrictId) {
        form.setValue("electoral_district_id", nationalDistrictId);
      }
      setSenatorDistricType(null);
    } else if (typeStr === "SENADOR") {
      // Si cambiamos a senador y no tenemos tipo definido, limpiamos distrito
      if (!senatorDistricType && mode === "create") {
        form.setValue("electoral_district_id", "");
      }

      // Si elige Distrito Único -> Nacional
      if (senatorDistricType === "UNICO" && nationalDistrictId) {
        form.setValue("electoral_district_id", nationalDistrictId);
      }
      // Si elige Múltiple -> Limpiar si estaba en nacional
      if (
        senatorDistricType === "MULTIPLE" &&
        currentDistrit === nationalDistrictId
      ) {
        form.setValue("electoral_district_id", "");
      }
    }

    // 3. Lógica para DIPUTADO
    else if (typeStr === "DIPUTADO") {
      setSenatorDistricType(null);
      // Si por alguna razón tiene nacional seleccionado, limpiarlo
      if (currentDistrit === nationalDistrictId) {
        form.setValue("electoral_district_id", "");
      }
    }
  }, [watchedType, senatorDistricType, nationalDistrictId, form, mode]);

  // Filtrado de la lista de distritos para el Select
  const filteredDistricts = useMemo(() => {
    if (!districts) return [];

    const typeStr = watchedType?.toString() || "";

    // Si es Diputado o Senador Múltiple -> Excluir Nacional
    if (
      typeStr === "DIPUTADO" ||
      (typeStr === "SENADOR" && senatorDistricType === "MULTIPLE")
    ) {
      return districts.filter((d) => d.id !== nationalDistrictId);
    }

    // En los demás casos (Presidente/Senador Único) el select suele estar deshabilitado o fijo,
    // pero retornamos todo por seguridad.
    return districts;
  }, [districts, watchedType, senatorDistricType, nationalDistrictId]);

  const handlePersonSelect = (person: PersonBasicInfo | null) => {
    setSelectedPerson(person);
    form.setValue("person_id", person?.id ?? "");
  };

  useEffect(() => {
    if (mode === "edit" && initialData?.person) {
      setSelectedPerson(initialData.person);
    }
  }, [initialData]);
  const onSubmit = async (values: CandidateFormValues) => {
    const payload = {
      ...values,
      id: values.id || "",
      list_number: values.list_number || null,
      active: values.active ?? true,
      electoral_district_id: values.electoral_district_id || null,
    };

    const action =
      mode === "edit" ? updateCandidatePeriod : createCandidatePeriod;
    const messageAction = mode === "edit" ? "actualizada" : "creada";

    toast.promise(action(payload), {
      loading: "Guardando candidatura...",
      success: `Candidatura ${messageAction} exitosamente`,
      error: (err) => err?.message || "Ocurrió un error",
    });

    onOpenChange(false);
    router.refresh();
  };

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <CredenzaHeader>
          <CredenzaTitle>
            {mode === "create" ? "Nueva Candidatura" : "Editar Candidatura"}
          </CredenzaTitle>
          <CredenzaDescription>
            {mode === "create"
              ? "Registra un candidato para un proceso electoral."
              : "Modifica los datos de la candidatura existente."}
          </CredenzaDescription>
        </CredenzaHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full overflow-hidden"
          >
            <CredenzaBody className="space-y-4 overflow-y-auto px-4 py-2">
              {/* --- PERSONA --- */}
              <FormField
                control={form.control}
                name="person_id"
                render={() => (
                  <FormItem>
                    <FormLabel>Candidato (Persona) *</FormLabel>
                    <FormControl>
                      <PersonSelector
                        onSelect={handlePersonSelect}
                        selectedPerson={selectedPerson}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* --- PROCESO ELECTORAL --- */}
                <FormField
                  control={form.control}
                  name="electoral_process_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proceso Electoral *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar proceso" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {active_process?.map((proc) => (
                            <SelectItem key={proc.id} value={proc.id}>
                              {proc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Cargo *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(CandidacyType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.toString().replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchedType?.toString() === "SENADOR" && (
                <div className="p-4 border rounded-md bg-muted/20 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <FormLabel className="text-primary">
                    Configuración de Senado
                  </FormLabel>
                  <div className="flex gap-4">
                    <div
                      onClick={() => setSenatorDistricType("UNICO")}
                      className={`flex-1 border p-3 rounded-md cursor-pointer transition-all flex items-center gap-2 ${senatorDistricType === "UNICO" ? "border-primary bg-primary/10 ring-1 ring-primary" : "hover:bg-muted"}`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full border border-primary ${senatorDistricType === "UNICO" ? "bg-primary" : ""}`}
                      />
                      <span className="text-sm font-medium">
                        Distrito Único
                      </span>
                    </div>
                    <div
                      onClick={() => setSenatorDistricType("MULTIPLE")}
                      className={`flex-1 border p-3 rounded-md cursor-pointer transition-all flex items-center gap-2 ${senatorDistricType === "MULTIPLE" ? "border-primary bg-primary/10 ring-1 ring-primary" : "hover:bg-muted"}`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full border border-primary ${senatorDistricType === "MULTIPLE" ? "bg-primary" : ""}`}
                      />
                      <span className="text-sm font-medium">
                        Distrito Múltiple
                      </span>
                    </div>
                  </div>
                  {senatorDistricType === "UNICO" && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" /> Se asignará automáticamente
                      el distrito Nacional.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="political_party_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partido Político *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione Partido" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          {parties?.map((party) => (
                            <SelectItem key={party.id} value={party.id}>
                              {party.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="electoral_district_id"
                  render={({ field }) => {
                    const typeStr = watchedType?.toString() || "";
                    const isPresidential =
                      typeStr === "PRESIDENTE" ||
                      typeStr.includes("VICEPRESIDENTE");
                    const isSenatorUnique =
                      typeStr === "SENADOR" && senatorDistricType === "UNICO";
                    const isAutoNacional = isPresidential || isSenatorUnique;

                    return (
                      <FormItem>
                        <FormLabel>Distrito Electoral</FormLabel>

                        {isAutoNacional ? (
                          <div className="h-10 px-3 py-2 rounded-md border bg-muted text-sm flex items-center justify-between opacity-80 cursor-not-allowed">
                            <span>Nacional</span>
                            <Badge
                              variant="secondary"
                              className="text-[10px] h-5"
                            >
                              Automático
                            </Badge>
                          </div>
                        ) : (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                            disabled={
                              typeStr === "SENADOR" && !senatorDistricType
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    typeStr === "SENADOR" && !senatorDistricType
                                      ? "Seleccione tipo de senado primero"
                                      : "Seleccione distrito"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filteredDistricts?.map((district) => (
                                <SelectItem
                                  key={district.id}
                                  value={district.id}
                                >
                                  {district.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Estado *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(CandidacyStatus).map((st) => (
                            <SelectItem key={st} value={st}>
                              {st}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="list_number"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>N° Lista</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ej. 1"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 md:col-span-1 mt-auto">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Activo</FormLabel>
                        <FormDescription>Visible públicamente</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CredenzaBody>
            <CredenzaFooter className="px-4 py-4 mt-auto border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === "create" ? "Crear Candidato" : "Guardar Cambios"}
              </Button>
            </CredenzaFooter>
          </form>
        </Form>
      </CredenzaContent>
    </Credenza>
  );
}
