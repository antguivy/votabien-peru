"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("Service Worker registrado:", registration.scope);
        })
        .catch((error) => {
          console.error("❌ Error al registrar SW:", error);
        });
    }
  }, []);

  return null;
}
