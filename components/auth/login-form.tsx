"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { serverLogin } from "@/lib/auth-actions";
import { LoginSchema } from "@/schemas/auth";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { FormError } from "@/components/form-error";

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? "¡El correo ya está en uso con otro proveedor!"
      : "";

  const [error, setError] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSuccessfulLogin = async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    router.replace(decodeURIComponent(callbackUrl));
    router.refresh();
  };

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");

    startTransition(async () => {
      try {
        const loginResult = await serverLogin({
          email: values.email,
          password: values.password,
        });

        if (loginResult.error) {
          setError(loginResult.error);
          return;
        }

        handleSuccessfulLogin();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error desconocido";
        console.error("error en login", message);
        setError(message);
        form.reset();
      }
    });
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

          <FormError message={error || urlError} />

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};
