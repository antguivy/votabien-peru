/**
 * Utilidades para manejo y formateo consistente de fechas límite en tareas.
 * Evita el problema clásico de desfase horario (UTC vs America/Lima UTC-5)
 * donde una fecha como "2026-09-25" se mostraba como el día anterior "24 sep".
 */

/**
 * Normaliza una fecha para guardado en base de datos fijando las 12:00:00 UTC.
 * Esto garantiza que en cualquier zona horaria entre UTC-11 y UTC+11
 * la fecha pertenezca al mismo día de calendario.
 */
export function normalizeDueDate(dueDate?: string | null): Date | null {
  if (!dueDate) return null;
  const clean = dueDate.trim();
  if (!clean) return null;
  const datePart = clean.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return new Date(`${datePart}T12:00:00.000Z`);
  }
  const d = new Date(clean);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Convierte un string o Date de fecha límite a un objeto Date local (a mediodía 12:00 local),
 * extrayendo de forma segura la parte YYYY-MM-DD para evitar desplazamientos por huso horario.
 */
export function parseTaskDueDate(dateStr?: string | Date | null): Date | null {
  if (!dateStr) return null;

  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return null;
    return new Date(
      dateStr.getFullYear(),
      dateStr.getMonth(),
      dateStr.getDate(),
      12,
      0,
      0,
    );
  }

  const clean = typeof dateStr === "string" ? dateStr.trim() : "";
  if (!clean) return null;

  // Extraer parte de fecha YYYY-MM-DD
  const datePart = clean.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [year, month, day] = datePart.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  const parsed = new Date(clean);
  if (isNaN(parsed.getTime())) return null;
  return new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
    12,
    0,
    0,
  );
}

/**
 * Formatea la fecha de vencimiento en español de Perú de forma segura (sin desfase UTC).
 * Por defecto devuelve: "25 sep" o con las opciones dadas.
 */
export function formatTaskDueDate(
  dateStr?: string | Date | null,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  },
): string | null {
  const d = parseTaskDueDate(dateStr);
  if (!d) return null;
  return d.toLocaleDateString("es-PE", options);
}

/**
 * Determina si una tarea está vencida.
 * Una tarea se considera vencida únicamente después de que el día límite ha concluido
 * (es decir, el día de hoy es posterior a la fecha límite asignada).
 */
export function isTaskOverdue(
  dueDate?: string | Date | null,
  isCompleted?: boolean | string | Date | null,
): boolean {
  if (!dueDate || Boolean(isCompleted)) return false;
  const d = parseTaskDueDate(dueDate);
  if (!d) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDay = new Date(d);
  dueDay.setHours(0, 0, 0, 0);

  return dueDay.getTime() < today.getTime();
}
