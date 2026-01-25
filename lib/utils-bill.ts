export type BadgeVariant =
  | "default"
  | "success"
  | "secondary"
  | "destructive"
  | "outline"
  | "warning";

// Tipos para los grupos
export type BillStatusGroupType =
  | "PRESENTADO"
  | "EN_PROCESO"
  | "APROBADO"
  | "ARCHIVADO"
  | "RETIRADO";

// Mapeo: Palabras clave -> Grupo
const GROUPS_MAPPING = {
  APROBADO: ["APROBADO", "AUTOGRAFA", "PUBLICADO"],
  ARCHIVADO: ["AL_ARCHIVO", "DECRETO_ARCHIVO"],
  RETIRADO: ["RETIRADO_POR_AUTOR"],
  EN_PROCESO: [
    "DICTAMEN",
    "EN_AGENDA_PLENO",
    "ORDEN_DEL_DIA",
    "EN_CUARTO_INTERMEDIO",
    "APROBADO_PRIMERA_VOTACION",
    "PENDIENTE_SEGUNDA_VOTACION",
    "EN_RECONSIDERACION",
    "RETORNA_A_COMISION",
  ],
};

/**
 * 1. Calcula el GRUPO basándose en el texto del estado.
 * Se usa en el Server Action.
 */
export function getBillStatusGroup(
  rawStatus: string | null,
): BillStatusGroupType {
  if (!rawStatus) return "PRESENTADO";
  const s = rawStatus.toUpperCase();

  if (GROUPS_MAPPING.APROBADO.some((k) => s.includes(k))) return "APROBADO";
  if (GROUPS_MAPPING.ARCHIVADO.some((k) => s.includes(k))) return "ARCHIVADO";
  if (GROUPS_MAPPING.RETIRADO.some((k) => s.includes(k))) return "RETIRADO";
  if (GROUPS_MAPPING.EN_PROCESO.some((k) => s.includes(k))) return "EN_PROCESO";

  return "PRESENTADO";
}

/**
 * 2. Define el COLOR (Variant) basándose en el GRUPO (no en el estado específico).
 * Se usa en el componente UI.
 */
export const getBadgeVariant = (group: string): BadgeVariant => {
  switch (group) {
    case "APROBADO":
      return "success"; // Verde
    case "ARCHIVADO":
      return "destructive"; // Rojo
    case "RETIRADO":
      return "destructive"; // Rojo
    case "EN_PROCESO":
      return "warning"; // Amarillo/Naranja
    case "PRESENTADO":
    default:
      return "secondary"; // Gris/Azul claro
  }
};

/**
 * 3. Formatea el texto para leerse bien (ej: "EN_COMISION" -> "En Comision")
 */
export const formatStatusLabel = (status: string): string => {
  if (!status) return "";
  // Reemplaza guiones bajos por espacios y capitaliza
  const clean = status.replace(/_/g, " ").toLowerCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

/**
 * Formateador de fecha
 */
export const formatterDate = (date: string): string => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
