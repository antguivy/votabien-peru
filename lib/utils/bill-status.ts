// 1. Tipos Unificados
export type BillGroup =
  | "PRESENTADO"
  | "EN_PROCESO"
  | "APROBADO"
  | "ARCHIVADO"
  | "RETIRADO";

export type BadgeVariant =
  | "default"
  | "success"
  | "secondary"
  | "destructive"
  | "outline"
  | "warning";

interface BillStatusConfig {
  group: BillGroup;
  label: string;
  variant: BadgeVariant; // Para tu componente <Badge>
  twClass: string; // Clases crudas para botones o chips personalizados
}

// 2. Grupos de Mapeo (Combinando tu lógica estricta con la de palabras clave)
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

// 3. Obtener Grupo con lógica sólida
export function getBillGroup(status: string | null): BillGroup {
  if (!status) return "PRESENTADO";
  const s = status.toUpperCase();

  if (GROUPS_MAPPING.APROBADO.some((k) => s.includes(k))) return "APROBADO";
  if (GROUPS_MAPPING.ARCHIVADO.some((k) => s.includes(k))) return "ARCHIVADO";
  if (GROUPS_MAPPING.RETIRADO.some((k) => s.includes(k))) return "RETIRADO";
  if (GROUPS_MAPPING.EN_PROCESO.some((k) => s.includes(k))) return "EN_PROCESO";

  return "PRESENTADO";
}

// 4. Configuración Visual Única y Consistente
const GROUP_CONFIG: Record<BillGroup, BillStatusConfig> = {
  PRESENTADO: {
    group: "PRESENTADO",
    label: "Presentado",
    variant: "secondary",
    twClass: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200/80",
  },
  EN_PROCESO: {
    group: "EN_PROCESO",
    label: "En proceso",
    variant: "warning",
    twClass:
      "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200/80",
  },
  APROBADO: {
    group: "APROBADO",
    label: "Aprobado",
    variant: "success",
    twClass:
      "bg-green-100 text-green-700 border-green-200 hover:bg-green-200/80",
  },
  ARCHIVADO: {
    group: "ARCHIVADO",
    label: "Archivado",
    variant: "destructive", // o "default" si prefieres el gris
    twClass: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200/80",
  },
  RETIRADO: {
    group: "RETIRADO",
    label: "Retirado",
    variant: "destructive",
    twClass: "bg-red-100 text-red-600 border-red-200 hover:bg-red-200/80",
  },
};

export function getBillStatusConfig(status: string | null): BillStatusConfig {
  const group = getBillGroup(status);
  return GROUP_CONFIG[group];
}

// 5. Utilidades Adicionales (Limpieza de strings y fechas)
export const formatStatusLabel = (status: string): string => {
  if (!status) return "";
  const clean = status.replace(/_/g, " ").toLowerCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

export const formatterDate = (date: string): string => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function calcBillStats(bills: { approval_status: string }[]) {
  const counts: Record<BillGroup, number> = {
    PRESENTADO: 0,
    EN_PROCESO: 0,
    APROBADO: 0,
    ARCHIVADO: 0,
    RETIRADO: 0,
  };

  for (const bill of bills) {
    counts[getBillGroup(bill.approval_status)]++;
  }

  return { ...counts, total: bills.length };
}
