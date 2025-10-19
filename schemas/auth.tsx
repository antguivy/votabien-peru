import * as z from "zod";

export const SettingsSchema = z.object({
  name: z.optional(z.string()),
  isTwoFactorEnabled: z.optional(z.boolean()),
  email: z.optional(z.string().email()),
  password: z.optional(z.string().min(6)),
  newPassword: z.optional(z.string().min(6)),
})
  .refine((data) => {
    if (data.password && !data.newPassword) {
      return false;
    }

    return true;
  }, {
    message: "New password es requerido!",
    path: ["newPassword"]
  })
  .refine((data) => {
    if (data.newPassword && !data.password) {
      return false;
    }

    return true;
  }, {
    message: "Password es requerido!",
    path: ["password"]
  })

export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Se requieren al menos 6 caracteres",
  }),
});

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Email es requerido",
  }),
});

export const LoginSchema = z.object({
  email: z.string().email({
    message: "",
  }),
  password: z.string().min(1, {
    message: "",
  }),
  code: z.string().optional(),
});

export const RegisterSchema = z.object({
  email: z.string().email({
    message: "",
  }),
  password: z.string().min(6, {
    message: "Se requieren al menos 6 caracteres",
  }),
  name: z.string().min(1, {
    message: "",
  })
});