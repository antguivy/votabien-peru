import * as z from "zod";

export const teamSchema = z.object({
  id: z.number().optional(), // El ID suele ser number en tu interfaz
  first_name: z.string().min(2, "El nombre es obligatorio"),
  last_name: z.string().min(2, "El apellido es obligatorio"),
  image_url: z.string().url("URL inválida").optional().or(z.literal("")),
  role: z.string().min(2, "El cargo es obligatorio"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phrase: z.string().min(2, "El apellido es obligatorio"),

  // Manejo de URLs opcionales
  linkedin_url: z.string().url("URL inválida").optional().or(z.literal("")),
  portfolio_url: z.string().url("URL inválida").optional().or(z.literal("")),

  is_principal: z.boolean(),
});

export type TeamFormValues = z.infer<typeof teamSchema>;
