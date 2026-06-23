import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toSentenceCase(str: string) {
  return str
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

export function booleanToText(value: boolean): string {
  return value ? "Sí" : "No";
}

/**
 * Formatea una fecha que proviene de la Base de Datos (asumiendo Medianoche UTC)
 * hacia una fecha de calendario local estricta, evitando desfases de huso horario.
 */
export function formatCalendarDate(date: Date | string | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("es-PE", { timeZone: "UTC" });
}

/**
 * Convierte de manera segura una fecha de DB en un string YYYY-MM-DD para inputs HTML.
 */
export function toISODateString(date: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}
