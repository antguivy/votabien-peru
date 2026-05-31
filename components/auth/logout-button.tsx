"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  children?: React.ReactNode;
}

export const LogoutButton = ({ children }: LogoutButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await authClient.signOut();
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Error durante el cierre de sesión:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <span
      onClick={!isLoading ? handleLogout : undefined}
      className={`w-full cursor-pointer ${isLoading ? "opacity-50" : ""}`}
    >
      {isLoading ? "Cerrando sesión..." : children}
    </span>
  );
};
