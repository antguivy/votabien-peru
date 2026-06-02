"use client";

import * as z from "zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";

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
import { FormSuccess } from "@/components/form-success";
import { Field } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";

const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Mínimo 6 caracteres requeridos",
  }),
});

export const NewPasswordForm = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof NewPasswordSchema>>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof NewPasswordSchema>) => {
    setError("");
    setSuccess("");

    if (!token) {
      setError("Token ausente!");
      return;
    }

    startTransition(async () => {
      try {
        const result = await authClient.resetPassword({
          newPassword: values.password,
          token: token,
        });

        if (result.error) {
          setError(result.error.message);
          return;
        }

        setSuccess("Contraseña restablecida exitosamente!");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Algo salió mal";
        setError(errorMessage);
      }
    });
  };

  return (
    <CardWrapper
      headerLabel="Ingresa tu nueva contraseña"
      backButtonLabel="Volver a iniciar sesión"
      welcomeMessage="Elige una nueva contraseña segura"
      backButtonHref="/auth/login"
      singleColumn={false}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-8">
          <div className="space-y-4">
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormError message={error} />
          <FormSuccess message={success} />
          <Field>
            <Button disabled={isPending} type="submit">
              Restablecer Contraseña
            </Button>
          </Field>
        </form>
      </Form>
    </CardWrapper>
  );
};
