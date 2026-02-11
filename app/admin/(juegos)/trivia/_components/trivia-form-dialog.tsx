"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { GripVertical, LinkIcon, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Agregado para previsualización
import { triviaSchema, type TriviaFormValues } from "../_lib/validation";
import { createTrivia, updateTrivia } from "../_lib/actions";
import { PersonSelector } from "@/components/person-selector";
import { PartySelector } from "@/components/party-selector";
import { Input } from "@/components/ui/input";
import { TriviaBasic, TriviaOption } from "@/interfaces/trivia";
import { PersonBasicInfo } from "@/interfaces/person";
import { PoliticalPartyBase } from "@/interfaces/politics";
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableOptionProps {
  id: string;
  index: number;
  option: TriviaOption;
  isSelected: boolean;
  onSelect: (value: string) => void;
  onRemove: () => void;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

function SortableOptionItem({
  id,
  index,
  option,
  isSelected,
  onSelect,
  onRemove,
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

  return (
    <div ref={setNodeRef} style={style} className="mb-2 touch-none">
      <Card
        className={`relative flex flex-row items-center p-2 transition-all ${
          isSelected
            ? "border-green-500 bg-green-50/50 dark:bg-green-900/20"
            : "bg-muted/20 border-transparent hover:bg-muted/30"
        }`}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab p-2 hover:bg-muted rounded mr-1 text-muted-foreground"
        >
          <GripVertical size={18} />
        </div>

        {/* Letter Badge (A, B, C, D) */}
        <div className="mr-3 flex-shrink-0">
          <Badge
            variant="outline"
            className="w-8 h-8 flex items-center justify-center rounded-full text-base font-bold bg-background"
          >
            {OPTION_LABELS[index]}
          </Badge>
        </div>

        <div className="flex items-center gap-3 w-full">
          <FormControl>
            <RadioGroupItem
              value={option.option_id}
              id={`rb-${option.option_id}`}
              className="data-[state=checked]:bg-green-600 border-muted-foreground/30"
              onClick={() => onSelect(option.option_id)}
            />
          </FormControl>

          <div
            className="flex-1 cursor-pointer flex items-center gap-3"
            onClick={() => onSelect(option.option_id)}
          >
            <Avatar className="h-8 w-8 border bg-white">
              <AvatarImage
                src={option.image_url || ""}
                className="object-contain"
              />
              <AvatarFallback>?</AvatarFallback>
            </Avatar>

            <Label
              htmlFor={`rb-${option.option_id}`}
              className="font-medium cursor-pointer text-sm line-clamp-1"
            >
              {option.name}
            </Label>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
}

const defaultFormValues: TriviaFormValues = {
  quote: "",
  category: "POLEMICO",
  difficulty: "FACIL",
  target_type: "PERSON",
  correct_answer_id: "",
  options: [],
  global_index: 0,
  explanation: "",
  source_url: "",
};

export function TriviaFormDialog({
  open,
  onOpenChange,
  mode = "create",
  initialData,
  nextOrderIndex,
}: TriviaFormDialogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const [globalSearch, setGlobalSearch] = useState("");
  const form = useForm({
    resolver: zodResolver(triviaSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const { fields, append, remove, replace, move } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const targetType = form.watch("target_type");
  const correctAnswerId = form.watch("correct_answer_id");

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
        const type = initialData.person_id ? "PERSON" : "PARTY";
        const correctId =
          initialData.person_id || initialData.political_party_id;

        const optionsWithFormId = (initialData.options || []).map((opt) => ({
          option_id: opt.option_id,
          name: opt.name,
          image_candidate_url: opt.image_url || null,
        }));

        form.reset({
          quote: initialData.quote,
          category: initialData.category,
          difficulty: initialData.difficulty,
          target_type: type,
          correct_answer_id: correctId ?? "",
          options: optionsWithFormId,
          global_index: initialData.global_index,
          explanation: initialData.explanation || "",
          source_url: initialData.source_url || "",
        });
      } else {
        form.reset({
          ...defaultFormValues,
          global_index: nextOrderIndex || 1,
        });
      }
    }
  }, [open, mode, initialData, form, nextOrderIndex]);

  const onSubmit = async (values: TriviaFormValues) => {
    const isEditing = mode === "edit";
    const promise = isEditing
      ? updateTrivia(initialData!.id, values)
      : createTrivia(values);

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
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      move(oldIndex, newIndex); // React Hook Form 'move'
    }
  };
  const handleAddPersonOption = (person: PersonBasicInfo) => {
    if (!person) return;
    const currentOptions = form.getValues("options");

    if (currentOptions.some((opt) => opt.option_id === person.id)) {
      toast.error("Esta opción ya existe");
      return;
    }
    if (currentOptions.length >= 4) {
      toast.error("Máximo 4 opciones");
      return;
    }

    append({
      option_id: person.id,
      name: person.fullname,
      image_candidate_url: person.image_candidate_url,
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
      image_candidate_url: party.logo_url,
    });
  };

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent className="sm:max-w-2xl flex flex-col max-h-[90vh]">
        <CredenzaHeader className="pb-2 border-b space-y-3">
          <div className="flex items-center justify-between pr-8 sm:pr-0">
            <CredenzaTitle>
              {mode === "edit" ? "Editar Pregunta" : "Nueva Pregunta"}
            </CredenzaTitle>
          </div>

          {activeTab === "options" && (
            <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  targetType === "PERSON"
                    ? "Buscar persona..."
                    : "Buscar partido..."
                }
                className="pl-9 bg-muted/30"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </CredenzaHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="px-4 pt-2">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-2">
                  <TabsTrigger value="general">1. General</TabsTrigger>
                  <TabsTrigger value="options">
                    2. Respuestas{" "}
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 min-w-5 px-1"
                    >
                      {fields.length}/4
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <CredenzaBody className="flex-1 overflow-y-auto px-4 pb-4 overflow-x-hidden">
              {activeTab === "general" && (
                <div className="space-y-4 py-2 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* --- FILA SUPERIOR: Quote --- */}
                  <FormField
                    control={form.control}
                    name="quote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frase o Pregunta</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ej: Plata como cancha"
                            className="resize-none h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* --- FILA DE 3 COLUMNAS: Global Index, Category, Difficulty --- */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoría</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="POLEMICO">Polémico</SelectItem>
                              <SelectItem value="HISTORIA">Historia</SelectItem>
                              <SelectItem value="PROPUESTA">
                                Propuesta
                              </SelectItem>
                              <SelectItem value="CORRUPCION">
                                Corrupción
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dificultad</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="FACIL">Fácil</SelectItem>
                              <SelectItem value="MEDIO">Medio</SelectItem>
                              <SelectItem value="DIFICIL">Difícil</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="target_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Entidad</FormLabel>
                          <Select
                            onValueChange={(val) => {
                              field.onChange(val);
                              replace([]);
                              form.setValue("correct_answer_id", "");
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PERSON">Personajes</SelectItem>
                              <SelectItem value="PARTY">Partidos</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="global_index"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel># Orden Global</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder="Calculando..."
                              {...field}
                              value={Number(field.value) ?? ""}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Automático: Es el siguiente número disponible.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* --- FILA NUEVA: Explicación --- */}
                  <FormField
                    control={form.control}
                    name="explanation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Explicación{" "}
                          <span className="text-muted-foreground text-xs font-normal">
                            (Opcional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Contexto adicional sobre la respuesta correcta..."
                            className="resize-none h-20"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* --- FILA NUEVA: Source URL --- */}
                  <FormField
                    control={form.control}
                    name="source_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <LinkIcon size={14} /> Fuente{" "}
                          <span className="text-muted-foreground text-xs font-normal">
                            (URL)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://..."
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {activeTab === "options" && (
                <div className="space-y-5 py-2 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    {fields.length > 0 && (
                      <div className="space-y-3 pt-4 border-t">
                        <Label className="flex justify-between">
                          <span>Orden de Respuestas ({fields.length}/4)</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            Arrastra para reordenar
                          </span>
                        </Label>

                        <FormField
                          control={form.control}
                          name="correct_answer_id"
                          render={({ field }) => (
                            <FormItem className="space-y-0">
                              <RadioGroup
                                key={field.value}
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex flex-col gap-2"
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
                                        isSelected={
                                          field.value === option.option_id
                                        }
                                        onSelect={(val) =>
                                          form.setValue(
                                            "correct_answer_id",
                                            val,
                                          )
                                        }
                                        onRemove={() => {
                                          remove(index);
                                          if (
                                            field.value === option.option_id
                                          ) {
                                            form.setValue(
                                              "correct_answer_id",
                                              "",
                                            );
                                          }
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
                      </div>
                    )}
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Resultados de búsqueda
                    </Label>

                    {targetType === "PERSON" ? (
                      <PersonSelector
                        onSelect={handleAddPersonOption}
                        enableSearch={false}
                        externalSearchTerm={globalSearch}
                      />
                    ) : (
                      <PartySelector
                        onSelect={handleAddPartyOption}
                        enableSearch={false}
                        externalSearchTerm={globalSearch}
                      />
                    )}
                  </div>
                </div>
              )}
            </CredenzaBody>

            <CredenzaFooter className="flex justify-between pt-4 mt-auto border-t bg-background px-4 pb-4">
              {activeTab === "options" && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveTab("general")}
                  >
                    Atrás
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={fields.length < 2 || !correctAnswerId}
                  >
                    {mode === "edit" ? "Guardar" : "Crear"}
                  </Button>
                </>
              )}
              {activeTab === "general" && (
                <div className="flex w-full justify-end">
                  <Button type="button" onClick={() => setActiveTab("options")}>
                    Continuar
                  </Button>
                </div>
              )}
            </CredenzaFooter>
          </form>
        </Form>
      </CredenzaContent>
    </Credenza>
  );
}
