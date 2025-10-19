"use client";

import * as z from "zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { RegisterSchema } from "@/schemas/auth";
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
import { serverRegister } from "@/lib/auth-actions";

export const RegisterForm = () => {

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        // Registrar usuario usando tu AuthProvider
        await serverRegister({
          email: values.email,
          password: values.password,
          name: values.name,
        });

        // Registro exitoso - mostrar mensaje de verificación
        setSuccess(
          "¡Cuenta creada exitosamente! Hemos enviado un enlace de verificación a tu correo electrónico. " +
            "Por favor revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta."
        );

        // Limpiar el formulario
        form.reset();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al crear la cuenta";
        setError(errorMessage);
      }
    });
  };

  return (
    <CardWrapper
      headerLabel="Crea tu cuenta"
      backButtonLabel="¿Ya tienes una cuenta?"
      welcomeMessage="Completa el siguiente formulario para crear tu cuenta"
      backButtonHref="/auth/login"
      singleColumn={false}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-8">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombres y Apellidos</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="John Doe"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              Crear Cuenta
            </Button>
          </Field>
        </form>
      </Form>
    </CardWrapper>
  );
};
