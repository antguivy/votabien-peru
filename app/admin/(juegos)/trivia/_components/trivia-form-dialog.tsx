"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  GripVertical,
  LinkIcon,
  Plus,
  Search,
  Trash2,
  HelpCircle,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
  ResponsiveSelectValue,
} from "@/components/ui/responsive-select";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { triviaSchema, type TriviaFormValues } from "../_lib/validation";
import { createTrivia, updateTrivia } from "../_lib/actions";
import { PersonSelector } from "@/components/person-selector";
import { PartySelector } from "@/components/party-selector";
import { Input } from "@/components/ui/input";
import {
  TriviaBasic,
  TriviaOption,
  TriviaTopic,
  TriviaAudience,
  OptionDisplayType,
} from "@/interfaces/trivia";
import { renderAudienceIcon } from "@/lib/trivia-icons";
import { PersonBasicInfo } from "@/interfaces/person";
import { PoliticalPartyBase } from "@/interfaces/political-party";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

interface SortableOptionProps {
  id: string;
  index: number;
  option: TriviaOption;
  isSelected: boolean;
  displayType: OptionDisplayType;
  onSelect: (value: string) => void;
  onRemove: () => void;
  onChangeName?: (val: string) => void;
}

function SortableOptionItem({
  id,
  index,
  option,
  isSelected,
  displayType,
  onSelect,
  onRemove,
  onChangeName,
}: SortableOptionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  const isTextOnly =
    displayType === "TEXT_ONLY" || displayType === "TRUE_FALSE";

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <Card
        className={`relative flex flex-row items-center p-2.5 transition-all ${
          isSelected
            ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-sm"
            : "bg-muted/20 border-border/40 hover:bg-muted/40"
        }`}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab p-1.5 hover:bg-muted rounded mr-1 text-muted-foreground shrink-0"
        >
          <GripVertical size={16} />
        </div>

        {/* Letter Badge */}
        <div className="mr-2.5 flex-shrink-0">
          <Badge
            variant="outline"
            className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-black ${
              isSelected
                ? "bg-emerald-500 text-white border-emerald-600"
                : "bg-background text-muted-foreground"
            }`}
          >
            {OPTION_LABELS[index] || index + 1}
          </Badge>
        </div>

        {/* Radio selector for correct answer */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <FormControl>
            <RadioGroupItem
              value={option.option_id}
              id={`rb-${option.option_id}`}
              className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 border-muted-foreground/40"
              onClick={() => onSelect(option.option_id)}
            />
          </FormControl>

          {!isTextOnly && (
            <Avatar className="h-8 w-8 border bg-white flex-shrink-0">
              <AvatarImage
                src={option.image_url || ""}
                className="object-contain"
              />
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
          )}

          {isTextOnly ? (
            <div className="flex-1">
              <Input
                value={option.name}
                onChange={(e) => onChangeName?.(e.target.value)}
                placeholder={`Texto de la opción ${OPTION_LABELS[index] || ""}`}
                className="h-8 text-xs font-medium"
              />
            </div>
          ) : (
            <Label
              htmlFor={`rb-${option.option_id}`}
              className="font-medium cursor-pointer text-sm truncate flex-1"
            >
              {option.name}
            </Label>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
            onClick={onRemove}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

interface TriviaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  initialData?: TriviaBasic;
  nextOrderIndex?: number;
  topics?: TriviaTopic[];
  audiences?: TriviaAudience[];
}

const defaultFormValues: TriviaFormValues = {
  quote: "",
  title: "",
  category: "CONSTITUCION",
  difficulty: "FACIL",
  display_type: "TEXT_ONLY",
  topic_id: "",
  correct_answer_id: "",
  options: [
    { option_id: "opt_1", name: "" },
    { option_id: "opt_2", name: "" },
    { option_id: "opt_3", name: "" },
    { option_id: "opt_4", name: "" },
  ],
  global_index: 1,
  explanation: "",
  source_url: "",
  image_url: "",
  audience_ids: [],
  is_published: true,
};

export function TriviaFormDialog({
  open,
  onOpenChange,
  mode = "create",
  initialData,
  nextOrderIndex,
  topics = [],
  audiences = [],
}: TriviaFormDialogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const [globalSearch, setGlobalSearch] = useState("");
  const form = useForm({
    resolver: zodResolver(triviaSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const { fields, append, remove, replace, move, update } = useFieldArray({
    control: form.control,
    name: "options",
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const displayType = form.watch("display_type");
  const correctAnswerId = form.watch("correct_answer_id");
  const selectedAudiences = form.watch("audience_ids") || [];
  const formQuote = form.watch("quote");
  const formCategory = form.watch("category");
  const formExplanation = form.watch("explanation");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (open) {
      setActiveTab("general");

      if (mode === "edit" && initialData) {
        const optionsWithFormId = (initialData.options || []).map((opt, i) => ({
          option_id: opt.option_id || `opt_${i + 1}`,
          name: opt.name,
          subtitle: opt.subtitle || null,
          image_url: opt.image_url || null,
        }));

        const initialAudienceIds =
          initialData.audiences?.map((a) => a.id) || [];

        form.reset({
          id: String(initialData.id),
          quote: initialData.quote,
          title: initialData.title || "",
          category: initialData.category,
          difficulty: initialData.difficulty,
          display_type: initialData.display_type || "TEXT_ONLY",
          topic_id: initialData.topic_id || "",
          correct_answer_id: initialData.correct_answer_id || "",
          options: optionsWithFormId,
          global_index: initialData.global_index,
          explanation: initialData.explanation || "",
          source_url: initialData.source_url || "",
          image_url: initialData.image_url || "",
          audience_ids: initialAudienceIds,
          is_published: initialData.is_published ?? true,
          person_id: initialData.person_id || null,
          political_party_id: initialData.political_party_id || null,
        });
      } else {
        const firstTopicId = topics.length > 0 ? topics[0].id : "";
        form.reset({
          ...defaultFormValues,
          topic_id: firstTopicId,
          global_index: nextOrderIndex || 1,
          audience_ids: audiences.map((a) => a.id),
        });
      }
    }
  }, [open, mode, initialData, form, nextOrderIndex, topics, audiences]);

  const handleDisplayTypeChange = (newType: OptionDisplayType) => {
    form.setValue("display_type", newType);
    form.setValue("correct_answer_id", "");

    if (newType === "TRUE_FALSE") {
      replace([
        { option_id: "opt_tf_true", name: "Verdadero" },
        { option_id: "opt_tf_false", name: "Falso" },
      ]);
      form.setValue("correct_answer_id", "opt_tf_true");
    } else if (newType === "TEXT_ONLY") {
      replace([
        { option_id: "opt_1", name: "" },
        { option_id: "opt_2", name: "" },
        { option_id: "opt_3", name: "" },
        { option_id: "opt_4", name: "" },
      ]);
    } else {
      replace([]);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      move(oldIndex, newIndex);
    }
  };

  const handleAddPersonOption = (person: PersonBasicInfo) => {
    if (!person) return;
    const currentOptions = form.getValues("options");
    if (currentOptions.some((opt) => opt.option_id === person.id)) {
      toast.error("Esta persona ya fue agregada");
      return;
    }
    if (currentOptions.length >= 4) {
      toast.error("Máximo 4 opciones");
      return;
    }
    append({
      option_id: person.id,
      name: person.fullname,
      image_url: person.image_candidate_url,
    });
  };

  const handleAddPartyOption = (party: PoliticalPartyBase) => {
    if (!party) return;
    const currentOptions = form.getValues("options");
    if (currentOptions.some((opt) => opt.option_id === party.id)) {
      toast.error("Este partido ya fue agregado");
      return;
    }
    if (currentOptions.length >= 4) {
      toast.error("Máximo 4 opciones");
      return;
    }
    append({
      option_id: party.id,
      name: party.name,
      image_url: party.logo_url,
    });
  };

  const handleAddCustomTextOption = () => {
    if (fields.length >= 4) {
      toast.error("Máximo 4 opciones");
      return;
    }
    const nextId = `opt_${Date.now()}`;
    append({
      option_id: nextId,
      name: "",
    });
  };

  const onSubmit = async (values: TriviaFormValues) => {
    const isEditing = mode === "edit";
    const promise = isEditing
      ? updateTrivia(initialData!.id, values)
      : createTrivia(values);

    toast.promise(promise, {
      loading: isEditing ? "Actualizando pregunta..." : "Creando pregunta...",
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
      <CredenzaContent
        noScroll
        className="sm:max-w-3xl p-0 overflow-hidden flex flex-col h-[90dvh] max-h-[90dvh] sm:h-[86vh] sm:max-h-[86vh] rounded-2xl border bg-background shadow-2xl"
      >
        <CredenzaHeader className="px-4 sm:px-6 py-3 border-b bg-muted/20 shrink-0">
          <CredenzaTitle className="text-base sm:text-lg font-bold">
            {mode === "edit"
              ? "Editar Pregunta de Trivia"
              : "Nueva Pregunta de Trivia"}
          </CredenzaTitle>
        </CredenzaHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            {/* Tabs fijas arriba */}
            <div className="px-4 sm:px-6 pt-3 pb-2 border-b bg-background shrink-0">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3 h-9 p-1">
                  <TabsTrigger
                    value="general"
                    className="text-xs px-2 truncate"
                  >
                    1. Datos
                  </TabsTrigger>
                  <TabsTrigger
                    value="options"
                    className="text-xs px-2 truncate"
                  >
                    2. Alternativas
                    <Badge
                      variant="secondary"
                      className="ml-1 px-1.5 py-0 h-4 text-[9px] font-bold"
                    >
                      {fields.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    className="text-xs px-2 truncate flex items-center gap-1"
                  >
                    <Eye size={12} className="shrink-0" /> 3. Preview
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <CredenzaBody className="flex-1 overflow-y-auto px-4 sm:px-6 py-3.5 space-y-4 min-h-0">
              {/* --- TAB 1: GENERAL --- */}
              {activeTab === "general" && (
                <div className="space-y-4 py-2 animate-in fade-in duration-200">
                  {/* Pregunta */}
                  <FormField
                    control={form.control}
                    name="quote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs">
                          Enunciado de la pregunta *
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ej: ¿Qué organismo ratifica y nombra a los jueces en el Perú?"
                            className="resize-none h-20 text-sm leading-relaxed"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Fila: Tema y Categoría */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="topic_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs">
                            Eje temático
                          </FormLabel>
                          <ResponsiveSelect
                            title="Seleccionar Eje Temático"
                            onValueChange={field.onChange}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <ResponsiveSelectTrigger className="text-xs">
                                <ResponsiveSelectValue placeholder="Seleccionar tema..." />
                              </ResponsiveSelectTrigger>
                            </FormControl>
                            <ResponsiveSelectContent>
                              {topics.map((top) => (
                                <ResponsiveSelectItem
                                  key={top.id}
                                  value={top.id}
                                >
                                  {top.title}
                                </ResponsiveSelectItem>
                              ))}
                            </ResponsiveSelectContent>
                          </ResponsiveSelect>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs">
                            Categoría
                          </FormLabel>
                          <ResponsiveSelect
                            title="Seleccionar Categoría"
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <ResponsiveSelectTrigger className="text-xs">
                                <ResponsiveSelectValue />
                              </ResponsiveSelectTrigger>
                            </FormControl>
                            <ResponsiveSelectContent>
                              <ResponsiveSelectItem value="CONSTITUCION">
                                Constitución
                              </ResponsiveSelectItem>
                              <ResponsiveSelectItem value="PODERES">
                                Poderes del Estado
                              </ResponsiveSelectItem>
                              <ResponsiveSelectItem value="DERECHOS">
                                Derechos y Deberes
                              </ResponsiveSelectItem>
                              <ResponsiveSelectItem value="PROPUESTA">
                                Propuestas
                              </ResponsiveSelectItem>
                              <ResponsiveSelectItem value="POLEMICO">
                                Frases y Coyuntura
                              </ResponsiveSelectItem>
                              <ResponsiveSelectItem value="HISTORICO">
                                Historia Electoral
                              </ResponsiveSelectItem>
                              <ResponsiveSelectItem value="CORRUPCION">
                                Fiscalización
                              </ResponsiveSelectItem>
                            </ResponsiveSelectContent>
                          </ResponsiveSelect>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Fila: Dificultad, Tipo de Presentación y Orden */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs">
                            Dificultad
                          </FormLabel>
                          <ResponsiveSelect
                            title="Nivel de Dificultad"
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <ResponsiveSelectTrigger className="text-xs">
                                <ResponsiveSelectValue />
                              </ResponsiveSelectTrigger>
                            </FormControl>
                            <ResponsiveSelectContent>
                              <ResponsiveSelectItem value="FACIL">
                                Fácil
                              </ResponsiveSelectItem>
                              <ResponsiveSelectItem value="MEDIO">
                                Medio
                              </ResponsiveSelectItem>
                              <ResponsiveSelectItem value="DIFICIL">
                                Difícil
                              </ResponsiveSelectItem>
                            </ResponsiveSelectContent>
                          </ResponsiveSelect>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="display_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs">
                            Tipo de alternativas
                          </FormLabel>
                          <ResponsiveSelect
                            title="Tipo de Alternativas"
                            onValueChange={(val) =>
                              handleDisplayTypeChange(val as OptionDisplayType)
                            }
                            value={field.value}
                          >
                            <FormControl>
                              <ResponsiveSelectTrigger className="text-xs">
                                <ResponsiveSelectValue />
                              </ResponsiveSelectTrigger>
                            </FormControl>
                            <ResponsiveSelectContent>
                              <ResponsiveSelectItem value="TEXT_ONLY">
                                Texto (Educación Cívica)
                              </ResponsiveSelectItem>
                              <ResponsiveSelectItem value="TRUE_FALSE">
                                Verdadero / Falso
                              </ResponsiveSelectItem>
                              <ResponsiveSelectItem value="PERSON">
                                Candidato o figura pública
                              </ResponsiveSelectItem>
                              <ResponsiveSelectItem value="PARTY">
                                Partido u organización
                              </ResponsiveSelectItem>
                            </ResponsiveSelectContent>
                          </ResponsiveSelect>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="global_index"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs">
                            Orden en el juego
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              className="text-xs"
                              {...field}
                              value={Number(field.value) || 1}
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

                  {/* Checkboxes de Audiencias */}
                  {audiences.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label className="font-bold text-xs text-muted-foreground">
                        Público recomendado
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {audiences.map((aud) => {
                          const isChecked = selectedAudiences.includes(aud.id);
                          return (
                            <label
                              key={aud.id}
                              className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? "border-primary bg-primary/5 font-semibold text-foreground shadow-sm"
                                  : "border-border/60 text-muted-foreground hover:bg-muted/30"
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
                                        (id) => id !== aud.id,
                                      ),
                                    );
                                  }
                                }}
                              />
                              <span className="flex items-center gap-1.5">
                                {renderAudienceIcon(aud.icon || aud.slug, {
                                  size: 13,
                                })}
                                <span>{aud.name}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Explicación Contextual */}
                  <FormField
                    control={form.control}
                    name="explanation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs flex items-center gap-1.5">
                          <HelpCircle size={14} /> Explicación educativa
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Explica detalladamente por qué es la respuesta correcta y qué artículo o ley lo fundamenta..."
                            className="resize-none h-20 text-xs leading-relaxed"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Enlace de Fuente */}
                  <FormField
                    control={form.control}
                    name="source_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs flex items-center gap-1.5">
                          <LinkIcon size={14} /> Enlace de verificación o fuente
                          oficial
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://..."
                            {...field}
                            value={field.value || ""}
                            className="text-xs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* --- TAB 2: OPCIONES DE RESPUESTA --- */}
              {activeTab === "options" && (
                <div className="space-y-4 py-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        Alternativas de respuesta
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Selecciona cuál es la alternativa correcta marcando el
                        círculo.
                      </p>
                    </div>

                    {displayType === "TEXT_ONLY" && fields.length < 4 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddCustomTextOption}
                        className="text-xs font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
                        Alternativa
                      </Button>
                    )}
                  </div>

                  {fields.length > 0 ? (
                    <FormField
                      control={form.control}
                      name="correct_answer_id"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <RadioGroup
                            key={field.value}
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col gap-1"
                          >
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={handleDragEnd}
                            >
                              <SortableContext
                                items={fields}
                                strategy={verticalListSortingStrategy}
                              >
                                {fields.map((option, index) => (
                                  <SortableOptionItem
                                    key={option.id}
                                    id={option.id}
                                    index={index}
                                    option={option}
                                    displayType={displayType}
                                    isSelected={
                                      field.value === option.option_id
                                    }
                                    onSelect={(val) =>
                                      form.setValue("correct_answer_id", val)
                                    }
                                    onRemove={() => {
                                      remove(index);
                                      if (field.value === option.option_id) {
                                        form.setValue("correct_answer_id", "");
                                      }
                                    }}
                                    onChangeName={(newName) => {
                                      update(index, {
                                        ...option,
                                        name: newName,
                                      });
                                    }}
                                  />
                                ))}
                              </SortableContext>
                            </DndContext>
                          </RadioGroup>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed rounded-xl bg-muted/20">
                      <p className="text-xs text-muted-foreground mb-3">
                        No hay opciones añadidas aún.
                      </p>
                    </div>
                  )}

                  {/* Búsqueda de Personas o Partidos si aplica */}
                  {displayType === "PERSON" && (
                    <div className="space-y-3 pt-3 border-t">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Buscar Político / Candidato
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por nombre..."
                          className="pl-9 text-xs"
                          value={globalSearch}
                          onChange={(e) => setGlobalSearch(e.target.value)}
                        />
                      </div>
                      <PersonSelector
                        onSelect={handleAddPersonOption}
                        enableSearch={false}
                        externalSearchTerm={globalSearch}
                      />
                    </div>
                  )}

                  {displayType === "PARTY" && (
                    <div className="space-y-3 pt-3 border-t">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Buscar Partido Político
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar partido..."
                          className="pl-9 text-xs"
                          value={globalSearch}
                          onChange={(e) => setGlobalSearch(e.target.value)}
                        />
                      </div>
                      <PartySelector
                        onSelect={handleAddPartyOption}
                        enableSearch={false}
                        externalSearchTerm={globalSearch}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* --- TAB 3: VISTA PREVIA --- */}
              {activeTab === "preview" && (
                <div className="py-4 space-y-4 animate-in fade-in duration-200">
                  <div className="max-w-md mx-auto p-5 rounded-2xl bg-slate-900 text-white shadow-2xl border border-white/10 space-y-4">
                    {/* Badge */}
                    <div className="flex justify-between items-center">
                      <Badge className="bg-amber-400 text-black font-black text-[10px]">
                        {formCategory || "CÍVICA"}
                      </Badge>
                      <span className="text-xs font-bold text-white/60">
                        Pregunta 1/1
                      </span>
                    </div>

                    {/* Pregunta */}
                    <p className="font-bold text-sm text-center leading-snug">
                      ❝{formQuote || "Pregunta de ejemplo..."}❞
                    </p>

                    {/* Opciones */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {fields.map((opt, i) => {
                        const isCorrect = opt.option_id === correctAnswerId;
                        return (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded-xl border flex items-center gap-2 text-left text-xs font-bold ${
                              isCorrect
                                ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                                : "bg-white/10 border-white/20 text-white/90"
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black flex-shrink-0">
                              {OPTION_LABELS[i] || i + 1}
                            </span>
                            <span className="truncate flex-1">
                              {opt.name || `Opción ${OPTION_LABELS[i]}`}
                            </span>
                            {isCorrect && (
                              <CheckCircle2
                                size={14}
                                className="text-emerald-400 flex-shrink-0"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Contexto */}
                    {formExplanation && (
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/80">
                        <p className="font-bold text-amber-400 mb-0.5">
                          Contexto / Explicación:
                        </p>
                        <p>{formExplanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CredenzaBody>

            {/* Footer fijo / estático abajo */}
            <CredenzaFooter className="shrink-0 border-t bg-background px-4 sm:px-6 py-3 mt-auto shadow-xs">
              {/* Layout Mobile: Botón Principal Prominente + Botones Secundarios */}
              <div className="flex flex-col gap-2 w-full sm:hidden">
                {activeTab === "general" && (
                  <>
                    <Button
                      type="button"
                      size="default"
                      onClick={() => setActiveTab("options")}
                      className="w-full h-10 font-bold bg-primary text-primary-foreground shadow-xs text-xs"
                    >
                      Continuar a Alternativas (2) →
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenChange(false)}
                      className="h-8 text-xs text-muted-foreground"
                    >
                      Cancelar
                    </Button>
                  </>
                )}

                {activeTab === "options" && (
                  <>
                    <Button
                      type="button"
                      size="default"
                      onClick={() => setActiveTab("preview")}
                      className="w-full h-10 font-bold bg-primary text-primary-foreground shadow-xs text-xs"
                    >
                      Continuar a Vista Previa (3) →
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab("general")}
                        className="flex-1 h-8.5 text-xs font-medium"
                      >
                        ← Volver a Datos
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 h-8.5 text-xs text-muted-foreground"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </>
                )}

                {activeTab === "preview" && (
                  <>
                    <Button
                      type="submit"
                      size="default"
                      disabled={fields.length < 2 || !correctAnswerId}
                      className="w-full h-10 font-bold bg-primary text-primary-foreground shadow-sm text-xs"
                    >
                      {mode === "edit"
                        ? "✓ Guardar Cambios"
                        : "✓ Crear Pregunta"}
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab("options")}
                        className="flex-1 h-8.5 text-xs font-medium"
                      >
                        ← Volver a Alternativas
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 h-8.5 text-xs text-muted-foreground"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {/* Layout Desktop: Barra Horizontal */}
              <div className="hidden sm:flex items-center justify-between w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-9 px-3 text-xs"
                >
                  Cancelar
                </Button>

                <div className="flex items-center gap-2">
                  {activeTab !== "general" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setActiveTab(
                          activeTab === "preview" ? "options" : "general",
                        )
                      }
                      className="h-9 px-3 text-xs"
                    >
                      ← Anterior
                    </Button>
                  )}

                  {activeTab !== "preview" ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setActiveTab(
                          activeTab === "general" ? "options" : "preview",
                        )
                      }
                      className="h-9 px-3.5 text-xs font-semibold"
                    >
                      Siguiente →
                    </Button>
                  ) : null}

                  <Button
                    type="submit"
                    size="sm"
                    disabled={fields.length < 2 || !correctAnswerId}
                    className="bg-primary text-primary-foreground font-bold shadow-xs h-9 px-3.5 text-xs"
                  >
                    {mode === "edit" ? "Guardar Cambios" : "Crear Pregunta"}
                  </Button>
                </div>
              </div>
            </CredenzaFooter>
          </form>
        </Form>
      </CredenzaContent>
    </Credenza>
  );
}
