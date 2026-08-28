"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import {
  createCandidatePeriod,
  updateCandidatePeriod,
  updateCandidateStatus,
} from "../_lib/actions";
import { toast } from "sonner";
import {
  Loader2,
  Info,
  User,
  Search,
  Trash2,
  Landmark,
  Building2,
  ShieldCheck,
  Award,
} from "lucide-react";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { CandidacyStatus, CandidacyType } from "@/interfaces/candidate";
import { PersonBasicInfo } from "@/interfaces/person";
import { AdminCandidateContext } from "@/components/context/admin-candidate";
import { Badge } from "@/components/ui/badge";
import { PersonSelector } from "@/components/person-selector";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CandidateFormValues, candidateSchema } from "../_lib/validation";
import { getCandidateForEdit, CandidateForEdit } from "../_lib/data";
import { useAuth } from "@/lib/auth-provider";
import {
  getCandidateTypeColor,
  getCandidateTypeIcon,
} from "@/lib/utils/helper-enums";

const STATUS_CONFIG: {
  value: CandidacyStatus;
  label: string;
  dotColor: string;
  badgeClass: string;
}[] = [
  {
    value: CandidacyStatus.INSCRITO,
    label: "Inscrito (En Carrera)",
    dotColor: "bg-emerald-500",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    value: CandidacyStatus.TACHADO,
    label: "Tachado (Tacha Fundada)",
    dotColor: "bg-rose-500",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300",
  },
  {
    value: CandidacyStatus.EXCLUIDO,
    label: "Excluido (JEE / JNE)",
    dotColor: "bg-red-600",
    badgeClass:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300",
  },
  {
    value: CandidacyStatus.IMPROCEDENTE,
    label: "Improcedente",
    dotColor: "bg-amber-500",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
  },
  {
    value: CandidacyStatus.APELACION,
    label: "En Apelación (JNE)",
    dotColor: "bg-yellow-500",
    badgeClass:
      "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300",
  },
  {
    value: CandidacyStatus.ADMITIDO,
    label: "Admitido",
    dotColor: "bg-blue-500",
    badgeClass:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    value: CandidacyStatus.PUBLICADO_PARA_TACHAS,
    label: "Publicado para Tachas",
    dotColor: "bg-cyan-500",
    badgeClass:
      "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300",
  },
  {
    value: CandidacyStatus.TACHA_EN_TRAMITE,
    label: "Tacha en Trámite",
    dotColor: "bg-orange-500",
    badgeClass:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300",
  },
  {
    value: CandidacyStatus.SOLICITUD_INSCRIPCION,
    label: "Solicitud de Inscripción",
    dotColor: "bg-indigo-500",
    badgeClass:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300",
  },
  {
    value: CandidacyStatus.RENUNCIA,
    label: "Renuncia",
    dotColor: "bg-zinc-500",
    badgeClass:
      "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-950 dark:text-zinc-300",
  },
];

interface CandidateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  candidateId?: string;
}

export function CandidateFormDialog({
  open,
  onOpenChange,
  mode = "create",
  candidateId,
}: CandidateFormDialogProps) {
  const { user } = useAuth();
  const isVolunteer = user?.role === "volunteer";

  const { districts, parties, active_process } = useContext(
    AdminCandidateContext,
  );
  const [selectedPerson, setSelectedPerson] = useState<PersonBasicInfo | null>(
    null,
  );
  const [editCandidateData, setEditCandidateData] =
    useState<CandidateForEdit | null>(null);
  const [senatorDistricType, setSenatorDistricType] = useState<
    "UNICO" | "MULTIPLE" | null
  >(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(false);

  const emptyValues: CandidateFormValues = {
    id: "",
    person_id: "",
    type: CandidacyType.DIPUTADO,
    status: CandidacyStatus.INSCRITO,
    political_party_id: "",
    electoral_district_id: "",
    electoral_process_id: active_process[0]?.id || "",
    list_number: 0,
    active: true,
  };

  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: emptyValues,
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchedType = form.watch("type");
  const watchedStatus = form.watch("status");

  const nationalDistrictId = useMemo(() => {
    return (
      districts?.find((d) => d.name.toUpperCase().includes("NACIONAL"))?.id ||
      ""
    );
  }, [districts]);

  useEffect(() => {
    if (!open) {
      form.reset(emptyValues);
      setSelectedPerson(null);
      setEditCandidateData(null);
      setSenatorDistricType(null);
      setGlobalSearch("");
      return;
    }

    if (mode === "create" || !candidateId) {
      form.reset({
        ...emptyValues,
        electoral_process_id: active_process[0]?.id || "",
      });
      setSelectedPerson(null);
      setEditCandidateData(null);
      setSenatorDistricType(null);
      return;
    }

    // modo edit — carga lazy
    setIsLoadingData(true);
    getCandidateForEdit(candidateId)
      .then((data) => {
        if (!data) return;
        setEditCandidateData(data);
        const { person, ...formValues } = data;
        form.reset(formValues);
        setSelectedPerson(person as PersonBasicInfo);
        setGlobalSearch("");

        if (data.type === "SENADOR" && data.electoral_district_id) {
          setSenatorDistricType(
            data.electoral_district_id === nationalDistrictId
              ? "UNICO"
              : "MULTIPLE",
          );
        } else {
          setSenatorDistricType(null);
        }
      })
      .finally(() => setIsLoadingData(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, candidateId]);

  const filteredDistricts = useMemo(() => {
    if (!districts) return [];

    const typeStr = watchedType?.toString() || "";

    if (
      typeStr === "DIPUTADO" ||
      typeStr === "GOBERNADOR_REGIONAL" ||
      typeStr === "VICEGOBERNADOR_REGIONAL" ||
      (typeStr === "SENADOR" && senatorDistricType === "MULTIPLE")
    ) {
      return districts.filter((d) => d.level === "REGIONAL");
    }

    if (
      typeStr === "ALCALDE_PROVINCIAL" ||
      typeStr === "REGIDOR_PROVINCIAL" ||
      typeStr === "CONSEJERO_REGIONAL"
    ) {
      return districts.filter((d) => d.level === "PROVINCIAL");
    }

    if (typeStr === "ALCALDE_DISTRITAL" || typeStr === "REGIDOR_DISTRITAL") {
      return districts.filter((d) => d.level === "DISTRITAL");
    }

    return districts.filter((d) => d.id !== nationalDistrictId);
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

  const handleRemovePerson = () => {
    setSelectedPerson(null);
    form.setValue("person_id", "");
  };

  const onSubmit = async (values: CandidateFormValues) => {
    try {
      // ── Flujo Voluntario: Solo actualización de Estado ──
      if (isVolunteer && mode === "edit" && candidateId) {
        await toast.promise(
          updateCandidateStatus(candidateId, values.status).then((result) => {
            if (!result.success) {
              throw new Error(result.error || "Error al actualizar estado");
            }
            return result;
          }),
          {
            loading: "Actualizando estado del candidato...",
            success: "Estado de candidatura actualizado exitosamente",
            error: (err) => err.message || "Error al actualizar el estado",
          },
        );
        onOpenChange(false);
        return;
      }

      // ── Flujo Administrador / Editor: Validación completa ──
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
        id: values.id || candidateId || "",
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

  const TypeIcon = getCandidateTypeIcon(watchedType);
  const typeColor = getCandidateTypeColor(watchedType);
  const currentStatusConfig = STATUS_CONFIG.find(
    (s) => s.value === watchedStatus,
  );

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <CredenzaHeader>
          <CredenzaTitle className="flex items-center gap-2">
            {isVolunteer && mode === "edit" ? (
              <>
                <ShieldCheck className="h-5 w-5 text-primary" />
                Actualizar Estado del Candidato
              </>
            ) : mode === "create" ? (
              "Nueva Candidatura"
            ) : (
              "Editar Candidatura"
            )}
          </CredenzaTitle>

          {!isVolunteer && mode === "create" && (
            <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar persona..."
                className="pl-9 bg-muted/30"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </CredenzaHeader>

        {isLoadingData ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Cargando información del candidato...
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col h-full overflow-hidden"
            >
              <CredenzaBody className="space-y-4 overflow-y-auto px-4 py-2 flex-1">
                {/* ── MODO VOLUNTARIO ── */}
                {isVolunteer && mode === "edit" ? (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Banner Informativo */}
                    <div className="flex items-start gap-3 p-3.5 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                      <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-semibold text-foreground">
                          Modo Voluntario: Información Oficial Sincronizada
                        </p>
                        <p>
                          Los datos del candidato provienen de VotoInformado
                          (JNE). En este panel puedes actualizar su estado legal
                          ante tachas, exclusiones o resoluciones emitidas por
                          el JEE o JNE.
                        </p>
                      </div>
                    </div>

                    {/* Tarjeta de Candidato */}
                    {selectedPerson && (
                      <Card className="flex flex-row items-center justify-between p-3 border bg-muted/20">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border bg-white shadow-sm">
                            <AvatarImage
                              src={selectedPerson.image_candidate_url || ""}
                            />
                            <AvatarFallback>
                              <User className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm text-foreground">
                              {selectedPerson.fullname}
                            </p>
                            {selectedPerson.profession && (
                              <p className="text-xs text-muted-foreground">
                                {selectedPerson.profession}
                              </p>
                            )}
                          </div>
                        </div>
                        {editCandidateData?.list_number ? (
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            N° {editCandidateData.list_number}
                          </Badge>
                        ) : null}
                      </Card>
                    )}

                    {/* Ficha Resumen de Candidatura (Solo Lectura) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border bg-muted/10">
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                          <Landmark className="h-3.5 w-3.5 text-primary" />
                          Proceso Electoral
                        </span>
                        <p className="text-xs font-semibold text-foreground">
                          {editCandidateData?.electoral_process_name ||
                            "Elecciones Regionales y Municipales 2026"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                          <TypeIcon className={`h-3.5 w-3.5 ${typeColor}`} />
                          Cargo Postulado
                        </span>
                        <p className="text-xs font-semibold text-foreground capitalize">
                          {watchedType
                            ?.toString()
                            .replace(/_/g, " ")
                            .toLowerCase()}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-primary" />
                          Organización Política
                        </span>
                        <p className="text-xs font-semibold text-foreground">
                          {editCandidateData?.party_name || "Partido Político"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                          <Landmark className="h-3.5 w-3.5 text-primary" />
                          Circunscripción / Distrito
                        </span>
                        <p className="text-xs font-semibold text-foreground">
                          {editCandidateData?.district_formatted ||
                            editCandidateData?.district_name ||
                            "Distrito Electoral"}
                        </p>
                      </div>
                    </div>

                    {/* Selector de Estado Habilitado */}
                    <div className="p-4 rounded-lg border border-primary/30 bg-card shadow-sm space-y-3">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                <Award className="h-4 w-4 text-primary" />
                                Estado de la Candidatura (JNE) *
                              </FormLabel>
                              {currentStatusConfig && (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-semibold border ${currentStatusConfig.badgeClass}`}
                                >
                                  {currentStatusConfig.label}
                                </Badge>
                              )}
                            </div>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-10 bg-background">
                                  <SelectValue placeholder="Seleccione estado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[300px]">
                                {STATUS_CONFIG.map((st) => (
                                  <SelectItem key={st.value} value={st.value}>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`h-2 w-2 rounded-full ${st.dotColor}`}
                                      />
                                      <span className="font-medium">
                                        {st.label}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription className="text-xs text-muted-foreground">
                              Actualiza el estado según las resoluciones
                              oficiales publicadas por el JEE o JNE (ej.
                              Inscrito, Tachado, Excluido, etc.).
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ) : (
                  /* ── MODO ADMINISTRADOR / EDITOR ── */
                  <>
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
                                      src={
                                        selectedPerson.image_candidate_url || ""
                                      }
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
                                {editCandidateData?.electoral_process_id &&
                                  !active_process?.some(
                                    (p) =>
                                      p.id ===
                                      editCandidateData.electoral_process_id,
                                  ) && (
                                    <SelectItem
                                      value={
                                        editCandidateData.electoral_process_id
                                      }
                                    >
                                      {editCandidateData.electoral_process_name ||
                                        "Proceso Registrado"}
                                    </SelectItem>
                                  )}
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
                                    {type.toString().replace(/_/g, " ")}
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
                            <Info className="h-3 w-3" /> Se asignará
                            automáticamente el distrito Nacional.
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
                            typeStr === "SENADOR" &&
                            senatorDistricType === "UNICO";
                          const isAutoNacional =
                            isPresidential || isSenatorUnique;

                          return (
                            <FormItem>
                              <FormLabel>Distrito Electoral *</FormLabel>

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
                                          typeStr === "SENADOR" &&
                                          !senatorDistricType
                                            ? "Seleccione tipo de senado primero"
                                            : "Seleccione distrito"
                                        }
                                      />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="max-h-[300px]">
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
                              <SelectContent className="max-h-[300px]">
                                {STATUS_CONFIG.map((st) => (
                                  <SelectItem key={st.value} value={st.value}>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`h-2 w-2 rounded-full ${st.dotColor}`}
                                      />
                                      <span>{st.label}</span>
                                    </div>
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
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(
                                    value === "" ? 0 : Number(value),
                                  );
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
                              <FormDescription>
                                Visible públicamente
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
              </CredenzaBody>

              <CredenzaFooter className="px-4 py-4 mt-auto border-t flex items-center justify-end gap-2">
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
                  {isVolunteer && mode === "edit"
                    ? "Actualizar Estado"
                    : mode === "create"
                      ? "Crear Candidato"
                      : "Guardar Cambios"}
                </Button>
              </CredenzaFooter>
            </form>
          </Form>
        )}
      </CredenzaContent>
    </Credenza>
  );
}
