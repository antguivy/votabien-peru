// Soporta tanto SSR dentro de Docker (API_INTERNAL_URL) como llamadas desde el cliente/host (NEXT_PUBLIC_API_URL)
export const API_BASE_URL =
  typeof window === "undefined" && process.env.API_INTERNAL_URL
    ? process.env.API_INTERNAL_URL
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
