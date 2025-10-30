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

/**
 * Formatea una fecha en español de Perú.
 * Ejemplo: "domingo, 12 de abril de 2026"
 */
export function formatFechaPeru(fechaISO: string) {
  if (!fechaISO) return "Fecha no disponible";

  const fechaSolo = fechaISO.split("T")[0];
  const [year, month, day] = fechaSolo.split("-").map(Number);

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
export function calcularDiasRestantes(fechaISO: string): number {
  if (!fechaISO) return 0;

  const fechaSolo = fechaISO.split("T")[0];
  const [year, month, day] = fechaSolo.split("-").map(Number);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaEleccion = new Date(year, month - 1, day);
  fechaEleccion.setHours(0, 0, 0, 0);

  const dias = Math.ceil(
    (fechaEleccion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(0, dias);
}
