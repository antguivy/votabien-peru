import * as z from "zod";

export const optionItemSchema = z.object({
  option_id: z.string(),
  name: z.string(),
  image_candidate_url: z.string().optional().nullable(),
});

export const triviaSchema = z.object({
  id: z.string().optional(),
  quote: z.string().min(5, "La frase o pregunta es requerida"),
  category: z.string().min(1, "Selecciona una categoría"),
  difficulty: z.enum(["FACIL", "MEDIO", "DIFICIL"]),

  target_type: z.enum(["PERSON", "PARTY"]),

  correct_answer_id: z
    .string()
    .min(1, "Debes seleccionar cuál es la respuesta correcta"),

  options: z
    .array(optionItemSchema)
    .min(2, "Mínimo 2 opciones")
    .max(4, "Máximo 4 opciones"),
});

export type TriviaFormValues = z.infer<typeof triviaSchema>;
