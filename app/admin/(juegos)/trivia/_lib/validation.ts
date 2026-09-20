import * as z from "zod";

export const optionItemSchema = z.object({
  option_id: z.string().min(1, "El ID de opción es requerido"),
  name: z.string().min(1, "El texto de la opción no puede estar vacío"),
  subtitle: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
});

export const secondarySourceSchema = z.object({
  url: z.string().url("URL inválida").min(1, "La URL es requerida"),
  label: z.string().optional().nullable(),
});

export const triviaSchema = z.object({
  id: z.string().optional(),
  topic_id: z.string().optional().nullable(),
  quote: z.string().min(3, "La pregunta o enunciado es requerido"),
  title: z.string().optional().nullable(),
  global_index: z.coerce
    .number()
    .min(0, "El índice debe ser mayor o igual a 0")
    .optional()
    .default(0),
  explanation: z.string().optional().nullable(),
  source_url: z
    .string()
    .url("URL inválida")
    .optional()
    .or(z.literal(""))
    .nullable(),
  secondary_sources: z.array(secondarySourceSchema).optional().nullable(),
  image_url: z
    .string()
    .url("URL de imagen inválida")
    .optional()
    .or(z.literal(""))
    .nullable(),

  category: z.string().min(1, "Selecciona o escribe una categoría"),
  difficulty: z.enum(["FACIL", "MEDIO", "DIFICIL"]),
  display_type: z.enum([
    "TEXT_ONLY",
    "PERSON",
    "PARTY",
    "INSTITUTION",
    "TRUE_FALSE",
    "IMAGE_CARD",
  ]),

  correct_answer_id: z
    .string()
    .min(1, "Debes seleccionar cuál es la respuesta correcta"),

  options: z
    .array(optionItemSchema)
    .min(2, "Mínimo 2 opciones")
    .max(4, "Máximo 4 opciones"),

  audience_ids: z.array(z.string()).optional(),
  is_published: z.boolean().default(false),

  // Para retrocompatibilidad y filtro regional
  person_id: z.string().optional().nullable(),
  political_party_id: z.string().optional().nullable(),
  electoral_district_id: z.string().optional().nullable(),
});

export type TriviaFormValues = z.infer<typeof triviaSchema>;

export const topicSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .min(2, "El slug debe tener al menos 2 caracteres")
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  title: z.string().min(3, "El título es requerido"),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  badge_color: z.string().optional().nullable(),
  banner_url: z
    .string()
    .url("URL inválida")
    .optional()
    .or(z.literal(""))
    .nullable(),
  order_index: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
  is_regional: z.boolean().default(false),
  has_factcheck: z.boolean().default(false),
  audience_ids: z.array(z.string()).optional(),
});

export type TopicFormValues = z.infer<typeof topicSchema>;

export const audienceSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .min(2, "El slug debe tener al menos 2 caracteres")
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  name: z.string().min(2, "El nombre es requerido"),
  description: z.string().optional().nullable(),
  emoji: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  order_index: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
});

export type AudienceFormValues = z.infer<typeof audienceSchema>;
