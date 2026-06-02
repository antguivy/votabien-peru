"use client";

import * as z from "zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

const ResetSchema = z.object({
  email: z.string().email({
    message: "Se requiere un correo válido",
  }),
});

export const ResetForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof ResetSchema>>({
    resolver: zodResolver(ResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: z.infer<typeof ResetSchema>) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const result = await authClient.requestPasswordReset({
          email: values.email,
          redirectTo: "/auth/new-password", // Esto agrega ?token=... al redireccionar
        });

        if (result.error) {
          setError(result.error.message);
          return;
        }

        setSuccess("Correo enviado exitosamente.");
        form.reset();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al enviar el correo";
        setError(errorMessage);
      }
    });
  };

  return (
    <CardWrapper
      headerLabel="Olvidaste tu contraseña?"
      backButtonLabel="Volver a iniciar sesión"
      welcomeMessage="Te enviaremos un correo para restablecerla"
      backButtonHref="/auth/login"
      singleColumn={false}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-8">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="john.doe@example.com"
                      type="email"
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
              Enviar correo de recuperación
            </Button>
          </Field>
        </form>
      </Form>
    </CardWrapper>
  );
};
