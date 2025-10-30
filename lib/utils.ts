import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea fechas parcialmente completas como:
 *  - "2021-07-13"  →  "13 jul 2021"
 *  - "2021-07-00"  →  "jul 2021"
 *  - "2021-00-00"  →  "2021"
 *
 * También admite fechas inválidas (devuelve "Fecha no disponible").
 */
export function formatFechaJsonable(fechaStr?: string | null): string {
  if (!fechaStr) return "Fecha no disponible";

  const [year, month, day] = fechaStr.split("-").map((v) => parseInt(v, 10));

  // Solo año disponible
  if (month === 0 || isNaN(month))
    return year ? `${year}` : "Fecha no disponible";

  const fecha = new Date(year, month - 1, day > 0 ? day : 1);

  const opciones: Intl.DateTimeFormatOptions = {
    year: "numeric",
    ...(month && month > 0 ? { month: "short" } : {}),
    ...(day && day > 0 ? { day: "numeric" } : {}),
  };

  // Si el día o mes son 0, el Intl.DateTimeFormat los omite automáticamente.
  return fecha.toLocaleDateString("es-ES", opciones);
}
