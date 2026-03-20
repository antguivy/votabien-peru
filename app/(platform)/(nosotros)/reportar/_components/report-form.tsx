"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { submitReportAction } from "../_lib/actions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  ArrowRight,
  Bug,
  CheckCircle2,
  ImageIcon,
  Lightbulb,
  Loader2,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const base = z.object({
  email: z.string().email("Ingresa un correo válido."),
});

const bugSchema = base.extend({
  type: z.literal("bug"),
  message: z
    .string()
    .min(10, "Describe el problema con al menos 10 caracteres."),
  referenceUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});

const sugerenciaSchema = base.extend({
  type: z.literal("sugerencia"),
  message: z
    .string()
    .min(10, "Describe tu sugerencia con al menos 10 caracteres."),
});

const correccionSchema = base.extend({
  type: z.literal("correccion_candidato"),
  candidateName: z.string().min(2, "Ingresa el nombre del candidato."),
  correctionField: z.string().min(1, "Selecciona qué dato está incorrecto."),
  candidateUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  currentValue: z.string().optional(),
  correctValue: z.string().optional(),
  sourceUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  message: z.string().optional(),
});

const reportSchema = z.discriminatedUnion("type", [
  bugSchema,
  sugerenciaSchema,
  correccionSchema,
]);

type ReportFormValues = z.infer<typeof reportSchema>;
type ReportType = ReportFormValues["type"];

// ─── Valores por defecto por tipo ─────────────────────────────────────────────
// FIX: todos los campos deben iniciar como string vacío, nunca undefined,
// para que React los trate siempre como controlled inputs.

const DEFAULT_VALUES: Record<ReportType, ReportFormValues> = {
  bug: { type: "bug", email: "", message: "", referenceUrl: "" },
  sugerencia: { type: "sugerencia", email: "", message: "" },
  correccion_candidato: {
    type: "correccion_candidato",
    email: "",
    candidateName: "",
    correctionField: "",
    candidateUrl: "",
    currentValue: "",
    correctValue: "",
    sourceUrl: "",
    message: "",
  },
};

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  bug: {
    icon: Bug,
    label: "Bug",
    sublabel: "Algo no funciona",
    messagePlaceholder:
      "Describe qué hiciste paso a paso y qué error obtuviste...",
    messageLabel: "Detalle del error",
    screenshotLabel: "Captura de pantalla",
    required: true,
  },
  sugerencia: {
    icon: Lightbulb,
    label: "Sugerencia",
    sublabel: "Tengo una idea",
    messagePlaceholder:
      "Cuéntanos tu idea o qué funcionalidad te gustaría ver...",
    messageLabel: "Tu sugerencia",
    screenshotLabel: "Ejemplo visual",
    required: true,
  },
  correccion_candidato: {
    icon: UserRound,
    label: "Corrección/Actualización",
    sublabel: "Dato incorrecto",
    messagePlaceholder: "Contexto adicional, fuente o referencia...",
    messageLabel: "Notas adicionales",
    screenshotLabel: "Evidencia o fuente",
    required: false,
  },
} satisfies Record<ReportType, unknown>;

const CORRECTION_FIELDS = [
  { value: "posturas", label: "Noticias" },
  { value: "sentencias", label: "Antecedentes" },
  { value: "otro", label: "Otro" },
];

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function SuccessScreen({ onReset }: { onReset: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center pt-4 px-4">
      <div className="text-center space-y-5 max-w-sm">
        <div className="w-14 h-14 bg-success/10 rounded-2xl flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7 text-success" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight">
            Reporte enviado
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Gracias por ayudarnos a mejorar VotaBien Perú. Nuestro equipo lo
            revisará pronto.
          </p>
        </div>
        <button
          onClick={onReset}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Enviar otro reporte
        </button>
      </div>
    </div>
  );
}

// ─── ReportForm ───────────────────────────────────────────────────────────────

export function ReportForm() {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    // Sin defaultValues aquí — se setean en handleTypeSelect via form.reset()
  });

  const isSubmitting = form.formState.isSubmitting;
  const typeConfig = selectedType ? TYPE_CONFIG[selectedType] : null;

  const handleTypeSelect = (type: ReportType) => {
    const email = selectedType ? (form.getValues("email") ?? "") : "";
    // FIX: reset con defaultValues completos para que ningún campo sea undefined
    form.reset({ ...DEFAULT_VALUES[type], email });
    setSelectedType(type);
    setFile(null);
    setPreview(null);
    setServerError("");
  };

  const handleFile = (f: File | null) => {
    setServerError("");
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!f.type.startsWith("image/")) {
      setServerError("Solo se aceptan imágenes (JPG, PNG, WEBP).");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setServerError("La imagen no puede superar los 5 MB.");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (values: ReportFormValues) => {
    setServerError("");
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (v != null && v !== "") formData.append(k, v as string);
      });
      if (file) formData.append("imageFile", file);

      const result = await submitReportAction(formData);
      if (result.success) setIsSuccess(true);
      else setServerError(result.error || "Ocurrió un error inesperado.");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Error de conexión.");
    }
  };

  if (isSuccess) {
    return (
      <SuccessScreen
        onReset={() => {
          form.reset();
          setSelectedType(null);
          setFile(null);
          setPreview(null);
          setIsSuccess(false);
          setServerError("");
        }}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 pt-4 max-w-xl">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight mb-1.5">
          Enviar reporte
        </h1>
        <p className="text-muted-foreground text-sm">
          Tu feedback nos ayuda a mantener la plataforma transparente y
          confiable.
        </p>
      </div>

      {/* Selector de tipo */}
      <div className="mb-8 space-y-3">
        <p className="text-sm font-medium">¿Qué quieres reportar?</p>
        <div className="grid grid-cols-3 gap-2">
          {(
            Object.entries(TYPE_CONFIG) as [
              ReportType,
              (typeof TYPE_CONFIG)[ReportType],
            ][]
          ).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const active = selectedType === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleTypeSelect(key)}
                className={`flex flex-col items-start gap-2.5 p-4 rounded-lg border text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? "border-foreground bg-foreground text-background shadow-sm"
                    : "border-border bg-card hover:border-foreground/30 hover:bg-muted/40"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${active ? "text-background" : "text-muted-foreground"}`}
                />
                <div>
                  <p
                    className={`text-xs font-semibold ${active ? "text-background" : "text-foreground"}`}
                  >
                    {cfg.label}
                  </p>
                  <p
                    className={`text-[11px] leading-snug mt-0.5 ${active ? "text-background/70" : "text-muted-foreground"}`}
                  >
                    {cfg.sublabel}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulario */}
      {selectedType && typeConfig && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-8"
          >
            {serverError && (
              <div className="flex items-start gap-2.5 p-3.5 bg-destructive/8 border border-destructive/20 rounded-lg text-sm text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Contacto */}
            <div>
              <SectionLabel>Tu contacto</SectionLabel>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Correo electrónico{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="tu@correo.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Solo para contactarte si necesitamos más información.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Detalles */}
            <div className="space-y-4">
              <SectionLabel>Detalles</SectionLabel>

              {selectedType === "bug" && (
                <FormField
                  control={form.control}
                  name="referenceUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        ¿En qué página ocurrió?{" "}
                        <span className="font-normal text-muted-foreground">
                          (Opcional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://votabienperu.com/..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedType === "correccion_candidato" && (
                <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="candidateName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Nombre del candidato{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Juan Pérez García" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="correctionField"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Campo incorrecto{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CORRECTION_FIELDS.map((f) => (
                                <SelectItem key={f.value} value={f.value}>
                                  {f.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="candidateUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Link al perfil{" "}
                          <span className="font-normal text-muted-foreground">
                            (Opcional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://votabienperu.com/candidatos/..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currentValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor actual (incorrecto)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Lo que dice ahora..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="correctValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor correcto</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Lo que debería decir..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sourceUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Fuente{" "}
                          <span className="font-normal text-muted-foreground">
                            (Opcional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://jne.gob.pe/..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {typeConfig.messageLabel}
                      {typeConfig.required ? (
                        <span className="text-destructive"> *</span>
                      ) : (
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          (Opcional)
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder={typeConfig.messagePlaceholder}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Imagen */}
            <div>
              <SectionLabel>
                {typeConfig.screenshotLabel}{" "}
                <span className="normal-case font-normal tracking-normal">
                  (opcional)
                </span>
              </SectionLabel>

              {preview ? (
                <div className="rounded-lg overflow-hidden border border-border">
                  <div className="relative group">
                    <img
                      src={preview}
                      alt="Vista previa"
                      className="w-full max-h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeFile}
                      className="absolute top-2 right-2 bg-background/90 hover:bg-background border border-border rounded-md p-1.5 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="px-3 py-2 border-t border-border bg-muted/20 flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate flex-1">
                      {file?.name}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {file ? `${(file.size / 1024).toFixed(0)} KB` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 shrink-0"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFile(e.dataTransfer.files?.[0] ?? null);
                  }}
                  className={`relative flex flex-col items-center gap-2.5 border-2 border-dashed rounded-lg p-8 cursor-pointer text-center transition-all ${
                    isDragging
                      ? "border-foreground bg-muted/50"
                      : "border-input hover:border-muted-foreground/50 hover:bg-muted/20"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-foreground">
                      Arrastra aquí o{" "}
                      <span className="font-medium underline underline-offset-2">
                        selecciona un archivo
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      PNG, JPG, WEBP — máx. 5 MB
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 font-medium gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {file ? "Subiendo imagen…" : "Enviando reporte…"}
                </>
              ) : (
                <>
                  Enviar reporte
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </Form>
      )}

      {!selectedType && (
        <p className="text-sm text-muted-foreground text-center">
          Selecciona el tipo de reporte para continuar.
        </p>
      )}
    </div>
  );
}
