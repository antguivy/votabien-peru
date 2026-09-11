import { formatInTimeZone } from "date-fns-tz";
import { fromZonedTime } from "date-fns-tz";

/**
 * Formatea fechas parcialmente completas como:
 *  - "2021-07-13"  →  "13 jul 2021"
 *  - "2021-07-00"  →  "jul 2021"
 *  - "2021-00-00"  →  "2021"
 *
 * También admite fechas inválidas (devuelve "Fecha no disponible").
 */
export function formatFechaJsonable(fechaStr?: string | Date | null): string {
  if (!fechaStr) return "Fecha no disponible";

  let year, month, day;

  if (fechaStr instanceof Date) {
    year = fechaStr.getFullYear();
    month = fechaStr.getMonth() + 1;
    day = fechaStr.getDate();
  } else {
    [year, month, day] = fechaStr.split("-").map((v) => parseInt(v, 10));
  }

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

/**
 * Formatea una fecha en español de Perú.
 * Ejemplo: "domingo, 12 de abril de 2026"
 */
export function formatFechaPeru(fechaISO: string | Date) {
  if (!fechaISO) return "Fecha no disponible";

  let year, month, day;

  if (fechaISO instanceof Date) {
    year = fechaISO.getFullYear();
    month = fechaISO.getMonth() + 1;
    day = fechaISO.getDate();
  } else {
    const fechaSolo = fechaISO.split("T")[0];
    [year, month, day] = fechaSolo.split("-").map(Number);
  }

  const fecha = new Date(year, month - 1, day);

  return fecha.toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Calcula días restantes entre ahora y una fecha futura.
 */
export function calcularDiasRestantes(fechaISO: string | Date): number {
  if (!fechaISO) return 0;

  let year, month, day;

  if (fechaISO instanceof Date) {
    year = fechaISO.getFullYear();
    month = fechaISO.getMonth() + 1;
    day = fechaISO.getDate();
  } else {
    const fechaSolo = fechaISO.split("T")[0];
    [year, month, day] = fechaSolo.split("-").map(Number);
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaEleccion = new Date(year, month - 1, day);
  fechaEleccion.setHours(0, 0, 0, 0);

  const dias = Math.ceil(
    (fechaEleccion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(0, dias);
}

export const formatterDate = (
  date: Date | string | number | null | undefined,
): string => {
  if (!date) {
    return ""; // Retorna una cadena vacía si la fecha es nula o no válida
  }
  const formattedDate = formatInTimeZone(date, "America/Lima", "yyyy-MM-dd");

  return formattedDate;
};

export const formatterDateWithTime = (
  date: Date | string | number | null | undefined,
): string => {
  if (!date) {
    return ""; // Retorna una cadena vacía si la fecha es nula o no válida
  }
  const formattedDate = formatInTimeZone(
    date,
    "America/Lima",
    "yyyy-MM-dd HH:mm",
  );

  return formattedDate;
};

//CONVERTIR FECHA A HORA DE LIMA
export function limaDateToUtc(dateString: string | null): string | null {
  if (!dateString) return null;

  const utcDate = fromZonedTime(`${dateString} 00:00:00`, "America/Lima");

  return utcDate.toISOString();
}

// OBTENER EL ULTIMO UPDATE

export function getLastUpdated(
  personUpdatedAt: string | null | undefined,
  backgrounds: { updated_at?: string | null }[],
): Date | null {
  const dates = [personUpdatedAt, ...backgrounds.map((b) => b.updated_at)]
    .filter(Boolean)
    .map((d) => new Date(d!));

  if (dates.length === 0) return null;
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

/**
 * Normaliza cualquier valor de fecha (Date, string, null, undefined) a string ISO o vacío.
 * Esencial para evitar errores en React Hook Form y Zod ("expected string, received Date")
 * cuando los datos iniciales provienen de Prisma o de APIs con objetos Date.
 */
export function ensureDateString(val: unknown): string {
  if (!val) return "";
  if (val instanceof Date) return isNaN(val.getTime()) ? "" : val.toISOString();
  return String(val);
}

/**
 * Convierte de forma segura un valor de fecha a un objeto Date en UTC.
 * Si recibe una fecha en formato simple (ej. "YYYY-MM-DD"), la ancla a la medianoche de Lima (America/Lima)
 * antes de convertir a UTC, evitando el típico desfase de -1 día ocasionado por UTC-5.
 */
export function parseToUtcDate(
  val: string | Date | null | undefined,
): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return null;
    // Si ya incluye T o zona horaria (formato ISO completo)
    if (trimmed.includes("T")) {
      const d = new Date(trimmed);
      return isNaN(d.getTime()) ? null : d;
    }
    // Si viene solo fecha (ej: YYYY-MM-DD), anclar a medianoche Lima y convertir a UTC
    const utcIso = limaDateToUtc(trimmed);
    return utcIso ? new Date(utcIso) : new Date(trimmed);
  }
  return new Date(val);
}
