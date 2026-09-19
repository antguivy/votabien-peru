"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { authClient } from "@/lib/auth-client";
import { Eye, EyeOff } from "lucide-react";
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
import { FormSuccess } from "@/components/form-success";

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? "¡El correo ya está en uso con otro proveedor!"
      : "";
  const isVerified = searchParams.get("verified") === "true";

  const [error, setError] = useState<string | undefined>("");
  const [success] = useState<string | undefined>(
    isVerified
      ? "¡Cuenta verificada exitosamente! Por favor inicia sesión."
      : undefined,
  );
  const [showPassword, setShowPassword] = useState(false);
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
        const loginResult = await authClient.signIn.email({
          email: values.email,
          password: values.password,
        });

        if (loginResult.error) {
          setError(loginResult.error.message);
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
      welcomeMessage="Inicia sesión para continuar"
      backButtonLabel="Volver al inicio"
      backButtonHref="/"
      singleColumn={false}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-sm font-medium">
                  Correo electrónico
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isPending}
                    placeholder="ejemplo@correo.com"
                    type="email"
                    autoComplete="email"
                    className="h-11 rounded-lg bg-background text-base sm:text-sm shadow-xs transition-colors"
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
              <FormItem className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium">
                    Contraseña
                  </FormLabel>
                  <Button
                    size="sm"
                    variant="link"
                    asChild
                    className="h-auto p-0 text-xs sm:text-sm font-normal text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Link href="/auth/reset">¿Olvidaste tu contraseña?</Link>
                  </Button>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="h-11 rounded-lg bg-background pr-10 text-base sm:text-sm shadow-xs transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      disabled={isPending}
                      tabIndex={-1}
                      className="absolute right-0 top-0 flex h-full items-center justify-center px-3 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormError message={error || urlError} />
          <FormSuccess message={success} />

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-11 rounded-lg text-sm sm:text-base font-medium shadow-xs transition-all active:scale-[0.99]"
          >
            {isPending ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};
