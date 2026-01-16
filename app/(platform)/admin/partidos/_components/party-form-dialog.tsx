"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDatePicker } from "@/components/date-picker";
import { toast } from "sonner";
import {
  AlignLeft,
  BookOpen,
  CalendarIcon,
  ChevronDown,
  FileText,
  Link2,
  ListChecks,
  Loader2,
  LucideIcon,
  Palette,
  Plus,
  Tag,
  Target,
  Trash2,
  Type,
  X,
} from "lucide-react";

import { createPoliticalParty, updatePoliticalParty } from "../_lib/actions";
import {
  AdminPoliticalParty,
  CreatePartyRequest,
  UpdatePartyRequest,
} from "@/interfaces/party";
import {
  GovernmentPlanSummary,
  OrganizationType,
  PartyHistory,
  PartyLegalCase,
} from "@/interfaces/politics";
import {
  FinancingCategory,
  FinancingReport,
  FinancingStatus,
  FlowType,
  PartyFinancingBasic,
} from "@/interfaces/party-financing";

const goalSchema = z.object({
  indicator: z.string(),
});

const governmentPlanSummarySchema = z.object({
  title: z.string(),
  summary: z.string(),
  tags: z.array(z.string()),
  proposals: z.array(z.string()),
  goals: z.array(goalSchema),
});

const partyHistorySchema = z.object({
  date: z.string(),
  event: z.string(),
  source: z.string().nullable(),
  source_url: z.string().nullable(),
});

const partyLegalCaseSchema = z.object({
  case_type: z.string(),
  date: z.string(),
  description: z.string(),
  status: z.string(),
  source_name: z.string(),
  source_url: z.string().nullable(),
});

const partyFinancingBasicSchema = z.object({
  id: z.string(),
  financing_report_id: z.string(),
  category: z.enum(FinancingCategory),
  flow_type: z.enum(FlowType),
  amount: z.number(),
  currency: z.string(),
  notes: z.string().nullable(),
});

const financingReportSchema = z.object({
  id: z.string(),
  party_id: z.string(),
  report_name: z.string(),
  filing_status: z.enum(FinancingStatus),
  source_name: z.string(),
  source_url: z.string().nullable(),
  report_date: z.string(),
  period_start: z.string(),
  period_end: z.string(),
  created_at: z.string(),
  transactions: z.array(partyFinancingBasicSchema),
});

// Schema principal del formulario
const partySchema = z.object({
  id: z.string(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  acronym: z.string().optional(),
  type: z.enum(OrganizationType),
  active: z.boolean(),

  // Identidad Visual
  color_hex: z
    .string()
    .regex(/^#([0-9A-F]{3}){1,2}$/i, "Color inválido")
    .optional(),
  logo_url: z.string().url("URL inválida").optional().or(z.literal("")),
  slogan: z.string().optional(),

  // Datos Fundacionales
  founder: z.string().optional(),
  foundation_date: z.string().nullable(),
  ideology: z.string().nullable(),
  party_president: z.string().optional(),
  purpose: z.string().optional(),

  // Contacto
  main_office: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().refine(
    (val) => {
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "URL inválida" },
  ),

  // Redes Sociales
  facebook_url: z.string().optional(),
  twitter_url: z.string().optional(),
  youtube_url: z.string().optional(),
  tiktok_url: z.string().optional(),

  // Datos Numéricos
  total_afiliates: z.number().int().nonnegative().optional(),

  // Archivos
  government_plan_url: z.string().url().optional().or(z.literal("")),
  government_audio_url: z.string().url().optional().or(z.literal("")),

  // Campos JSON - Arrays requeridos (no opcionales)
  government_plan_summary: z.array(governmentPlanSummarySchema),
  party_timeline: z.array(partyHistorySchema),
  legal_cases: z.array(partyLegalCaseSchema),
  financing_reports: z.array(financingReportSchema),
});
type PartyFormValues = z.infer<typeof partySchema>;

interface PartyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  initialData?: Partial<AdminPoliticalParty>;
}

const FloatingLabelWrapper = ({
  label,
  children,
  icon: Icon,
}: {
  label: string;
  children: React.ReactNode;
  icon?: LucideIcon;
}) => (
  <div className="relative group pt-1">
    <label className="absolute -top-2 left-3 bg-background px-1 text-xs font-semibold text-primary/80 z-10 flex items-center gap-1.5 transition-colors group-hover:text-primary group-focus-within:text-primary">
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </label>
    {children}
  </div>
);

function IdeologyInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const ideologies = useMemo(
    () => (value ? value.split(",").filter(Boolean) : []),
    [value],
  );

  const [inputs, setInputs] = useState<string[]>(
    ideologies.length > 0 ? ideologies : [""],
  );

  useEffect(() => {
    const filtered = inputs.filter((v) => v.trim());
    onChange(filtered.join(","));
  }, [inputs, onChange]);

  const addInput = useCallback(() => {
    if (inputs.length < 3) {
      setInputs((prev) => [...prev, ""]);
    }
  }, [inputs.length]);

  const removeInput = useCallback((index: number) => {
    setInputs((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateInput = useCallback((index: number, value: string) => {
    setInputs((prev) => {
      const newInputs = [...prev];
      newInputs[index] = value;
      return newInputs;
    });
  }, []);

  return (
    <div className="space-y-2">
      {inputs.map((input, index) => (
        <div key={index} className="flex gap-2">
          <Input
            placeholder={`Ideología ${index + 1}`}
            value={input}
            onChange={(e) => updateInput(index, e.target.value)}
            maxLength={50}
          />
          {inputs.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeInput(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      {inputs.length < 3 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addInput}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar ideología
        </Button>
      )}
    </div>
  );
}

function TimelineManager({
  value,
  onChange,
}: {
  value: PartyHistory[];
  onChange: (value: PartyHistory[]) => void;
}) {
  const [items, setItems] = useState<PartyHistory[]>(value || []);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    onChange(items);
  }, [items, onChange]);

  const addItem = useCallback(() => {
    setItems((prev) => {
      const newItems = [
        ...prev,
        { date: "", event: "", source: null, source_url: null },
      ];
      setActiveIndex(newItems.length - 1);
      return newItems;
    });
  }, []);

  const removeItem = useCallback(
    (index: number) => {
      setItems((prev) => prev.filter((_, i) => i !== index));
      if (activeIndex === index) setActiveIndex(null);
      else if (activeIndex !== null && activeIndex > index)
        setActiveIndex(activeIndex - 1);
    },
    [activeIndex],
  );

  const updateItem = useCallback(
    (index: number, field: keyof PartyHistory, value: string | null) => {
      setItems((prev) => {
        const newItems = [...prev];
        newItems[index] = { ...newItems[index], [field]: value };
        return newItems;
      });
    },
    [],
  );

  const toggleExpand = (index: number) => {
    setActiveIndex((current) => (current === index ? null : index));
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isExpanded = activeIndex === index;

        return (
          <div
            key={index}
            className={`
              group relative bg-card border rounded-xl transition-all duration-300 ease-in-out
              ${
                isExpanded
                  ? "border-primary/50 shadow-md ring-1 ring-primary/10"
                  : "border-border hover:border-primary/30 hover:shadow-sm"
              }
            `}
          >
            <div
              onClick={() => toggleExpand(index)}
              className="p-5 cursor-pointer space-y-4"
            >
              <div className="flex gap-4 items-start">
                {/* Indicador Numérico */}
                <div
                  className={`
                  flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold shrink-0 transition-colors mt-1
                  ${
                    isExpanded
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                  }
                `}
                >
                  {index + 1}
                </div>

                {/* Fecha (Elemento Principal) */}
                <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                  <FloatingLabelWrapper
                    label="Fecha del Evento"
                    icon={CalendarIcon}
                  >
                    <div className="w-full">
                      <CalendarDatePicker
                        date={{
                          from: item.date ? new Date(item.date) : undefined,
                          to: item.date ? new Date(item.date) : undefined,
                        }}
                        onDateSelect={({ from }) => {
                          if (from)
                            updateItem(
                              index,
                              "date",
                              from.toISOString().split("T")[0],
                            );
                        }}
                        variant="outline"
                        numberOfMonths={1}
                        yearsRange={100}
                        closeOnSelect
                        className="w-[200px] justify-start text-left font-normal"
                      />
                    </div>
                  </FloatingLabelWrapper>
                </div>

                {/* Acciones */}
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(index);
                    }}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div
                    className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 pointer-events-none"
                    >
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </div>

              {!isExpanded && item.event && (
                <p className="text-sm text-muted-foreground pl-12 line-clamp-1">
                  {item.event}
                </p>
              )}
            </div>

            {isExpanded && (
              <div className="px-5 pb-6 space-y-5 border-t border-border/40 mt-1 pt-6 animate-in slide-in-from-top-2 fade-in duration-300">
                {/* Descripción */}
                <div onClick={(e) => e.stopPropagation()}>
                  <FloatingLabelWrapper
                    label="Descripción Detallada"
                    icon={FileText}
                  >
                    <Textarea
                      placeholder="Describe qué sucedió en este evento..."
                      value={item.event}
                      onChange={(e) =>
                        updateItem(index, "event", e.target.value)
                      }
                      rows={3}
                      className="resize-none"
                    />
                  </FloatingLabelWrapper>
                </div>

                {/* Fuentes */}
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FloatingLabelWrapper
                    label="Nombre de Fuente"
                    icon={BookOpen}
                  >
                    <Input
                      placeholder="Ej: Diario El Peruano"
                      value={item.source || ""}
                      onChange={(e) =>
                        updateItem(index, "source", e.target.value || null)
                      }
                    />
                  </FloatingLabelWrapper>

                  <FloatingLabelWrapper label="URL de Referencia" icon={Link2}>
                    <Input
                      placeholder="https://..."
                      value={item.source_url || ""}
                      onChange={(e) =>
                        updateItem(index, "source_url", e.target.value || null)
                      }
                    />
                  </FloatingLabelWrapper>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={addItem}
        className="w-full h-12 border-dashed border-2 bg-muted/20 hover:bg-primary/5 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all gap-2"
      >
        <Plus className="h-4 w-4" />
        Agregar evento histórico
      </Button>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
          <div className="p-3 bg-muted rounded-full mb-3">
            <CalendarIcon className="h-6 w-6 opacity-50" />
          </div>
          <p className="text-sm font-medium">No hay eventos registrados</p>
          <p className="text-xs opacity-70">
            Añade hitos importantes en la historia del partido
          </p>
        </div>
      )}
    </div>
  );
}

function LegalCasesManager({
  value,
  onChange,
}: {
  value: PartyLegalCase[];
  onChange: (value: PartyLegalCase[]) => void;
}) {
  const [items, setItems] = useState<PartyLegalCase[]>(value || []);

  useEffect(() => {
    onChange(items);
  }, [items, onChange]);

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        case_type: "",
        date: "",
        description: "",
        status: "",
        source_name: "",
        source_url: null,
      },
    ]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback(
    (index: number, field: keyof PartyLegalCase, value: string | null) => {
      setItems((prev) => {
        const newItems = [...prev];
        newItems[index] = { ...newItems[index], [field]: value };
        return newItems;
      });
    },
    [],
  );

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-sm">Caso {index + 1}</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Tipo de caso"
              value={item.case_type}
              onChange={(e) => updateItem(index, "case_type", e.target.value)}
            />
            <Input
              placeholder="Fecha (YYYY-MM-DD)"
              value={item.date}
              onChange={(e) => updateItem(index, "date", e.target.value)}
            />
          </div>
          <Textarea
            placeholder="Descripción"
            value={item.description}
            onChange={(e) => updateItem(index, "description", e.target.value)}
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Estado"
              value={item.status}
              onChange={(e) => updateItem(index, "status", e.target.value)}
            />
            <Input
              placeholder="Nombre de fuente"
              value={item.source_name}
              onChange={(e) => updateItem(index, "source_name", e.target.value)}
            />
          </div>
          <Input
            placeholder="URL de la fuente"
            value={item.source_url || ""}
            onChange={(e) =>
              updateItem(index, "source_url", e.target.value || null)
            }
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={addItem}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar caso legal
      </Button>
    </div>
  );
}

function TagInput({
  value,
  onChange,
  label,
  placeholder,
  icon: Icon,
  color = "primary",
}: {
  value: string[];
  onChange: (value: string[]) => void;
  label: string;
  placeholder: string;
  icon?: LucideIcon;
  color?: "primary" | "success" | "blue";
}) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInputValue("");
    }
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const colorClasses = {
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-green-500/10 text-green-700 border-green-500/20",
    blue: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  };

  return (
    <div className="space-y-3">
      <FloatingLabelWrapper label={label} icon={Icon}>
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addTag}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={addTag}
            disabled={!inputValue.trim()}
            size="icon"
            variant="outline"
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </FloatingLabelWrapper>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {value.map((item, index) => (
            <span
              key={index}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border animate-in zoom-in-95 duration-200 ${colorClasses[color]}`}
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ProposalInput({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  label: string;
  placeholder: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const addProposal = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      onChange([...value, trimmed]);
      setInputValue("");
    }
  };

  const removeProposal = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      addProposal();
    }
  };

  return (
    <div className="space-y-3">
      <FloatingLabelWrapper label={label} icon={ListChecks}>
        <div className="space-y-2">
          <div className="relative">
            <Textarea
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              className="resize-none pr-10"
            />
            <Button
              type="button"
              onClick={addProposal}
              disabled={!inputValue.trim()}
              size="sm"
              variant="ghost"
              className="absolute bottom-2 right-2 h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {/* <p className="text-[10px] text-muted-foreground text-right px-1">
            Ctrl + Enter para agregar
          </p> */}
        </div>
      </FloatingLabelWrapper>

      {value.length > 0 && (
        <div className="space-y-2 px-1">
          {value.map((proposal, index) => (
            <div
              key={index}
              className="flex items-start gap-3 px-2 py-1 bg-muted/40 rounded-lg border border-border/50 group hover:border-primary/30 hover:bg-muted/60 transition-all"
            >
              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
                {index + 1}
              </span>
              <p className="flex-1 text-sm text-foreground/90 leading-snug">
                {proposal}
              </p>
              <button
                type="button"
                onClick={() => removeProposal(index)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GovernmentPlanManager({
  value,
  onChange,
}: {
  value: GovernmentPlanSummary[];
  onChange: (value: GovernmentPlanSummary[]) => void;
}) {
  const [items, setItems] = useState<GovernmentPlanSummary[]>(value || []);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    onChange(items);
  }, [items, onChange]);

  const addItem = useCallback(() => {
    setItems((prev) => {
      const newItems = [
        ...prev,
        { title: "", summary: "", tags: [], proposals: [], goals: [] },
      ];
      // Expandimos el nuevo item y cerramos los demás
      setActiveIndex(newItems.length - 1);
      return newItems;
    });
  }, []);

  const removeItem = useCallback(
    (index: number) => {
      setItems((prev) => prev.filter((_, i) => i !== index));
      if (activeIndex === index) setActiveIndex(null);
      else if (activeIndex !== null && activeIndex > index)
        setActiveIndex(activeIndex - 1);
    },
    [activeIndex],
  );

  const updateItem = useCallback(
    (
      index: number,
      field: keyof GovernmentPlanSummary,
      value: string | string[] | Array<{ indicator: string }>,
    ) => {
      setItems((prev) => {
        const newItems = [...prev];
        newItems[index] = { ...newItems[index], [field]: value };
        return newItems;
      });
    },
    [],
  );

  // Solo uno puede estar abierto
  const toggleExpand = (index: number) => {
    setActiveIndex((current) => (current === index ? null : index));
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isExpanded = activeIndex === index;

        return (
          <div
            key={index}
            className={`
              group relative bg-card border rounded-xl transition-all duration-300 ease-in-out
              ${
                isExpanded
                  ? "border-primary/50 shadow-md ring-1 ring-primary/10"
                  : "border-border hover:border-primary/30 hover:shadow-sm"
              }
            `}
          >
            <div
              onClick={() => toggleExpand(index)}
              className="p-5 cursor-pointer space-y-5"
            >
              {/* Título y Acciones */}
              <div className="flex gap-4 items-start">
                {/* Número indicador */}
                <div
                  className={`
                  flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold shrink-0 transition-colors mt-1
                  ${
                    isExpanded
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                  }
                `}
                >
                  {index + 1}
                </div>

                {/* Input Título (Floating) */}
                <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                  <FloatingLabelWrapper label="Título del Plan" icon={Type}>
                    <Input
                      placeholder="Ej: Reforma Educativa Integral"
                      value={item.title}
                      onChange={(e) =>
                        updateItem(index, "title", e.target.value)
                      }
                      className="font-medium h-10"
                    />
                  </FloatingLabelWrapper>
                </div>

                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(index);
                    }}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div
                    className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 pointer-events-none"
                    >
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Resumen (Siempre visible, con Floating) */}
              <div onClick={(e) => e.stopPropagation()}>
                <FloatingLabelWrapper
                  label="Resumen Ejecutivo"
                  icon={AlignLeft}
                >
                  <Textarea
                    placeholder="Describe brevemente el objetivo general..."
                    value={item.summary}
                    onChange={(e) =>
                      updateItem(index, "summary", e.target.value)
                    }
                    rows={2}
                    className="resize-none min-h-[60px]"
                  />
                </FloatingLabelWrapper>
              </div>
            </div>

            {isExpanded && (
              <div className="px-5 pb-6 space-y-5 border-t border-border/40 mt-1 pt-6 animate-in slide-in-from-top-2 fade-in duration-300">
                {/* Etiquetas */}
                <div onClick={(e) => e.stopPropagation()}>
                  <TagInput
                    label="Etiquetas / Ejes Temáticos"
                    value={item.tags}
                    onChange={(tags) => updateItem(index, "tags", tags)}
                    placeholder="Escribe y presiona enter..."
                    icon={Tag}
                    color="primary"
                  />
                </div>

                {/* Propuestas y Metas */}
                <div
                  className="grid grid-cols-1 gap-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Propuestas */}
                  <ProposalInput
                    label="Propuestas Específicas"
                    value={item.proposals}
                    onChange={(proposals) =>
                      updateItem(index, "proposals", proposals)
                    }
                    placeholder="Detalla una propuesta..."
                  />

                  {/* Metas e Indicadores */}
                  <TagInput
                    label="Metas e Indicadores"
                    value={item.goals.map((g) => g.indicator)}
                    onChange={(goals) =>
                      updateItem(
                        index,
                        "goals",
                        goals.map((i) => ({ indicator: i })),
                      )
                    }
                    placeholder="Ej: Reducir anemia 10%..."
                    icon={Target}
                    color="success"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={addItem}
        className="w-full h-12 border-dashed border-2 bg-muted/20 hover:bg-primary/5 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all gap-2"
      >
        <Plus className="h-4 w-4" />
        Agregar nuevo Plan de Gobierno
      </Button>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
          <div className="p-3 bg-muted rounded-full mb-3">
            <ListChecks className="h-6 w-6 opacity-50" />
          </div>
          <p className="text-sm font-medium">No hay planes registrados</p>
          <p className="text-xs opacity-70">
            Comienza agregando el primer eje temático
          </p>
        </div>
      )}
    </div>
  );
}

function FinancingReportsManager({
  value,
  onChange,
}: {
  value: FinancingReport[];
  onChange: (value: FinancingReport[]) => void;
}) {
  const [reports, setReports] = useState<FinancingReport[]>(value || []);
  const [expandedReportIndex, setExpandedReportIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    onChange(reports);
  }, [reports, onChange]);

  const addReport = useCallback(() => {
    setReports((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        party_id: "",
        report_name: "",
        filing_status: FinancingStatus.DENTRO_DEL_PLAZO,
        source_name: "",
        source_url: null,
        report_date: new Date().toISOString(),
        period_start: new Date().toISOString(),
        period_end: new Date().toISOString(),
        created_at: new Date().toISOString(),
        transactions: [],
      },
    ]);
  }, []);

  const removeReport = useCallback((index: number) => {
    setReports((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateReport = useCallback(
    (
      index: number,
      field: keyof FinancingReport,
      value: string | FinancingStatus | null,
    ) => {
      setReports((prev) => {
        const newReports = [...prev];
        newReports[index] = { ...newReports[index], [field]: value };
        return newReports;
      });
    },
    [],
  );

  const addFinancingItem = useCallback((reportIndex: number) => {
    setReports((prev) => {
      const newReports = [...prev];
      if (!newReports[reportIndex].transactions) {
        newReports[reportIndex].transactions = [];
      }
      newReports[reportIndex].transactions!.push({
        id: `temp-item-${Date.now()}`,
        financing_report_id: newReports[reportIndex].id,
        category: FinancingCategory.INGRESO,
        flow_type: FlowType.I_FPD,
        amount: 0,
        currency: "PEN",
        notes: null,
      });
      return newReports;
    });
  }, []);

  const removeFinancingItem = useCallback(
    (reportIndex: number, itemIndex: number) => {
      setReports((prev) => {
        const newReports = [...prev];
        newReports[reportIndex].transactions = newReports[
          reportIndex
        ].transactions?.filter((_, i) => i !== itemIndex);
        return newReports;
      });
    },
    [],
  );

  const updateFinancingItem = useCallback(
    (
      reportIndex: number,
      itemIndex: number,
      field: keyof PartyFinancingBasic,
      value: FlowType | FinancingCategory | number | string | null,
    ) => {
      setReports((prev) => {
        const newReports = [...prev];
        if (newReports[reportIndex].transactions) {
          newReports[reportIndex].transactions![itemIndex] = {
            ...newReports[reportIndex].transactions![itemIndex],
            [field]: value,
          };
        }
        return newReports;
      });
    },
    [],
  );

  return (
    <div className="space-y-4">
      {reports.map((report, reportIndex) => (
        <div key={reportIndex} className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 p-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 grid grid-cols-2 gap-3">
                <Input
                  placeholder="Nombre del reporte"
                  value={report.report_name}
                  onChange={(e) =>
                    updateReport(reportIndex, "report_name", e.target.value)
                  }
                />
                <Select
                  value={report.filing_status}
                  onValueChange={(value: FinancingStatus) =>
                    updateReport(reportIndex, "filing_status", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(FinancingStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setExpandedReportIndex(
                      expandedReportIndex === reportIndex ? null : reportIndex,
                    )
                  }
                >
                  {expandedReportIndex === reportIndex
                    ? "Ocultar"
                    : "Ver Detalles"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeReport(reportIndex)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {expandedReportIndex === reportIndex && (
              <div className="mt-4 space-y-3 pt-3 border-t">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Nombre de fuente"
                    value={report.source_name}
                    onChange={(e) =>
                      updateReport(reportIndex, "source_name", e.target.value)
                    }
                  />
                  <Input
                    placeholder="URL de fuente"
                    value={report.source_url || ""}
                    onChange={(e) =>
                      updateReport(
                        reportIndex,
                        "source_url",
                        e.target.value || null,
                      )
                    }
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    type="date"
                    placeholder="Fecha de reporte"
                    value={report.report_date || ""}
                    onChange={(e) =>
                      updateReport(
                        reportIndex,
                        "report_date",
                        e.target.value || null,
                      )
                    }
                  />
                  <Input
                    type="date"
                    placeholder="Inicio de período"
                    value={report.period_start || ""}
                    onChange={(e) =>
                      updateReport(
                        reportIndex,
                        "period_start",
                        e.target.value || null,
                      )
                    }
                  />
                  <Input
                    type="date"
                    placeholder="Fin de período"
                    value={report.period_end || ""}
                    onChange={(e) =>
                      updateReport(
                        reportIndex,
                        "period_end",
                        e.target.value || null,
                      )
                    }
                  />
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h5 className="text-sm font-medium">
                      Items de Financiamiento
                    </h5>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addFinancingItem(reportIndex)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar Item
                    </Button>
                  </div>

                  {report.transactions && report.transactions.length > 0 ? (
                    <div className="space-y-2">
                      {report.transactions.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="bg-background border rounded p-3 space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-muted-foreground">
                              Item {itemIndex + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeFinancingItem(reportIndex, itemIndex)
                              }
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Select
                              value={item.flow_type ?? undefined}
                              onValueChange={(value: FlowType) =>
                                updateFinancingItem(
                                  reportIndex,
                                  itemIndex,
                                  "flow_type",
                                  value,
                                )
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(FlowType).map((flow) => (
                                  <SelectItem key={flow} value={flow}>
                                    {flow}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Select
                              value={item.category ?? undefined}
                              onValueChange={(value: FinancingCategory) =>
                                updateFinancingItem(
                                  reportIndex,
                                  itemIndex,
                                  "category",
                                  value,
                                )
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Categoría" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(FinancingCategory).map((cat) => (
                                  <SelectItem key={cat} value={cat}>
                                    {cat}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              placeholder="Monto"
                              className="h-8"
                              value={item.amount ?? undefined}
                              onChange={(e) =>
                                updateFinancingItem(
                                  reportIndex,
                                  itemIndex,
                                  "amount",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                            <Input
                              placeholder="Moneda"
                              className="h-8"
                              value={item.currency ?? undefined}
                              onChange={(e) =>
                                updateFinancingItem(
                                  reportIndex,
                                  itemIndex,
                                  "currency",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <Textarea
                            placeholder="Notas"
                            className="text-xs"
                            rows={2}
                            value={item.notes || ""}
                            onChange={(e) =>
                              updateFinancingItem(
                                reportIndex,
                                itemIndex,
                                "notes",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No hay items de financiamiento. Agrega uno para comenzar.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={addReport}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar reporte de financiamiento
      </Button>
    </div>
  );
}

export function PartyFormDialog({
  open,
  onOpenChange,
  mode = "create",
  initialData,
}: PartyFormDialogProps) {
  const router = useRouter();

  const defaultValues = useMemo<PartyFormValues>(() => {
    if (mode === "edit" && initialData) {
      return {
        ...initialData,
        id: initialData.id,
        acronym: initialData.acronym,
        color_hex: initialData.color_hex ?? "#000000",
        logo_url: initialData.logo_url ?? "",
        slogan: initialData.slogan ?? "",
        founder: initialData.founder ?? "",
        foundation_date: initialData.foundation_date ?? null,
        ideology: initialData.ideology ?? "",
        party_president: initialData.party_president ?? "",
        purpose: initialData.purpose ?? "",
        main_office: initialData.main_office ?? "",
        phone: initialData.phone ?? "",
        email: initialData.email ?? "",
        website: initialData.website ?? "",
        facebook_url: initialData.facebook_url ?? "",
        twitter_url: initialData.twitter_url ?? "",
        youtube_url: initialData.youtube_url ?? "",
        tiktok_url: initialData.tiktok_url ?? "",
        total_afiliates: initialData.total_afiliates ?? 0,
        government_plan_url: initialData.government_plan_url ?? "",
        government_audio_url: initialData.government_audio_url ?? "",
        type:
          (initialData.type as OrganizationType) ?? OrganizationType.PARTIDO,
        government_plan_summary: initialData.government_plan_summary ?? [],
        party_timeline: initialData.party_timeline ?? [],
        legal_cases: initialData.legal_cases ?? [],
        financing_reports:
          (initialData.financing_reports as FinancingReport[]) ?? [],
      } as PartyFormValues;
    }

    return {
      id: "",
      name: "",
      acronym: "",
      type: OrganizationType.PARTIDO,
      active: true,
      color_hex: "#000000",
      logo_url: "",
      slogan: "",
      founder: "",
      foundation_date: null,
      ideology: "",
      party_president: "",
      purpose: "",
      main_office: "",
      phone: "",
      email: "",
      website: "",
      facebook_url: "",
      twitter_url: "",
      youtube_url: "",
      tiktok_url: "",
      total_afiliates: 0,
      government_plan_url: "",
      government_audio_url: "",
      government_plan_summary: [],
      party_timeline: [],
      legal_cases: [],
      financing_reports: [],
    };
  }, [mode, initialData]);

  const form = useForm<PartyFormValues>({
    resolver: zodResolver(partySchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, defaultValues, form]);

  const onSubmit = useCallback(
    async (values: PartyFormValues) => {
      const isEditing = mode === "edit";
      const message = isEditing ? "actualizado" : "creado";

      const commonPayload = {
        name: values.name,
        type: values.type,
        active: values.active,
        acronym: values.acronym || null,

        color_hex: values.color_hex || null,
        logo_url: values.logo_url || null,
        slogan: values.slogan || null,

        founder: values.founder || null,
        foundation_date: values.foundation_date || null,
        ideology: values.ideology || null,
        party_president: values.party_president || null,
        purpose: values.purpose || null,

        main_office: values.main_office || null,
        phone: values.phone || null,
        email: values.email || null,
        website: values.website || null,

        facebook_url: values.facebook_url || null,
        twitter_url: values.twitter_url || null,
        youtube_url: values.youtube_url || null,
        tiktok_url: values.tiktok_url || null,

        total_afiliates: values.total_afiliates ?? null,

        government_plan_url: values.government_plan_url || null,
        government_audio_url: values.government_audio_url || null,

        government_plan_summary: values.government_plan_summary || [],
        party_timeline: values.party_timeline || [],
        legal_cases: values.legal_cases || [],
        financing_reports: values.financing_reports || [],
      };

      try {
        if (isEditing) {
          const updatePayload: UpdatePartyRequest = {
            ...commonPayload,
            id: values.id,
          };
          await updatePoliticalParty(updatePayload);
        } else {
          // PARA CREATE: No enviamos ID
          const createPayload: CreatePartyRequest = {
            ...commonPayload,
          };
          await createPoliticalParty(createPayload);
        }

        toast.success(`Partido ${message} exitosamente`);
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Error al ${message} el partido`;
        toast.error(errorMessage);
      }
    },
    [mode, onOpenChange, router],
  );
  // const onError = (errors: any) => {
  //   console.log("Form errors:", errors);
  // };

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-5xl min-h-[90vh] flex flex-col overflow-hidden">
        <CredenzaHeader>
          <CredenzaTitle>
            {mode === "create"
              ? "Registrar Organización Política"
              : "Editar Organización Política"}
          </CredenzaTitle>
          <CredenzaDescription>
            {mode === "create"
              ? "Ingresa los datos básicos para registrar un nuevo partido o alianza."
              : "Modifica la información general de la organización."}
          </CredenzaDescription>
        </CredenzaHeader>

        <CredenzaBody className="flex-1 overflow-y-auto pr-2">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 p-1"
            >
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="legal">Legales</TabsTrigger>
                  <TabsTrigger value="plan">Plan Gob.</TabsTrigger>
                  <TabsTrigger value="financing">Financ.</TabsTrigger>
                  <TabsTrigger value="contacto">Contacto</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6 mt-4">
                  {/* Identidad General */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="col-span-1 md:col-span-2">
                            <FormLabel>Nombre Oficial *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: Partido Morado"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="acronym"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Siglas</FormLabel>
                              <FormControl>
                                <Input placeholder="Ej: PM" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Tipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.values(OrganizationType).map(
                                    (type) => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ),
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="color_hex"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color Representativo</FormLabel>
                            <div className="flex gap-2">
                              <div
                                className="w-8 h-8 rounded border shrink-0"
                                style={{
                                  backgroundColor: field.value || "#ffffff",
                                }}
                              />
                              <FormControl>
                                <div className="relative w-full">
                                  <Input
                                    placeholder="#RRGGBB"
                                    {...field}
                                    className="pl-8 uppercase"
                                    maxLength={7}
                                  />
                                  <Palette className="w-4 h-4 absolute left-2.5 top-3 text-muted-foreground pointer-events-none" />
                                  <input
                                    type="color"
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    value={field.value || "#000000"}
                                    onChange={field.onChange}
                                  />
                                </div>
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="logo_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL del Logo</FormLabel>
                            <FormControl>
                              <Textarea placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="slogan"
                        render={({ field }) => (
                          <FormItem className="">
                            <FormLabel>Slogan</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Ej: Por un país mejor"
                                {...field}
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
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 md:col-span-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Organización Activa</FormLabel>
                              <FormDescription>
                                Determina si el partido aparece en las listas
                                públicas.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Fundación y Estructura */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground border-b pb-1">
                      Fundación y Estructura
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="founder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fundador</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="party_president"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Presidente Actual</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="foundation_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de Fundación</FormLabel>
                            <FormControl>
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
                                  if (from)
                                    form.setValue(
                                      "foundation_date",
                                      from.toISOString(),
                                    );
                                }}
                                variant="outline"
                                numberOfMonths={1}
                                withoutdropdown={true}
                                yearsRange={100}
                                closeOnSelect
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="total_afiliates"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Afiliados</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ideology"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Ideologías (máximo 3, cortas)</FormLabel>
                            <FormDescription>
                              Internamente se guardarán separadas por comas
                            </FormDescription>
                            <FormControl>
                              <IdeologyInput
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="purpose"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Propósito</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Recursos */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground border-b pb-1">
                      Recursos de Campaña
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="government_plan_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL Plan de Gobierno (PDF)</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="government_audio_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL Audio Resumen</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">
                        Línea de Tiempo del Partido
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Eventos históricos importantes del partido
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="party_timeline"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <TimelineManager
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="legal" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">Casos Legales</h3>
                      <p className="text-xs text-muted-foreground">
                        Registro de casos legales relacionados con el partido
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="legal_cases"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <LegalCasesManager
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="plan" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">
                        Resumen de Plan de Gobierno
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Detalles estructurados del plan de gobierno
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="government_plan_summary"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <GovernmentPlanManager
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="financing" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">
                        Reportes de Financiamiento
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Gestiona los reportes financieros del partido político
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="financing_reports"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <FinancingReportsManager
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="contacto" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground border-b pb-1">
                      Contacto y Presencia Digital
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sitio Web</FormLabel>
                            <FormControl>
                              <Input placeholder="www.partido.pe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Oficial</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="main_office"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Oficina Principal</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="md:col-span-2">
                        <h4 className="text-sm font-medium mb-3">
                          Redes Sociales
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <FormField
                            control={form.control}
                            name="facebook_url"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  Facebook URL
                                </FormLabel>
                                <FormControl>
                                  <Input className="h-8 text-xs" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="twitter_url"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  Twitter (X) URL
                                </FormLabel>
                                <FormControl>
                                  <Input className="h-8 text-xs" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="tiktok_url"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  TikTok URL
                                </FormLabel>
                                <FormControl>
                                  <Input className="h-8 text-xs" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="youtube_url"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  YouTube URL
                                </FormLabel>
                                <FormControl>
                                  <Input className="h-8 text-xs" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </CredenzaBody>

        <CredenzaFooter className="border-t pt-4 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={form.formState.isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {mode === "create" ? "Registrar Partido" : "Guardar Cambios"}
          </Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
