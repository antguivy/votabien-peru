import * as z from "zod";

export const hitoSchema = z.object({
  date: z.string().min(1, "La fecha es obligatoria"),
  location: z.string().min(2, "La ubicación es obligatoria"),
  photo_url: z.string().url("URL inválida").optional().or(z.literal("")),
  photo_description: z.string().min(2, "La descripción es obligatoria"),
  index: z.number(),
  quote: z.string().min(2, "La cita es obligatoria"),
  label: z.string().optional(),
});

export type HitoFormValues = z.infer<typeof hitoSchema>;
