import * as z from "zod";

export const hitoSchema = z.object({
  title: z.string().min(2, "El título es obligatorio"),
  date: z.date(),
  description: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  label: z.string().optional().or(z.literal("")),
  photo_url: z
    .string()
    .url("URL inválida")
    .optional()
    .or(z.literal(""))
    .nullable(),
  registration_url: z
    .string()
    .url("URL inválida")
    .optional()
    .or(z.literal(""))
    .nullable(),
  is_published: z.boolean(),
  index: z.number().optional().nullable(),
});

export type HitoFormValues = z.infer<typeof hitoSchema>;
