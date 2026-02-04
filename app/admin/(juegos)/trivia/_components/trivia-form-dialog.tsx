"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Search, Trash2 } from "lucide-react";
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
import { TriviaBasic } from "@/interfaces/trivia";
import { PersonBasicInfo } from "@/interfaces/person";
import { PoliticalPartyBase } from "@/interfaces/politics";

interface TriviaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  initialData?: TriviaBasic;
}

const defaultFormValues: TriviaFormValues = {
  quote: "",
  category: "POLEMICO",
  difficulty: "FACIL",
  target_type: "PERSON",
  correct_answer_id: "",
  options: [],
};

export function TriviaFormDialog({
  open,
  onOpenChange,
  mode = "create",
  initialData,
}: TriviaFormDialogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const [globalSearch, setGlobalSearch] = useState("");
  const form = useForm<TriviaFormValues>({
    resolver: zodResolver(triviaSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const targetType = form.watch("target_type");
  const correctAnswerId = form.watch("correct_answer_id");

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
          image_url:
            opt.image_candidate_url || opt.image_url || opt.logo_url || null,
          image_candidate_url: opt.image_candidate_url || opt.image_url || null, // Para mantener compatibilidad con el form
        }));

        form.reset({
          quote: initialData.quote,
          category: initialData.category,
          difficulty: initialData.difficulty,
          target_type: type,
          correct_answer_id: correctId ?? "",
          options: optionsWithFormId,
        });
      } else {
        form.reset(defaultFormValues);
      }
    }
  }, [open, mode, initialData, form]);

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
      <CredenzaContent className="sm:max-w-2xl flex flex-col">
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
            className="flex flex-col"
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

            <CredenzaBody className="flex-1 overflow-y-auto px-4 pb-4">
              {activeTab === "general" && (
                <div className="space-y-4 py-2 animate-in fade-in slide-in-from-right-4 duration-300">
                  <FormField
                    control={form.control}
                    name="quote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frase o Pregunta</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ej: Plata como cancha"
                            className="resize-none h-32"
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
                  </div>

                  <FormField
                    control={form.control}
                    name="target_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Respuesta</FormLabel>
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
                </div>
              )}

              {activeTab === "options" && (
                <div className="space-y-5 py-2 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
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

                  {fields.length > 0 && (
                    <div className="space-y-3 pt-4 border-t">
                      <Label>Opciones Seleccionadas ({fields.length}/4)</Label>
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
                              {fields.map((option, index) => {
                                const isSelected =
                                  field.value === option.option_id;

                                return (
                                  <Card
                                    key={option.id}
                                    className={`relative flex items-center p-3 transition-all ${
                                      isSelected
                                        ? "border-green-500 bg-green-50/50 dark:bg-green-900/20"
                                        : "bg-muted/20 border-transparent hover:bg-muted/30"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 w-full">
                                      <FormControl>
                                        <RadioGroupItem
                                          value={option.option_id}
                                          id={`rb-${option.id}`}
                                          className="data-[state=checked]:bg-green-600 border-muted-foreground/30"
                                        />
                                      </FormControl>

                                      <div
                                        className="flex-1 cursor-pointer flex items-center gap-3"
                                        onClick={() =>
                                          form.setValue(
                                            "correct_answer_id",
                                            option.option_id,
                                          )
                                        }
                                      >
                                        <Avatar className="h-8 w-8 border bg-white">
                                          <AvatarImage
                                            src={
                                              option.image_candidate_url || ""
                                            }
                                            className="object-contain"
                                          />
                                          <AvatarFallback>?</AvatarFallback>
                                        </Avatar>

                                        <Label
                                          htmlFor={`rb-${option.id}`}
                                          className="font-medium cursor-pointer text-sm"
                                        >
                                          {option.name}
                                        </Label>
                                      </div>

                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => {
                                          remove(index);
                                          if (isSelected)
                                            form.setValue(
                                              "correct_answer_id",
                                              "",
                                            );
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </Card>
                                );
                              })}
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              )}
            </CredenzaBody>
          </form>
        </Form>
        <CredenzaFooter className="flex justify-between pt-4 mt-4">
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
            <Button type="button" onClick={() => setActiveTab("options")}>
              Continuar
            </Button>
          )}
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
