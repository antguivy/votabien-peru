import React, { useState, useEffect, useContext, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  ExternalLink,
  SquarePen,
  AlertCircle,
  Trash2,
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarDatePicker } from "@/components/date-picker";
import { toast } from "sonner";
import { AdminLegislatorContext } from "@/components/context/admin-legislator";
import { GroupChangeReason } from "@/interfaces/politics";
import Image from "next/image";
import {
  createParliamentaryMembership,
  deleteParliamentaryMembership,
  updateParliamentaryMembership,
} from "../_lib/actions";
import {
  CreateParliamentaryMembershipResult,
  ParliamentaryMembershipWithGroup,
} from "@/interfaces/parliamentary-membership";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

const REASON_CONFIG = {
  [GroupChangeReason.INICIAL]: {
    label: "Inicial",
    color: "bg-info/10 text-info border-info/20",
  },
  [GroupChangeReason.CAMBIO_VOLUNTARIO]: {
    label: "Voluntario",
    color: "bg-success/10 text-success border-success/20",
  },
  [GroupChangeReason.EXPULSION]: {
    label: "Expulsión",
    color: "bg-destructive/10 text-destructive border-destructive/20",
  },
  [GroupChangeReason.RENUNCIA]: {
    label: "Renuncia",
    color: "bg-warning/15 text-warning border-warning/20",
  },
  [GroupChangeReason.DISOLUCION_BANCADA]: {
    label: "Disolución",
    color: "bg-muted text-muted-foreground border-border",
  },
  [GroupChangeReason.CAMBIO_ESTRATEGICO]: {
    label: "Estratégico",
    color: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  },
  [GroupChangeReason.SANCION_DISCIPLINARIA]: {
    label: "Sanción",
    color: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  },
  [GroupChangeReason.OTRO]: {
    label: "Otro",
    color: "bg-secondary text-secondary-foreground border-secondary",
  },
};

const membershipSchema = z
  .object({
    id: z.string(),
    parliamentary_group_id: z
      .string()
      .min(1, "Debe seleccionar un grupo parlamentario"),
    start_date: z.string().min(1, "Fecha de inicio requerida"),
    end_date: z.string().nullable(),
    change_reason: z.enum(GroupChangeReason),
    source_url: z
      .union([z.string().url({ message: "URL inválida" }), z.literal("")])
      .optional(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return new Date(data.end_date) >= new Date(data.start_date);
      }
      return true;
    },
    {
      message: "La fecha de fin debe ser posterior a la fecha de inicio",
      path: ["end_date"],
    },
  );

type MembershipFormValues = z.infer<typeof membershipSchema>;

interface ParliamentaryMembershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  legislatorName: string;
  legislator_id: string;
  memberships: ParliamentaryMembershipWithGroup[];
}

export function ParliamentaryMembershipDialog({
  open,
  onOpenChange,
  legislatorName,
  legislator_id,
  memberships: initialMemberships,
}: ParliamentaryMembershipDialogProps) {
  const [memberships, setMemberships] =
    useState<ParliamentaryMembershipWithGroup[]>(initialMemberships);
  const [editingMembership, setEditingMembership] =
    useState<ParliamentaryMembershipWithGroup | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { parliamentaryGroups } = useContext(AdminLegislatorContext);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const form = useForm<MembershipFormValues>({
    resolver: zodResolver(membershipSchema),
    defaultValues: {
      id: "",
      parliamentary_group_id: "",
      start_date: "",
      end_date: null,
      change_reason: GroupChangeReason.CAMBIO_VOLUNTARIO,
      source_url: "",
    },
  });

  useEffect(() => {
    setMemberships(initialMemberships);
  }, [initialMemberships]);

  useEffect(() => {
    if (!open) {
      handleCancel();
    }
  }, [open]);

  const handleEdit = useCallback(
    (membership: ParliamentaryMembershipWithGroup) => {
      setEditingMembership(membership);
      form.reset({
        id: membership.id,
        parliamentary_group_id: membership.parliamentary_group_id,
        start_date: membership.start_date,
        end_date: membership.end_date || null,
        change_reason: membership.change_reason,
        source_url: membership.source_url || "",
      });
      setShowForm(true);
    },
    [form],
  );

  const handleCancel = useCallback(() => {
    form.reset();
    setEditingMembership(null);
    setShowForm(false);
  }, [form]);

  const handleDelete = async (membershipId: string) => {
    if (
      !confirm("¿Estás seguro de que deseas eliminar este cambio de bancada?")
    ) {
      return;
    }
    setIsDeleting(membershipId);
    try {
      const result = await deleteParliamentaryMembership(
        legislator_id,
        membershipId,
      );
      if (!result.success) {
        toast.error(result.error || "Error al eliminar");
        return;
      }
      setMemberships((prev) => prev.filter((m) => m.id !== membershipId));
      toast.success("Eliminado exitosamente");
    } catch (error) {
      toast.error("Error al eliminar");
    } finally {
      setIsDeleting(null);
    }
  };

  const onSubmit = async (values: MembershipFormValues) => {
    const isEditing = !!editingMembership;
    setIsSubmitting(true);
    try {
      let result;
      if (isEditing) {
        result = await updateParliamentaryMembership(legislator_id, values);
        if (!result.success) {
          toast.error(result.error || `Error al actualizar`);
          return;
        }
        if (result.data) {
          const updatedMembership =
            result.data as ParliamentaryMembershipWithGroup;
          setMemberships((prev) =>
            prev.map((m) =>
              m.id === updatedMembership.id ? updatedMembership : m,
            ),
          );
        }
      } else {
        const { id, ...createData } = values;
        result = await createParliamentaryMembership(legislator_id, createData);
        if (!result.success) {
          toast.error(result.error || `Error al crear`);
          return;
        }
        if (result.data) {
          const { created, updated } =
            result.data as CreateParliamentaryMembershipResult;
          setMemberships((prev) => {
            const updatedList = updated
              ? prev.map((m) => (m.id === updated.id ? updated : m))
              : prev;
            return [created, ...updatedList];
          });
        }
      }
      toast.success(
        isEditing ? "Actualizado exitosamente" : "Creado exitosamente",
      );
      handleCancel();
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Actualidad";
    return new Date(dateString).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const sortedMemberships = [...memberships].sort(
    (a, b) =>
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
  );

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="p-4 sm:max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <CredenzaHeader className="text-left">
          <div className="flex items-center gap-2">
            {showForm && (
              <Button
                variant="ghost"
                size="icon"
                className="-ml-2 h-8 w-8 rounded-full"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <CredenzaTitle>
                {showForm
                  ? editingMembership
                    ? "Editar Afiliación"
                    : "Nueva Afiliación"
                  : "Historial de Bancadas"}
              </CredenzaTitle>
              {!showForm && (
                <p className="text-sm text-muted-foreground mt-1">
                  {legislatorName}
                </p>
              )}
            </div>
          </div>
        </CredenzaHeader>

        <CredenzaBody className="sm:p-4 overflow-y-auto min-h-[300px]">
          {!showForm ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => setShowForm(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Registrar Cambio
                </Button>
              </div>

              {memberships.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                    <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sin historial registrado
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <TooltipProvider>
                    {sortedMemberships.map((membership) => {
                      const isBeingDeleted = isDeleting === membership.id;
                      const isCurrentMembership = !membership.end_date;
                      const reasonConfig =
                        REASON_CONFIG[membership.change_reason] ||
                        REASON_CONFIG[GroupChangeReason.OTRO];

                      return (
                        <div
                          key={membership.id}
                          className={`
                              group relative flex items-center gap-4 p-4 rounded-xl border bg-card transition-all duration-200
                              ${
                                isBeingDeleted
                                  ? "opacity-50 pointer-events-none"
                                  : "hover:border-primary/40 hover:shadow-sm"
                              }
                              ${isCurrentMembership ? "border-primary/30 bg-primary/5" : "border-border/60"}
                            `}
                        >
                          {isCurrentMembership && (
                            <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-primary" />
                          )}

                          <div className="relative flex-shrink-0 ml-1">
                            <div className="w-12 h-12 rounded-lg border bg-white p-1 flex items-center justify-center overflow-hidden">
                              {membership.parliamentary_group?.logo_url ? (
                                <Image
                                  src={membership.parliamentary_group.logo_url}
                                  alt={membership.parliamentary_group.name}
                                  width={48}
                                  height={48}
                                  className="object-contain w-full h-full"
                                />
                              ) : (
                                <span className="text-xs font-bold text-muted-foreground">
                                  S/L
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 pr-16">
                            <div className="flex flex-wrap items-baseline gap-2 mb-1.5">
                              <h4 className="font-semibold text-sm text-foreground leading-none">
                                {membership.parliamentary_group?.name}
                              </h4>
                              {membership.parliamentary_group?.acronym && (
                                <span className="text-xs font-medium text-muted-foreground">
                                  ({membership.parliamentary_group.acronym})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center flex-wrap gap-3 text-xs">
                              <Badge
                                variant="secondary"
                                className={`px-1.5 py-0 rounded text-[10px] font-medium uppercase border-0 ${reasonConfig.color}`}
                              >
                                {reasonConfig.label}
                              </Badge>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <span>{formatDate(membership.start_date)}</span>
                                <ArrowRight className="h-3 w-3 opacity-50" />
                                <span
                                  className={
                                    isCurrentMembership
                                      ? "font-medium text-primary"
                                      : ""
                                  }
                                >
                                  {membership.end_date
                                    ? formatDate(membership.end_date)
                                    : "Actualidad"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleEdit(membership)}
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                >
                                  <SquarePen className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDelete(membership.id)}
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                >
                                  {isDeleting === membership.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Eliminar</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      );
                    })}
                  </TooltipProvider>
                </div>
              )}
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="parliamentary_group_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grupo Parlamentario</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Seleccionar bancada..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          {parliamentaryGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha Inicio</FormLabel>
                        <CalendarDatePicker
                          date={{
                            from: field.value
                              ? new Date(field.value)
                              : undefined,
                            to: field.value ? new Date(field.value) : undefined,
                          }}
                          onDateSelect={({ from }) => {
                            if (from)
                              form.setValue("start_date", from.toISOString());
                          }}
                          variant="outline"
                          numberOfMonths={1}
                          withoutdropdown
                          closeOnSelect
                          yearsRange={10}
                          className="w-full"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha Fin</FormLabel>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <CalendarDatePicker
                              date={{
                                from: field.value
                                  ? new Date(field.value)
                                  : undefined,
                                to: field.value
                                  ? new Date(field.value)
                                  : undefined,
                              }}
                              onDateSelect={({ from }) => {
                                field.onChange(
                                  from ? from.toISOString() : null,
                                );
                              }}
                              variant="outline"
                              numberOfMonths={1}
                              withoutdropdown
                              closeOnSelect
                              yearsRange={10}
                              className="w-full"
                            />
                          </div>
                          {field.value && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => field.onChange(null)}
                              className="shrink-0 text-muted-foreground hover:text-foreground"
                              title="Limpiar fecha"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="change_reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo del cambio</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(REASON_CONFIG).map(
                              ([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  {config.label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="source_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuente (Opcional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <ExternalLink className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              className="pl-9 h-10"
                              placeholder="https://..."
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

                <div className="flex items-center justify-end gap-3 pt-4 border-t mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : editingMembership ? (
                      "Actualizar Cambio"
                    ) : (
                      "Registrar Cambio"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
