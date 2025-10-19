"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { CardWrapper } from "@/components/auth/card-wrapper";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { serverVerifyAccount } from "@/lib/auth-actions";

export const NewVerificationForm = () => {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [isVerifying, setIsVerifying] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const processVerification = useCallback(async () => {
    if (!token || !email) {
      setError("Enlace inválido. Faltan parámetros de verificación.");
      setIsVerifying(false);
      return;
    }

    try {
      await serverVerifyAccount(email, token);

      setSuccess(
        "¡Cuenta verificada exitosamente! Serás redirigido en 3 segundos."
      );
      setIsVerifying(false);

      setTimeout(() => {
        router.push("/auth/login?status=verified");
      }, 3000);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo verificar la cuenta. Por favor, intenta de nuevo.";

      setError(message);
      setIsVerifying(false);
    }
  }, [token, email, router]);

  useEffect(() => {
    processVerification();
  }, [processVerification]);

  const renderContent = () => {
    if (isVerifying) {
      return (
        <div className="flex flex-col items-center space-y-4 py-6">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-sm text-gray-600">Verificando tu cuenta...</p>
        </div>
      );
    }

    if (success) {
      return (
        <div className="flex flex-col items-center space-y-4 py-6">
          <FormSuccess message={success} />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center space-y-4 py-6">
          <FormError message={error} />
        </div>
      );
    }

    return null;
  };

  return (
    <CardWrapper
      headerLabel="Verificación de Cuenta"
      welcomeMessage="Estamos confirmando tu correo electrónico"
      backButtonLabel="Volver al inicio de sesión"
      backButtonHref="/auth/login"
      singleColumn={true}
    >
      {renderContent()}
    </CardWrapper>
  );
};
