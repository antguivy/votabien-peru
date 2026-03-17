"use client";

import { useContext, useEffect, useMemo, useState } from "react";
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
import { createCandidatePeriod, updateCandidatePeriod } from "../_lib/actions";
import { toast } from "sonner";
import { Loader2, Info, User, Search, Trash2 } from "lucide-react";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import {
  AdminCandidate,
  CandidacyStatus,
  CandidacyType,
} from "@/interfaces/candidate";
import { PersonBasicInfo } from "@/interfaces/person";
import { AdminCandidateContext } from "@/components/context/admin-candidate";
import { Badge } from "@/components/ui/badge";
import { PersonSelector } from "@/components/person-selector";
import { Card } from "@/components/ui/card";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Avatar } from "@radix-ui/react-avatar";

const candidateSchema = z.object({
  id: z.string().optional(),
  person_id: z.string().min(1, "Debe seleccionar una persona"),
  type: z.enum(CandidacyType),
  status: z.enum(CandidacyStatus),
  political_party_id: z.string().min(1, "Seleccione un partido"),
  electoral_district_id: z.string(),
  electoral_process_id: z.string().min(1, "Seleccione proceso electoral"),
  list_number: z.number().min(1, "El número de lista es obligatorio"),
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

  const [selectedPerson, setSelectedPerson] = useState<PersonBasicInfo | null>(
    null,
  );

  const [senatorDistricType, setSenatorDistricType] = useState<
    "UNICO" | "MULTIPLE" | null
  >(null);
  const [globalSearch, setGlobalSearch] = useState("");

  const defaultValues = useMemo<CandidateFormValues>(() => {
    if (mode === "edit" && initialData) {
      return {
        ...initialData,
        id: initialData.id,
        person_id: initialData.person_id ?? "",
        type: initialData.type ?? CandidacyType.DIPUTADO,
        status: initialData.status ?? CandidacyStatus.INSCRITO,
        political_party_id: initialData.political_party_id ?? "",
        electoral_district_id: initialData.electoral_district_id ?? "",
        electoral_process_id: initialData.electoral_process_id ?? "",
        list_number: initialData?.list_number ?? 0,
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
      list_number: undefined as unknown as number,
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
    if (open) {
      if (mode === "edit" && initialData) {
        form.reset({
          id: initialData.id,
          person_id: initialData.person_id ?? "",
          type: initialData.type ?? CandidacyType.DIPUTADO,
          status: initialData.status ?? CandidacyStatus.INSCRITO,
          political_party_id: initialData.political_party_id ?? "",
          electoral_district_id: initialData.electoral_district_id ?? "",
          electoral_process_id: initialData.electoral_process_id ?? "",
          list_number: initialData.list_number ?? 0,
          active: initialData.active ?? true,
        });

        setSelectedPerson(initialData.person as PersonBasicInfo);
        setGlobalSearch("");

        // ✅ Determinar el tipo de distrito de senador en modo edit
        if (
          initialData.type === "SENADOR" &&
          initialData.electoral_district_id
        ) {
          if (initialData.electoral_district_id === nationalDistrictId) {
            setSenatorDistricType("UNICO");
          } else {
            setSenatorDistricType("MULTIPLE");
          }
        } else {
          setSenatorDistricType(null);
        }
      } else {
        // Modo create
        form.setValue("person_id", "");
        form.setValue("list_number", "" as unknown as number);
        form.setValue("id", "");

        setSelectedPerson(null);
        setGlobalSearch("");
        setSenatorDistricType(null); // ✅ Reset
      }
    } else {
      // Al cerrar el modal
      if (mode === "edit") {
        form.reset({
          id: "",
          person_id: "",
          type: CandidacyType.DIPUTADO,
          status: CandidacyStatus.INSCRITO,
          political_party_id: "",
          electoral_district_id: "",
          electoral_process_id: active_process[0]?.id || "",
          list_number: undefined as unknown as number,
          active: true,
        });
        setSelectedPerson(null);
        setSenatorDistricType(null); // ✅ Reset
      }
    }
  }, [open, mode, initialData, form, active_process, nationalDistrictId]);

  const filteredDistricts = useMemo(() => {
    if (!districts) return [];

    const typeStr = watchedType?.toString() || "";

    if (
      typeStr === "DIPUTADO" ||
      (typeStr === "SENADOR" && senatorDistricType === "MULTIPLE")
    ) {
      return districts.filter((d) => d.id !== nationalDistrictId);
    }

    return districts;
  }, [districts, watchedType, senatorDistricType, nationalDistrictId]);

  useEffect(() => {
    if (
      (watchedType === "SENADOR" && senatorDistricType === "UNICO") ||
      watchedType === "VICEPRESIDENTE_1" ||
      watchedType === "VICEPRESIDENTE_2" ||
      watchedType === "PRESIDENTE"
    ) {
      if (nationalDistrictId) {
        form.setValue("electoral_district_id", nationalDistrictId);
      }
    } else if (watchedType === "SENADOR" && senatorDistricType === "MULTIPLE") {
      const currentDistrictId = form.getValues("electoral_district_id");
      if (!currentDistrictId || currentDistrictId === nationalDistrictId) {
        form.setValue("electoral_district_id", "");
      }
    } else {
      if (mode === "create") {
        form.setValue("electoral_district_id", "");
      }
    }
  }, [watchedType, senatorDistricType, nationalDistrictId, form, mode]);

  const handlePersonSelect = (person: PersonBasicInfo | null) => {
    setSelectedPerson(person);
    form.setValue("person_id", person?.id ?? "");
  };

  useEffect(() => {
    if (mode === "edit" && initialData?.person) {
      setSelectedPerson(initialData.person);
    }
  }, [initialData]);

  const handleRemovePerson = () => {
    setSelectedPerson(null);
    form.setValue("person_id", "");
  };

  const onSubmit = async (values: CandidateFormValues) => {
    try {
      if (values.type === "SENADOR" && !senatorDistricType) {
        toast.error(
          "Debe seleccionar si el Senador es de Distrito Único o Múltiple",
        );
        return;
      }

      if (!values.electoral_district_id) {
        toast.error("Debe seleccionar un distrito electoral");
        return;
      }

      const payload = {
        ...values,
        id: values.id || "",
        list_number: values.list_number,
        active: values.active ?? true,
        electoral_district_id: values.electoral_district_id,
      };

      const action =
        mode === "edit" ? updateCandidatePeriod : createCandidatePeriod;
      const messageAction = mode === "edit" ? "actualizada" : "creada";

      await toast.promise(
        action(payload).then((result) => {
          if (!result.success) {
            throw new Error(result.error || "Error desconocido");
          }
          return result;
        }),
        {
          loading: "Guardando candidatura...",
          success: `Candidatura ${messageAction} exitosamente`,
          error: (err) => err.message || "Error al guardar la candidatura",
        },
      );

      onOpenChange(false);
    } catch (error) {
      console.error("❌ Error al guardar candidatura:", error);
    }
  };

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <CredenzaHeader>
          <CredenzaTitle>
            {mode === "create" ? "Nueva Candidatura" : "Editar Candidatura"}
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
                          // TRUCO VISUAL: Si el valor es 0 (nuestro "vacío" lógico), mostramos cadena vacía
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => {
                            // LÓGICA:
                            // Si el input está vacío (""), Number lo convierte a 0.
                            // Si escriben "5", Number lo convierte a 5.
                            // Enviamos SIEMPRE un número (0 o mayor) para satisfacer a TypeScript.
                            field.onChange(Number(e.target.value));
                          }}
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
