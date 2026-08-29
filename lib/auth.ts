import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { sendEmail } from "./maileroo";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    process.env.NEXT_PUBLIC_APP_DOMAIN,
    process.env.BETTER_AUTH_URL,
  ].filter(Boolean) as string[],
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Restablece tu contraseña - VotaBien",
        html: `Hola ${user.name},<br><br>Has solicitado restablecer tu contraseña. Haz click en el siguiente enlace:<br><br><a href="${url}">${url}</a><br><br>Si no lo solicitaste, ignora este mensaje.`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verifica tu cuenta en VotaBien",
        html: `Hola ${user.name},<br><br>Bienvenido a VotaBien. Por favor verifica tu cuenta haciendo click en el siguiente enlace:<br><br><a href="${url}">${url}</a>`,
      });
    },
  },
  socialProviders: {
    // You can configure your social providers here
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        // El rol solo se modifica desde /admin/usuarios, nunca por input del cliente
        input: false,
      },
    },
  },
  rateLimit: {
    enabled: true,
    window: 60, // 60 segundos
    max: 100, // 100 peticiones por ventana
  },
});
