"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "@/schemas/auth";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Field } from "../ui/field";
import { serverLogin } from "@/lib/auth-actions";

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? "¡El correo ya está en uso con otro proveedor!"
      : "";

  // Usar tu AuthProvider en lugar del action

  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
      code: "",
    },
  });

  // Desde la pantalla 2FA
  const handleBackToLogin = () => {
    setShowTwoFactor(false);
    form.reset();
    setError("");
  };

  const handleSuccessfulLogin = async () => {
    setSuccess("¡Inicio de sesión exitoso!");

    // Espera 100ms para que cookies se guarden
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Redirige sin agregar al historial
    router.replace(decodeURIComponent(callbackUrl));

    // Fuerza que el middleware re-ejecute
    router.refresh();
  };

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        // Llamar directamente al Server Action sin intermediarios
        const loginResult = await serverLogin({
          email: values.email,
          password: values.password,
        });

        if (loginResult.error) {
          setError(loginResult.error);
          return;
        }

        // Login exitoso
        handleSuccessfulLogin();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        console.error("error en login", errorMessage);
        setError(errorMessage);
        form.reset();
      }
    });
  };

  const handleTwoFactorVerification = async (
    values: z.infer<typeof LoginSchema>
  ) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-2fa`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: values.email,
            code: values.code,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Código de verificación inválido");
      }

      const tokens = await response.json();
      setSuccess("¡Verificación exitosa!");
    } catch (error) {
      throw new Error("Código de verificación inválido");
    }
  };

  const sendTwoFactorCode = async (email: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/send-2fa`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }
    );

    if (!response.ok) {
      throw new Error("Error al enviar código de verificación");
    }
  };

  return (
    <CardWrapper
      headerLabel="¡Hola de nuevo!"
      welcomeMessage="Inicia sesión en tu cuenta"
      backButtonLabel="Regístrate ahora"
      backButtonHref="/auth/register"
      singleColumn={false}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {showTwoFactor && (
            <>
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium">
                  Verificación de dos factores
                </h3>
                <p className="text-sm text-gray-500">
                  Ingresa el código de 6 dígitos enviado a tu correo
                </p>
              </div>
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <InputOTP {...field} disabled={isPending} maxLength={6}>
                        <InputOTPGroup className="space-x-2">
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {!showTwoFactor && (
            <>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="ejemplo@gmail.com"
                        type="email"
                        className="p-4 md:p-6 rounded-lg bg-gray-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>

                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="******"
                        type="password"
                        className="p-4 md:p-6 rounded-lg bg-gray-50 pr-12"
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <FormError message={error || urlError} />

          {/* Botones de acción - Ajustados según el estado */}
          <div className="space-y-3">
            {showTwoFactor ? (
              <>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-colorprimary hover:bg-colorprimary/80 text-white font-medium p-4 md:p-6 rounded-lg"
                >
                  Confirmar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleBackToLogin}
                  disabled={isPending}
                >
                  Volver al inicio de sesión
                </Button>
              </>
            ) : (
              <Field>
                <Button
                  type="submit"
                  disabled={isPending}
                  // className="w-full bg-colorprimary hover:bg-colorprimary/80 text-white font-medium p-4 md:p-6 rounded-lg"
                >
                  Iniciar Sesión
                </Button>
              </Field>
            )}
          </div>
        </form>
      </Form>
    </CardWrapper>
  );
};
