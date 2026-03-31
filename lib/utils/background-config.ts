export const backgroundTypeConfig: Record<
  string,
  {
    border: string;
    header: string;
    badge: string;
  }
> = {
  PENAL: {
    border: "border-l-destructive",
    header: "bg-destructive/6",
    badge: "text-destructive",
  },
  CIVIL: {
    border: "border-l-orange-500",
    header: "bg-orange-500/6",
    badge: "text-orange-600 dark:text-orange-400",
  },
  ADMINISTRATIVO: {
    border: "border-l-warning",
    header: "bg-warning/6",
    badge: "text-warning",
  },
  ETICA: {
    border: "border-l-blue-500",
    header: "bg-blue-500/6",
    badge: "text-blue-600 dark:text-blue-400",
  },
};

export const DEFAULT_BACKGROUND_CONFIG = backgroundTypeConfig.ADMINISTRATIVO;

export const backgroundStatusConfig: Record<
  string,
  {
    badge: string;
  }
> = {
  EN_INVESTIGACION: {
    badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  SENTENCIADO: {
    badge: "bg-destructive/10 text-destructive dark:text-red-400",
  },
  SANCIONADO: { badge: "bg-destructive/10 text-destructive dark:text-red-400" },
  ARCHIVADO: { badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400" },
  ABSUELTO: { badge: "bg-green-500/10 text-green-600 dark:text-green-400" },
  PRESCRITO: { badge: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
};
