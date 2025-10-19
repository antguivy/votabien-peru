"use client";

import { useState } from "react";
import { serverLogout } from "@/lib/auth-actions";
interface LogoutButtonProps {
  children?: React.ReactNode;
}

export const LogoutButton = ({ children }: LogoutButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await serverLogout();
    } catch (error) {
      console.error("Error durante el cierre de sesión:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    // <span onClick={handleLogout} className=" w-full">
    //   {children}
    // </span>
    <span
      onClick={!isLoading ? handleLogout : undefined}
      className={`w-full cursor-pointer ${isLoading ? "opacity-50" : ""}`}
    >
      {isLoading ? "Cerrando sesión..." : children}
    </span>
  );
};
